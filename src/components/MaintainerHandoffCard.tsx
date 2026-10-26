'use client';

import React, { useState } from 'react';
import { MaintainerHandoff } from '@/lib/types';
import { MessageSquareText, Copy, Check, Edit3, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface MaintainerHandoffCardProps {
  handoff: MaintainerHandoff;
  issueNumber: number;
  onUpdateHandoff: (updated: MaintainerHandoff) => void;
}

export function MaintainerHandoffCard({
  handoff,
  issueNumber,
  onUpdateHandoff,
}: MaintainerHandoffCardProps) {
  const [copiedQuestion, setCopiedQuestion] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [question, setQuestion] = useState(handoff.clarification_question);
  const [proposedCriteria, setProposedCriteria] = useState(
    handoff.proposed_criteria_addition || ''
  );
  const [validationPlan, setValidationPlan] = useState(
    handoff.suggested_validation_scenario || ''
  );

  const fullCommentText = `${question}\n\n${
    proposedCriteria ? `### Proposed Acceptance Criteria:\n${proposedCriteria}\n\n` : ''
  }${
    validationPlan ? `### Verification Plan:\n${validationPlan}\n\n` : ''
  }_Note: Prepared with [IssueLift](https://github.com/issuelift/issuelift) (pre-contribution evidence check)._`;

  const copyQuestion = () => {
    navigator.clipboard.writeText(question);
    setCopiedQuestion(true);
    setTimeout(() => setCopiedQuestion(false), 2000);
  };

  const copyFullComment = () => {
    navigator.clipboard.writeText(fullCommentText);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleSave = () => {
    onUpdateHandoff({
      ...handoff,
      clarification_question: question,
      proposed_criteria_addition: proposedCriteria,
      suggested_validation_scenario: validationPlan,
      user_edited: true,
    });
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-ink-border shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-electric-indigo/10 text-electric-indigo">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink">Maintainer Handoff (Copy-Ready)</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
              Never Auto-Posts
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Grounded clarification comment citing the exact ambiguity before anyone starts editing code.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl border border-ink-border hover:border-electric-indigo/50 text-ink-soft hover:text-electric-indigo text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-canvas-subtle hover:bg-white"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draft</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl bg-electric-indigo text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-electric-indigo-hover transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Triggering Ambiguity explanation */}
      <div className="p-3.5 rounded-xl bg-canvas-subtle border border-ink-border text-xs text-ink-soft flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-ink">Triggering Ambiguity in Issue #{issueNumber}:</strong>{' '}
          {handoff.triggering_ambiguity}
        </div>
      </div>

      {/* Editable or display area */}
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase mb-1">
              Clarification Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-ink-border focus:outline-none focus:border-electric-indigo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase mb-1">
              Proposed Acceptance Criteria Bullet(s)
            </label>
            <textarea
              value={proposedCriteria}
              onChange={(e) => setProposedCriteria(e.target.value)}
              rows={2}
              className="w-full text-sm p-3 rounded-xl border border-ink-border focus:outline-none focus:border-electric-indigo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase mb-1">
              Suggested Local Validation Scenario
            </label>
            <textarea
              value={validationPlan}
              onChange={(e) => setValidationPlan(e.target.value)}
              rows={2}
              className="w-full text-sm p-3 rounded-xl border border-ink-border focus:outline-none focus:border-electric-indigo"
            />
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-xl bg-canvas-subtle border border-ink-border space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint block mb-1">
              Drafted Comment for Maintainer:
            </span>
            <p className="text-sm text-ink font-medium leading-relaxed">{question}</p>
          </div>

          {proposedCriteria && (
            <div className="pt-3 border-t border-ink-border/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint block mb-1">
                Suggested Criteria Addition:
              </span>
              <p className="text-xs text-ink-soft font-mono bg-white p-2.5 rounded-lg border border-ink-border/70 whitespace-pre-wrap">
                {proposedCriteria}
              </p>
            </div>
          )}

          {validationPlan && (
            <div className="pt-3 border-t border-ink-border/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint block mb-1">
                Suggested Validation Scenario:
              </span>
              <p className="text-xs text-ink-soft">{validationPlan}</p>
            </div>
          )}
        </div>
      )}

      {/* Copy Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={copyQuestion}
          className="px-4 py-2 rounded-xl border border-ink-border bg-white hover:bg-canvas-subtle text-ink font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          {copiedQuestion ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedQuestion ? 'Copied Question!' : 'Copy Question Only'}</span>
        </button>

        <button
          onClick={copyFullComment}
          className="px-4 py-2 rounded-xl gradient-accent text-white font-medium text-xs flex items-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
        >
          {copiedFull ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
          <span>{copiedFull ? 'Copied Full Markdown!' : 'Copy Full Formatted Comment'}</span>
        </button>

        <span className="text-[11px] text-ink-faint italic">
          *Review and paste manually in GitHub issue thread.
        </span>
      </div>
    </div>
  );
}
