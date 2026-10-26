'use client';

import React from 'react';
import { ContributionContract } from '@/lib/types';
import { ExternalLink, Clock, GitBranch, User, Tag, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface IssueOverviewCardProps {
  contract: ContributionContract;
}

export function IssueOverviewCard({ contract }: IssueOverviewCardProps) {
  const meta = contract.issue_metadata;
  const gate = contract.readiness_gate;

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'ACTIONABLE':
        return {
          bg: 'bg-verified-surface',
          border: 'border-verified-border',
          text: 'text-teal-900',
          badge: 'bg-verified-teal text-white',
          icon: CheckCircle,
        };
      case 'CLARIFY FIRST':
        return {
          bg: 'bg-caution-surface',
          border: 'border-caution-border',
          text: 'text-rose-950',
          badge: 'bg-caution-coral text-white',
          icon: AlertTriangle,
        };
      case 'EVIDENCE-LIMITED':
      default:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-950',
          badge: 'bg-amber-500 text-white',
          icon: ShieldAlert,
        };
    }
  };

  const style = getVerdictStyle(gate.verdict);
  const VerdictIcon = style.icon;

  return (
    <div className="w-full bg-white rounded-2xl border border-ink-border shadow-card p-6 sm:p-8 space-y-6">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-ink-border/70">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                meta.state === 'open'
                  ? 'bg-verified-surface text-teal-800 border border-verified-border'
                  : 'bg-caution-surface text-caution-coral border border-caution-border'
              }`}
            >
              {meta.state}
            </span>
            <span className="text-xs text-ink-muted">
              {meta.owner}/{meta.repo} #{meta.number}
            </span>
            <span className="text-xs text-ink-faint flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Checked {new Date(meta.checked_at).toLocaleTimeString()}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <a
              href={meta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-electric-indigo transition-colors flex items-center gap-1.5"
            >
              <span>{meta.title}</span>
              <ExternalLink className="w-4 h-4 text-ink-faint shrink-0" />
            </a>
          </h2>
        </div>

        {/* Readiness Gate Badge */}
        <div className={`p-4 rounded-xl border ${style.bg} ${style.border} ${style.text} max-w-sm shrink-0`}>
          <div className="flex items-center gap-2 mb-1.5">
            <VerdictIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Readiness Gate:</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${style.badge}`}>
              {gate.verdict}
            </span>
          </div>
          <ul className="text-xs space-y-1 mt-2">
            {gate.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-ink-faint">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Meta tags and signals */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-ink-faint" />
          <span>Author:</span>
          <a
            href={meta.author.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink hover:text-electric-indigo"
          >
            @{meta.author.login}
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-ink-faint" />
          <span>Assignee:</span>
          <span className="font-medium text-ink">
            {meta.assignees.length > 0
              ? meta.assignees.map((a) => `@${a.login}`).join(', ')
              : 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-ink-faint" />
          <span>Branch:</span>
          <span className="font-mono text-ink font-medium">{meta.default_branch}</span>
        </div>

        {meta.labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-ink-faint" />
            {meta.labels.map((l) => (
              <span
                key={l.name}
                className="px-2 py-0.5 rounded-full text-[11px] bg-canvas-subtle border border-ink-border text-ink-soft"
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Executive Summary & Expected Outcome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-canvas-subtle border border-ink-border/80">
          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Issue Summary
          </h4>
          <p className="text-sm text-ink-soft leading-relaxed">{contract.issue_summary}</p>
        </div>

        <div className="p-4 rounded-xl bg-canvas-subtle border border-ink-border/80">
          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Expected Outcome (Definition of Done)
          </h4>
          <p className="text-sm text-ink-soft leading-relaxed">{contract.expected_outcome}</p>
        </div>
      </div>
    </div>
  );
}
