'use client';

import React, { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useHabitStore } from '@/store/useHabitStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function ScreenTimeTrend() {
  const { screenTimeLogs } = useHabitStore();

  const data = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 13); // Last 14 days
    const intervals = eachDayOfInterval({ start, end });

    return intervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dailyLogs = screenTimeLogs.filter(l => l.date === dateStr);
      
      const productivity = dailyLogs.filter(l => l.category === 'Productivity').reduce((acc, l) => acc + l.duration, 0);
      const social = dailyLogs.filter(l => l.category === 'Social').reduce((acc, l) => acc + l.duration, 0);
      const entertainment = dailyLogs.filter(l => l.category === 'Entertainment').reduce((acc, l) => acc + l.duration, 0);
      const gaming = dailyLogs.filter(l => l.category === 'Gaming').reduce((acc, l) => acc + l.duration, 0);
      const other = dailyLogs.filter(l => l.category === 'Other').reduce((acc, l) => acc + l.duration, 0);
      
      const total = productivity + social + entertainment + gaming + other;

      return {
        date: format(date, 'MMM d'),
        total,
        Productivity: productivity,
        Social: social,
        Entertainment: entertainment,
        Gaming: gaming,
        Other: other
      };
    });
  }, [screenTimeLogs]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="date" 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => `${val}h`}
          />
          <Tooltip 
            cursor={{ fill: '#27272a', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderColor: '#27272a',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#fff'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
          <Bar dataKey="Productivity" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Social" stackId="a" fill="#f97316" />
          <Bar dataKey="Entertainment" stackId="a" fill="#a855f7" />
          <Bar dataKey="Gaming" stackId="a" fill="#10b981" />
          <Bar dataKey="Other" stackId="a" fill="#71717a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
