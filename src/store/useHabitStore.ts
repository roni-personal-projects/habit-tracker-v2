import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, Completion, HabitStore, SleepLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// ─── DB <-> App mappers ────────────────────────────────────────────────────

// Habits
function habitFromDb(row: any): Habit {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    frequency: row.frequency,
    interval: row.interval,
    selectedDays: row.selected_days,
    createdAt: new Date(row.created_at),
  };
}

function habitToDb(habit: Omit<Habit, 'id' | 'createdAt'>, userId: string, id: string) {
  return {
    id,
    name: habit.name,
    color: habit.color,
    frequency: habit.frequency,
    interval: habit.interval ?? null,
    selected_days: habit.selectedDays ?? null,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
}

// Completions
function completionFromDb(row: any): Completion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
  };
}

function completionToDb(habitId: string, date: string, userId: string, id: string) {
  return {
    id,
    habit_id: habitId,
    date,
    user_id: userId,
  };
}

// Sleep Logs
function sleepLogFromDb(row: any): SleepLog {
  return {
    id: row.id,
    date: row.date,
    sleepTime: row.sleep_time,
    wakeTime: row.wake_time,
    duration: row.duration,
    category: row.category,
  };
}

function sleepLogToDb(log: Omit<SleepLog, 'id'>, userId: string, id: string) {
  return {
    id,
    date: log.date,
    sleep_time: log.sleepTime,
    wake_time: log.wakeTime,
    duration: log.duration,
    category: log.category,
    user_id: userId,
  };
}

// ─── Store ─────────────────────────────────────────────────────────────────

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
        // Only skip if already initialized for the same user in this session
        if (get().isInitialized && get().userId === userId) return;
        console.log('[AuthSync] Initializing store for user:', userId);

        set({ isLoading: true, userId });

        // 1. Fetch data from Supabase
        const [
          { data: habitsData, error: habitsError },
          { data: completionsData },
          { data: sleepLogsData }
        ] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', userId),
          supabase.from('completions').select('*').eq('user_id', userId),
          supabase.from('sleep_logs').select('*').eq('user_id', userId)
        ]);

        if (habitsError) {
          console.error('Supabase fetch error:', habitsError.message);
          set({ isLoading: false });
          return;
        }

        // 2. Migration: if Supabase is empty but localStorage has data
        const localHabits = get().habits;
        const localCompletions = get().completions;
        const localSleepLogs = get().sleepLogs;

        if ((!habitsData || habitsData.length === 0) && localHabits.length > 0) {
          console.log('Migrating local data to Supabase...');

          await supabase.from('habits').insert(
            localHabits.map(h => habitToDb(h, userId, h.id))
          );
          await supabase.from('completions').insert(
            localCompletions.map(c => completionToDb(c.habitId, c.date, userId, c.id))
          );
          await supabase.from('sleep_logs').insert(
            localSleepLogs.map(s => sleepLogToDb(s, userId, s.id))
          );

          // Refetch after migration
          const [{ data: nh }, { data: nc }, { data: ns }] = await Promise.all([
            supabase.from('habits').select('*').eq('user_id', userId),
            supabase.from('completions').select('*').eq('user_id', userId),
            supabase.from('sleep_logs').select('*').eq('user_id', userId),
          ]);

          set({
            habits: (nh || []).map(habitFromDb),
            completions: (nc || []).map(completionFromDb),
            sleepLogs: (ns || []).map(sleepLogFromDb),
            isInitialized: true,
            isLoading: false,
          });
        } else {
          set({
            habits: (habitsData || []).map(habitFromDb),
            completions: (completionsData || []).map(completionFromDb),
            sleepLogs: (sleepLogsData || []).map(sleepLogFromDb),
            isInitialized: true,
            isLoading: false,
          });
        }

        // 3. Realtime listeners — refetch on any change
        supabase
          .channel('habits-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
            async () => {
              const { data } = await supabase.from('habits').select('*').eq('user_id', userId);
              set({ habits: (data || []).map(habitFromDb) });
            })
          .subscribe();

        supabase
          .channel('completions-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'completions', filter: `user_id=eq.${userId}` },
            async () => {
              const { data } = await supabase.from('completions').select('*').eq('user_id', userId);
              set({ completions: (data || []).map(completionFromDb) });
            })
          .subscribe();

        supabase
          .channel('sleep-logs-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sleep_logs', filter: `user_id=eq.${userId}` },
            async () => {
              const { data } = await supabase.from('sleep_logs').select('*').eq('user_id', userId);
              set({ sleepLogs: (data || []).map(sleepLogFromDb) });
            })
          .subscribe();
      },

      addHabit: async (habitData) => {
        const { userId } = get();
        if (!userId) return;

        const id = uuidv4();
        const newHabit: Habit = { ...habitData, id, createdAt: new Date() };

        // Optimistic update
        set((state) => ({ habits: [...state.habits, newHabit] }));

        const { error } = await supabase.from('habits').insert([habitToDb(habitData, userId, id)]);
        if (error) {
          console.error('Error adding habit:', error.message);
          // Roll back
          set((state) => ({ habits: state.habits.filter(h => h.id !== id) }));
        }
      },

      updateHabit: async (id, updatedHabit) => {
        const { userId } = get();
        if (!userId) return;

        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)),
        }));

        await supabase.from('habits').update({
          name: updatedHabit.name,
          color: updatedHabit.color,
          frequency: updatedHabit.frequency,
          interval: updatedHabit.interval ?? null,
          selected_days: updatedHabit.selectedDays ?? null,
        }).eq('id', id);
      },

      deleteHabit: async (id) => {
        const { userId } = get();
        if (!userId) return;

        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
        }));

        await supabase.from('habits').delete().eq('id', id);
      },

      toggleCompletion: async (habitId, date) => {
        const { userId, completions } = get();
        if (!userId) return;

        const exists = completions.find((c) => c.habitId === habitId && c.date === date);

        if (exists) {
          set({ completions: completions.filter((c) => c.id !== exists.id) });
          await supabase.from('completions').delete().eq('id', exists.id);
        } else {
          const id = uuidv4();
          const newCompletion: Completion = { id, habitId, date };
          set({ completions: [...completions, newCompletion] });
          const { error } = await supabase.from('completions').insert([completionToDb(habitId, date, userId, id)]);
          if (error) {
            console.error('Error toggling completion:', error.message);
          }
        }
      },

      addSleepLog: async (log) => {
        const { userId, sleepLogs } = get();
        if (!userId) return;

        const existingIndex = sleepLogs.findIndex((l) => l.date === log.date);

        if (existingIndex !== -1) {
          const existing = sleepLogs[existingIndex];
          const updated: SleepLog = { ...log, id: existing.id };

          set((state) => {
            const newLogs = [...state.sleepLogs];
            newLogs[existingIndex] = updated;
            return { sleepLogs: newLogs };
          });

          await supabase.from('sleep_logs').update({
            sleep_time: log.sleepTime,
            wake_time: log.wakeTime,
            duration: log.duration,
            category: log.category,
          }).eq('id', existing.id);
        } else {
          const id = uuidv4();
          const newLog: SleepLog = { ...log, id };
          set((state) => ({ sleepLogs: [...state.sleepLogs, newLog] }));
          const { error } = await supabase.from('sleep_logs').insert([sleepLogToDb(log, userId, id)]);
          if (error) {
            console.error('Error adding sleep log:', error.message);
          }
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
      // Don't persist auth state — let it re-initialize from Clerk on every page load
      partialize: (state) => ({
        habits: state.habits,
        completions: state.completions,
        sleepLogs: state.sleepLogs,
      }),
    }
  )
);
