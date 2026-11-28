'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { differenceInCalendarDays, startOfDay, format, addDays } from 'date-fns';
import { Hourglass, Cake, Clock, Edit3, X, Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

function makeBirthdayInYear(year: number, monthIndex: number, day: number): Date {
  // Handle Feb 29 safely in non-leap years by clamping to Feb 28
  const daysInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, daysInTargetMonth));
}

function parseYMD(ymd: string): { year: number; monthIndex: number; day: number } | null {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, monthIndex: month - 1, day };
}

export default function BirthdayUrgencyBar() {
  const { birthDate, setBirthDate, sprintStartDate } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(birthDate || '');
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick every 60s so "time left today" stays accurate
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const openModal = () => {
    setDraftDate(birthDate || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftDate) {
      setBirthDate(draftDate);
    }
    setIsModalOpen(false);
  };

  const timeLeftToday = useMemo(() => {
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const totalMins = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 60000));
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hours}h ${mins}m left today`;
  }, [now]);

  const sprintDaysLeft = useMemo(() => {
    if (!sprintStartDate) return null;
    const parsed = parseYMD(sprintStartDate);
    if (!parsed) return null;
    const start = new Date(parsed.year, parsed.monthIndex, parsed.day);
    const sprintEnd = addDays(start, 84); // 12 weeks
    const today = startOfDay(now);
    return Math.max(0, differenceInCalendarDays(sprintEnd, today));
  }, [sprintStartDate, now]);

  const birthdayStats = useMemo(() => {
    if (!birthDate) return null;
    const parsed = parseYMD(birthDate);
    if (!parsed) return null;

    const today = startOfDay(now);
    const currentYear = today.getFullYear();

    let lastBday = makeBirthdayInYear(currentYear, parsed.monthIndex, parsed.day);
    if (lastBday > today) {
      lastBday = makeBirthdayInYear(currentYear - 1, parsed.monthIndex, parsed.day);
    }

    const nextBday = makeBirthdayInYear(lastBday.getFullYear() + 1, parsed.monthIndex, parsed.day);
    const daysSince = differenceInCalendarDays(today, lastBday);
    const daysLeft = differenceInCalendarDays(nextBday, today);
    const totalDays = Math.max(1, differenceInCalendarDays(nextBday, lastBday));
    const pctElapsed = Math.min(100, Math.max(0, Math.round((daysSince / totalDays) * 1000) / 10));

    const currentAge = lastBday.getFullYear() - parsed.year;
    const nextAge = currentAge + 1;

    return {
      lastBday,
      nextBday,
      daysSince,
      daysLeft,
      totalDays,
      pctElapsed,
      currentAge,
      nextAge,
      isBirthdayToday: daysLeft === 0 || daysSince === 0,
    };
  }, [birthDate, now]);

  return (
    <>
      {!birthdayStats ? (
        <div className="glass-card rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Hourglass size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Time Moves Fast — Track Your Year of Life
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Set your birthday to see exact days elapsed since your last birthday and days remaining until the next one.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
              <Clock size={12} className="text-amber-400" />
              {timeLeftToday}
            </span>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Cake size={15} />
              Set Birthday
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-zinc-800/80 p-4 sm:p-5 relative overflow-hidden">
          {/* Subtle urgency glow */}
          <div className="absolute -left-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col gap-3.5">
            {/* Top row: headline + live micro-urgency badges */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Hourglass size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                      Time Horizon · {birthdayStats.currentAge >= 0 ? `Age ${birthdayStats.currentAge} → ${birthdayStats.nextAge}` : 'Birthday Countdown'}
                    </span>
                    {birthdayStats.isBirthdayToday && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        🎉 Happy Birthday! Day 0
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Time moves fast — lock in today&apos;s votes before the day slips away.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg">
                  <Clock size={12} />
                  {timeLeftToday}
                </span>
                {sprintDaysLeft !== null && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-blue-300 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-lg">
                    <Flame size={12} />
                    {sprintDaysLeft}d left in sprint
                  </span>
                )}
                <button
                  onClick={openModal}
                  title="Edit Birthday"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            {/* Centerpiece stats + Progress Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Days Since */}
              <div className="md:col-span-3 flex items-baseline justify-between md:justify-start md:gap-2 bg-zinc-900/70 border border-zinc-800/80 rounded-xl px-3.5 py-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Since Last Birthday
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {birthdayStats.daysSince}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">days done</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-300/80 md:hidden">
                  {birthdayStats.pctElapsed}%
                </span>
              </div>

              {/* Visual Progress Track */}
              <div className="md:col-span-6 space-y-1.5 px-1">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-zinc-400">
                    {format(birthdayStats.lastBday, 'MMM d, yyyy')}
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {birthdayStats.pctElapsed}% of year spent
                  </span>
                  <span className="text-zinc-400">
                    {format(birthdayStats.nextBday, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-800/90 rounded-full overflow-hidden border border-zinc-700/50 p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      birthdayStats.pctElapsed >= 75
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
                        : "bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500"
                    )}
                    style={{ width: `${Math.max(2, birthdayStats.pctElapsed)}%` }}
                  />
                </div>
              </div>

              {/* Days Remaining */}
              <div className="md:col-span-3 flex items-baseline justify-between md:justify-end md:text-right bg-zinc-900/70 border border-zinc-800/80 rounded-xl px-3.5 py-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Until Next Birthday
                  </span>
                  <div className="flex items-baseline md:justify-end gap-1.5">
                    <span className={cn(
                      "text-2xl font-black font-mono",
                      birthdayStats.daysLeft <= 30 ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {birthdayStats.daysLeft}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">days left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Birthday Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-zinc-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Cake size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Set Your Birthday</h2>
                  <p className="text-[11px] text-zinc-400">Powers your daily time-urgency bar</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  Birth Date
                </label>
                <input
                  type="date"
                  value={draftDate}
                  max={format(now, 'yyyy-MM-dd')}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                <p className="text-[11px] text-zinc-500">
                  Stored locally in your browser so you never lose sight of how fast each year goes by.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                {birthDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBirthDate('');
                      setIsModalOpen(false);
                    }}
                    className="text-xs font-medium text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    Clear
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
                  >
                    Save Birthday
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
