'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useHabitStore } from '@/store/useHabitStore';
import { format, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, parseISO } from 'date-fns';

export default function SleepWeeklySummary() {
  const { sleepLogs } = useHabitStore();

  const data = React.useMemo(() => {
    const end = new Date();
    const start = subWeeks(end, 5); // Last 6 weeks
    const weeks = eachWeekOfInterval({ start, end });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const logsInWeek = sleepLogs.filter(log => {
        const logDate = parseISO(log.date);
        return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
      });

      const avgDuration = logsInWeek.length > 0
        ? logsInWeek.reduce((acc, log) => acc + log.duration, 0) / logsInWeek.length
        : 0;

      return {
        week: `Week of ${format(weekStart, 'MMM d')}`,
        avgDuration: parseFloat(avgDuration.toFixed(1)),
        count: logsInWeek.length
      };
    });
  }, [sleepLogs]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="week" 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 12]}
            unit="h"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderColor: '#27272a',
              borderRadius: '16px',
              fontSize: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar dataKey="avgDuration" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.avgDuration >= 7 ? '#10b981' : '#3b82f6'} 
                fillOpacity={entry.avgDuration > 0 ? 0.8 : 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
