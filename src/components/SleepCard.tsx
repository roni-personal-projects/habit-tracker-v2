'use client';

import React from 'react';
import { Trash2, Moon, Sun, Clock } from 'lucide-react';
import { SleepLog } from '@/types';
import { useHabitStore } from '@/store/useHabitStore';
import { cn } from '@/lib/utils';

interface SleepCardProps {
  log: SleepLog;
}

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'Great Sleep': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'Good Sleep': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'Overslept': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'Sleep Deprived': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'Severely Deprived': return 'text-red-500 bg-red-500/10 border-red-500/20';
    default: return 'text-zinc-500 bg-zinc-800 border-zinc-700';
  }
};

export default function SleepCard({ log }: SleepCardProps) {
  const { deleteSleepLog } = useHabitStore();

  const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="glass-card p-5 rounded-2xl border border-zinc-800/50 group hover:border-zinc-700 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{formattedDate}</h3>
          <div className={cn("inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold border", getCategoryStyles(log.category))}>
            {log.category.toUpperCase()}
          </div>
        </div>
        <button 
          onClick={() => deleteSleepLog(log.id)}
          className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400">
            <Clock size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{log.duration}<span className="text-sm text-zinc-500 font-bold ml-1">h</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1.5"><Moon size={12} /> {log.sleepTime}</span>
            <span className="flex items-center gap-1.5"><Sun size={12} /> {log.wakeTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
