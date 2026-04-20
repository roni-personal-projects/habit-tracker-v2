import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, Category, Completion, HabitStore, SleepLog } from '@/types';
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
    categoryId: row.category_id,
    order: row.order || 0,
    createdAt: new Date(row.created_at),
  };
}

// Categories
function categoryFromDb(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    order: row.order || 0,
  };
}

function categoryToDb(category: Omit<Category, 'id' | 'order'>, userId: string, id: string, order: number) {
  return {
    id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    order,
    user_id: userId,
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
    category_id: habit.categoryId ?? null,
    order: habit.order ?? 0,
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
      categories: [],
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
          { data: categoriesData },
          { data: completionsData },
          { data: sleepLogsData }
        ] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', userId).order('order', { ascending: true }),
          supabase.from('categories').select('*').eq('user_id', userId).order('order', { ascending: true }),
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
        const localCategories = get().categories;
        const localCompletions = get().completions;
        const localSleepLogs = get().sleepLogs;

        const isSupabaseEmpty = (!habitsData || habitsData.length === 0) && (!categoriesData || categoriesData.length === 0);
        const hasLocalData = localHabits.length > 0 || localCategories.length > 0;

        if (isSupabaseEmpty && hasLocalData) {
          console.log('Migrating local data to Supabase...');

          // IMPORTANT: Migrate categories FIRST to avoid foreign key issues in habits
          if (localCategories.length > 0) {
            await supabase.from('categories').insert(
              localCategories.map(c => categoryToDb(c, userId, c.id, c.order))
            );
          }

          if (localHabits.length > 0) {
            await supabase.from('habits').insert(
              localHabits.map(h => habitToDb(h, userId, h.id))
            );
          }

          if (localCompletions.length > 0) {
            await supabase.from('completions').insert(
              localCompletions.map(c => completionToDb(c.habitId, c.date, userId, c.id))
            );
          }

          if (localSleepLogs.length > 0) {
            await supabase.from('sleep_logs').insert(
              localSleepLogs.map(s => sleepLogToDb(s, userId, s.id))
            );
          }

          // Refetch after migration
          const [{ data: nh }, { data: nc }, { data: ns }, { data: ncat }] = await Promise.all([
            supabase.from('habits').select('*').eq('user_id', userId).order('order', { ascending: true }),
            supabase.from('completions').select('*').eq('user_id', userId),
            supabase.from('sleep_logs').select('*').eq('user_id', userId),
            supabase.from('categories').select('*').eq('user_id', userId).order('order', { ascending: true }),
          ]);

          set({
            habits: (nh || []).map(habitFromDb),
            categories: (ncat || []).map(categoryFromDb),
            completions: (nc || []).map(completionFromDb),
            sleepLogs: (ns || []).map(sleepLogFromDb),
            isInitialized: true,
            isLoading: false,
          });
        } else {
          set({
            habits: (habitsData || []).map(habitFromDb),
            categories: (categoriesData || []).map(categoryFromDb),
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
              const { data } = await supabase.from('habits').select('*').eq('user_id', userId).order('order', { ascending: true });
              set({ habits: (data || []).map(habitFromDb) });
            })
          .subscribe();

        supabase
          .channel('categories-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
            async () => {
              const { data } = await supabase.from('categories').select('*').eq('user_id', userId).order('order', { ascending: true });
              set({ categories: (data || []).map(categoryFromDb) });
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
        const { habits } = get();
        const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) : -1;
        const id = uuidv4();
        const newHabit: Habit = { ...habitData, id, order: maxOrder + 1, createdAt: new Date() };

        // Optimistic update
        set((state) => ({ habits: [...state.habits, newHabit] }));

        const { error } = await supabase.from('habits').insert([habitToDb(newHabit, userId, id)]);
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

        const dbUpdate: any = {};
        if (updatedHabit.name !== undefined) dbUpdate.name = updatedHabit.name;
        if (updatedHabit.color !== undefined) dbUpdate.color = updatedHabit.color;
        if (updatedHabit.frequency !== undefined) dbUpdate.frequency = updatedHabit.frequency;
        if (updatedHabit.interval !== undefined) dbUpdate.interval = updatedHabit.interval;
        if (updatedHabit.selectedDays !== undefined) dbUpdate.selected_days = updatedHabit.selectedDays;
        if (updatedHabit.categoryId !== undefined) dbUpdate.category_id = updatedHabit.categoryId;
        if (updatedHabit.order !== undefined) dbUpdate.order = updatedHabit.order;

        await supabase.from('habits').update(dbUpdate).eq('id', id);
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

      reorderHabits: async (newHabits) => {
        const { userId } = get();
        if (!userId) return;

        // Optimistic update
        set({ habits: newHabits });

        // Update database (batch upsert)
        const dbHabits = newHabits.map(h => ({
          id: h.id,
          user_id: userId,
          name: h.name,
          color: h.color,
          frequency: h.frequency,
          interval: h.interval ?? null,
          selected_days: h.selectedDays ?? null,
          order: h.order,
          created_at: h.createdAt.toISOString()
        }));

        const { error } = await supabase.from('habits').upsert(dbHabits);
        if (error) {
          console.error('Error reordering habits:', error.message);
        }
      },

      addCategory: async (categoryData) => {
        const { userId, categories } = get();
        if (!userId) return;

        const id = uuidv4();
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) : -1;
        const newCategory: Category = { ...categoryData, id, order: maxOrder + 1 };

        // Optimistic update
        set((state) => ({ categories: [...state.categories, newCategory] }));

        const { error } = await supabase.from('categories').insert([
          categoryToDb(categoryData, userId, id, maxOrder + 1)
        ]);

        if (error) {
          console.error('Error adding category:', error.message);
          // Roll back
          set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        }
      },

      updateCategory: async (id, updatedCategory) => {
        const { userId } = get();
        if (!userId) return;

        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updatedCategory } : c)),
        }));

        const dbUpdate: any = {};
        if (updatedCategory.name !== undefined) dbUpdate.name = updatedCategory.name;
        if (updatedCategory.icon !== undefined) dbUpdate.icon = updatedCategory.icon;
        if (updatedCategory.color !== undefined) dbUpdate.color = updatedCategory.color;
        if (updatedCategory.order !== undefined) dbUpdate.order = updatedCategory.order;

        await supabase.from('categories').update(dbUpdate).eq('id', id);
      },

      deleteCategory: async (id) => {
        const { userId } = get();
        if (!userId) return;

        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          habits: state.habits.map(h => h.categoryId === id ? { ...h, categoryId: undefined } : h)
        }));

        // In Supabase, if we have a foreign key, we might need to set it to null first or cascade
        await supabase.from('habits').update({ category_id: null }).eq('category_id', id);
        await supabase.from('categories').delete().eq('id', id);
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
        categories: state.categories,
        completions: state.completions,
        sleepLogs: state.sleepLogs,
      }),
    }
  )
);
