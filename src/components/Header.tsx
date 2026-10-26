'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Terminal, BookOpen, ExternalLink, Activity } from 'lucide-react';

export function Header() {
  const [health, setHealth] = useState<{ configured: boolean; model: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.gemma) {
          setHealth({
            configured: data.gemma.configured,
            model: data.gemma.model,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-ink-border/70 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-white shadow-md shadow-electric-indigo/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-ink">IssueLift</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-electric-indigo/10 text-electric-indigo border border-electric-indigo/20">
                v1.3 MVP
              </span>
            </div>
            <p className="text-xs text-ink-muted hidden sm:block">Pre-Contribution Contract & TraceMap Engine</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-ink hover:text-electric-indigo rounded-lg hover:bg-electric-indigo/5 transition-colors"
          >
            Scanner
          </Link>
          <Link
            href="/proofbench"
            className="px-3 py-1.5 text-sm font-medium text-ink hover:text-electric-indigo rounded-lg hover:bg-electric-indigo/5 flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-4 h-4 text-electric-indigo" />
            <span>ProofBench</span>
            <span className="text-xs px-1.5 py-0.2 rounded-md bg-verified-teal/15 text-teal-800 font-mono font-semibold">
              7
            </span>
          </Link>
          <a
            href="#how-it-works"
            className="px-3 py-1.5 text-sm font-medium text-ink hover:text-electric-indigo rounded-lg hover:bg-electric-indigo/5 transition-colors hidden md:block"
          >
            How It Works
          </a>

          {/* Engine status indicator */}
          <div className="ml-2 pl-3 border-l border-ink-border flex items-center gap-2">
            {health?.configured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-verified-surface text-teal-800 border border-verified-border">
                <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse" />
                <span className="hidden lg:inline">Gemma 4 Live</span>
                <span className="lg:hidden">Live</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-caution-surface text-caution-coral border border-caution-border">
                <span className="w-2 h-2 rounded-full bg-caution-coral" />
                <span className="hidden lg:inline">Key Pending (Baseline Active)</span>
                <span className="lg:hidden">Baseline</span>
              </span>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
