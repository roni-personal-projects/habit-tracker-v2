'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import HabitTable from '@/components/HabitTable';
import HabitForm from '@/components/HabitForm';
import { Plus, Flame, Target, CheckCircle2, Moon, Laptop, Sparkles, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { calculateStreak, calculateWeeklyExecution, calculateIdentityVotes } from '@/lib/streak-logic';
import { Habit } from '@/types';
import { cn } from '@/lib/utils';

const formatDuration = (hoursDec: number) => {
  if (!hoursDec || isNaN(hoursDec)) return '0m';
  const h = Math.floor(hoursDec);
  const m = Math.round((hoursDec - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export default function Home() {
  const { habits, completions, sleepLogs, screenTimeLogs } = useHabitStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHabit(null);
  };

  // Derived stats
  const totalHabits = habits.length;
  const bestStreak = habits.reduce((max, h) => {
    const { longestStreak } = calculateStreak(h, completions);
    return Math.max(max, longestStreak);
  }, 0);
  
  const todayCount = completions.filter(c => c.date === new Date().toISOString().split('T')[0]).length;

  const lastSleep = [...sleepLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayScreenTime = (screenTimeLogs || [])
    .filter(log => log.date === todayStr)
    .reduce((acc, log) => acc + log.duration, 0);

  // Behavioral Science Insights
  const weeklyExecution = calculateWeeklyExecution(habits, completions);
  const identityVotes = calculateIdentityVotes(habits, completions);
  const atRiskHabits = habits.filter(h => calculateStreak(h, completions).isAtRisk);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Your Progress</h1>
          <p className="text-zinc-400">Identity-based habits compounded over time create exponential change.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          Create Habit
        </button>
      </header>

      {/* ⚠️ Never Miss Twice Action Radar */}
      {atRiskHabits.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                "Never Miss Twice" Action Radar ({atRiskHabits.length} {atRiskHabits.length === 1 ? 'Habit' : 'Habits'} at risk)
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                Missing once is an accident; missing twice is the start of a competing habit. Complete{' '}
                <strong className="text-amber-300">{atRiskHabits.map(h => h.name).join(', ')}</strong> today to activate Iron Recovery and protect your streak!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            Atomic Habits Law #4
          </span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Laptop size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Screen Time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-100">{formatDuration(todayScreenTime)}</span>
            <span className="text-zinc-500 font-medium">today</span>
          </div>
        </div>
      </div>

      {/* Behavioral Architecture Decks: 12-Week Year Execution & Identity Voting Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. The 12-Week Year Execution Scorecard */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={14} className="text-blue-400" />
                The 12 Week Year Scorecard
              </span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                weeklyExecution.status === 'elite'
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : weeklyExecution.status === 'operational'
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              )}>
                {weeklyExecution.status === 'elite' ? '🟢 Elite (≥85%)' : weeklyExecution.status === 'operational' ? '🔵 Operational' : '🟡 Needs Focus'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white">{weeklyExecution.rate}%</span>
              <span className="text-xs text-zinc-400">weekly pace ({weeklyExecution.completedCount}/{weeklyExecution.scheduledCount} actions)</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mt-2 relative">
              <div 
                className={cn(
                  "h-full transition-all duration-700 rounded-full",
                  weeklyExecution.rate >= 85 ? "bg-emerald-500" : weeklyExecution.rate >= 70 ? "bg-blue-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.min(100, weeklyExecution.rate)}%` }}
              />
              {/* 85% Target Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/70"
                style={{ left: '85%' }}
                title="85% Gold Standard"
              />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            <em>The 12 Week Year</em> rule: Consistently maintaining an <strong>≥85% weekly execution rate</strong> guarantees long-term milestone achievement.
          </p>
        </div>

        {/* 2. Atomic Habits: Identity Voting Meter */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Identity Voting Meter (Atomic Habits)
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Votes Cast This Week
              </span>
            </div>

            {identityVotes.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">Assign identities to your habits to start tracking your self-image votes.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {identityVotes.slice(0, 4).map((item) => (
                  <div key={item.identity} className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-zinc-100">{item.identity}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.habitsCount} associated {item.habitsCount === 1 ? 'habit' : 'habits'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-400">+{item.weeklyVotes}</span>
                      <p className="text-[9px] uppercase font-bold text-zinc-500">votes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            You don't need a unanimous vote to win an election; you just need a consistent majority. Every repetition is a vote for who you are becoming.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-100">Weekly Tracker</h2>
        </div>
        <HabitTable onEditHabit={handleEditHabit} />
      </section>

      <HabitForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        habit={editingHabit} 
      />
    </div>
  );
}
