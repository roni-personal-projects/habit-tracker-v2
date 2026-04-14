'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import HabitTable from '@/components/HabitTable';
import HabitForm from '@/components/HabitForm';
import { Plus, Flame, Target, CheckCircle2, Moon } from 'lucide-react';
import { calculateStreak } from '@/lib/streak-logic';

export default function Home() {
  const { habits, completions, sleepLogs } = useHabitStore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Derived stats
  const totalHabits = habits.length;
  const bestStreak = habits.reduce((max, h) => {
    const { longestStreak } = calculateStreak(h, completions);
    return Math.max(max, longestStreak);
  }, 0);
  
  const todayCount = completions.filter(c => c.date === new Date().toISOString().split('T')[0]).length;

  const lastSleep = [...sleepLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Your Progress</h1>
          <p className="text-zinc-400">Keep up the consistency. You're doing great!</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          Create Habit
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Flame size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Best Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-100">{bestStreak}</span>
            <span className="text-zinc-500 font-medium">days</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Target size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Active Habits</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-100">{totalHabits}</span>
            <span className="text-zinc-500 font-medium">habits</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Completed Today</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-100">{todayCount}</span>
            <span className="text-zinc-500 font-medium">tasks</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Moon size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Last Night</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-100">{lastSleep?.duration || 0}</span>
            <span className="text-zinc-500 font-medium">hours</span>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-100">Weekly Tracker</h2>
        </div>
        <HabitTable />
      </section>

      <HabitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
