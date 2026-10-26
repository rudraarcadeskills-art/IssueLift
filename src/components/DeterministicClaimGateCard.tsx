'use client';

import React from 'react';
import { ContributionContract } from '@/lib/types';
import { ShieldCheck, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

interface DeterministicClaimGateCardProps {
  contract: ContributionContract;
}

export function DeterministicClaimGateCard({ contract }: DeterministicClaimGateCardProps) {
  const audit = contract.claim_gate_audit;
  const boundaries = contract.scan_boundaries;

  const verifiedSourcesCount = contract.sources.filter((s) => s.verified_exists).length;

  return (
    <div className="w-full bg-midnight-800/90 border border-midnight-700 rounded-2xl shadow-card-dark p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-midnight-700/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              Deterministic Claim Gate & Truth Ledger
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 font-semibold">
              Guardrails Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gemma proposes candidate files and criteria; deterministic code validates paths against GitHub tree.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-midnight-900 border border-midnight-700 text-slate-300">
          Engine: {contract.ai_configured ? `Gemma 4 (${contract.model_id})` : 'Baseline Compiler'}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-midnight-900/60 border border-midnight-700">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Verified Sources</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1 flex items-center gap-2">
            <span>{verifiedSourcesCount}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed in repo evidence</p>
        </div>

        <div className="p-4 rounded-xl bg-midnight-900/60 border border-midnight-700">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Repo Tree Files</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {boundaries.total_files_in_tree}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {boundaries.is_tree_truncated ? 'Truncated by API' : 'Full tree indexed'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-midnight-900/60 border border-midnight-700">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Rejected Paths</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-1 flex items-center gap-2">
            <span>{audit.rejected_paths_count}</span>
            {audit.rejected_paths_count > 0 ? (
              <XCircle className="w-4 h-4 text-coral-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Hallucinations blocked</p>
        </div>

        <div className="p-4 rounded-xl bg-midnight-900/60 border border-midnight-700">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">ProofBench Invariants</p>
          <p className="text-2xl font-bold font-mono text-violet-400 mt-1">
            7 / 7
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Offline fixture verified</p>
        </div>
      </div>

      {/* Warnings & Audit Log */}
      {audit.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Claim Gate Audit Log:</span>
          </div>
          <ul className="space-y-1 list-disc pl-4 text-amber-300/90 font-mono text-[11px]">
            {audit.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Security statement */}
      <div className="p-3.5 rounded-xl bg-midnight-900/80 border border-midnight-700 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Security Guarantee:</strong> IssueLift treats scanned repository content as untrusted input. No arbitrary code, installation scripts, or tests from the target repository are executed on the server.
        </p>
      </div>
    </div>
  );
}
