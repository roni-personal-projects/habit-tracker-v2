'use client';

import React from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import CompletionTrend from '@/components/charts/CompletionTrend';
import FrequencyChart from '@/components/charts/FrequencyChart';
import GlobalPieChart from '@/components/charts/GlobalPieChart';
import MonthlyHabitPie from '@/components/charts/MonthlyHabitPie';
import { calculateStreak, getCompletionStats } from '@/lib/streak-logic';
import { Flame, Target, TrendingUp, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { habits, completions } = useHabitStore();

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
  const avgCompletionRate = habits.length > 0
    ? Math.round(habits.reduce((acc, h) => acc + getCompletionStats(h, completions).rate, 0) / habits.length)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Advanced Analytics</h1>
        <p className="text-zinc-400">Deep dive into your performance and consistency patterns.</p>
      </header>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Completions</p>
          <p className="text-3xl font-black text-white">{totalCompletions}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg Completion Rate</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black text-white">{avgCompletionRate}%</p>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
        </div>
      </div>

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
                      <p className="text-xs text-zinc-500 uppercase tracking-tight">{habit.frequency}</p>
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
