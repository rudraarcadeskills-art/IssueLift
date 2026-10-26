'use client';

import React, { useState } from 'react';
import { AcceptanceCriterion, CommandInfo } from '@/lib/types';
import {
  Network,
  FileCode,
  FlaskConical,
  Terminal,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface TraceMapRadarProps {
  criteria: AcceptanceCriterion[];
  defaultBranch: string;
  owner: string;
  repo: string;
  globalTestCommand?: CommandInfo;
}

export function TraceMapRadar({
  criteria,
  defaultBranch,
  owner,
  repo,
  globalTestCommand,
}: TraceMapRadarProps) {
  const [expandedCriterionId, setExpandedCriterionId] = useState<string | null>(
    criteria[0]?.id || null
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-ink-border shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-electric-blue/10 text-electric-blue">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink">
              Acceptance-to-Test TraceMap & Test Gap Radar
            </h3>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Conservative evidence chains linking requirement → candidate source → test evidence → test command.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-verified-teal" />
            <span>Verified Path</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-electric-indigo/60" />
            <span>AI-Inferred Relevance</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-caution-coral" />
            <span>Evidence Gap</span>
          </span>
        </div>
      </div>

      {/* Criteria TraceMap rows */}
      <div className="space-y-5">
        {criteria.map((c) => {
          const isExpanded = expandedCriterionId === c.id;
          const hasTestEvidence = c.test_evidence.status === 'TEST EVIDENCE FOUND';
          const isGap = c.test_evidence.status === 'NO TEST EVIDENCE FOUND IN SCANNED FILES';

          return (
            <div
              key={c.id}
              className="rounded-xl border border-ink-border/80 bg-canvas-subtle/30 overflow-hidden transition-all"
            >
              {/* Row header */}
              <button
                onClick={() => setExpandedCriterionId(isExpanded ? null : c.id)}
                className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-canvas-subtle transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-ink text-white shrink-0">
                    {c.id}
                  </span>
                  <span className="text-sm font-semibold text-ink truncate">{c.description}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      hasTestEvidence
                        ? 'bg-verified-surface text-teal-800 border border-verified-border'
                        : isGap
                        ? 'bg-caution-surface text-caution-coral border border-caution-border'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {c.test_evidence.status}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-ink-muted transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Trace chain detail */}
              {isExpanded && (
                <div className="p-5 border-t border-ink-border bg-white space-y-6 animate-in fade-in duration-150">
                  {/* Visual Node Flow */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                    {/* Node 1: Requirement */}
                    <div className="p-3.5 rounded-xl border border-ink-border bg-canvas-subtle">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-electric-indigo" />
                        <span>1. Criterion</span>
                      </div>
                      <p className="text-xs text-ink font-medium leading-relaxed">{c.description}</p>
                      <span className="inline-block mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-ink-muted border border-ink-border">
                        Type: {c.criterion_type}
                      </span>
                    </div>

                    {/* Node 2: Candidate Source Files */}
                    <div className="p-3.5 rounded-xl border border-ink-border bg-canvas-subtle">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase mb-1.5">
                        <FileCode className="w-3.5 h-3.5 text-electric-blue" />
                        <span>2. Candidate File</span>
                      </div>
                      {c.candidate_implementation_files.length > 0 ? (
                        <div className="space-y-1.5">
                          {c.candidate_implementation_files.map((file, i) => (
                            <div key={i} className="text-xs">
                              <a
                                href={`https://github.com/${owner}/${repo}/blob/${defaultBranch}/${file.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-electric-indigo hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span className="truncate">{file.path}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              <span className="text-[10px] text-ink-faint block mt-0.5">
                                {file.verified_exists ? '✓ Verified in tree' : '✗ Unverified'} • {file.relevance_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-muted italic">No candidate file mapped in bounded scan.</p>
                      )}
                    </div>

                    {/* Node 3: Test Evidence */}
                    <div className="p-3.5 rounded-xl border border-ink-border bg-canvas-subtle">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase mb-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-verified-teal" />
                        <span>3. Test Candidate</span>
                      </div>
                      {c.test_evidence.candidate_test_files.length > 0 ? (
                        <div className="space-y-1.5">
                          {c.test_evidence.candidate_test_files.map((tFile, i) => (
                            <div key={i} className="text-xs">
                              <a
                                href={`https://github.com/${owner}/${repo}/blob/${defaultBranch}/${tFile.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-teal-700 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span className="truncate">{tFile.path}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              <span className="text-[10px] text-teal-600 block mt-0.5">
                                ✓ Found in scanned tree (not executed)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-caution-coral font-medium">
                          No test evidence found in scanned files.
                        </p>
                      )}
                    </div>

                    {/* Node 4: Test Command */}
                    <div className="p-3.5 rounded-xl border border-ink-border bg-canvas-subtle">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase mb-1.5">
                        <Terminal className="w-3.5 h-3.5 text-ink-soft" />
                        <span>4. Test Command</span>
                      </div>
                      {globalTestCommand?.command ? (
                        <div>
                          <code className="text-xs font-mono font-bold text-ink block p-1.5 rounded bg-white border border-ink-border">
                            {globalTestCommand.command}
                          </code>
                          <span className="text-[10px] text-ink-faint mt-1 block">
                            Label: {globalTestCommand.label}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-ink-muted italic">
                          No test execution command documented in inspected files.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Test Gap Card if evidence is missing or uncertain */}
                  {isGap && (
                    <div className="p-4 rounded-xl bg-caution-surface/70 border border-caution-border text-rose-950 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-caution-coral uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4" />
                        <span>Test Gap Radar: Absence of Test Evidence</span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        <strong>Checked Evidence:</strong> Bounded scan of repository tree located no automated test file referencing this criterion.
                      </p>
                      <p className="text-xs leading-relaxed">
                        <strong>Reason for Uncertainty:</strong> The repository may place tests in another directory, test externally via CI, or lack automated regression tests for this path.
                      </p>
                      <div className="p-2.5 rounded-lg bg-white/80 border border-caution-border text-xs">
                        <strong>Proposed Manual Validation Scenario:</strong>
                        <p className="mt-0.5 text-ink-soft">
                          {c.test_evidence.proposed_manual_validation ||
                            'Reproduce the issue locally before editing; write a localized test case covering this exact acceptance criterion.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
