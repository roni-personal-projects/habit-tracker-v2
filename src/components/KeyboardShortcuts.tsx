'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Keyboard, X, Sparkles, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutItem {
  key: string;
  description: string;
  scope?: string;
}

const SHORTCUT_GROUPS = [
  {
    category: 'Essential Actions',
    shortcuts: [
      { key: 'C', description: 'Create new habit (or log entry on current page)' },
      { key: 'T', description: 'Jump to Today in timeline table (or go to Table)' },
      { key: 'S', description: 'Open 12-Week Sprint configuration', scope: 'Dashboard' },
      { key: 'E', description: 'Export AI Coaching Markdown report', scope: 'Table' },
    ],
  },
  {
    category: 'Timeline Paging',
    shortcuts: [
      { key: '← or [', description: 'Previous 14 days in timeline' },
      { key: '→ or ]', description: 'Next 14 days in timeline' },
    ],
  },
  {
    category: 'Quick Navigation',
    shortcuts: [
      { key: '1', description: 'Jump to Dashboard' },
      { key: '2', description: 'Jump to Habits Table' },
      { key: '3', description: 'Jump to Sleep Tracker' },
      { key: '4', description: 'Jump to Screen Time' },
      { key: '5', description: 'Jump to Analytics' },
    ],
  },
  {
    category: 'System & Dialogs',
    shortcuts: [
      { key: '?', description: 'Toggle this keyboard shortcuts cheat sheet' },
      { key: 'Esc', description: 'Close any active modal or dialog' },
    ],
  },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenShortcuts = () => setIsOpen(prev => !prev);
    window.addEventListener('habitflow:toggle-shortcuts', handleOpenShortcuts);
    return () => window.removeEventListener('habitflow:toggle-shortcuts', handleOpenShortcuts);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept browser commands or combinations with modifiers
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Never trigger while typing in inputs, textareas, selects, or contenteditable
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || isEditable) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      // 1. Help Cheat Sheet (?)
      if (e.key === '?') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        return;
      }

      // 2. Escape closes modals
      if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          return;
        }
        window.dispatchEvent(new CustomEvent('habitflow:close-modals'));
        return;
      }

      // If shortcuts cheat sheet modal is open, don't execute background keys
      if (isOpen) return;

      // 3. Create Action ('C' or 'c')
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (pathname === '/' || pathname === '/table' || pathname === '/sleep' || pathname === '/screentime') {
          window.dispatchEvent(new CustomEvent('habitflow:create-habit'));
        } else {
          router.push('/?create=true');
        }
        return;
      }

      // 4. Jump to Today / Table ('T' or 't')
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (pathname === '/' || pathname === '/table') {
          window.dispatchEvent(new CustomEvent('habitflow:jump-today'));
        } else {
          router.push('/table');
        }
        return;
      }

      // 5. Timeline Navigation
      if (e.key === 'ArrowLeft' || e.key === '[') {
        if (pathname === '/' || pathname === '/table') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('habitflow:prev-dates'));
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ']') {
        if (pathname === '/' || pathname === '/table') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('habitflow:next-dates'));
        }
        return;
      }

      // 6. Sprint Settings ('S' or 's')
      if ((e.key === 's' || e.key === 'S') && pathname === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('habitflow:open-sprint'));
        return;
      }

      // 7. Export Report ('E' or 'e')
      if ((e.key === 'e' || e.key === 'E') && pathname === '/table') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('habitflow:export-report'));
        return;
      }

      // 8. Number Keys for Quick Page Navigation (1-5)
      if (e.key === '1') {
        e.preventDefault();
        router.push('/');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        router.push('/table');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        router.push('/sleep');
        return;
      }
      if (e.key === '4') {
        e.preventDefault();
        router.push('/screentime');
        return;
      }
      if (e.key === '5') {
        e.preventDefault();
        router.push('/analytics');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pathname, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-card w-full max-w-xl p-6 sm:p-7 rounded-2xl border border-zinc-700/80 shadow-2xl relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Keyboard size={20} />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                Keyboard Shortcuts
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Power User
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Navigate HabitFlow at the speed of thought without touching your mouse.</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close keyboard shortcuts"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="mt-5 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {group.category}
              </h3>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 divide-y divide-zinc-800/60 overflow-hidden">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="text-zinc-200 flex items-center gap-2">
                      {shortcut.description}
                      {shortcut.scope && (
                        <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700/50">
                          {shortcut.scope}
                        </span>
                      )}
                    </span>
                    <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-md shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 rounded">?</kbd> anywhere to toggle this guide.
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
