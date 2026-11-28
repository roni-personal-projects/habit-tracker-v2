export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type CompletionStatus = 'full' | 'micro';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  parentId?: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  frequency: Frequency;
  interval?: number; // for 'custom'
  selectedDays?: number[]; // [0-6] for Weekly specific days
  categoryId?: string;
  order: number;
  createdAt: Date;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  // Atomic Habits & Behavioral Additions:
  identity?: string;          // e.g. 'The Disciplined Athlete', 'The Deep Thinker'
  twoMinuteRule?: string;     // Micro/Emergency version (e.g. 'Do 2 pushups', 'Read 1 page')
  cueAnchor?: string;         // Habit stacking trigger (e.g. 'After pouring morning coffee')
  cueLocation?: string;       // Context cue (e.g. 'At my desk')
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // ISO string YYYY-MM-DD
  status?: CompletionStatus; // 'full' (default) or 'micro' (2-minute rule)
}

export interface SleepLog {
  id: string;
  date: string; // The "Sleep Start" date (YYYY-MM-DD)
  sleepTime: string; // HH:mm
  wakeTime: string; // HH:mm
  duration: number; // in hours
  category: string;
}

export interface ScreenTimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // in hours
  category: string; // 'Social', 'Productivity', 'Entertainment', 'Gaming', 'Other'
}

export interface HabitStore {
  habits: Habit[];
  categories: Category[];
  completions: Completion[];
  sleepLogs: SleepLog[];
  screenTimeLogs: ScreenTimeLog[];
  isLoading: boolean;
  isInitialized: boolean;
  userId: string | null;
  
  initialize: (userId: string) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (habits: Habit[]) => Promise<void>;

  addCategory: (category: Omit<Category, 'id' | 'order'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;
  
  toggleCompletion: (habitId: string, date: string, targetStatus?: CompletionStatus) => Promise<void>;
  addSleepLog: (log: Omit<SleepLog, 'id'>) => Promise<void>;
  deleteSleepLog: (id: string) => Promise<void>;
  
  addScreenTimeLog: (log: Omit<ScreenTimeLog, 'id'>) => Promise<void>;
  deleteScreenTimeLog: (id: string) => Promise<void>;

  // 12-Week Year Sprint Configuration:
  sprintGoal?: string;
  sprintStartDate?: string;
  sprintTargetRate?: number;
  updateSprintSettings: (settings: { sprintGoal?: string; sprintStartDate?: string; sprintTargetRate?: number }) => void;

  // Birthday & Time-Urgency + Focus Controls (persisted locally):
  birthDate?: string; // YYYY-MM-DD
  setBirthDate: (birthDate: string) => void;
  pinnedHabitIds: string[];
  togglePinHabit: (habitId: string) => void;
  pausedHabitIds: string[];
  togglePauseHabit: (habitId: string) => void;
}

