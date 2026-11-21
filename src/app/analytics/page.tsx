'use client';

import React, { useState, useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import CompletionTrend from '@/components/charts/CompletionTrend';
import DayOfWeekChart from '@/components/charts/DayOfWeekChart';
import GlobalPieChart from '@/components/charts/GlobalPieChart';
import ScreenTimeTrend from '@/components/charts/ScreenTimeTrend';
import { 
  calculateStreak, 
  getCompletionStats, 
  calculateIdentityVotes, 
  getKeystoneInsights,
  calculateRollingVelocity,
  calculateResilienceScore,
  calculateDayOfWeekPerformance,
  calculateSleepBrackets,
  calculateScreenTimeBrackets,
  calculateHabitHealthMatrix,
  HabitHealthTier
} from '@/lib/streak-logic';
import { 
  Flame, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart as PieChartIcon, 
  Sparkles, 
  Moon, 
  Key, 
  Activity, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Laptop, 
  Layers, 
  Award, 
  CheckCircle2, 
  HelpCircle,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { habits, categories, completions, sleepLogs, screenTimeLogs } = useHabitStore();
  const [timeRange, setTimeRange] = useState<number>(30); // 7, 30, 90, 365
  const [healthFilter, setHealthFilter] = useState<'all' | HabitHealthTier>('all');

  // Behavioral Analytics Calculations
  const rollingVelocity = useMemo(() => {
    const windowDays = timeRange === 7 ? 7 : timeRange === 30 ? 14 : 30;
    return calculateRollingVelocity(habits, completions, windowDays);
  }, [habits, completions, timeRange]);

  const resilienceScore = useMemo(() => {
    return calculateResilienceScore(habits, completions);
  }, [habits, completions]);

  const dayOfWeek = useMemo(() => {
    return calculateDayOfWeekPerformance(habits, completions, timeRange);
  }, [habits, completions, timeRange]);

  const sleepBrackets = useMemo(() => {
    return calculateSleepBrackets(habits, completions, sleepLogs);
  }, [habits, completions, sleepLogs]);

  const screenTimeBrackets = useMemo(() => {
    return calculateScreenTimeBrackets(habits, completions, screenTimeLogs);
  }, [habits, completions, screenTimeLogs]);

  const habitHealthMatrix = useMemo(() => {
    return calculateHabitHealthMatrix(habits, completions);
  }, [habits, completions]);

  const identityVotes = useMemo(() => {
    return calculateIdentityVotes(habits, completions);
  }, [habits, completions]);

  const keystoneInsights = useMemo(() => {
    return getKeystoneInsights(habits, completions, sleepLogs, screenTimeLogs);
  }, [habits, completions, sleepLogs, screenTimeLogs]);

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
          <TrendingUp size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">No data yet</h2>
        <p className="text-zinc-500 max-w-xs">Start tracking your habits to see detailed behavioral analytics and trends here.</p>
      </div>
    );
  }

  // Filtered health items
  const filteredHealthItems = healthFilter === 'all'
    ? habitHealthMatrix
    : habitHealthMatrix.filter(item => item.tier === healthFilter);

  const microCompletionsCount = completions.filter(c => c.status === 'micro').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header with Time-Range Selector */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-2">
            Executive Behavioral Intelligence
          </h1>
          <p className="text-zinc-400 text-sm">
            Lead indicators, momentum velocity, causal keystone metrics, and habit health.
          </p>
        </div>

        {/* Time-Range Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 self-start sm:self-auto">
          {[
            { label: '7D', value: 7, title: 'Last 7 Days (Sprint)' },
            { label: '30D', value: 30, title: 'Last 30 Days (Monthly)' },
            { label: '90D', value: 90, title: 'Last 90 Days (12-Week Year)' },
            { label: '1Y', value: 365, title: 'Annual Compounding' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setTimeRange(tab.value)}
              title={tab.title}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                timeRange === tab.value
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ─── ROW 1: VELOCITY & MOMENTUM KPI DECK ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Rolling Execution Velocity */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/60 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rolling Execution</span>
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border",
                rollingVelocity.delta >= 0 
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              )}>
                {rollingVelocity.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {rollingVelocity.delta >= 0 ? `+${rollingVelocity.delta}%` : `${rollingVelocity.delta}%`}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{rollingVelocity.currentRate}%</span>
              <span className="text-xs text-zinc-400">vs {rollingVelocity.previousRate}% prior</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800/60">
            {rollingVelocity.delta >= 0 ? '🚀 Positive velocity momentum' : '⚠️ Slight drop in execution velocity'}
          </p>
        </div>

        {/* 2. Resilience Score (Never Miss Twice) */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Resilience Score</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Anti-Fragile
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{resilienceScore.resilienceRate}%</span>
              <span className="text-xs text-zinc-400">recovery rate</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800/60">
            {resilienceScore.salvagedCount} single-day lapses salvaged by next-day action.
          </p>
        </div>

        {/* 3. 2-Min Micro Habits Saved */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <Zap size={13} /> 2-Min Micro Saves
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Rule #3
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{microCompletionsCount}</span>
              <span className="text-xs text-zinc-400">streaks rescued</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800/60">
            Scaled-down actions preventing all-or-nothing failures.
          </p>
        </div>

        {/* 4. Active Identity Personas */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-amber-400" /> Identity Personas
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Self-Image
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{identityVotes.length}</span>
              <span className="text-xs text-zinc-400">tracks building</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800/60">
            {completions.length} total empirical identity votes cast.
          </p>
        </div>
      </div>

      {/* ─── ROW 2: DUAL CORE VISUALIZATIONS ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Stacked Area Trend (Full vs Micro) */}
        <section className="lg:col-span-2 glass-card p-6 rounded-2xl border border-zinc-800/60">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Volume Trend: Full Habits vs. 2-Min Micro Saves ({timeRange} Days)
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800/60 px-2.5 py-1 rounded-full">
              Stacked Volumes
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">
            See how the 2-Minute Rule (amber) rescues days that would otherwise drop to zero.
          </p>
          <CompletionTrend daysRange={timeRange} />
        </section>

        {/* Right 1/3: Day-of-the-Week Friction Breakdown */}
        <section className="glass-card p-6 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                Day-of-Week Rhythm
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                Friction Scan
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              Consistency rate across each weekday.
            </p>

            <DayOfWeekChart 
              data={dayOfWeek.days} 
              bestDay={dayOfWeek.bestDay} 
              weakestDay={dayOfWeek.weakestDay} 
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Peak Day:
              </span>
              <strong className="text-emerald-400">{dayOfWeek.bestDay?.dayName} ({dayOfWeek.bestDay?.rate}%)</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Friction Day:
              </span>
              <strong className="text-amber-400">{dayOfWeek.weakestDay?.dayName} ({dayOfWeek.weakestDay?.rate}%)</strong>
            </div>
          </div>
        </section>
      </div>

      {/* ─── ROW 3: CAUSAL KEYSTONE INTELLIGENCE ───────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key size={20} className="text-amber-400" />
            Causal Keystone Correlations (Biological & Digital Drivers)
          </h2>
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
            Empirical Evidence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Sleep Duration Brackets */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Moon size={15} /> Sleep Duration Impact
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
                  Biological Base
                </span>
              </div>
              <h3 className="font-bold text-white text-sm mb-3">Habit Follow-Through by Sleep Brackets</h3>
              <div className="space-y-3">
                {sleepBrackets.map((bracket) => (
                  <div key={bracket.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">{bracket.label} <span className="text-[10px] text-zinc-500">({bracket.range})</span></span>
                      <span className="font-bold text-white">{bracket.rate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          bracket.rate >= 80 ? "bg-emerald-500" : bracket.rate >= 60 ? "bg-indigo-500" : "bg-zinc-600"
                        )}
                        style={{ width: `${bracket.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-4 italic">
              Executive function directly correlates with sleep duration.
            </p>
          </div>

          {/* 2. Digital Depletion Curve (Screen Time Brackets) */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop size={15} /> Digital Depletion Curve
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">
                  Dopamine Drain
                </span>
              </div>
              <h3 className="font-bold text-white text-sm mb-3">Consistency by Daily Screen Time</h3>
              <div className="space-y-3">
                {screenTimeBrackets.map((bracket) => (
                  <div key={bracket.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">{bracket.label} <span className="text-[10px] text-zinc-500">({bracket.range})</span></span>
                      <span className="font-bold text-white">{bracket.rate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          bracket.rate >= 75 ? "bg-emerald-500" : bracket.rate >= 50 ? "bg-violet-500" : "bg-red-500"
                        )}
                        style={{ width: `${bracket.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-4 italic">
              High screen time depletes evening prefrontal willpower reserves.
            </p>
          </div>

          {/* 3. Crowned #1 Keystone Habit */}
          <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-transparent flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={15} /> #1 Keystone Catalyst
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lead Domino
                </span>
              </div>

              {keystoneInsights.topKeystoneHabit ? (
                <>
                  <h3 className="font-black text-white text-lg mb-1">
                    {keystoneInsights.topKeystoneHabit.habit.name}
                  </h3>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 my-3">
                    <span className="text-2xl font-black text-amber-300">
                      {keystoneInsights.topKeystoneHabit.otherHabitRate}%
                    </span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">
                      average completion rate of all other daily habits when this habit is done!
                    </p>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Completing this habit triggers a positive cognitive cascade. Prioritize this habit early in the day.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-white text-base mb-1">Correlation Engine Calibrating</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    Log at least 3-5 completions across different days to reveal which habit is your statistical catalyst.
                  </p>
                </>
              )}
            </div>
            <p className="text-[10px] text-amber-400/80 mt-4 italic">
              "Focus on keystone habits, and you will transform everything else."
            </p>
          </div>
        </div>
      </section>

      {/* ─── ROW 4: IDENTITY PORTFOLIO ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Identity Portfolio & Empirical Votes Cast
          </h2>
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
            Voting Mechanism of Self-Image
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {identityVotes.map((iv) => (
            <div key={iv.identity} className="glass-card p-5 rounded-2xl border border-zinc-800/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base truncate">{iv.identity}</h3>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    +{iv.weeklyVotes} wk
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{iv.habitsCount} connected habit{iv.habitsCount === 1 ? '' : 's'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Lifetime Votes</span>
                <span className="text-2xl font-black text-white">{iv.totalVotes}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ROW 5: HABIT HEALTH QUADRANT MATRIX ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-blue-400" />
              Habit Health Quadrant Matrix
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identifies automated anchors, developing habits, and friction points needing the 2-Minute Rule.
            </p>
          </div>

          {/* Health Tier Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto overflow-x-auto max-w-full">
            {[
              { id: 'all', label: `All (${habitHealthMatrix.length})` },
              { id: 'anchor', label: `Anchors (${habitHealthMatrix.filter(h => h.tier === 'anchor').length})` },
              { id: 'momentum', label: `Momentum (${habitHealthMatrix.filter(h => h.tier === 'momentum').length})` },
              { id: 'friction', label: `Friction (${habitHealthMatrix.filter(h => h.tier === 'friction').length})` },
              { id: 'dormant', label: `Dormant (${habitHealthMatrix.filter(h => h.tier === 'dormant').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHealthFilter(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  healthFilter === tab.id
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHealthItems.map((item) => {
            const h = item.habit;
            return (
              <div 
                key={h.id} 
                className={cn(
                  "glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between",
                  item.tier === 'anchor' && "border-emerald-500/30 hover:border-emerald-500/50",
                  item.tier === 'momentum' && "border-blue-500/30 hover:border-blue-500/50",
                  item.tier === 'friction' && "border-amber-500/40 bg-amber-500/[0.02] hover:border-amber-500/60",
                  item.tier === 'dormant' && "border-zinc-800 opacity-60 hover:opacity-100"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm"
                        style={{ backgroundColor: h.color }}
                      >
                        {h.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">{h.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {h.identity && (
                            <span className="text-[10px] font-bold text-amber-300">
                              {h.identity}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">• {h.frequency}</span>
                        </div>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                      item.tier === 'anchor' && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      item.tier === 'momentum' && "bg-blue-500/15 text-blue-400 border-blue-500/30",
                      item.tier === 'friction' && "bg-amber-500/15 text-amber-300 border-amber-500/30",
                      item.tier === 'dormant' && "bg-zinc-800 text-zinc-400 border-zinc-700"
                    )}>
                      {item.tierLabel}
                    </span>
                  </div>

                  {/* Accuracy & Streak Row */}
                  <div className="grid grid-cols-3 gap-2 my-3 text-center">
                    <div className="bg-zinc-800/40 p-2 rounded-xl border border-zinc-700/30">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Accuracy</span>
                      <p className="text-lg font-black text-white">{item.accuracy}%</p>
                    </div>
                    <div className="bg-zinc-800/40 p-2 rounded-xl border border-zinc-700/30">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Streak</span>
                      <p className="text-lg font-black text-orange-400 flex items-center justify-center gap-0.5">
                        <Flame size={14} fill="currentColor" /> {item.currentStreak}
                      </p>
                    </div>
                    <div className="bg-zinc-800/40 p-2 rounded-xl border border-zinc-700/30">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Best</span>
                      <p className="text-lg font-black text-zinc-300">{item.longestStreak}d</p>
                    </div>
                  </div>
                </div>

                {/* Behavioral Recommendation Pill */}
                <div className="pt-3 border-t border-zinc-800/60">
                  <div className={cn(
                    "p-2.5 rounded-xl text-xs flex items-start gap-2",
                    item.tier === 'friction' ? "bg-amber-500/10 text-amber-200 border border-amber-500/20" : "bg-zinc-800/40 text-zinc-400"
                  )}>
                    <HelpCircle size={14} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item.recommendation}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── ROW 6: CATEGORY & SCREEN TIME DISTRIBUTION ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass-card p-6 rounded-2xl border border-zinc-800/60">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-orange-500" />
            Global Activity Distribution by Habit
          </h2>
          <GlobalPieChart />
        </section>

        <section className="glass-card p-6 rounded-2xl border border-zinc-800/60">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Laptop size={18} className="text-indigo-400" />
            Screen Time Category Distribution (14 Days)
          </h2>
          <ScreenTimeTrend />
        </section>
      </div>
    </div>
  );
}
