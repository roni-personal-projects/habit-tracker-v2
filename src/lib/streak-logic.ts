import { 
  format,
  differenceInCalendarDays, 
  isSameDay, 
  subDays, 
  startOfDay, 
  parseISO,
  isSameWeek,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  subWeeks,
  subMonths,
  eachDayOfInterval
} from 'date-fns';
import { Habit, Completion, SleepLog, ScreenTimeLog } from '@/types';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;          // True if yesterday was missed and today is needed to save the streak
  recoveredLapses: number;    // Number of times "Never Miss Twice" saved the streak
}

export const calculateStreak = (habit: Habit, completions: Completion[]): StreakResult => {
  const habitCompletions = completions
    .filter((c) => c.habitId === habit.id)
    .map((c) => startOfDay(parseISO(c.date)))
    .sort((a, b) => b.getTime() - a.getTime());

  if (habitCompletions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isAtRisk: false, recoveredLapses: 0 };
  }

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const dayBeforeYesterday = subDays(today, 2);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let isAtRisk = false;
  let recoveredLapses = 0;

  // Streak calculation based on frequency
  if (habit.frequency === 'daily') {
    const hasToday = habitCompletions.some(d => isSameDay(d, today));
    const hasYesterday = habitCompletions.some(d => isSameDay(d, yesterday));
    const hasDayBefore = habitCompletions.some(d => isSameDay(d, dayBeforeYesterday));

    // "Never Miss Twice" Check for Current Streak
    if (!hasToday && !hasYesterday) {
      currentStreak = 0;
    } else {
      // If missed yesterday but completed today or day before
      if (!hasToday && hasYesterday) {
        // Today is pending, but yesterday was done
        let checkDate = yesterday;
        let allowedSkips = 1; // Atomic Habits grace
        while (checkDate) {
          const completed = habitCompletions.some(d => isSameDay(d, checkDate));
          if (completed) {
            currentStreak++;
            allowedSkips = 1; // reset grace once completed
            checkDate = subDays(checkDate, 1);
          } else if (allowedSkips > 0) {
            // 1 missed day allowed if immediately preceded by completed day
            allowedSkips--;
            const prevDayCompleted = habitCompletions.some(d => isSameDay(d, subDays(checkDate, 1)));
            if (prevDayCompleted) {
              recoveredLapses++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      } else if (hasToday && !hasYesterday && hasDayBefore) {
        // Yesterday was missed, but today and day before were completed -> Never Miss Twice preserved!
        recoveredLapses++;
        let checkDate = today;
        let allowedSkips = 1;
        while (checkDate) {
          const completed = habitCompletions.some(d => isSameDay(d, checkDate));
          if (completed) {
            currentStreak++;
            allowedSkips = 1;
            checkDate = subDays(checkDate, 1);
          } else if (allowedSkips > 0) {
            allowedSkips--;
            const prevDayCompleted = habitCompletions.some(d => isSameDay(d, subDays(checkDate, 1)));
            if (prevDayCompleted) {
              recoveredLapses++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      } else {
        // Normal continuous streak
        let checkDate = hasToday ? today : yesterday;
        let allowedSkips = 1;
        while (checkDate) {
          const completed = habitCompletions.some(d => isSameDay(d, checkDate));
          if (completed) {
            currentStreak++;
            allowedSkips = 1;
            checkDate = subDays(checkDate, 1);
          } else if (allowedSkips > 0) {
            allowedSkips--;
            const prevDayCompleted = habitCompletions.some(d => isSameDay(d, subDays(checkDate, 1)));
            if (prevDayCompleted) {
              recoveredLapses++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    }

    // Is at risk? If yesterday was missed and today hasn't been completed yet
    if (!hasYesterday && !hasToday && hasDayBefore) {
      isAtRisk = true;
    }

    // Longest Streak logic with single-day grace recovery
    const sortedDates = [...habitCompletions].sort((a, b) => a.getTime() - b.getTime());
    let lastDate: Date | null = null;
    
    for (const date of sortedDates) {
      if (lastDate) {
        const diff = differenceInCalendarDays(date, lastDate);
        if (diff === 1) {
          tempStreak++;
        } else if (diff === 2) {
          // Never miss twice: 1 day gap preserved
          tempStreak += 2;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = date;
    }
  } else if (habit.frequency === 'weekly') {
    if (habit.selectedDays && habit.selectedDays.length > 0) {
      let checkDate = today;
      while (!habit.selectedDays.includes(checkDate.getDay())) {
        checkDate = subDays(checkDate, 1);
      }
      
      const isDueToday = habit.selectedDays.includes(today.getDay());
      const completedToday = habitCompletions.some(d => isSameDay(d, today));
      
      let lastRequiredDate = checkDate;
      if (isDueToday && !completedToday) {
        lastRequiredDate = subDays(today, 1);
        while (!habit.selectedDays.includes(lastRequiredDate.getDay())) {
          lastRequiredDate = subDays(lastRequiredDate, 1);
        }
      }

      if (!habitCompletions.some(d => isSameDay(d, lastRequiredDate))) {
        currentStreak = 0;
      } else {
        let tempCheck = lastRequiredDate;
        while (habitCompletions.some(d => isSameDay(d, tempCheck))) {
          currentStreak++;
          tempCheck = subDays(tempCheck, 1);
          while (!habit.selectedDays.includes(tempCheck.getDay())) {
            tempCheck = subDays(tempCheck, 1);
          }
        }
      }

      const dueCompletions = habitCompletions
        .filter(d => habit.selectedDays?.includes(d.getDay()))
        .sort((a, b) => a.getTime() - b.getTime());
      
      let lastDue: Date | null = null;
      for (const date of dueCompletions) {
        if (lastDue) {
          let nextDue = subDays(date, 1);
          while (!habit.selectedDays.includes(nextDue.getDay())) {
            nextDue = subDays(nextDue, 1);
          }
          if (isSameDay(nextDue, lastDue)) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        lastDue = date;
      }
    } else {
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

      const weeksWithCompletions = Array.from(new Set(habitCompletions.map(d => startOfWeek(d, { weekStartsOn: 1 }).getTime())));
      weeksWithCompletions.sort((a, b) => a - b);
      
      let lastWeek: number | null = null;
      for (const week of weeksWithCompletions) {
        if (lastWeek && (week - lastWeek) <= 7 * 24 * 60 * 60 * 1000 + 1000) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        lastWeek = week;
      }
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
        if (diff >= 28 && diff <= 31) {
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

  return { currentStreak, longestStreak, isAtRisk, recoveredLapses };
};

export const getCompletionStats = (habit: Habit, completions: Completion[]) => {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  const totalCompleted = habitCompletions.length;
  const fullCompleted = habitCompletions.filter(c => !c.status || c.status === 'full').length;
  const microCompleted = habitCompletions.filter(c => c.status === 'micro').length;
  
  const createdDate = new Date(habit.createdAt);
  const daysSinceCreation = Math.max(1, differenceInCalendarDays(new Date(), createdDate) + 1);
  
  let expectedCompletions = daysSinceCreation;
  if (habit.frequency === 'weekly') {
    if (habit.selectedDays && habit.selectedDays.length > 0) {
      expectedCompletions = 0;
      let checkDate = startOfDay(createdDate);
      const today = startOfDay(new Date());
      while (checkDate <= today) {
        if (habit.selectedDays.includes(checkDate.getDay())) {
          expectedCompletions++;
        }
        checkDate = subDays(checkDate, -1);
      }
      expectedCompletions = Math.max(1, expectedCompletions);
    } else {
      expectedCompletions = Math.ceil(daysSinceCreation / 7);
    }
  }
  if (habit.frequency === 'monthly') expectedCompletions = Math.ceil(daysSinceCreation / 30);
  
  const rate = Math.min(100, Math.round((totalCompleted / expectedCompletions) * 100));

  return { totalCompleted, fullCompleted, microCompleted, rate };
};

// ─── Behavioral Science & Book Insights ───────────────────────────────────────

export interface IdentityVotes {
  identity: string;
  totalVotes: number;
  weeklyVotes: number;
  habitsCount: number;
}

export const calculateIdentityVotes = (habits: Habit[], completions: Completion[]): IdentityVotes[] => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const identityMap = new Map<string, { totalVotes: number; weeklyVotes: number; habitIds: Set<string> }>();

  habits.forEach(h => {
    const identityName = h.identity?.trim() || 'General Growth';
    if (!identityMap.has(identityName)) {
      identityMap.set(identityName, { totalVotes: 0, weeklyVotes: 0, habitIds: new Set() });
    }
    identityMap.get(identityName)!.habitIds.add(h.id);
  });

  completions.forEach(c => {
    const habit = habits.find(h => h.id === c.habitId);
    if (!habit) return;
    const identityName = habit.identity?.trim() || 'General Growth';
    const entry = identityMap.get(identityName);
    if (entry) {
      entry.totalVotes++;
      const compDate = parseISO(c.date);
      if (compDate >= weekStart && compDate <= weekEnd) {
        entry.weeklyVotes++;
      }
    }
  });

  return Array.from(identityMap.entries()).map(([identity, data]) => ({
    identity,
    totalVotes: data.totalVotes,
    weeklyVotes: data.weeklyVotes,
    habitsCount: data.habitIds.size,
  })).sort((a, b) => b.weeklyVotes - a.weeklyVotes || b.totalVotes - a.totalVotes);
};

export interface WeeklyExecutionScore {
  rate: number;               // 0-100%
  completedCount: number;
  scheduledCount: number;
  status: 'elite' | 'operational' | 'needs_alignment'; // 85% rule from The 12 Week Year
}

export const calculateWeeklyExecution = (habits: Habit[], completions: Completion[]): WeeklyExecutionScore => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const today = startOfDay(now);
  
  // Only evaluate up to today in the current week to provide an accurate real-time pace
  const daysInWeekSoFar = eachDayOfInterval({ start: weekStart, end: today });

  let scheduledCount = 0;
  let completedCount = 0;

  daysInWeekSoFar.forEach(day => {
    const dateStr = day.toISOString().split('T')[0];
    const dayOfWeek = day.getDay();

    habits.forEach(habit => {
      // Check active date bounds
      if (habit.startDate && dateStr < habit.startDate) return;
      if (habit.endDate && dateStr > habit.endDate) return;

      let isDue = true;
      if (habit.frequency === 'weekly' && habit.selectedDays && habit.selectedDays.length > 0) {
        isDue = habit.selectedDays.includes(dayOfWeek);
      } else if (habit.frequency === 'weekly') {
        isDue = true; // daily opportunity for weekly habit
      }

      if (isDue) {
        scheduledCount++;
        const isDone = completions.some(c => c.habitId === habit.id && c.date === dateStr);
        if (isDone) {
          completedCount++;
        }
      }
    });
  });

  const rate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;
  
  // 12 Week Year Standard: 85%+ is Elite execution
  let status: 'elite' | 'operational' | 'needs_alignment' = 'needs_alignment';
  if (rate >= 85) {
    status = 'elite';
  } else if (rate >= 70) {
    status = 'operational';
  }

  return { rate, completedCount, scheduledCount, status };
};

export interface KeystoneInsights {
  optimalSleepRate: number;     // Completion % when sleep >= 7.5h
  suboptimalSleepRate: number;  // Completion % when sleep < 7.0h
  sleepDelta: number;           // Difference
  lowScreenTimeRate: number;    // Completion % when screen time < 2.5h
  highScreenTimeRate: number;   // Completion % when screen time >= 4.0h
  screenDelta: number;
  topKeystoneHabit: {
    habit: Habit;
    otherHabitRate: number;     // Completion % of other habits when this habit is done
  } | null;
}

export const getKeystoneInsights = (
  habits: Habit[],
  completions: Completion[],
  sleepLogs: SleepLog[],
  screenTimeLogs: ScreenTimeLog[]
): KeystoneInsights => {
  // 1. Group completions by date
  const completionsByDate = new Map<string, Set<string>>();
  completions.forEach(c => {
    if (!completionsByDate.has(c.date)) {
      completionsByDate.set(c.date, new Set());
    }
    completionsByDate.get(c.date)!.add(c.habitId);
  });

  // 2. Sleep correlation
  let optimalSleepDone = 0, optimalSleepTotal = 0;
  let subSleepDone = 0, subSleepTotal = 0;

  sleepLogs.forEach(s => {
    const doneForDate = completionsByDate.get(s.date)?.size || 0;
    const totalHabits = habits.length;
    if (totalHabits === 0) return;

    if (s.duration >= 7.5) {
      optimalSleepDone += doneForDate;
      optimalSleepTotal += totalHabits;
    } else if (s.duration < 7.0) {
      subSleepDone += doneForDate;
      subSleepTotal += totalHabits;
    }
  });

  const optimalSleepRate = optimalSleepTotal > 0 ? Math.round((optimalSleepDone / optimalSleepTotal) * 100) : 0;
  const suboptimalSleepRate = subSleepTotal > 0 ? Math.round((subSleepDone / subSleepTotal) * 100) : 0;
  const sleepDelta = optimalSleepRate - suboptimalSleepRate;

  // 3. Screen time correlation
  let lowScreenDone = 0, lowScreenTotal = 0;
  let highScreenDone = 0, highScreenTotal = 0;

  // Aggregate daily screen time
  const dailyScreenTime = new Map<string, number>();
  (screenTimeLogs || []).forEach(st => {
    dailyScreenTime.set(st.date, (dailyScreenTime.get(st.date) || 0) + st.duration);
  });

  dailyScreenTime.forEach((hours, date) => {
    const doneForDate = completionsByDate.get(date)?.size || 0;
    const totalHabits = habits.length;
    if (totalHabits === 0) return;

    if (hours < 2.5) {
      lowScreenDone += doneForDate;
      lowScreenTotal += totalHabits;
    } else if (hours >= 4.0) {
      highScreenDone += doneForDate;
      highScreenTotal += totalHabits;
    }
  });

  const lowScreenTimeRate = lowScreenTotal > 0 ? Math.round((lowScreenDone / lowScreenTotal) * 100) : 0;
  const highScreenTimeRate = highScreenTotal > 0 ? Math.round((highScreenDone / highScreenTotal) * 100) : 0;
  const screenDelta = lowScreenTimeRate - highScreenTimeRate;

  // 4. Top Keystone Habit: Habit whose completion most strongly correlates with other habits
  let topKeystoneHabit: { habit: Habit; otherHabitRate: number } | null = null;
  if (habits.length > 1) {
    let bestCorrelation = -1;

    habits.forEach(candidate => {
      // Dates where candidate was completed
      const candidateDates = completions.filter(c => c.habitId === candidate.id).map(c => c.date);
      if (candidateDates.length < 3) return; // need sufficient sample

      let otherDone = 0;
      let otherTotal = 0;

      candidateDates.forEach(date => {
        const completedOnDate = completionsByDate.get(date) || new Set();
        habits.forEach(other => {
          if (other.id !== candidate.id) {
            otherTotal++;
            if (completedOnDate.has(other.id)) otherDone++;
          }
        });
      });

      const rate = otherTotal > 0 ? Math.round((otherDone / otherTotal) * 100) : 0;
      if (rate > bestCorrelation) {
        bestCorrelation = rate;
        topKeystoneHabit = { habit: candidate, otherHabitRate: rate };
      }
    });
  }

  return {
    optimalSleepRate,
    suboptimalSleepRate,
    sleepDelta,
    lowScreenTimeRate,
    highScreenTimeRate,
    screenDelta,
    topKeystoneHabit
  };
};

// ─── Executive Behavioral Analytics Calculations ──────────────────────────────

export interface RollingVelocity {
  currentRate: number;      // e.g. 84%
  previousRate: number;     // e.g. 70%
  delta: number;            // +14%
  currentCompleted: number;
  currentScheduled: number;
}

export const calculateRollingVelocity = (
  habits: Habit[],
  completions: Completion[],
  windowDays = 7
): RollingVelocity => {
  const now = startOfDay(new Date());
  
  // Current window: [now - (windowDays - 1), now]
  const currentStart = subDays(now, windowDays - 1);
  const currentInterval = eachDayOfInterval({ start: currentStart, end: now });

  // Previous window: [now - (windowDays * 2 - 1), now - windowDays]
  const prevEnd = subDays(now, windowDays);
  const prevStart = subDays(now, (windowDays * 2) - 1);
  const prevInterval = eachDayOfInterval({ start: prevStart, end: prevEnd });

  const getStatsForInterval = (dates: Date[]) => {
    let scheduled = 0;
    let completed = 0;

    dates.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay();

      habits.forEach(h => {
        if (h.startDate && dateStr < h.startDate) return;
        if (h.endDate && dateStr > h.endDate) return;

        let isDue = true;
        if (h.frequency === 'weekly' && h.selectedDays && h.selectedDays.length > 0) {
          isDue = h.selectedDays.includes(dayOfWeek);
        }

        if (isDue) {
          scheduled++;
          const done = completions.some(c => c.habitId === h.id && c.date === dateStr);
          if (done) completed++;
        }
      });
    });

    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
    return { scheduled, completed, rate };
  };

  const current = getStatsForInterval(currentInterval);
  const previous = getStatsForInterval(prevInterval);
  const delta = current.rate - previous.rate;

  return {
    currentRate: current.rate,
    previousRate: previous.rate,
    delta,
    currentCompleted: current.completed,
    currentScheduled: current.scheduled
  };
};

export interface ResilienceScore {
  resilienceRate: number;   // 0-100%
  salvagedCount: number;
  totalLapses: number;
}

export const calculateResilienceScore = (
  habits: Habit[],
  completions: Completion[]
): ResilienceScore => {
  let totalLapses = 0;
  let salvagedCount = 0;

  habits.filter(h => h.frequency === 'daily').forEach(habit => {
    const dates = completions
      .filter(c => c.habitId === habit.id)
      .map(c => c.date);
    const dateSet = new Set(dates);

    if (dates.length < 2) return;

    // Check last 60 days
    const today = startOfDay(new Date());
    for (let i = 2; i <= 60; i++) {
      const dayBefore = format(subDays(today, i), 'yyyy-MM-dd');
      const targetDay = format(subDays(today, i - 1), 'yyyy-MM-dd');
      const dayAfter = format(subDays(today, i - 2), 'yyyy-MM-dd');

      // If dayBefore was done, targetDay was missed
      if (dateSet.has(dayBefore) && !dateSet.has(targetDay)) {
        totalLapses++;
        // If dayAfter was done -> Never Miss Twice salvaged the streak!
        if (dateSet.has(dayAfter)) {
          salvagedCount++;
        }
      }
    }
  });

  const resilienceRate = totalLapses > 0 ? Math.round((salvagedCount / totalLapses) * 100) : 100;
  return { resilienceRate, salvagedCount, totalLapses };
};

export interface DayOfWeekStat {
  dayIndex: number;
  dayName: string;
  rate: number;
  completed: number;
  scheduled: number;
}

export const calculateDayOfWeekPerformance = (
  habits: Habit[],
  completions: Completion[],
  daysCount = 60
): { days: DayOfWeekStat[]; bestDay: DayOfWeekStat; weakestDay: DayOfWeekStat } => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    dayName: dayNames[i],
    completed: 0,
    scheduled: 0,
    rate: 0
  }));

  const now = startOfDay(new Date());
  const start = subDays(now, daysCount - 1);
  const interval = eachDayOfInterval({ start, end: now });

  interval.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();

    habits.forEach(h => {
      if (h.startDate && dateStr < h.startDate) return;
      if (h.endDate && dateStr > h.endDate) return;

      let isDue = true;
      if (h.frequency === 'weekly' && h.selectedDays && h.selectedDays.length > 0) {
        isDue = h.selectedDays.includes(dayOfWeek);
      }

      if (isDue) {
        buckets[dayOfWeek].scheduled++;
        const done = completions.some(c => c.habitId === h.id && c.date === dateStr);
        if (done) buckets[dayOfWeek].completed++;
      }
    });
  });

  buckets.forEach(b => {
    b.rate = b.scheduled > 0 ? Math.round((b.completed / b.scheduled) * 100) : 0;
  });

  // Reorder starting Monday (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const reordered = [...buckets.slice(1), buckets[0]];

  // Sort by rate to identify best and weakest
  const sorted = [...reordered].sort((a, b) => b.rate - a.rate);
  const bestDay = sorted[0];
  const weakestDay = sorted[sorted.length - 1];

  return { days: reordered, bestDay, weakestDay };
};

export interface SleepBracket {
  label: string;
  range: string;
  rate: number;
  daysCount: number;
  sampleDescription: string;
}

export const calculateSleepBrackets = (
  habits: Habit[],
  completions: Completion[],
  sleepLogs: SleepLog[]
): SleepBracket[] => {
  const completionsByDate = new Map<string, number>();
  completions.forEach(c => {
    completionsByDate.set(c.date, (completionsByDate.get(c.date) || 0) + 1);
  });

  const brackets = [
    { label: '< 6h', range: 'Severely Deprived', min: 0, max: 6.0, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
    { label: '6h – 7h', range: 'Suboptimal', min: 6.0, max: 7.0, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
    { label: '7h – 8h', range: 'Optimal Zone', min: 7.0, max: 8.0, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
    { label: '> 8h', range: 'Deep Recovery', min: 8.0, max: 24.0, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
  ];

  sleepLogs.forEach(s => {
    const done = completionsByDate.get(s.date) || 0;
    const totalHabits = habits.length;
    if (totalHabits === 0) return;

    for (const b of brackets) {
      if (s.duration >= b.min && s.duration < b.max) {
        b.totalCompleted += done;
        b.totalPossible += totalHabits;
        b.daysCount++;
        break;
      }
    }
  });

  return brackets.map(b => ({
    label: b.label,
    range: b.range,
    rate: b.totalPossible > 0 ? Math.round((b.totalCompleted / b.totalPossible) * 100) : 0,
    daysCount: b.daysCount,
    sampleDescription: `${b.daysCount} logged ${b.daysCount === 1 ? 'day' : 'days'}`
  }));
};

export interface ScreenTimeBracket {
  label: string;
  range: string;
  rate: number;
  daysCount: number;
  description: string;
}

export const calculateScreenTimeBrackets = (
  habits: Habit[],
  completions: Completion[],
  screenTimeLogs: ScreenTimeLog[]
): ScreenTimeBracket[] => {
  const completionsByDate = new Map<string, number>();
  completions.forEach(c => {
    completionsByDate.set(c.date, (completionsByDate.get(c.date) || 0) + 1);
  });

  const dailyScreenTime = new Map<string, number>();
  (screenTimeLogs || []).forEach(st => {
    dailyScreenTime.set(st.date, (dailyScreenTime.get(st.date) || 0) + st.duration);
  });

  const brackets = [
    { label: '< 2.5h', range: 'Laser Focus', min: 0, max: 2.5, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
    { label: '2.5h – 4h', range: 'Moderate', min: 2.5, max: 4.0, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
    { label: '> 4.0h', range: 'Digital Fatigue', min: 4.0, max: 24.0, totalCompleted: 0, totalPossible: 0, daysCount: 0 },
  ];

  dailyScreenTime.forEach((hours, date) => {
    const done = completionsByDate.get(date) || 0;
    const totalHabits = habits.length;
    if (totalHabits === 0) return;

    for (const b of brackets) {
      if (hours >= b.min && hours < b.max) {
        b.totalCompleted += done;
        b.totalPossible += totalHabits;
        b.daysCount++;
        break;
      }
    }
  });

  return brackets.map(b => ({
    label: b.label,
    range: b.range,
    rate: b.totalPossible > 0 ? Math.round((b.totalCompleted / b.totalPossible) * 100) : 0,
    daysCount: b.daysCount,
    description: `${b.daysCount} logged ${b.daysCount === 1 ? 'day' : 'days'}`
  }));
};

export type HabitHealthTier = 'anchor' | 'momentum' | 'friction' | 'dormant';

export interface HabitHealthItem {
  habit: Habit;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  tier: HabitHealthTier;
  tierLabel: string;
  recommendation: string;
  fullCount: number;
  microCount: number;
}

export const calculateHabitHealthMatrix = (
  habits: Habit[],
  completions: Completion[]
): HabitHealthItem[] => {
  const now = startOfDay(new Date());
  const twoWeeksAgo = format(subDays(now, 14), 'yyyy-MM-dd');

  return habits.map(habit => {
    const { rate, fullCompleted, microCompleted } = getCompletionStats(habit, completions);
    const { currentStreak, longestStreak } = calculateStreak(habit, completions);

    const recentCompletions = completions.filter(c => c.habitId === habit.id && c.date >= twoWeeksAgo);

    let tier: HabitHealthTier = 'momentum';
    let tierLabel = 'Developing Momentum';
    let recommendation = 'Keep building consistency to reach the 85% anchor threshold.';

    if (recentCompletions.length === 0 && completions.filter(c => c.habitId === habit.id).length > 0) {
      tier = 'dormant';
      tierLabel = 'Dormant (Zero in 14d)';
      recommendation = 'Either archive this habit or redesign the anchor cue to revive it.';
    } else if (rate >= 85 && currentStreak >= 5) {
      tier = 'anchor';
      tierLabel = 'Automated Anchor (≥85%)';
      recommendation = 'Solidified habit! Excellent candidate to stack a new micro-habit onto.';
    } else if (rate < 70) {
      tier = 'friction';
      tierLabel = 'High Friction (<70%)';
      recommendation = habit.twoMinuteRule 
        ? `Scale down! Execute the 2-minute version: "${habit.twoMinuteRule}".`
        : 'Friction detected: add a 2-Minute emergency version to avoid all-or-nothing failure.';
    }

    return {
      habit,
      accuracy: rate,
      currentStreak,
      longestStreak,
      tier,
      tierLabel,
      recommendation,
      fullCount: fullCompleted,
      microCount: microCompleted
    };
  }).sort((a, b) => b.accuracy - a.accuracy);
};
