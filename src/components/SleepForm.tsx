'use client';

import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Clock, Brain } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { cn } from '@/lib/utils';

interface SleepFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const getSleepCategory = (duration: number) => {
  if (duration < 4) return { label: 'Severely Deprived', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', psych: 'High stress, critical need for rest.' };
  if (duration < 6) return { label: 'Sleep Deprived', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', psych: 'Reduced focus and emotional regulation.' };
  if (duration < 7) return { label: 'Good Sleep', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', psych: 'Stable energy levels and cognitive function.' };
  if (duration <= 9) return { label: 'Great Sleep', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', psych: 'Optimal recovery and peak mental performance.' };
  return { label: 'Overslept', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', psych: 'Potential lethargy or "sleep drunkenness".' };
};

export default function SleepForm({ isOpen, onClose }: SleepFormProps) {
  const { addSleepLog } = useHabitStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [duration, setDuration] = useState(8);

  useEffect(() => {
    const [sH, sM] = sleepTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    
    let diff = (wH + wM / 60) - (sH + sM / 60);
    if (diff < 0) diff += 24; // Handle overnight
    
    setDuration(parseFloat(diff.toFixed(1)));
  }, [sleepTime, wakeTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = getSleepCategory(duration).label;
    
    addSleepLog({
      date,
      sleepTime,
      wakeTime,
      duration,
      category,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  const categoryInfo = getSleepCategory(duration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
              <Moon size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Log Sleep</h2>
              <p className="text-xs text-zinc-500">Track your nightly recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1">Sleep Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              required
            />
            <p className="text-[10px] text-zinc-500 ml-1 italic">* This is the day you went to sleep.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                <Moon size={14} /> Sleep Time
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                <Sun size={14} /> Wake Time
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className={cn("p-4 rounded-2xl border transition-all duration-300", categoryInfo.bg, categoryInfo.border)}>
            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-lg bg-zinc-900/50", categoryInfo.color)}>
                <Clock size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{duration}</span>
                  <span className="text-zinc-500 text-sm font-bold">hours</span>
                </div>
                <div className={cn("text-sm font-bold mb-1", categoryInfo.color)}>
                  {categoryInfo.label}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Brain size={12} className="text-zinc-500" />
                  {categoryInfo.psych}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Save Sleep Log
          </button>
        </form>
      </div>
    </div>
  );
}
