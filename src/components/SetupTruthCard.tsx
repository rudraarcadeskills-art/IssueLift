'use client';

import React, { useState } from 'react';
import { SetupTruth } from '@/lib/types';
import { Terminal, Check, Copy, ExternalLink, FileText, AlertCircle } from 'lucide-react';

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
    { key: 'run', title: 'Development/Run Command', info: setupTruth.run_command },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-ink-border shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-electric-indigo/10 text-electric-indigo">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink">Setup Truth & Command Ledger</h3>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Verified commands extracted from documentation and package manifests.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <FileText className="w-3.5 h-3.5" />
            <span>README:</span>
            <strong className={setupTruth.has_readme ? 'text-teal-700' : 'text-rose-600'}>
              {setupTruth.has_readme ? 'Found' : 'Not Found'}
            </strong>
          </span>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <FileText className="w-3.5 h-3.5" />
            <span>CONTRIBUTING:</span>
            <strong className={setupTruth.has_contributing ? 'text-teal-700' : 'text-rose-600'}>
              {setupTruth.has_contributing ? 'Found' : 'Not Found'}
            </strong>
          </span>
        </div>
      </div>

      {/* Command Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {commands.map((c) => (
          <div key={c.key} className="p-4 rounded-xl border border-ink-border bg-canvas-subtle/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted uppercase">{c.title}</span>
              {c.info ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-verified-surface text-teal-800 border border-verified-border">
                  {c.info.label}
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  Not Documented
                </span>
              )}
            </div>

            {c.info ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-ink-border font-mono text-xs text-ink">
                <span className="truncate pr-2">{c.info.command}</span>
                <button
                  onClick={() => copyToClipboard(c.info!.command, c.key)}
                  className="p-1 rounded hover:bg-canvas-subtle text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedCmd === c.key ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-white/60 border border-ink-border/50 text-xs text-ink-faint italic">
                No command found in inspected files.
              </div>
            )}

            {c.info?.source_url && (
              <a
                href={c.info.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-electric-indigo hover:underline flex items-center gap-1 font-medium pt-1"
              >
                <span>View source in repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-canvas-subtle border border-ink-border text-xs text-ink-muted">
        <strong>Setup Notes:</strong> {setupTruth.notes}
      </div>
    </div>
  );
}
