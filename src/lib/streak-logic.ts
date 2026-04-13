import { 
  differenceInCalendarDays, 
  isSameDay, 
  subDays, 
  startOfDay, 
  parseISO,
  isSameWeek,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  subWeeks,
  subMonths
} from 'date-fns';
import { Habit, Completion } from '@/types';

export const calculateStreak = (habit: Habit, completions: Completion[]) => {
  const habitCompletions = completions
    .filter((c) => c.habitId === habit.id)
    .map((c) => startOfDay(parseISO(c.date)))
    .sort((a, b) => b.getTime() - a.getTime());

  if (habitCompletions.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Streak calculation based on frequency
  if (habit.frequency === 'daily') {
    // Current Streak logic
    let checkDate = today;
    const hasToday = habitCompletions.some(d => isSameDay(d, today));
    const hasYesterday = habitCompletions.some(d => isSameDay(d, yesterday));
    
    if (!hasToday && !hasYesterday) {
      currentStreak = 0;
    } else {
      if (!hasToday) checkDate = yesterday;
      
      while (habitCompletions.some(d => isSameDay(d, checkDate))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // Longest Streak logic
    const sortedDates = [...habitCompletions].sort((a, b) => a.getTime() - b.getTime());
    let lastDate: Date | null = null;
    
    for (const date of sortedDates) {
      if (lastDate && differenceInCalendarDays(date, lastDate) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = date;
    }
  } else if (habit.frequency === 'weekly') {
    // Current Streak: weeks with at least one completion
    let checkWeek = startOfWeek(today, { weekStartsOn: 1 });
    const completionsThisWeek = habitCompletions.some(d => isSameWeek(d, today, { weekStartsOn: 1 }));
    const completionsLastWeek = habitCompletions.some(d => isSameWeek(d, subWeeks(today, 1), { weekStartsOn: 1 }));

    if (!completionsThisWeek && !completionsLastWeek) {
      currentStreak = 0;
    } else {
      if (!completionsThisWeek) checkWeek = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      
      while (habitCompletions.some(d => isSameWeek(d, checkWeek, { weekStartsOn: 1 }))) {
        currentStreak++;
        checkWeek = subWeeks(checkWeek, 1);
      }
    }

    // Longest Streak
    const weeksWithCompletions = Array.from(new Set(habitCompletions.map(d => startOfWeek(d, { weekStartsOn: 1 }).getTime())));
    weeksWithCompletions.sort((a, b) => a - b);
    
    let lastWeek: number | null = null;
    for (const week of weeksWithCompletions) {
      if (lastWeek && (week - lastWeek) <= 7 * 24 * 60 * 60 * 1000 + 1000) { // accounting for DST
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      lastWeek = week;
    }
  } else if (habit.frequency === 'monthly') {
    let checkMonth = startOfMonth(today);
    const completionsThisMonth = habitCompletions.some(d => isSameMonth(d, today));
    const completionsLastMonth = habitCompletions.some(d => isSameMonth(d, subMonths(today, 1)));

    if (!completionsThisMonth && !completionsLastMonth) {
      currentStreak = 0;
    } else {
      if (!completionsThisMonth) checkMonth = startOfMonth(subMonths(today, 1));
      
      while (habitCompletions.some(d => isSameMonth(d, checkMonth))) {
        currentStreak++;
        checkMonth = subMonths(checkMonth, 1);
      }
    }

    const monthsWithCompletions = Array.from(new Set(habitCompletions.map(d => startOfMonth(d).getTime())));
    monthsWithCompletions.sort((a, b) => a - b);
    
    let lastMonth: number | null = null;
    for (const month of monthsWithCompletions) {
      if (lastMonth) {
        const diff = differenceInCalendarDays(new Date(month), new Date(lastMonth));
        if (diff >= 28 && diff <= 31) { // roughly one month
           tempStreak++;
        } else {
           tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      lastMonth = month;
    }
  }

  return { currentStreak, longestStreak };
};

export const getCompletionStats = (habit: Habit, completions: Completion[]) => {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  const totalCompleted = habitCompletions.length;
  
  const createdDate = new Date(habit.createdAt);
  const daysSinceCreation = Math.max(1, differenceInCalendarDays(new Date(), createdDate) + 1);
  
  let expectedCompletions = daysSinceCreation;
  if (habit.frequency === 'weekly') expectedCompletions = Math.ceil(daysSinceCreation / 7);
  if (habit.frequency === 'monthly') expectedCompletions = Math.ceil(daysSinceCreation / 30);
  
  const rate = Math.min(100, Math.round((totalCompleted / expectedCompletions) * 100));

  return { totalCompleted, rate };
};
