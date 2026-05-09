'use client';

import React, { useState, useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { Laptop, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import ScreenTimeForm from '@/components/ScreenTimeForm';
import ScreenTimeTrend from '@/components/charts/ScreenTimeTrend';

const CATEGORIES = {
  'Productivity': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Social': { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'Entertainment': { color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'Gaming': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Other': { color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
} as Record<string, { color: string, bg: string }>;

const formatDuration = (hoursDec: number) => {
  const h = Math.floor(hoursDec);
  const m = Math.round((hoursDec - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export default function ScreenTimePage() {
  const { screenTimeLogs, deleteScreenTimeLog } = useHabitStore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = screenTimeLogs.filter(log => log.date === today);
  const totalToday = todayLogs.reduce((acc, log) => acc + log.duration, 0);

  const recentLogs = [...screenTimeLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            <Laptop className="text-indigo-500" size={32} />
            Screen Time
          </h1>
          <p className="text-zinc-400">Track and manage your digital consumption.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={20} />
          Log Screen Time
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50 md:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Clock size={24} />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Today's Usage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-100">{formatDuration(totalToday)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-2">
            {todayLogs.map(log => {
              const catStyle = CATEGORIES[log.category] || CATEGORIES['Other'];
              return (
                <div key={log.id} className="flex justify-between items-center text-sm font-medium">
                  <span className={`${catStyle.color}`}>{log.category}</span>
                  <span className="text-zinc-300">{formatDuration(log.duration)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-zinc-800/50 md:col-span-2">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-500" />
              14-Day Trend
            </h2>
            <ScreenTimeTrend />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-zinc-400" size={20} />
            <h2 className="text-lg font-bold text-white">Recent Logs</h2>
          </div>
          
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-zinc-500">No screen time logged yet.</p>
              <button onClick={() => setIsFormOpen(true)} className="text-indigo-500 hover:underline mt-2 text-sm font-bold">Log your first session</button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const catStyle = CATEGORIES[log.category] || CATEGORIES['Other'];
                return (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catStyle.bg} ${catStyle.color}`}>
                        <Laptop size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{log.category}</p>
                        <p className="text-xs text-zinc-500 font-medium">{log.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-lg font-black text-zinc-100">{formatDuration(log.duration)}</span>
                      </div>
                      <button 
                        onClick={() => deleteScreenTimeLog(log.id)}
                        className="text-zinc-600 hover:text-red-500 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ScreenTimeForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
    </div>
  );
}
