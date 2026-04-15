import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Habit, Completion, HabitStore, SleepLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],
      sleepLogs: [],
      isLoading: false,
      isInitialized: false,
      userId: null,

      initialize: async (userId: string) => {
        if (get().isInitialized && get().userId === userId) return;
        
        set({ isLoading: true, userId });

        // 1. Fetch data from Supabase
        const [
          { data: habitsData },
          { data: completionsData },
          { data: sleepLogsData }
        ] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', userId),
          supabase.from('completions').select('*').eq('user_id', userId),
          supabase.from('sleep_logs').select('*').eq('user_id', userId)
        ]);

        // 2. Migration Check: If Supabase is empty but LocalStorage has data
        const localHabits = get().habits;
        const localCompletions = get().completions;
        const localSleepLogs = get().sleepLogs;

        if (
          (!habitsData || habitsData.length === 0) && 
          localHabits.length > 0
        ) {
          console.log('Migrating local data to Supabase...');
          // Migrate Habits
          await supabase.from('habits').insert(
            localHabits.map(h => ({ ...h, user_id: userId }))
          );
          // Migrate Completions
          await supabase.from('completions').insert(
            localCompletions.map(c => ({ ...c, user_id: userId }))
          );
          // Migrate Sleep Logs
          await supabase.from('sleep_logs').insert(
            localSleepLogs.map(s => ({ ...s, user_id: userId }))
          );
          
          // Refetch after migration
          const { data: newHabits } = await supabase.from('habits').select('*').eq('user_id', userId);
          const { data: newCompletions } = await supabase.from('completions').select('*').eq('user_id', userId);
          const { data: newSleepLogs } = await supabase.from('sleep_logs').select('*').eq('user_id', userId);
          
          set({ 
            habits: newHabits || [], 
            completions: newCompletions || [], 
            sleepLogs: newSleepLogs || [],
            isInitialized: true,
            isLoading: false 
          });
        } else {
          set({ 
            habits: habitsData || [], 
            completions: completionsData || [], 
            sleepLogs: (sleepLogsData as any) || [],
            isInitialized: true,
            isLoading: false 
          });
        }

        // 3. Setup Realtime Listeners
        supabase
          .channel('habits-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` }, 
          async () => {
             const { data } = await supabase.from('habits').select('*').eq('user_id', userId);
             set({ habits: data || [] });
          })
          .subscribe();

        supabase
          .channel('completions-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'completions', filter: `user_id=eq.${userId}` }, 
          async () => {
             const { data } = await supabase.from('completions').select('*').eq('user_id', userId);
             set({ completions: data || [] });
          })
          .subscribe();

        supabase
          .channel('sleep-logs-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sleep_logs', filter: `user_id=eq.${userId}` }, 
          async () => {
             const { data } = await supabase.from('sleep_logs').select('*').eq('user_id', userId);
             set({ sleepLogs: (data as any) || [] });
          })
          .subscribe();
      },

      addHabit: async (habitData) => {
        const { userId } = get();
        if (!userId) return;

        const newHabit = {
          ...habitData,
          id: uuidv4(),
          user_id: userId,
          created_at: new Date().toISOString()
        };

        // Optimistic update
        set((state) => ({ habits: [...state.habits, newHabit as any] }));

        const { error } = await supabase.from('habits').insert([newHabit]);
        if (error) {
          console.error('Error adding habit:', error);
          // Rollback or handle error
        }
      },

      updateHabit: async (id, updatedHabit) => {
        const { userId } = get();
        if (!userId) return;

        // Optimistic update
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)),
        }));

        await supabase.from('habits').update(updatedHabit).eq('id', id);
      },

      deleteHabit: async (id) => {
        const { userId } = get();
        if (!userId) return;

        // Optimistic update
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
        }));

        await supabase.from('habits').delete().eq('id', id);
      },

      toggleCompletion: async (habitId, date) => {
        const { userId, completions } = get();
        if (!userId) return;

        const exists = completions.find(
          (c) => c.habitId === habitId && c.date === date
        );

        if (exists) {
          // Optimistic remove
          set({
            completions: completions.filter((c) => c.id !== exists.id)
          });
          await supabase.from('completions').delete().eq('id', exists.id);
        } else {
          const newCompletion = {
            id: uuidv4(),
            habitId,
            date,
            user_id: userId
          };
          // Optimistic add
          set({ completions: [...completions, newCompletion as any] });
          await supabase.from('completions').insert([newCompletion]);
        }
      },

      addSleepLog: async (log) => {
        const { userId, sleepLogs } = get();
        if (!userId) return;

        const existingIndex = sleepLogs.findIndex((l) => l.date === log.date);
        
        if (existingIndex !== -1) {
          const logToUpdate = sleepLogs[existingIndex];
          const updatedLog = { ...log, id: logToUpdate.id, user_id: userId };
          
          set((state) => {
            const newLogs = [...state.sleepLogs];
            newLogs[existingIndex] = updatedLog as any;
            return { sleepLogs: newLogs };
          });
          
          await supabase.from('sleep_logs').update(log).eq('id', logToUpdate.id);
        } else {
          const newLog = { ...log, id: uuidv4(), user_id: userId };
          set((state) => ({ sleepLogs: [...state.sleepLogs, newLog as any] }));
          await supabase.from('sleep_logs').insert([newLog]);
        }
      },

      deleteSleepLog: async (id) => {
        const { userId } = get();
        if (!userId) return;

        set((state) => ({
          sleepLogs: state.sleepLogs.filter((l) => l.id !== id),
        }));

        await supabase.from('sleep_logs').delete().eq('id', id);
      },
    }),
    {
      name: 'habit-tracker-storage',
      // Only persist habits/completions/logs for migration purposes initially
      // Once data is in Supabase, the DB takes over.
    }
  )
);
