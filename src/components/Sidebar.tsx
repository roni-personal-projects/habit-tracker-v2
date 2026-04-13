'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Table as TableIcon, Settings, BarChart3, PlusCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton, Show, SignInButton } from '@clerk/nextjs';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Habits Table', href: '/table', icon: TableIcon },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-64 glass-card border-r border-zinc-800 p-4 fixed left-0 top-0">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold">H</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">HabitFlow</h1>
      </div>

      <nav className="flex-1 space-y-1">
        <Show when="signed-in">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-blue-600/10 text-blue-500 font-medium" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                )}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </Show>
      </nav>

      <div className="pt-4 border-t border-zinc-800">
        <Show when="signed-in">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8 rounded-lg"
                }
              }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-100">Account</span>
              <span className="text-[10px] text-zinc-500">Member since 30d</span>
            </div>
          </div>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="flex items-center gap-3 w-full px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-lg transition-all duration-200">
              <LogIn size={18} />
              <span>Sign In</span>
            </button>
          </SignInButton>
        </Show>
      </div>
    </div>
  );
}
