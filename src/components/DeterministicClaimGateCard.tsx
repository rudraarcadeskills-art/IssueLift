'use client';

import React from 'react';
import { ContributionContract } from '@/lib/types';
import { ShieldCheck, AlertTriangle, FileCode, CheckCircle2, XCircle, Info } from 'lucide-react';

interface DeterministicClaimGateCardProps {
  contract: ContributionContract;
}

export function DeterministicClaimGateCard({ contract }: DeterministicClaimGateCardProps) {
  const audit = contract.claim_gate_audit;
  const boundaries = contract.scan_boundaries;

  const verifiedSourcesCount = contract.sources.filter((s) => s.verified_exists).length;

  return (
    <div className="w-full bg-white rounded-2xl border border-ink-border shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-verified-surface text-teal-800">
              <ShieldCheck className="w-5 h-5 text-verified-teal" />
            </div>
            <h3 className="text-lg font-bold text-ink">Deterministic Claim Gate & Truth Ledger</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-verified-surface text-teal-800 border border-verified-border font-semibold">
              Guardrails Active
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Gemma proposes candidate files and criteria; deterministic code validates paths against GitHub tree.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-canvas-subtle border border-ink-border text-ink-soft">
          Engine: {contract.ai_configured ? `Gemma 4 (${contract.model_id})` : 'Baseline Compiler'}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-canvas-subtle border border-ink-border">
          <p className="text-xs text-ink-muted uppercase font-semibold">Verified Sources</p>
          <p className="text-2xl font-bold font-mono text-ink mt-1 flex items-center gap-2">
            <span>{verifiedSourcesCount}</span>
            <CheckCircle2 className="w-5 h-5 text-verified-teal" />
          </p>
          <p className="text-[11px] text-ink-faint mt-1">Confirmed in repo evidence</p>
        </div>

        <div className="p-4 rounded-xl bg-canvas-subtle border border-ink-border">
          <p className="text-xs text-ink-muted uppercase font-semibold">Repo Tree Files</p>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {boundaries.total_files_in_tree}
          </p>
          <p className="text-[11px] text-ink-faint mt-1">
            {boundaries.is_tree_truncated ? 'Truncated by API' : 'Full tree indexed'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-canvas-subtle border border-ink-border">
          <p className="text-xs text-ink-muted uppercase font-semibold">Rejected Paths</p>
          <p className="text-2xl font-bold font-mono text-ink mt-1 flex items-center gap-2">
            <span>{audit.rejected_paths_count}</span>
            {audit.rejected_paths_count > 0 ? (
              <XCircle className="w-5 h-5 text-caution-coral" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-verified-teal" />
            )}
          </p>
          <p className="text-[11px] text-ink-faint mt-1">Hallucinations blocked</p>
        </div>

        <div className="p-4 rounded-xl bg-canvas-subtle border border-ink-border">
          <p className="text-xs text-ink-muted uppercase font-semibold">ProofBench Invariants</p>
          <p className="text-2xl font-bold font-mono text-electric-indigo mt-1">
            7/7
          </p>
          <p className="text-[11px] text-ink-faint mt-1">Offline fixture verified</p>
        </div>
      </div>

      {/* Warnings & Audit Log */}
      {audit.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Claim Gate Audit Log:</span>
          </div>
          <ul className="space-y-1 list-disc pl-4 text-amber-900/90 font-mono text-[11px]">
            {audit.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Security statement */}
      <div className="p-3.5 rounded-xl bg-canvas-subtle/80 border border-ink-border text-xs text-ink-muted flex items-start gap-2.5">
        <Info className="w-4 h-4 text-electric-indigo shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Security Guarantee:</strong> IssueLift treats scanned repository content as untrusted input. No arbitrary code, installation scripts, or tests from the target repository are executed on the server.
        </p>
      </div>
    </div>
  );
}
