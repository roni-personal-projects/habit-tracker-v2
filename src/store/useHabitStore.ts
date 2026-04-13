import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, Completion, HabitStore, Frequency } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const useHabitStore = create<HabitStore>()(
  persist(
    (set) => ({
      habits: [],
      completions: [],

      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: uuidv4(),
          createdAt: new Date(),
        };
        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      },

      updateHabit: (id, updatedHabit) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
        }));
      },

      toggleCompletion: (habitId, date) => {
        set((state) => {
          const exists = state.completions.find(
            (c) => c.habitId === habitId && c.date === date
          );

          if (exists) {
            return {
              completions: state.completions.filter(
                (c) => !(c.habitId === habitId && c.date === date)
              ),
            };
          } else {
            const newCompletion: Completion = {
              id: uuidv4(),
              habitId,
              date,
            };
            return {
              completions: [...state.completions, newCompletion],
            };
          }
        });
      },
    }),
    {
      name: 'habit-tracker-storage',
    }
  )
);
