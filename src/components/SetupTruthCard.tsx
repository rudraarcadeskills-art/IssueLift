'use client';

import React, { useState } from 'react';
import { SetupTruth } from '@/lib/types';
import { Terminal, Check, Copy, ExternalLink, FileText } from 'lucide-react';

interface SetupTruthCardProps {
  setupTruth: SetupTruth;
}

export function SetupTruthCard({ setupTruth }: SetupTruthCardProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const commands = [
    { key: 'install', title: 'Installation Command', info: setupTruth.install_command },
    { key: 'test', title: 'Test Execution Command', info: setupTruth.test_command },
    { key: 'run', title: 'Development / Run Command', info: setupTruth.run_command },
  ];

  return (
    <div className="w-full bg-white dark:bg-midnight-800/90 rounded-2xl border border-slate-200 dark:border-midnight-700/80 shadow-card dark:shadow-card-dark p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-midnight-700/70">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Setup Truth & Command Ledger</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified commands extracted from documentation and package manifests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-midnight-900/80 border border-slate-200 dark:border-midnight-700/70 text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>README:</span>
            <strong className={setupTruth.has_readme ? 'text-teal-600 dark:text-teal-400' : 'text-coral-600 dark:text-coral-400'}>
              {setupTruth.has_readme ? 'Found' : 'Not Found'}
            </strong>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-midnight-900/80 border border-slate-200 dark:border-midnight-700/70 text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>CONTRIBUTING:</span>
            <strong className={setupTruth.has_contributing ? 'text-teal-600 dark:text-teal-400' : 'text-coral-600 dark:text-coral-400'}>
              {setupTruth.has_contributing ? 'Found' : 'Not Found'}
            </strong>
          </span>
        </div>
      </div>

      {/* Command Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {commands.map((c) => (
          <div
            key={c.key}
            className="p-4 rounded-xl border border-slate-200 dark:border-midnight-700/70 bg-slate-50 dark:bg-midnight-900/60 hover:border-violet-500/40 transition-colors space-y-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.title}
              </span>
              {c.info ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/40">
                  {c.info.label}
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Not Documented
                </span>
              )}
            </div>

            {c.info ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-midnight-950/90 border border-slate-200 dark:border-midnight-700/80 font-mono text-xs text-slate-800 dark:text-slate-200">
                <span className="truncate pr-2 select-all">{c.info.command}</span>
                <button
                  onClick={() => copyToClipboard(c.info!.command, c.key)}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-midnight-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedCmd === c.key ? (
                    <Check className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-100/60 dark:bg-midnight-950/40 border border-slate-200 dark:border-midnight-800 text-xs text-slate-500 italic">
                No command found in inspected files.
              </div>
            )}

            {c.info?.source_url && (
              <a
                href={c.info.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:underline flex items-center gap-1 font-medium pt-1"
              >
                <span>View source in repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-midnight-900/60 border border-slate-200 dark:border-midnight-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
        <strong className="text-violet-600 dark:text-violet-300 shrink-0">Setup Notes:</strong>
        <span className="leading-relaxed">{setupTruth.notes}</span>
      </div>
    </div>
  );
}
