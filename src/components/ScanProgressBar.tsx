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
    <div className="w-full max-w-4xl mx-auto my-6 p-5 sm:p-6 rounded-2xl bg-midnight-800/90 border border-midnight-700 shadow-card-dark">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Autonomous Analysis Pipeline
        </h3>
        <span className="text-[11px] font-mono font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
          {currentStage === 'complete' ? 'Analysis Verified' : 'Executing Scan...'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border transition-all ${
                status === 'complete'
                  ? 'bg-teal-950/40 border-teal-500/40 text-teal-300'
                  : status === 'active'
                  ? 'bg-midnight-750 border-violet-500 shadow-glow text-slate-100 ring-2 ring-violet-500/20'
                  : 'bg-midnight-900/40 border-midnight-700/50 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-4 h-4 ${
                    status === 'complete'
                      ? 'text-teal-400'
                      : status === 'active'
                      ? 'text-violet-400'
                      : 'text-slate-600'
                  }`}
                />
                {status === 'complete' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                {status === 'active' && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
              </div>
              <p className="font-semibold text-xs sm:text-sm">{stage.label}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight mt-0.5">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
