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

  const handleExport = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let content = `# HabitFlow Performance Report (${today})\n\n`;

    content += `## 🚀 AI Analysis Prompt\n`;
    content += `> Copy and paste the text below into an AI (like Gemini or ChatGPT) for personalized coaching:\n\n`;
    content += `\`\`\`text\nI've attached my progress. Analyze which categories I struggle with most and suggest appropriate changes to my routine to improve my consistency.\n\`\`\`\n\n`;

    content += `## 📊 Executive Summary\n`;
    content += `- **Total Habits**: ${habits.length}\n`;
    content += `- **Total Completions**: ${completions.length}\n`;
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

    content += `## 📝 Raw Habit Data\n`;
    content += `| Habit | Category | Frequency | Consistency |\n`;
    content += `| :--- | :--- | :--- | :--- |\n`;
    habits.forEach(h => {
      const cat = categories.find(c => c.id === h.categoryId)?.name || 'None';
      const stats = getCompletionStats(h, completions);
      content += `| ${h.name} | ${cat} | ${h.frequency} | ${stats.rate}% |\n`;
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
          >
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
