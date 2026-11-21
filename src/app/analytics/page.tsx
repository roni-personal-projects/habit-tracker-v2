'use client';

import React, { useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import CompletionTrend from '@/components/charts/CompletionTrend';
import FrequencyChart from '@/components/charts/FrequencyChart';
import GlobalPieChart from '@/components/charts/GlobalPieChart';
import MonthlyHabitPie from '@/components/charts/MonthlyHabitPie';
import ScreenTimeTrend from '@/components/charts/ScreenTimeTrend';
import { calculateStreak, getCompletionStats, calculateIdentityVotes, getKeystoneInsights } from '@/lib/streak-logic';
import { Flame, Target, TrendingUp, Calendar, PieChart as PieChartIcon, Sparkles, Moon, Key, Activity, Book, Brain, Briefcase, Camera, Code, Coffee, Coins, Dumbbell, Gamepad, GraduationCap, Heart, Home, Image, Laptop, Languages, Lightbulb, Music, Palette, Pill, Plane, Play, Rocket, ShoppingCart, Smile, Star, Target as TargetIcon, Tv, Utensils, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  Activity, Book, Brain, Briefcase, Camera, 
  Code, Coffee, Coins, Dumbbell, Gamepad, 
  GraduationCap, Heart, Home, Image, Laptop, 
  Languages, Lightbulb, Music, Palette, Pill, 
  Plane, Play, Rocket, ShoppingCart, Smile, 
  Star, Target: TargetIcon, Tv, Utensils, Zap 
};

export default function AnalyticsPage() {
  const { habits, categories, completions, sleepLogs, screenTimeLogs } = useHabitStore();

  const keystoneInsights = useMemo(() => {
    return getKeystoneInsights(habits, completions, sleepLogs, screenTimeLogs);
  }, [habits, completions, sleepLogs, screenTimeLogs]);

  const identityVotes = useMemo(() => {
    return calculateIdentityVotes(habits, completions);
  }, [habits, completions]);

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
          <TrendingUp size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">No data yet</h2>
        <p className="text-zinc-500 max-w-xs">Start tracking your habits to see detailed analytics and trends here.</p>
      </div>
    );
  }

  // Aggregate Stats
  const totalCompletions = completions.length;
  const fullCompletionsCount = completions.filter(c => !c.status || c.status === 'full').length;
  const microCompletionsCount = completions.filter(c => c.status === 'micro').length;
  const avgCompletionRate = habits.length > 0
    ? Math.round(habits.reduce((acc, h) => acc + getCompletionStats(h, completions).rate, 0) / habits.length)
    : 0;

  // Category stats with hierarchy support
  const categoryStats = useMemo(() => {
    const parents = categories.filter(c => !c.parentId);
    
    return parents.map(parent => {
      const children = categories.filter(c => c.parentId === parent.id);
      const parentHabits = habits.filter(h => h.categoryId === parent.id);
      const childHabits = habits.filter(h => children.some(c => c.id === h.categoryId));
      
      const allRelatedHabits = [...parentHabits, ...childHabits];
      if (allRelatedHabits.length === 0) return null;
      
      const avgRate = Math.round(allRelatedHabits.reduce((acc, h) => acc + getCompletionStats(h, completions).rate, 0) / allRelatedHabits.length);
      
      return { 
        ...parent, 
        avgRate,
        children: children.map(child => {
          const habitsForChild = habits.filter(h => h.categoryId === child.id);
          if (habitsForChild.length === 0) return null;
          const childRate = Math.round(habitsForChild.reduce((acc, h) => acc + getCompletionStats(h, completions).rate, 0) / habitsForChild.length);
          return { ...child, avgRate: childRate };
        }).filter(Boolean)
      };
    }).filter(Boolean);
  }, [habits, categories, completions]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Advanced Analytics</h1>
        <p className="text-zinc-400">Behavioral insights, Keystone correlation, and identity compounding.</p>
      </header>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Completions</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white">{totalCompletions}</p>
            <span className="text-xs text-zinc-500">votes cast</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg Completion Rate</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black text-white">{avgCompletionRate}%</p>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Zap size={14} /> 2-Min Micro Habits
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-amber-400">{microCompletionsCount}</p>
            <span className="text-xs text-zinc-400">streaks saved</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-400" /> Identity Personas
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white">{identityVotes.length}</p>
            <span className="text-xs text-zinc-500">active tracks</span>
          </div>
        </div>
      </div>

      {/* 🔬 Keystone Habit & Cross-Domain Intelligence */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key size={20} className="text-amber-400" />
            Keystone Habit & Cross-Domain Intelligence
          </h2>
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
            Atomic Habits & The Power of Habit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Sleep Leverage */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Moon size={15} /> Sleep Leverage
                </span>
                {keystoneInsights.sleepDelta > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    +{keystoneInsights.sleepDelta}% Boost
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base mb-1">Rest vs. Discipline</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Completion rate after optimal sleep (≥7.5h): <strong className="text-white">{keystoneInsights.optimalSleepRate}%</strong>
                <br />
                Completion rate after poor sleep (&lt;7.0h): <strong className="text-zinc-400">{keystoneInsights.suboptimalSleepRate}%</strong>
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 italic">
              Sleep is the neurological foundation for executive function and habit retention.
            </p>
          </div>

          {/* 2. Screen Time Friction */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop size={15} /> Screen Time Friction
                </span>
                {keystoneInsights.screenDelta > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    -{keystoneInsights.screenDelta}% Drop
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base mb-1">Digital Depletion</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Consistency on low screen days (&lt;2.5h): <strong className="text-white">{keystoneInsights.lowScreenTimeRate}%</strong>
                <br />
                Consistency on high screen days (≥4h): <strong className="text-zinc-400">{keystoneInsights.highScreenTimeRate}%</strong>
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 italic">
              Excessive screen time drains willpower reserves needed for difficult evening habits.
            </p>
          </div>

          {/* 3. Top Keystone Habit */}
          <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] to-transparent flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={15} /> #1 Keystone Habit
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Primary Domino
                </span>
              </div>
              {keystoneInsights.topKeystoneHabit ? (
                <>
                  <h3 className="font-bold text-white text-base mb-1">
                    {keystoneInsights.topKeystoneHabit.habit.name}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    When you complete this habit, you execute <strong className="text-amber-300">{keystoneInsights.topKeystoneHabit.otherHabitRate}%</strong> of all other scheduled habits on the same day.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-white text-base mb-1">Calculating Correlation</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Log at least 3-5 completions across different days to unlock your crowned keystone habit.
                  </p>
                </>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 italic">
              Keystone habits trigger positive cascading behavioral momentum.
            </p>
          </div>
        </div>
      </section>

      {/* 🏛️ Identity Portfolio (Atomic Habits) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Identity Portfolio & Empirical Votes Cast
          </h2>
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
            Every Action Is A Vote
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {identityVotes.map((iv) => (
            <div key={iv.identity} className="glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">{iv.identity}</h3>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    +{iv.weeklyVotes} this week
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{iv.habitsCount} connected habit(s)</p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Lifetime Votes</span>
                <span className="text-xl font-black text-white">{iv.totalVotes}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 glass-card p-6 rounded-2xl border border-zinc-800/50">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-blue-500" />
            Completion Trend (Last 30 Days)
          </h2>
          <CompletionTrend />
        </section>

        <section className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-orange-500" />
            Activity Distribution
          </h2>
          <GlobalPieChart />
        </section>
      </div>
      
      <section className="glass-card p-6 rounded-2xl border border-zinc-800/50">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Laptop size={20} className="text-indigo-500" />
          Screen Time Distribution
        </h2>
        <ScreenTimeTrend />
      </section>

      {/* Category Mastery Section */}
      {categoryStats.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChartIcon size={22} className="text-violet-500" />
            Category Mastery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryStats.map((cat: any) => {
              const IconComp = (ICONS as any)[cat.icon] || Activity;
              return (
                <div key={cat.id} className="glass-card p-6 rounded-2xl border border-zinc-800/50 relative overflow-hidden group flex flex-col">
                  <div 
                    className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <IconComp size={20} />
                    </div>
                    <span className="text-2xl font-black text-white">{cat.avgRate}%</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{cat.name}</h3>
                  <div className="h-1 w-full bg-zinc-800 rounded-full mt-2">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${cat.avgRate}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  
                  {/* Children Stats */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                      {cat.children.map((child: any) => (
                        <div key={child.id} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-zinc-500">
                            <span>{child.name}</span>
                            <span className="text-zinc-300">{child.avgRate}%</span>
                          </div>
                          <div className="h-0.5 w-full bg-zinc-800/50 rounded-full">
                            <div 
                              className="h-full rounded-full"
                              style={{ width: `${child.avgRate}%`, backgroundColor: child.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </section>
      )}

      {/* Monthly Mastery Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={22} className="text-emerald-500" />
            Monthly Mastery
          </h2>
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-3 py-1.5 rounded-full">
            Current Month Status
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {habits.map((habit) => (
            <div key={habit.id} className="glass-card p-6 rounded-2xl border border-zinc-800/50 flex flex-col items-center">
              <MonthlyHabitPie habit={habit} completions={completions} />
              <div className="mt-4 text-center">
                <h3 className="font-bold text-white text-sm">{habit.name}</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight mt-1">
                  {habit.frequency} Target
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Detailed Habit Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const { currentStreak, longestStreak } = calculateStreak(habit, completions);
            const { rate } = getCompletionStats(habit, completions);
            
            return (
              <div key={habit.id} className="glass-card p-5 rounded-2xl border border-zinc-800 group hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: habit.color }}
                    >
                      {habit.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-tight">{habit.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tight font-bold">{habit.frequency}</p>
                        {habit.categoryId && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">
                              {categories.find(c => c.id === habit.categoryId)?.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{rate}%</span>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Accuracy</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-700/30">
                    <div className="flex items-center gap-1.5 text-orange-500 mb-1">
                      <Flame size={14} fill="currentColor" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Current</span>
                    </div>
                    <p className="text-2xl font-black text-white">{currentStreak}</p>
                  </div>
                  <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-700/30">
                    <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                      <TrendingUp size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Longest</span>
                    </div>
                    <p className="text-2xl font-black text-white">{longestStreak}</p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${rate}%`, 
                      backgroundColor: habit.color,
                      boxShadow: `0 0 8px ${habit.color}40`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
