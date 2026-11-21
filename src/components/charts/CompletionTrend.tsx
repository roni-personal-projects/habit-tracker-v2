'use client';

import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { useHabitStore } from '@/store/useHabitStore';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';

interface CompletionTrendProps {
  daysRange?: number;
}

export default function CompletionTrend({ daysRange = 30 }: CompletionTrendProps) {
  const { completions } = useHabitStore();

  const data = React.useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, Math.max(6, daysRange - 1));
    const intervals = eachDayOfInterval({ start, end });

    return intervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayCompletions = completions.filter(c => c.date === dateStr);
      const micro = dayCompletions.filter(c => c.status === 'micro').length;
      const full = dayCompletions.filter(c => !c.status || c.status === 'full').length;
      const total = full + micro;

      return {
        date: format(date, daysRange <= 14 ? 'EEE d' : 'MMM d'),
        fullDate: format(date, 'MMMM d, yyyy'),
        Full: full,
        Micro: micro,
        Total: total
      };
    });
  }, [completions, daysRange]);

  const tickInterval = daysRange <= 14 ? 1 : daysRange <= 30 ? 5 : daysRange <= 90 ? 14 : 30;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0]?.payload;
      return (
        <div className="bg-[#121215] border border-zinc-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]">
          <p className="font-bold text-zinc-200 border-b border-zinc-800 pb-1">{pData?.fullDate}</p>
          <div className="flex items-center justify-between text-blue-400">
            <span>Full Habits:</span>
            <span className="font-bold">{pData?.Full || 0}</span>
          </div>
          <div className="flex items-center justify-between text-amber-400">
            <span>2-Min Micro:</span>
            <span className="font-bold">+{pData?.Micro || 0}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800 font-black text-white">
            <span>Total Actions:</span>
            <span>{pData?.Total || 0}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorMicro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="date" 
            stroke="#71717a" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value) => <span className="text-zinc-400">{value === 'Full' ? 'Full Habit Volume' : '2-Min Micro Saves'}</span>}
          />
          {/* Stacked Areas */}
          <Area 
            type="monotone" 
            dataKey="Full" 
            stackId="1"
            stroke="#3b82f6" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorFull)" 
          />
          <Area 
            type="monotone" 
            dataKey="Micro" 
            stackId="1"
            stroke="#f59e0b" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorMicro)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
