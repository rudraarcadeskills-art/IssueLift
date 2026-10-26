'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Terminal, BookOpen, ExternalLink, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type ActiveView = 'scanner' | 'proofbench' | 'playbook';

interface HeaderProps {
  activeView?: ActiveView;
  onSelectView?: (view: ActiveView) => void;
  isGemmaActive?: boolean;
}

export function Header({ activeView = 'scanner', onSelectView, isGemmaActive = false }: HeaderProps) {
  const [health, setHealth] = useState<{ configured: boolean; model: string } | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => {
        if (data?.gemma) {
          setHealth({
            configured: Boolean(data.gemma.configured),
            model: data.gemma.model || 'gemma-4-26b-a4b-it',
          });
        }
      })
      .catch(() => {
        setHealth({ configured: false, model: 'gemma-4-26b-a4b-it' });
      })
      .finally(() => {
        setIsLoadingHealth(false);
      });
  }, []);

  const gemmaLive = isGemmaActive || health?.configured;

  const handleNav = (view: ActiveView) => {
    if (onSelectView) {
      onSelectView(view);
    } else {
      if (view === 'scanner') {
        window.location.href = '/';
      } else if (view === 'proofbench') {
        window.location.href = '/proofbench';
      } else if (view === 'playbook') {
        window.location.href = '/#how-it-works';
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full dark-panel border-b border-midnight-700/80 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNav('scanner')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-sky-500 to-teal-400 p-[1px] shadow-glow">
              <div className="w-full h-full bg-midnight-900 rounded-[11px] flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-100 group-hover:text-violet-300 transition-colors">
                  IssueLift
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  v1.3
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* View Switcher Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleNav('scanner')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeView === 'scanner'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-midnight-800'
            }`}
          >
            Scanner
          </button>

          <button
            onClick={() => handleNav('proofbench')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'proofbench'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-midnight-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <span>ProofBench</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
              7
            </span>
          </button>

          <button
            onClick={() => handleNav('playbook')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer hidden md:flex items-center gap-1.5 ${
              activeView === 'playbook'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-midnight-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Playbook</span>
          </button>
        </nav>

        {/* Right side controls: Engine Status & Theme Switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dynamic Engine Status Pill */}
          {isLoadingHealth ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-midnight-800 text-slate-400 border border-midnight-700">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-ping" />
              <span className="hidden sm:inline">Checking Engine...</span>
            </span>
          ) : gemmaLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-950/60 text-teal-300 border border-teal-500/40 shadow-glow-teal">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="hidden sm:inline">Gemma 4 Live</span>
              <span className="sm:hidden font-mono text-[10px]">Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-500/40">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="hidden sm:inline">Baseline Active</span>
              <span className="sm:hidden font-mono text-[10px]">Baseline</span>
            </span>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
