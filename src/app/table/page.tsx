'use client';

import React, { useState } from 'react';
import HabitTable from '@/components/HabitTable';
import HabitForm from '@/components/HabitForm';
import { Plus, Download } from 'lucide-react';

export default function TablePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Habit Timeline</h1>
          <p className="text-zinc-400">A detailed view of your daily consistency and streaks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl font-medium transition-all">
            <Download size={18} />
            Export Data
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={20} />
            Add Habit
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs opacity-50">Active Tracker</h2>
        </div>
        <HabitTable />
      </div>

      <HabitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
