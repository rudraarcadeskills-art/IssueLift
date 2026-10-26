'use client';

import React, { useState } from 'react';
import { AcceptanceCriterion, CriterionStatus } from '@/lib/types';
import { FileCheck, AlertCircle, Edit3, Check, X, HelpCircle, Quote, Plus } from 'lucide-react';

interface ContributionContractCardProps {
  criteria: AcceptanceCriterion[];
  onUpdateCriteria: (updated: AcceptanceCriterion[]) => void;
}

export function ContributionContractCard({ criteria, onUpdateCriteria }: ContributionContractCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<CriterionStatus>('ACTIONABLE');

  const startEdit = (c: AcceptanceCriterion) => {
    setEditingId(c.id);
    setEditDesc(c.description);
    setEditStatus(c.status);
  };

  const saveEdit = (id: string) => {
    const updated = criteria.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          description: editDesc,
          status: editStatus,
          user_edited: true,
        };
      }
      return c;
    });
    onUpdateCriteria(updated);
    setEditingId(null);
  };

  const toggleNeedsClarification = (id: string) => {
    const updated = criteria.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          needs_maintainer_clarification: !c.needs_maintainer_clarification,
          status: !c.needs_maintainer_clarification ? ('AMBIGUOUS' as CriterionStatus) : ('ACTIONABLE' as CriterionStatus),
          user_edited: true,
        };
      }
      return c;
    });
    onUpdateCriteria(updated);
  };

  const handleAddCriterion = () => {
    const newId = `AC-${String(criteria.length + 1).padStart(2, '0')}`;
    const newCriterion: AcceptanceCriterion = {
      id: newId,
      description: 'New proposed acceptance criterion',
      criterion_type: 'AI-PROPOSED',
      status: 'ACTIONABLE',
      status_rationale: 'User added criterion to contract.',
      needs_maintainer_clarification: false,
      candidate_implementation_files: [],
      test_evidence: {
        status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
        candidate_test_files: [],
        rationale: 'Newly added criterion requires test mapping.',
      },
      user_edited: true,
    };
    onUpdateCriteria([...criteria, newCriterion]);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-ink-border shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-electric-indigo/10 text-electric-indigo">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink">Contribution Contract</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-canvas-subtle border border-ink-border text-ink-muted font-mono font-medium">
              {criteria.length} Criteria
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Explicit issue quotes remain verbatim. Inferred criteria are isolated and editable before handoff.
          </p>
        </div>

        <button
          onClick={handleAddCriterion}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-ink-border hover:border-electric-indigo/50 text-ink-soft hover:text-electric-indigo text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-canvas-subtle hover:bg-white"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Criterion</span>
        </button>
      </div>

      <div className="space-y-4">
        {criteria.map((c) => {
          const isEditing = editingId === c.id;

          return (
            <div
              key={c.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                c.needs_maintainer_clarification
                  ? 'border-amber-300 bg-amber-50/50'
                  : c.criterion_type === 'EXPLICIT'
                  ? 'border-ink-border bg-canvas-subtle/50'
                  : 'border-dashed border-electric-indigo/30 bg-electric-indigo/[0.02]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-ink text-white">
                    {c.id}
                  </span>

                  {c.criterion_type === 'EXPLICIT' ? (
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-verified-surface text-teal-800 border border-verified-border">
                      Explicit Quote
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-electric-indigo-surface text-electric-indigo border border-electric-indigo/20">
                      AI-Proposed (Inferred)
                    </span>
                  )}

                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      c.status === 'ACTIONABLE'
                        ? 'bg-verified-surface text-teal-800'
                        : c.status === 'AMBIGUOUS'
                        ? 'bg-caution-surface text-caution-coral'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {c.status}
                  </span>

                  {c.needs_maintainer_clarification && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 flex items-center gap-1">
                      ⚠️ Needs Clarification
                    </span>
                  )}
                </div>

                {/* Edit & Clarify actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => toggleNeedsClarification(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                      c.needs_maintainer_clarification
                        ? 'bg-amber-200 border-amber-300 text-amber-900 hover:bg-amber-300'
                        : 'bg-white border-ink-border text-ink-muted hover:text-ink hover:border-ink-border/80'
                    }`}
                  >
                    {c.needs_maintainer_clarification ? 'Flagged for Maintainer' : 'Flag Question'}
                  </button>

                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1 rounded-lg hover:bg-ink-border/30 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                      title="Edit criterion"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Criterion description or inline edit form */}
              {isEditing ? (
                <div className="mt-3 space-y-3 p-3 rounded-lg bg-white border border-electric-indigo/30 shadow-sm">
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-sm font-medium p-2 rounded-lg border border-ink-border focus:outline-none focus:border-electric-indigo"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as CriterionStatus)}
                      className="text-xs p-1.5 rounded-lg border border-ink-border bg-white text-ink"
                    >
                      <option value="ACTIONABLE">ACTIONABLE</option>
                      <option value="AMBIGUOUS">AMBIGUOUS</option>
                      <option value="NOT_SPECIFIED">NOT_SPECIFIED</option>
                      <option value="EVIDENCE_LIMITED">EVIDENCE_LIMITED</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="px-3 py-1 rounded-lg bg-electric-indigo text-white text-xs font-semibold flex items-center gap-1 hover:bg-electric-indigo-hover cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded-lg hover:bg-gray-100 text-ink-muted text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-ink mt-1.5 leading-relaxed">{c.description}</p>
              )}

              {/* Exact quote citation if available */}
              {c.exact_quote && (
                <div className="mt-2.5 p-2 rounded-lg bg-white/70 border border-ink-border/60 text-xs text-ink-muted flex items-start gap-2">
                  <Quote className="w-3.5 h-3.5 text-ink-faint shrink-0 mt-0.5" />
                  <span className="italic leading-relaxed">"{c.exact_quote}"</span>
                </div>
              )}

              <p className="text-xs text-ink-faint mt-2">
                <span className="font-semibold text-ink-muted">Rationale:</span> {c.status_rationale}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
