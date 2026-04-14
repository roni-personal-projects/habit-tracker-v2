'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import SleepForm from '@/components/SleepForm';
import SleepCard from '@/components/SleepCard';
import SleepDailyTrend from '@/components/charts/SleepDailyTrend';
import SleepWeeklySummary from '@/components/charts/SleepWeeklySummary';
import { Moon, Plus, TrendingUp, BarChart, Info, Calendar, LineChart as LineChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SleepPage() {
  const { sleepLogs } = useHabitStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Stats calculation
  const sortedLogs = [...sleepLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const avgSleep = sleepLogs.length > 0 
    ? (sleepLogs.reduce((acc, log) => acc + log.duration, 0) / sleepLogs.length).toFixed(1)
    : 0;
  
  const lastSleep = sortedLogs[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Sleep Tracker</h1>
          <p className="text-zinc-400">Rest is the foundation of every habit. Optimize your recovery.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          Log Sleep
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Avg. Sleep</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{avgSleep}</span>
            <span className="text-zinc-500 font-medium">hours</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Moon size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Last Night</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{lastSleep?.duration || 0}</span>
            <span className="text-zinc-500 font-medium">hours</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sleep Hygiene</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            "Quality sleep enhances neuroplasticity, making it easier for your brain to wire in new habits."
          </p>
        </div>
      </div>

      <section className="glass-card p-6 rounded-3xl border border-zinc-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            <h2 className="text-xl font-bold text-white">Sleep Trends</h2>
          </div>
          
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('daily')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'daily' 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <LineChartIcon size={14} />
              Daily
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'weekly' 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Calendar size={14} />
              Weekly
            </button>
          </div>
        </div>

        <div className="animate-in fade-in duration-500 delay-150">
          {activeTab === 'daily' ? <SleepDailyTrend /> : <SleepWeeklySummary />}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart size={20} className="text-blue-500" /> Recent History
          </h2>
          {sleepLogs.length > 0 && <span className="text-xs text-zinc-500 font-bold uppercase">{sleepLogs.length} Entries</span>}
        </div>

        {sleepLogs.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-4 border border-zinc-800">
              <Moon size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">No sleep logs yet</h3>
            <p className="text-zinc-500 max-w-xs text-sm">Start tracking your sleep to see your recovery patterns and insights.</p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="mt-6 text-blue-500 font-bold hover:text-blue-400 transition-colors"
            >
              Log your first night
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedLogs.map((log) => (
              <SleepCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </section>

      <SleepForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
