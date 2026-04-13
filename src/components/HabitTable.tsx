'use client';

import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, startOfDay, isToday as isTodayFn, isFuture } from 'date-fns';
import { useHabitStore } from '@/store/useHabitStore';
import { calculateStreak } from '@/lib/streak-logic';
import { Check, Flame, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HabitTable() {
  const { habits, completions, toggleCompletion } = useHabitStore();
  const [offset, setOffset] = React.useState(0);

  const daysCount = 14;
  const dates = useMemo(() => {
    const end = startOfDay(subDays(new Date(), offset));
    const start = subDays(end, daysCount - 1);
    return eachDayOfInterval({ start, end });
  }, [offset]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setOffset(prev => prev + 14)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
            title="Previous 14 days"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setOffset(prev => Math.max(0, prev - 14))}
            disabled={offset === 0}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="Next 14 days"
          >
            <ChevronRight size={18} />
          </button>
          {offset > 0 && (
            <button 
              onClick={() => setOffset(0)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 transition-all text-xs font-bold"
            >
              <RotateCcw size={14} />
              TODAY
            </button>
          )}
        </div>
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-3 py-1.5 rounded-full">
          {format(dates[0], 'MMM d')} — {format(dates[dates.length - 1], 'MMM d, yyyy')}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
              <th className="sticky left-0 z-10 bg-zinc-900 p-4 text-left font-semibold text-zinc-100 min-w-[200px] border-r border-zinc-800">
                Habit
              </th>
              {dates.map((date) => (
                <th key={date.toISOString()} className="p-4 text-center min-w-[60px]">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                    {format(date, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    isTodayFn(date) ? "text-blue-500" : "text-zinc-300"
                  )}>
                    {format(date, 'd')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 ? (
              <tr>
                <td colSpan={daysCount + 1} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Plus size={40} className="opacity-20 mb-2" />
                    <p>No habits yet. Create one to start tracking!</p>
                  </div>
                </td>
              </tr>
            ) : (
              habits.map((habit) => {
                const { currentStreak } = calculateStreak(habit, completions);
                
                return (
                  <tr key={habit.id} className="border-b border-zinc-800 group hover:bg-white/[0.02] transition-colors">
                    <td className="sticky left-0 z-10 bg-zinc-900 p-4 border-r border-zinc-800 transition-colors group-hover:bg-zinc-800/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-100">{habit.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: habit.color }}
                          />
                          <span className="text-[10px] text-zinc-500 uppercase tracking-tight">
                            {habit.frequency}
                          </span>
                          {currentStreak > 0 && (
                            <div className="flex items-center gap-0.5 ml-2 text-orange-500">
                              <Flame size={12} fill="currentColor" />
                              <span className="text-xs font-bold">{currentStreak}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {dates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isCompleted = completions.some(
                        (c) => c.habitId === habit.id && c.date === dateStr
                      );
                      const future = isFuture(date) && !isTodayFn(date);

                      return (
                        <td 
                          key={dateStr}
                          className={cn(
                            "p-0 border-r border-zinc-900 last:border-r-0",
                            future ? "opacity-20 cursor-not-allowed" : "cursor-pointer"
                          )}
                          onClick={() => !future && toggleCompletion(habit.id, dateStr)}
                        >
                          <div className={cn(
                            "w-full h-14 flex items-center justify-center transition-all duration-300",
                            isCompleted ? "scale-100" : "scale-100"
                          )}>
                            <div 
                              className={cn(
                                "w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-200",
                                isCompleted 
                                  ? "shadow-lg" 
                                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                              )}
                              style={isCompleted ? { 
                                backgroundColor: habit.color,
                                borderColor: habit.color,
                                boxShadow: `0 0 12px ${habit.color}40`
                              } : {}}
                            >
                              {isCompleted && <Check size={14} className="text-white stroke-[3px]" />}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
