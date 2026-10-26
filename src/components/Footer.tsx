import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Terminal, Heart, Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-ink-border bg-white/70 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-ink">IssueLift</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-electric-indigo/10 text-electric-indigo">
                Hacktoberfest 2026
              </span>
            </div>
            <p className="text-sm text-ink-muted max-w-md mb-4 leading-relaxed">
              Before a newcomer edits code, IssueLift converts a real GitHub issue into an evidence-backed
              Contribution Contract, maps criteria to test evidence, and produces a reviewable Maintainer Handoff.
            </p>
            <p className="text-xs text-ink-faint">
              <strong>Core Invariant:</strong> Gemma proposes; deterministic code verifies. Never executes scanned repository code.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Product & Engine</h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <Link href="/" className="hover:text-electric-indigo transition-colors">
                  Issue Scanner
                </Link>
              </li>
              <li>
                <Link href="/proofbench" className="hover:text-electric-indigo transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-electric-indigo" />
                  ProofBench Suite (7 Fixtures)
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-electric-indigo transition-colors">
                  How TraceMap Works
                </a>
              </li>
              <li>
                <a href="/api/health" target="_blank" className="hover:text-electric-indigo transition-colors">
                  Engine Health Endpoint
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Open Innovation</h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <a href="https://github.com/google/gemma" target="_blank" rel="noopener noreferrer" className="hover:text-electric-indigo transition-colors">
                  Gemma 4 Open Weights
                </a>
              </li>
              <li>
                <a href="https://hacktoberfest.com" target="_blank" rel="noopener noreferrer" className="hover:text-electric-indigo transition-colors">
                  Hacktoberfest 2026
                </a>
              </li>
              <li>
                <span className="inline-block px-2 py-0.5 text-xs rounded bg-progress-surface text-progress-dark font-medium border border-progress-lime">
                  MIT License (Original Code)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-ink-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-faint gap-4">
          <p>© 2026 IssueLift Contributors. Open-source contribution verification architecture.</p>
          <p className="flex items-center gap-1">
            Built with Next.js, Tailwind, and Gemma 4
          </p>
        </div>
      </div>
    </footer>
  );
}
