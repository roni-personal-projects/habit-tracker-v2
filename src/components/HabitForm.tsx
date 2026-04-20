'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { Frequency, Habit } from '@/types';
import { X, Check, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryManager from './CategoryManager';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit | null; // For editing
}

export default function HabitForm({ isOpen, onClose, habit }: HabitFormProps) {
  const { addHabit, updateHabit, categories } = useHabitStore();
  const [name, setName] = useState(habit?.name || '');
  const [color, setColor] = useState(habit?.color || COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>(habit?.frequency || 'daily');
  const [interval, setIntervalValue] = useState(habit?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(habit?.selectedDays || []);
  const [categoryId, setCategoryId] = useState<string | undefined>(habit?.categoryId);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Sync state with habit if editing
  React.useEffect(() => {
    if (habit) {
      setName(habit.name);
      setColor(habit.color);
      setFrequency(habit.frequency);
      setIntervalValue(habit.interval || 1);
      setSelectedDays(habit.selectedDays || []);
      setCategoryId(habit.categoryId);
    } else {
      setName('');
      setColor(COLORS[0]);
      setFrequency('daily');
      setIntervalValue(1);
      setSelectedDays([]);
      setCategoryId(undefined);
    }
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData = {
      name,
      color,
      frequency,
      interval: frequency === 'custom' ? interval : undefined,
      selectedDays: frequency === 'weekly' && selectedDays.length > 0 ? selectedDays : undefined,
      categoryId,
    };

    if (habit) {
      updateHabit(habit.id, habitData);
    } else {
      addHabit(habitData);
    }
    
    // Reset and close
    setName('');
    setColor(COLORS[0]);
    setFrequency('daily');
    setIntervalValue(1);
    setSelectedDays([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100">
            {habit ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Habit Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Workout"
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {(['daily', 'weekly', 'monthly', 'custom'] as Frequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                    frequency === f 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Repeat on</label>
                <span className="text-[10px] text-zinc-600 font-medium">Optional: picks specific days</span>
              </div>
              <div className="flex justify-between gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs font-bold transition-all border",
                      selectedDays.includes(i)
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
              <button 
                type="button"
                onClick={() => setIsCategoryManagerOpen(true)}
                className="text-[10px] flex items-center gap-1 text-blue-500 hover:text-blue-400 font-bold uppercase transition-colors"
              >
                <Settings size={12} />
                Manage
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setCategoryId(undefined)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center gap-2",
                  !categoryId 
                    ? "bg-zinc-100 text-zinc-900 border-white shadow-lg" 
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                None
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center gap-2",
                    categoryId === cat.id 
                      ? "bg-zinc-100 text-zinc-900 border-white shadow-lg" 
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          {frequency === 'custom' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Every N Days</label>
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setIntervalValue(parseInt(e.target.value))}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pick a Color</label>
            <div className="flex flex-wrap gap-3 items-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center",
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : ""
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} className="text-white" />}
                </button>
              ))}
              <div className="relative w-8 h-8 group">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center transition-all bg-zinc-800",
                    !COLORS.includes(color) && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                  )}
                  style={{ backgroundColor: !COLORS.includes(color) ? color : undefined }}
                >
                  {!COLORS.includes(color) ? (
                    <Check size={14} className="text-white" />
                  ) : (
                    <Plus size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-white text-zinc-950 font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors shadow-lg"
            >
              {habit ? 'Save Changes' : 'Start Tracking'}
            </button>
          </div>
        </form>
      </div>

      <CategoryManager 
        isOpen={isCategoryManagerOpen} 
        onClose={() => setIsCategoryManagerOpen(false)} 
      />
    </div>
  );
}
