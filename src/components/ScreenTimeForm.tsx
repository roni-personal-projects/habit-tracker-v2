'use client';

import React, { useState } from 'react';
import { X, Laptop, Clock, Tag } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { cn } from '@/lib/utils';

interface ScreenTimeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'Productivity', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { value: 'Social', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { value: 'Entertainment', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { value: 'Gaming', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { value: 'Other', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
];

export default function ScreenTimeForm({ isOpen, onClose }: ScreenTimeFormProps) {
  const { addScreenTimeLog } = useHabitStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number>(2); // Default to 2 hours
  const [category, setCategory] = useState<string>('Productivity');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addScreenTimeLog({
      date,
      duration: Number(duration),
      category,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  const selectedCat = CATEGORIES.find(c => c.value === category) || CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-500">
              <Laptop size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Log Screen Time</h2>
              <p className="text-xs text-zinc-500">Track your digital consumption</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Clock size={14} /> Duration (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Tag size={14} /> Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-bold border transition-all text-center",
                    category === cat.value
                      ? cn(cat.bg, cat.border, cat.color)
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50"
                  )}
                >
                  {cat.value}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("p-4 rounded-2xl border transition-all duration-300", selectedCat.bg, selectedCat.border)}>
            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-lg bg-zinc-900/50", selectedCat.color)}>
                <Laptop size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{duration}</span>
                  <span className="text-zinc-500 text-sm font-bold">hours of</span>
                </div>
                <div className={cn("text-sm font-bold mb-1", selectedCat.color)}>
                  {category}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Save Screen Time Log
          </button>
        </form>
      </div>
    </div>
  );
}
