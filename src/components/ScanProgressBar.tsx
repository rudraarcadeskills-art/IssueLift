'use client';

import React from 'react';
import { CheckCircle2, Loader2, GitPullRequest, FileCode, Sparkles, ShieldCheck } from 'lucide-react';

export type ScanStage = 'idle' | 'fetching_issue' | 'inspecting_repo' | 'reasoning_gemma' | 'claim_gate' | 'complete';

interface ScanProgressBarProps {
  currentStage: ScanStage;
}

export function ScanProgressBar({ currentStage }: ScanProgressBarProps) {
  if (currentStage === 'idle') return null;

  const stages = [
    {
      id: 'fetching_issue',
      label: 'Fetch Issue',
      desc: 'Live metadata & comments',
      icon: GitPullRequest,
    },
    {
      id: 'inspecting_repo',
      label: 'Inspect Repo',
      desc: 'Bounded tree & setup docs',
      icon: FileCode,
    },
    {
      id: 'reasoning_gemma',
      label: 'Gemma 4 Reasoning',
      desc: 'Contract & trace derivation',
      icon: Sparkles,
    },
    {
      id: 'claim_gate',
      label: 'Claim Gate',
      desc: 'Deterministic path validation',
      icon: ShieldCheck,
    },
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ['fetching_issue', 'inspecting_repo', 'reasoning_gemma', 'claim_gate', 'complete'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const targetIndex = stageOrder.indexOf(stageId);

    if (currentIndex > targetIndex) return 'complete';
    if (currentIndex === targetIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 rounded-2xl glass-panel shadow-card border border-ink-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Autonomous Analysis Pipeline
        </h3>
        <span className="text-xs font-mono font-medium text-electric-indigo bg-electric-indigo/10 px-2.5 py-0.5 rounded-full">
          {currentStage === 'complete' ? 'Analysis Verified' : 'Executing Scan...'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border transition-all ${
                status === 'complete'
                  ? 'bg-verified-surface/60 border-verified-border text-teal-900'
                  : status === 'active'
                  ? 'bg-white border-electric-indigo shadow-md shadow-electric-indigo/10 text-ink ring-2 ring-electric-indigo/20'
                  : 'bg-white/40 border-ink-border/50 text-ink-muted opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-5 h-5 ${
                    status === 'complete'
                      ? 'text-verified-teal'
                      : status === 'active'
                      ? 'text-electric-indigo'
                      : 'text-ink-faint'
                  }`}
                />
                {status === 'complete' && <CheckCircle2 className="w-4 h-4 text-verified-teal" />}
                {status === 'active' && <Loader2 className="w-4 h-4 text-electric-indigo animate-spin" />}
              </div>
              <p className="font-semibold text-sm">{stage.label}</p>
              <p className="text-[11px] text-ink-muted leading-tight mt-0.5">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
