export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  color: string;
  frequency: Frequency;
  interval?: number; // for 'custom'
  createdAt: Date;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // ISO string YYYY-MM-DD
}

export interface HabitStore {
  habits: Habit[];
  completions: Completion[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleCompletion: (habitId: string, date: string) => void;
}
