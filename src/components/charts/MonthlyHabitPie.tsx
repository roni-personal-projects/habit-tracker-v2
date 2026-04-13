'use client';

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Habit, Completion } from '@/types';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isAfter, 
  startOfDay, 
  parseISO,
  format
} from 'date-fns';

interface MonthlyHabitPieProps {
  habit: Habit;
  completions: Completion[];
}

export default function MonthlyHabitPie({ habit, completions }: MonthlyHabitPieProps) {
  const data = React.useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(today);
    
    // We only count days in the month up to today
    const daysInterval = eachDayOfInterval({
      start: monthStart,
      end: today
    });

    const habitCompletionsInMonth = completions.filter(c => {
      const compDate = startOfDay(parseISO(c.date));
      return c.habitId === habit.id && isSameMonth(compDate, today);
    });

    const completedCount = habitCompletionsInMonth.length;
    // For simplicity in a radial chart, we compare completions to total possible "tracking points" 
    // In a daily habit, it's just total days. In others, it's still useful to see completion vs empty days.
    const missedCount = Math.max(0, daysInterval.length - completedCount);

    return [
      { name: 'Completed', value: completedCount, color: habit.color },
      { name: 'Missed', value: missedCount, color: '#27272a' }
    ];
  }, [habit, completions]);

  return (
    <div className="h-[120px] w-[120px] mx-auto relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={45}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderColor: '#27272a',
              borderRadius: '8px',
              fontSize: '10px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-[10px] font-bold text-zinc-500 uppercase">Rate</span>
        <span className="text-sm font-black text-white">
          {Math.round((data[0].value / (data[0].value + data[1].value || 1)) * 100)}%
        </span>
      </div>
    </div>
  );
}
