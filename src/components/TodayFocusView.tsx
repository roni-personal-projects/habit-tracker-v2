'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useHabitStore } from '@/store/useHabitStore';
import { calculateStreak } from '@/lib/streak-logic';
import { Habit } from '@/types';
import { cn } from '@/lib/utils';
import {
  Check,
  Zap,
  Star,
  Pause,
  Play,
  Edit2,
  Trash2,
  Flame,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Archive,
  X,
} from 'lucide-react';

interface TodayFocusViewProps {
  onEditHabit: (habit: Habit) => void;
  onCreateHabit: () => void;
}

function isHabitDueOnDate(habit: Habit, date: Date, dateStr: string): boolean {
  if (habit.startDate && dateStr < habit.startDate) return false;
  if (habit.endDate && dateStr > habit.endDate) return false;
  if (habit.frequency === 'weekly' && habit.selectedDays && habit.selectedDays.length > 0) {
    return habit.selectedDays.includes(date.getDay());
  }
  return true;
}

export default function TodayFocusView({ onEditHabit, onCreateHabit }: TodayFocusViewProps) {
  const {
    habits,
    categories,
    completions,
    pinnedHabitIds = [],
    pausedHabitIds = [],
    toggleCompletion,
    togglePinHabit,
    togglePauseHabit,
    deleteHabit,
  } = useHabitStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [showNotDue, setShowNotDue] = useState(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [isPausedOpen, setIsPausedOpen] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, color: c.color }));
    return map;
  }, [categories]);

  const todayCompletionMap = useMemo(() => {
    const map = new Map<string, 'full' | 'micro'>();
    completions
      .filter((c) => c.date === todayStr)
      .forEach((c) => map.set(c.habitId, c.status || 'full'));
    return map;
  }, [completions, todayStr]);

  const {
    activeHabits,
    pausedHabits,
    dueTodayHabits,
    notDueHabits,
    pinnedPending,
    regularPending,
    completedToday,
    pinnedTotalCount,
    pinnedCompletedCount,
    fullCount,
    microCount,
    atRiskCount,
  } = useMemo(() => {
    const pausedSet = new Set(pausedHabitIds);
    const pinnedSet = new Set(pinnedHabitIds);

    const active = habits.filter((h) => !pausedSet.has(h.id));
    const paused = habits.filter((h) => pausedSet.has(h.id));

    const due = active.filter((h) => isHabitDueOnDate(h, today, todayStr));
    const notDue = active.filter((h) => !isHabitDueOnDate(h, today, todayStr));

    const pool = showNotDue ? active : due;

    // Apply search, category, and at-risk filters
    const filtered = pool.filter((h) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = h.categoryId ? categoryMap.get(h.categoryId)?.name.toLowerCase() || '' : '';
        const matches =
          h.name.toLowerCase().includes(q) ||
          (h.identity || '').toLowerCase().includes(q) ||
          (h.cueAnchor || '').toLowerCase().includes(q) ||
          catName.includes(q);
        if (!matches) return false;
      }
      if (selectedCategoryId !== 'all' && h.categoryId !== selectedCategoryId) {
        return false;
      }
      if (onlyAtRisk && !calculateStreak(h, completions).isAtRisk) {
        return false;
      }
      return true;
    });

    const completed: Habit[] = [];
    const pinnedPend: Habit[] = [];
    const regPend: Habit[] = [];

    filtered.forEach((h) => {
      if (todayCompletionMap.has(h.id)) {
        completed.push(h);
      } else if (pinnedSet.has(h.id)) {
        pinnedPend.push(h);
      } else {
        regPend.push(h);
      }
    });

    // Sort pending habits: At-Risk first, then original order
    const sortByUrgencyThenOrder = (a: Habit, b: Habit) => {
      const aRisk = calculateStreak(a, completions).isAtRisk ? 1 : 0;
      const bRisk = calculateStreak(b, completions).isAtRisk ? 1 : 0;
      if (aRisk !== bRisk) return bRisk - aRisk;
      return a.order - b.order;
    };

    pinnedPend.sort(sortByUrgencyThenOrder);
    regPend.sort(sortByUrgencyThenOrder);

    const dueCompleted = due.filter((h) => todayCompletionMap.has(h.id));
    const full = dueCompleted.filter((h) => todayCompletionMap.get(h.id) === 'full').length;
    const micro = dueCompleted.filter((h) => todayCompletionMap.get(h.id) === 'micro').length;

    const pinnedDue = due.filter((h) => pinnedSet.has(h.id));
    const pinnedDone = pinnedDue.filter((h) => todayCompletionMap.has(h.id)).length;

    const risk = due.filter(
      (h) => !todayCompletionMap.has(h.id) && calculateStreak(h, completions).isAtRisk
    ).length;

    return {
      activeHabits: active,
      pausedHabits: paused,
      dueTodayHabits: due,
      notDueHabits: notDue,
      pinnedPending: pinnedPend,
      regularPending: regPend,
      completedToday: completed,
      pinnedTotalCount: pinnedDue.length,
      pinnedCompletedCount: pinnedDone,
      fullCount: full,
      microCount: micro,
      atRiskCount: risk,
    };
  }, [
    habits,
    pausedHabitIds,
    pinnedHabitIds,
    today,
    todayStr,
    showNotDue,
    searchQuery,
    selectedCategoryId,
    onlyAtRisk,
    categoryMap,
    completions,
    todayCompletionMap,
  ]);

  // Categories that actually have active habits
  const activeCategories = useMemo(() => {
    const usedIds = new Set(activeHabits.map((h) => h.categoryId).filter(Boolean));
    return categories.filter((c) => usedIds.has(c.id));
  }, [activeHabits, categories]);

  const dueCompletedCount = fullCount + microCount;
  const dueTotalCount = dueTodayHabits.length;
  const todayProgressPct = dueTotalCount > 0 ? Math.round((dueCompletedCount / dueTotalCount) * 100) : 0;

  const renderHabitRow = (habit: Habit, options?: { isPinnedSection?: boolean; isCompletedRow?: boolean }) => {
    const status = todayCompletionMap.get(habit.id);
    const isCompleted = !!status;
    const isFull = status === 'full';
    const isMicro = status === 'micro';
    const isPinned = pinnedHabitIds.includes(habit.id);
    const canPinMore = pinnedHabitIds.length < 3;
    const { currentStreak, isAtRisk } = calculateStreak(habit, completions);
    const category = habit.categoryId ? categoryMap.get(habit.categoryId) : undefined;
    const isDueToday = isHabitDueOnDate(habit, today, todayStr);

    return (
      <div
        key={habit.id}
        className={cn(
          'group rounded-xl border p-3.5 sm:px-4 sm:py-3 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          isCompleted
            ? 'bg-zinc-900/40 border-zinc-800/60 opacity-85 hover:opacity-100'
            : options?.isPinnedSection
            ? 'bg-gradient-to-r from-amber-500/[0.07] via-zinc-900/90 to-zinc-900/90 border-amber-500/30 hover:border-amber-400/50 shadow-sm'
            : isAtRisk
            ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-400/50'
            : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
        )}
      >
        {/* Left: Habit Details */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <span
            className="w-2.5 h-8 sm:h-7 rounded-full shrink-0 mt-0.5 sm:mt-0"
            style={{ backgroundColor: habit.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'font-semibold text-sm sm:text-[15px] truncate',
                  isCompleted ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-zinc-100'
                )}
              >
                {habit.name}
              </span>

              {isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Star size={9} className="fill-amber-400 text-amber-400" />
                  Top 3
                </span>
              )}

              {category && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-700/70 bg-zinc-800/80 text-zinc-300"
                >
                  {category.name}
                </span>
              )}

              {!isDueToday && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  Off-day
                </span>
              )}

              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-400">
                  <Flame size={12} fill="currentColor" />
                  {currentStreak}
                </span>
              )}

              {isAtRisk && !isCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse">
                  <AlertTriangle size={10} /> At Risk
                </span>
              )}
            </div>

            {(habit.cueAnchor || habit.twoMinuteRule || habit.identity) && (
              <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-zinc-400">
                {habit.cueAnchor && (
                  <span className="truncate max-w-[260px]" title={`Cue: After ${habit.cueAnchor}`}>
                    ⚡ After <span className="text-zinc-300">{habit.cueAnchor}</span>
                  </span>
                )}
                {habit.twoMinuteRule && !isCompleted && (
                  <span className="text-zinc-500 truncate max-w-[240px]" title={`2-Min Rule: ${habit.twoMinuteRule}`}>
                    2-Min: <span className="text-zinc-400">{habit.twoMinuteRule}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Direct 1-Tap Logging & Quick Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-5 sm:pl-0">
          {/* Quick Manage Icons */}
          <div className="flex items-center gap-1 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => togglePinHabit(habit.id)}
              disabled={!isPinned && !canPinMore}
              title={
                isPinned
                  ? 'Unpin from Top 3'
                  : canPinMore
                  ? 'Pin to Top 3 Non-Negotiables'
                  : 'Top 3 full (unpin one first)'
              }
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isPinned
                  ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
                  : canPinMore
                  ? 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800'
                  : 'text-zinc-700 cursor-not-allowed'
              )}
            >
              <Star size={14} className={cn(isPinned && 'fill-amber-400')} />
            </button>

            <button
              type="button"
              onClick={() => togglePauseHabit(habit.id)}
              title="Pause / Archive habit (keeps all history)"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
            >
              <Pause size={14} />
            </button>

            <button
              type="button"
              onClick={() => onEditHabit(habit)}
              title="Edit habit"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Edit2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${habit.name}" and all its history? Tip: Use Pause instead to keep history.`)) {
                  deleteHabit(habit.id);
                }
              }}
              title="Delete habit"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

          {/* Direct Complete Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleCompletion(habit.id, todayStr, 'micro')}
              title={habit.twoMinuteRule ? `2-Min Micro: ${habit.twoMinuteRule}` : 'Log 2-Minute Micro version'}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95',
                isMicro
                  ? 'bg-amber-500/25 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/70 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10'
              )}
            >
              <Zap size={13} className={cn(isMicro && 'fill-amber-300')} />
              <span>2-Min</span>
            </button>

            <button
              type="button"
              onClick={() => toggleCompletion(habit.id, todayStr, 'full')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95',
                isFull
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25'
                  : 'bg-blue-600/15 text-blue-300 border-blue-500/40 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'
              )}
            >
              <Check size={14} className="stroke-[2.5px]" />
              <span>{isFull ? 'Done' : 'Complete'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (habits.length === 0) {
    return (
      <div className="glass-card rounded-2xl border border-zinc-800/60 p-10 text-center space-y-3">
        <p className="text-zinc-300 font-semibold">No habits created yet.</p>
        <p className="text-xs text-zinc-500">Create your first habit to start casting identity votes today.</p>
        <button
          onClick={onCreateHabit}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
        >
          Create First Habit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress & Search/Filter Toolbar */}
      <div className="glass-card rounded-2xl border border-zinc-800/70 p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between sm:justify-start sm:gap-3">
              <span className="text-sm font-bold text-white">
                {dueCompletedCount} of {dueTotalCount} due today complete
              </span>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {fullCount} Full
                </span>
                {microCount > 0 && (
                  <span className="text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {microCount} Micro
                  </span>
                )}
                <span className="text-zinc-400 font-mono">{todayProgressPct}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-zinc-800/90 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  todayProgressPct === 100
                    ? 'bg-emerald-500'
                    : todayProgressPct >= 60
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                )}
                style={{ width: `${todayProgressPct}%` }}
              />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick filter habits..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-8 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Category & Smart Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId('all');
              setOnlyAtRisk(false);
            }}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
              selectedCategoryId === 'all' && !onlyAtRisk
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            )}
          >
            All ({dueTotalCount})
          </button>

          {atRiskCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyAtRisk(!onlyAtRisk)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1',
                onlyAtRisk
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-900/70 text-amber-400/80 border-zinc-800 hover:border-amber-500/30'
              )}
            >
              <AlertTriangle size={11} />
              At Risk ({atRiskCount})
            </button>
          )}

          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? 'all' : cat.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1.5',
                selectedCategoryId === cat.id
                  ? 'bg-zinc-800 text-white border-zinc-600'
                  : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </button>
          ))}

          {notDueHabits.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNotDue(!showNotDue)}
              className={cn(
                'ml-auto px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                showNotDue
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                  : 'bg-zinc-900/50 text-zinc-500 border-zinc-800/80 hover:text-zinc-300'
              )}
            >
              {showNotDue ? `Hiding ${notDueHabits.length} off-day` : `+ Show ${notDueHabits.length} off-day`}
            </button>
          )}
        </div>
      </div>

      {/* ⭐ Section 1: Top 3 Non-Negotiables (Pinned) */}
      {(pinnedPending.length > 0 || pinnedTotalCount > 0) ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              Top 3 Non-Negotiables
              <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                {pinnedHabitIds.length}/3 pinned
              </span>
            </h3>
            {pinnedTotalCount > 0 && (
              <span className="text-[11px] font-bold text-zinc-400">
                {pinnedCompletedCount}/{pinnedTotalCount} locked in
              </span>
            )}
          </div>

          {pinnedPending.length > 0 ? (
            <div className="space-y-2">
              {pinnedPending.map((h) => renderHabitRow(h, { isPinnedSection: true }))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <Sparkles size={14} />
                All pinned Top 3 Non-Negotiables completed today!
              </span>
              <span className="text-[11px] font-mono text-emerald-400/80">
                {pinnedCompletedCount}/{pinnedTotalCount}
              </span>
            </div>
          )}
        </div>
      ) : (
        activeHabits.length > 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 px-3.5 py-2 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Star size={12} className="text-amber-400/70" />
              Tip: Click the <strong className="text-zinc-300">★</strong> icon on up to 3 core habits to pin your daily Non-Negotiables at the top.
            </span>
          </div>
        )
      )}

      {/* 🎯 Section 2: Up Next Today (Pending Remaining Habits) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Up Next Today ({regularPending.length})
          </h3>
        </div>

        {regularPending.length > 0 ? (
          <div className="space-y-2">
            {regularPending.map((h) => renderHabitRow(h))}
          </div>
        ) : pinnedPending.length === 0 ? (
          <div className="glass-card rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 size={22} />
            </div>
            <h4 className="text-sm font-bold text-emerald-300">
              {completedToday.length > 0
                ? 'Everything due today is locked in!'
                : 'No pending habits match your current filter'}
            </h4>
            <p className="text-xs text-zinc-400">
              {completedToday.length > 0
                ? 'You cast every scheduled identity vote for today.'
                : 'Try clearing your search or category filter above.'}
            </p>
          </div>
        ) : null}
      </div>

      {/* ✅ Section 3: Shrinking Completed Today Tray */}
      {completedToday.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {isCompletedOpen ? (
                <ChevronDown size={16} className="text-emerald-400" />
              ) : (
                <ChevronRight size={16} className="text-emerald-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Completed Today ({completedToday.length})
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              {isCompletedOpen ? 'Collapse' : 'Tap to review or undo'}
            </span>
          </button>

          {isCompletedOpen && (
            <div className="p-3 border-t border-zinc-800/60 space-y-2">
              {completedToday.map((h) => renderHabitRow(h, { isCompletedRow: true }))}
            </div>
          )}
        </div>
      )}

      {/* ⏸️ Section 4: Paused / Archived Habits Drawer */}
      {pausedHabits.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsPausedOpen(!isPausedOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {isPausedOpen ? (
                <ChevronDown size={15} className="text-zinc-500" />
              ) : (
                <ChevronRight size={15} className="text-zinc-500" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Archive size={13} className="text-zinc-500" />
                Paused / Archived ({pausedHabits.length})
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              History preserved · Excluded from daily streaks
            </span>
          </button>

          {isPausedOpen && (
            <div className="p-3 pt-2 border-t border-zinc-800/60 space-y-2">
              {pausedHabits.map((habit) => {
                const { longestStreak } = calculateStreak(habit, completions);
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-5 rounded-full shrink-0 opacity-60"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-300 truncate">{habit.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          Best streak preserved: {longestStreak}d
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePauseHabit(habit.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Play size={11} />
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Permanently delete "${habit.name}" and its history?`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
