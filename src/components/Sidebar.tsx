'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Table as TableIcon, BarChart3, LogIn, Moon, Laptop, Menu, X, Sparkles, Keyboard, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton, Show, SignInButton } from '@clerk/nextjs';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Habits Table', href: '/table', icon: TableIcon },
  { name: 'Sleep Tracker', href: '/sleep', icon: Moon },
  { name: 'Screen Time', href: '/screentime', icon: Laptop },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-violet-600 p-[1.5px] shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
        <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none">
            <path
              d="M18 36 C18 24 28 16 36 22 C42 26 48 34 50 38 C52 42 50 48 44 48 C36 48 30 38 24 28 C20 22 14 26 14 32 C14 42 24 48 34 46"
              stroke="url(#logoGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M26 32 L32 38 L44 24"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="44" cy="24" r="3" fill="#38bdf8" />
            <defs>
              <linearGradient id="logoGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div>
        <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
          HabitFlow
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">v2.1</span>
        </h1>
        <p className="text-[10px] text-zinc-500 font-medium tracking-tight mt-0.5">Atomic Behavioral OS</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 📱 Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 glass-card border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md">
        <BrandLogo />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/60 border border-zinc-700/50"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 📱 Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-md pt-20 p-6 flex flex-col justify-between animate-in fade-in duration-200">
          <nav className="space-y-2">
            <Show when="signed-in">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm",
                      isActive 
                        ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-bold" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    )}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </Show>
          </nav>

          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('habitflow:trigger-install'));
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-blue-300 hover:text-white bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Download size={16} className="text-blue-400" />
                <span className="font-semibold">Install HabitFlow</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
                App
              </span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('habitflow:toggle-shortcuts'));
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Keyboard size={16} className="text-zinc-400" />
                <span>Keyboard Shortcuts</span>
              </span>
              <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                ?
              </kbd>
            </button>

            <Show when="signed-in">
              <div className="flex items-center gap-3 px-2 py-2">
                <UserButton />
                <span className="text-xs font-bold text-zinc-300">My Profile</span>
              </div>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="flex items-center gap-3 w-full px-4 py-3 text-zinc-100 bg-blue-600 rounded-xl font-bold">
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      )}

      {/* 💻 Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-full w-64 glass-card border-r border-zinc-800/80 p-5 fixed left-0 top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mb-8 px-1">
          <BrandLogo />
        </div>

        <nav className="flex-1 space-y-1.5">
          <Show when="signed-in">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-medium",
                    isActive 
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold shadow-sm" 
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                  )}
                >
                  <Icon size={17} className={isActive ? "text-blue-400" : "text-zinc-500"} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </Show>
        </nav>

        <div className="pt-2 pb-2 space-y-1.5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('habitflow:trigger-install'))}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-blue-300 hover:text-white hover:bg-blue-600/20 bg-blue-600/10 border border-blue-500/25 transition-colors"
            title="Install HabitFlow Standalone App"
          >
            <span className="flex items-center gap-2">
              <Download size={14} className="text-blue-400" />
              <span className="font-semibold">Install App</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
              PWA
            </span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('habitflow:toggle-shortcuts'))}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 bg-zinc-900/40 border border-zinc-800/60 transition-colors"
            title="Keyboard Shortcuts (Press ?)"
          >
            <span className="flex items-center gap-2">
              <Keyboard size={14} className="text-zinc-500" />
              <span>Shortcuts</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
              ?
            </kbd>
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-800/80">
          <Show when="signed-in">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 rounded-lg"
                  }
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-zinc-100 truncate">Account</span>
                <span className="text-[10px] text-zinc-500 truncate">Sync: Connected</span>
              </div>
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20">
                <LogIn size={15} />
                <span>Sign In with Clerk</span>
              </button>
            </SignInButton>
          </Show>
        </div>
      </aside>
    </>
  );
}
