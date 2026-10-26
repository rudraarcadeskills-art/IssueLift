'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('issuelift-theme') as 'dark' | 'light' | 'system';
      if (stored) {
        setTheme(stored);
        applyTheme(stored);
      } else {
        applyTheme('dark');
      }
    } catch (_) {}
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    if (newTheme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isSystemDark);
      root.classList.toggle('light', !isSystemDark);
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  };

  const handleSelect = (t: 'dark' | 'light') => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem('issuelift-theme', next);
    } catch (_) {}
  };

  return (
    <button
      onClick={() => handleSelect(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl bg-midnight-800/80 hover:bg-midnight-750 border border-midnight-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <>
          <Moon className="w-4 h-4 text-violet-400" />
          <span className="hidden sm:inline text-[11px]">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline text-[11px]">Light</span>
        </>
      )}
    </button>
  );
}
