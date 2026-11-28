'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import HabitTable from '@/components/HabitTable';
import TodayFocusView from '@/components/TodayFocusView';
import BirthdayUrgencyBar from '@/components/BirthdayUrgencyBar';
import HabitForm from '@/components/HabitForm';
import { 
  Plus, Flame, Target, CheckCircle2, Moon, Laptop, Sparkles, 
  AlertTriangle, ShieldCheck, Zap, Settings2, Calendar, Flag, X,
  ListChecks, Table as TableIcon
} from 'lucide-react';
import { calculateStreak, calculateWeeklyExecution, calculateIdentityVotes } from '@/lib/streak-logic';
import { Habit } from '@/types';
import { cn } from '@/lib/utils';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const formatDuration = (hoursDec: number) => {
  if (!hoursDec || isNaN(hoursDec)) return '0m';
  const h = Math.floor(hoursDec);
  const m = Math.round((hoursDec - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export default function Home() {
  const { 
    habits, 
    completions, 
    sleepLogs, 
    screenTimeLogs,
    pausedHabitIds = [],
    sprintGoal = 'Quarterly Peak Performance & Consistency',
    sprintStartDate = new Date().toISOString().split('T')[0],
    sprintTargetRate = 85,
    updateSprintSettings
  } = useHabitStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [trackerView, setTrackerView] = useState<'today' | 'grid'>('today');

  // 12-Week Sprint Modal State
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [formGoal, setFormGoal] = useState(sprintGoal);
  const [formStartDate, setFormStartDate] = useState(sprintStartDate);
  const [formTargetRate, setFormTargetRate] = useState(sprintTargetRate);

  const openSprintModal = () => {
    setFormGoal(sprintGoal || 'Quarterly Peak Performance & Consistency');
    setFormStartDate(sprintStartDate || new Date().toISOString().split('T')[0]);
    setFormTargetRate(sprintTargetRate || 85);
    setIsSprintModalOpen(true);
  };

  const handleSaveSprint = (e: React.FormEvent) => {
    e.preventDefault();
    updateSprintSettings({
      sprintGoal: formGoal.trim() || 'Quarterly Peak Performance & Consistency',
      sprintStartDate: formStartDate || new Date().toISOString().split('T')[0],
      sprintTargetRate: Number(formTargetRate) || 85,
    });
    setIsSprintModalOpen(false);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHabit(null);
  };

  // Keyboard Shortcuts & Event Listeners
  React.useEffect(() => {
    const handleCreateHabit = () => {
      setEditingHabit(null);
      setIsFormOpen(true);
    };
    const handleOpenSprintEvent = () => {
      openSprintModal();
    };
    const handleCloseModals = () => {
      setIsFormOpen(false);
      setIsSprintModalOpen(false);
    };

    window.addEventListener('habitflow:create-habit', handleCreateHabit);
    window.addEventListener('habitflow:open-sprint', handleOpenSprintEvent);
    window.addEventListener('habitflow:close-modals', handleCloseModals);

    // Check if navigated with ?create=true
    if (typeof window !== 'undefined' && window.location.search.includes('create=true')) {
      handleCreateHabit();
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('habitflow:create-habit', handleCreateHabit);
      window.removeEventListener('habitflow:open-sprint', handleOpenSprintEvent);
      window.removeEventListener('habitflow:close-modals', handleCloseModals);
    };
  }, [openSprintModal]);

  // Derived stats
  const pausedSet = new Set(pausedHabitIds);
  const activeHabits = habits.filter(h => !pausedSet.has(h.id));
  const totalHabits = activeHabits.length;
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

  // 12-Week Year Sprint Calculations
  const today = new Date();
  const sprintStart = sprintStartDate ? parseISO(sprintStartDate) : today;
  const daysDiff = differenceInCalendarDays(today, sprintStart);
  const rawWeekNum = Math.floor(daysDiff / 7) + 1;
  const currentWeekNum = Math.min(12, Math.max(1, rawWeekNum));
  const isSprintFinished = rawWeekNum > 12;

  // Behavioral Science Insights (exclude paused habits from weekly pace & at-risk radar)
  const weeklyExecution = calculateWeeklyExecution(activeHabits, completions, sprintTargetRate);
  const identityVotes = calculateIdentityVotes(habits, completions);
  const atRiskHabits = activeHabits.filter(h => calculateStreak(h, completions).isAtRisk);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Your Progress</h1>
          <p className="text-zinc-400">Identity-based habits compounded over time create exponential change.</p>
        </div>
        <button 
          onClick={() => {
            setEditingHabit(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          title="Create Habit (Press C)"
        >
          <Plus size={20} />
          <span>Create Habit</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/20 rounded text-white">
            C
          </kbd>
        </button>
      </header>

      {/* ⏳ Birthday & Time Urgency Bar */}
      <BirthdayUrgencyBar />

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
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-between relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={14} className="text-blue-400" />
                12-Week Year Scorecard
              </span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  weeklyExecution.status === 'elite'
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : weeklyExecution.status === 'operational'
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                )}>
                  {weeklyExecution.status === 'elite' ? `🟢 Elite (≥${sprintTargetRate}%)` : weeklyExecution.status === 'operational' ? '🔵 Operational' : '🟡 Needs Focus'}
                </span>
                <button
                  onClick={openSprintModal}
                  title="Configure 12-Week Sprint"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <Settings2 size={15} />
                </button>
              </div>
            </div>

            {/* Sprint Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <Calendar size={12} />
                {isSprintFinished ? 'Sprint Completed' : `Week ${currentWeekNum} of 12`}
              </span>
              {sprintGoal && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 truncate max-w-[220px]" title={sprintGoal}>
                  <Flag size={11} className="text-amber-400 shrink-0" />
                  <span className="truncate">{sprintGoal}</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white">{weeklyExecution.rate}%</span>
              <span className="text-xs text-zinc-400">weekly pace ({weeklyExecution.completedCount}/{weeklyExecution.scheduledCount} actions)</span>
            </div>

            {/* Execution Progress Bar */}
            <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden mt-2 relative border border-zinc-700/30">
              <div 
                className={cn(
                  "h-full transition-all duration-700 rounded-full",
                  weeklyExecution.rate >= sprintTargetRate ? "bg-emerald-500" : weeklyExecution.rate >= Math.round(sprintTargetRate * 0.8) ? "bg-blue-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.min(100, weeklyExecution.rate)}%` }}
              />
              {/* Target Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                style={{ left: `${Math.min(100, Math.max(0, sprintTargetRate))}%` }}
                title={`${sprintTargetRate}% Target Gold Standard`}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              Target: <strong className="text-zinc-200">≥{sprintTargetRate}%</strong> lead execution
            </span>
            <button
              onClick={openSprintModal}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
            >
              Edit Sprint &rarr;
            </button>
          </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-zinc-100">
              {trackerView === 'today' ? "Today's Focus" : 'Weekly Tracker'}
            </h2>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <button
              type="button"
              onClick={() => setTrackerView('today')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                trackerView === 'today'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <ListChecks size={14} />
              <span>Today</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackerView('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                trackerView === 'grid'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <TableIcon size={14} />
              <span>14-Day Grid</span>
            </button>
          </div>
        </div>

        {trackerView === 'today' ? (
          <TodayFocusView
            onEditHabit={handleEditHabit}
            onCreateHabit={() => {
              setEditingHabit(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <HabitTable onEditHabit={handleEditHabit} />
        )}
      </section>

      <HabitForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        habit={editingHabit} 
      />

      {/* ─── 12-Week Year Sprint Settings Modal ────────────────────────────── */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border border-zinc-750 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">12-Week Year Sprint Settings</h3>
                  <p className="text-xs text-zinc-400">Structure your 12-week vision, timeline, and lead execution rate.</p>
                </div>
              </div>
              <button
                onClick={() => setIsSprintModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSprint} className="space-y-5 mt-5">
              {/* Sprint Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flag size={13} className="text-amber-400" />
                  Sprint Vision / Main Goal
                </label>
                <input
                  type="text"
                  value={formGoal}
                  onChange={(e) => setFormGoal(e.target.value)}
                  placeholder="e.g. Q4 Peak Performance & Ship MVP"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                
                {/* Goal presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    '🚀 Launch MVP & Revenue Focus',
                    '🧠 Deep Work & Cognitive Clarity',
                    '💪 Fitness, Sleep & Vitality',
                    '⚡ Habit Mastery & 85% Execution'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormGoal(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/60 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sprint Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-400" />
                  Sprint Cycle Start Date
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-400">
                  Calculates your progress across the 12-week timeline. Today is in <strong className="text-blue-300">Week {Math.min(12, Math.max(1, Math.floor(differenceInCalendarDays(new Date(), formStartDate ? parseISO(formStartDate) : new Date()) / 7) + 1))} of 12</strong>.
                </p>
              </div>

              {/* Target Execution Benchmark */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Target Execution Benchmark (%)
                  </label>
                  <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                    {formTargetRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={formTargetRate}
                  onChange={(e) => setFormTargetRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-semibold px-1">
                  <span>60% (Minimum)</span>
                  <span className="text-emerald-400 font-bold">85% (Book Standard)</span>
                  <span>95% (Hardcore)</span>
                </div>
              </div>

              {/* Explainer Box */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                💡 <em>The 12 Week Year</em> principle: Rather than waiting 12 months, treat 12 weeks as a full year. Your weekly execution score is a <strong>Lead Indicator</strong>: complete your planned habits each day to push your weekly score above your target benchmark.
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setFormGoal('Quarterly Peak Performance & Consistency');
                    setFormStartDate(new Date().toISOString().split('T')[0]);
                    setFormTargetRate(85);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setIsSprintModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-95"
                >
                  Save Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
