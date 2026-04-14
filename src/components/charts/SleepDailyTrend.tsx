'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useHabitStore } from '@/store/useHabitStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function SleepDailyTrend() {
  const { sleepLogs } = useHabitStore();

  const data = React.useMemo(() => {
    const end = new Date();
    const start = subDays(end, 13); // Last 14 days
    const intervals = eachDayOfInterval({ start, end });

    return intervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = sleepLogs.find(l => l.date === dateStr);
      return {
        date: format(date, 'MMM d'),
        duration: log ? log.duration : 0,
        fullDate: dateStr,
        category: log?.category || 'No data'
      };
    });
  }, [sleepLogs]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            domain={[0, 12]}
            ticks={[0, 3, 6, 9, 12]}
            unit="h"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderColor: '#27272a',
              borderRadius: '16px',
              fontSize: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
            cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="duration" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorSleep)" 
            animationDuration={1500}
            name="Sleep Duration"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
