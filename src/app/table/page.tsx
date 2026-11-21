'use client';

import React, { useState } from 'react';
import HabitTable from '@/components/HabitTable';
import HabitForm from '@/components/HabitForm';
import { Plus, Download } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { Habit } from '@/types';
import { format } from 'date-fns';
import { getCompletionStats } from '@/lib/streak-logic';

export default function TablePage() {
  const { habits, categories, completions, sleepLogs } = useHabitStore();
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

  React.useEffect(() => {
    const handleCreateHabit = () => {
      setEditingHabit(null);
      setIsFormOpen(true);
    };
    const handleExportEvent = () => {
      handleExport();
    };
    const handleCloseModals = () => {
      setIsFormOpen(false);
    };

    window.addEventListener('habitflow:create-habit', handleCreateHabit);
    window.addEventListener('habitflow:export-report', handleExportEvent);
    window.addEventListener('habitflow:close-modals', handleCloseModals);

    return () => {
      window.removeEventListener('habitflow:create-habit', handleCreateHabit);
      window.removeEventListener('habitflow:export-report', handleExportEvent);
      window.removeEventListener('habitflow:close-modals', handleCloseModals);
    };
  }, [habits, categories, completions, sleepLogs]);

  const handleExport = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let content = `# HabitFlow Behavioral & Performance Report (${today})\n\n`;

    content += `## 🚀 AI Behavioral Coaching Prompt\n`;
    content += `> Copy and paste the text below into an AI (like Gemini or ChatGPT) for personalized Atomic Habits & 12-Week Year coaching:\n\n`;
    content += `\`\`\`text\nAct as a world-class behavioral performance coach trained in James Clear's 'Atomic Habits', BJ Fogg's 'Tiny Habits', and Brian Moran's 'The 12 Week Year'.\nReview my attached habit data below. Specifically:\n1. Audit my identity alignment: Are my daily votes sufficient to embody my stated personas?\n2. Identify friction bottlenecks where consistency falls below the 85% execution standard.\n3. Recommend improvements to my Habit Stacking Cues and 2-Minute Emergency Rules.\n4. Pinpoint potential Keystone Habits based on my sleep and completion metrics.\n\`\`\`\n\n`;

    content += `## 📊 Executive Summary\n`;
    content += `- **Total Habits**: ${habits.length}\n`;
    content += `- **Total Completions**: ${completions.length}\n`;
    content += `- **Full Completions**: ${completions.filter(c => !c.status || c.status === 'full').length}\n`;
    content += `- **2-Min Micro Completions**: ${completions.filter(c => c.status === 'micro').length}\n`;
    content += `- **Active Categories**: ${categories.length}\n\n`;

    content += `## 📁 Category Performance\n`;
    categories.forEach(cat => {
      const catHabits = habits.filter(h => h.categoryId === cat.id);
      if (catHabits.length === 0) return;
      
      let totalRate = 0;
      catHabits.forEach(h => {
        totalRate += getCompletionStats(h, completions).rate;
      });
      const avgRate = Math.round(totalRate / catHabits.length);
      
      content += `### ${cat.name}\n`;
      content += `- **Average Consistency**: ${avgRate}%\n`;
      content += `- **Habits**: ${catHabits.map(h => h.name).join(', ')}\n\n`;
    });

    content += `## 📝 Raw Habit Data (With Behavioral Architecture)\n`;
    content += `| Habit | Identity Persona | Category | Frequency | Consistency | Habit Stack Cue | 2-Min Micro Rule |\n`;
    content += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    habits.forEach(h => {
      const cat = categories.find(c => c.id === h.categoryId)?.name || 'None';
      const stats = getCompletionStats(h, completions);
      const identity = h.identity || 'General';
      const cue = h.cueAnchor ? `After ${h.cueAnchor}` : 'None';
      const micro = h.twoMinuteRule || 'None';
      content += `| ${h.name} | ${identity} | ${cat} | ${h.frequency} | ${stats.rate}% | ${cue} | ${micro} |\n`;
    });

    content += `\n\n## 💤 Sleep Performance (Last 7 Logs)\n`;
    const recentSleep = [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    content += `| Date | Duration | Category |\n`;
    content += `| :--- | :--- | :--- |\n`;
    recentSleep.forEach(s => {
      content += `| ${s.date} | ${s.duration}h | ${s.category} |\n`;
    });

    // Download the file
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habitflow-report-${today}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Habit Timeline</h1>
          <p className="text-zinc-400">A detailed view of your daily consistency and streaks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl font-medium transition-all"
            title="Export AI Coaching Report (Press E)"
          >
            <Download size={18} />
            <span>Export Data</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-700 rounded">
              E
            </kbd>
          </button>
          <button 
            onClick={() => {
              setEditingHabit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            title="Add Habit (Press C)"
          >
            <Plus size={20} />
            <span>Add Habit</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/20 rounded text-white">
              C
            </kbd>
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs opacity-50">Active Tracker</h2>
        </div>
        <HabitTable onEditHabit={handleEditHabit} />
      </div>

      <HabitForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        habit={editingHabit} 
      />
    </div>
  );
}
