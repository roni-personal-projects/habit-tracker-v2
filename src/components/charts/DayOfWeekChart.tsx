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
import { DayOfWeekStat } from '@/lib/streak-logic';

interface DayOfWeekChartProps {
  data: DayOfWeekStat[];
  bestDay: DayOfWeekStat;
  weakestDay: DayOfWeekStat;
}

export default function DayOfWeekChart({ data, bestDay, weakestDay }: DayOfWeekChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d: DayOfWeekStat = payload[0].payload;
      return (
        <div className="bg-[#121215] border border-zinc-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{d.dayName} Consistency</p>
          <div className="flex items-center justify-between text-zinc-300 gap-4">
            <span>Accuracy Rate:</span>
            <span className="font-black text-white">{d.rate}%</span>
          </div>
          <div className="flex items-center justify-between text-zinc-500 text-[10px]">
            <span>Executed:</span>
            <span>{d.completed} of {d.scheduled}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[240px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="dayName" 
            stroke="#71717a" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
            {data.map((entry) => {
              const isBest = entry.dayIndex === bestDay?.dayIndex && entry.rate > 0;
              const isWeakest = entry.dayIndex === weakestDay?.dayIndex && entry.rate < 100;
              const fillColor = isBest 
                ? '#10b981' // emerald for best day
                : isWeakest 
                ? '#f59e0b' // amber for friction day
                : '#3b82f6'; // default blue
              return <Cell key={`cell-${entry.dayIndex}`} fill={fillColor} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
