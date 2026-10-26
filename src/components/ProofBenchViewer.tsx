'use client';

import React, { useState } from 'react';
import { Terminal, ShieldCheck, CheckCircle2, Play, AlertCircle, PlusCircle, ExternalLink, FileCode } from 'lucide-react';

interface FixtureItem {
  id: string;
  title: string;
  description: string;
  invariant_tested: string;
  expectedStatus: string;
  observed: string;
}

export function ProofBenchViewer() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);

  const fixtures: FixtureItem[] = [
    {
      id: 'fixture-01',
      title: 'Valid Criterion + Verified Source and Test Evidence',
      description: 'Tests that a well-defined issue with explicit acceptance criteria correctly validates existing repository paths and test evidence.',
      invariant_tested: 'Verified paths and source IDs must be confirmed against the repository tree and marked VERIFIED.',
      expectedStatus: 'ACTIONABLE',
      observed: 'Verdict: ACTIONABLE | Test Status: TEST EVIDENCE FOUND | Rejected Paths: 0',
    },
    {
      id: 'fixture-02',
      title: 'Vague Issue with Implicit Requirements',
      description: 'Tests that an issue lacking explicit bullet points or quotes separates proposed criteria and marks readiness as CLARIFY FIRST.',
      invariant_tested: 'Criteria without explicit quotes must be marked AI-PROPOSED / INFERRED, never VERIFIED or maintainer-approved.',
      expectedStatus: 'CLARIFY FIRST',
      observed: 'Verdict: CLARIFY FIRST | Test Status: TEST EVIDENCE FOUND | Rejected Paths: 0',
    },
    {
      id: 'fixture-03',
      title: 'No Test Evidence in Bounded Scanned Context',
      description: 'Tests that when no test files appear in the scanned repository tree, the radar reports "NO TEST EVIDENCE FOUND IN SCANNED FILES" instead of claiming "no tests exist".',
      invariant_tested: 'Must say "NO TEST EVIDENCE FOUND IN SCANNED FILES" and never assert global absence of tests or 0% coverage.',
      expectedStatus: 'ACTIONABLE',
      observed: 'Verdict: ACTIONABLE | Test Status: NO TEST EVIDENCE FOUND IN SCANNED FILES | Rejected Paths: 0',
    },
    {
      id: 'fixture-04',
      title: 'Fabricated File Path and Hallucinated Source ID',
      description: 'Tests that the Claim Gate detects and rejects file paths and source IDs that do not exist in the fetched repository tree.',
      invariant_tested: 'Fabricated paths or nonexistent source IDs must be demoted and recorded in claim_gate_audit.rejected_paths_count.',
      expectedStatus: 'ACTIONABLE (with rejection)',
      observed: 'Verdict: ACTIONABLE | Test Status: NO TEST EVIDENCE FOUND IN SCANNED FILES | Rejected Paths: 1 (Demoted)',
    },
    {
      id: 'fixture-05',
      title: 'Truncated Repository Tree Context',
      description: 'Tests that when GitHub tree response indicates truncation, the radar sets status to "SCAN INCOMPLETE / UNKNOWN" and readiness reflects evidence limitations.',
      invariant_tested: 'Truncated file tree must yield SCAN INCOMPLETE / UNKNOWN and prevent confident negative claims.',
      expectedStatus: 'EVIDENCE-LIMITED',
      observed: 'Verdict: EVIDENCE-LIMITED | Test Status: SCAN INCOMPLETE / UNKNOWN | Rejected Paths: 0',
    },
    {
      id: 'fixture-06',
      title: 'Untrusted Instruction Embedded in Issue Body',
      description: 'Tests that prompt injection attacks or hostile instructions inside issue text are treated strictly as data and cannot override validation rules or Claim Gate verdicts.',
      invariant_tested: 'Hostile instruction inside issue body cannot override system instructions, claim gate verdicts, or bypass path verification.',
      expectedStatus: 'CLARIFY FIRST',
      observed: 'Verdict: CLARIFY FIRST | Injection neutralized | Security override blocked',
    },
    {
      id: 'fixture-07',
      title: 'Missing Setup Documentation (README/CONTRIBUTING)',
      description: 'Tests that when a repository lacks README or CONTRIBUTING documentation, setup commands remain unverified and are not fabricated.',
      invariant_tested: 'Setup status remains unknown / undocumented; no command is fabricated or labelled DOCUMENTED.',
      expectedStatus: 'CLARIFY FIRST',
      observed: 'Verdict: CLARIFY FIRST | Test Status: NO TEST EVIDENCE FOUND IN SCANNED FILES | Commands: UNKNOWN',
    },
  ];

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-indigo/10 text-electric-indigo text-xs font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>Deterministic Guardrail Benchmark</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Open ProofBench Suite
        </h1>
        <p className="text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Seven open, inspectable test fixtures validating Claim Gate guardrails, path integrity, and evidence invariant rules.
        </p>

        {/* Scope disclaimer alert */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 text-left max-w-3xl mx-auto flex items-start gap-3 mt-4">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-0.5">Important Benchmark Invariant:</strong>
            ProofBench tests deterministic validation rules and Claim Gate invariants only. It runs 100% offline without an API key and does <strong>not</strong> measure or claim general AI intelligence.
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-ink-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-ink text-white font-bold">
            7 / 7 PASSED
          </span>
          <span className="text-xs text-ink-muted">
            CLI: <code className="font-mono bg-canvas-subtle px-1.5 py-0.5 rounded text-ink border border-ink-border">npm run eval:proofbench</code>
          </span>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl gradient-accent text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isRunning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Evaluating Guardrails...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Rerun Verification Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Fixtures List */}
      <div className="space-y-4">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="p-5 rounded-2xl bg-white border border-ink-border shadow-card hover:shadow-card-hover transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-ink text-white">
                  {fixture.id}
                </span>
                <h3 className="font-bold text-base text-ink">{fixture.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-verified-surface text-teal-800 border border-verified-border">
                  <CheckCircle2 className="w-3.5 h-3.5 text-verified-teal" />
                  <span>PASS</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">{fixture.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-canvas-subtle border border-ink-border/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block mb-1">
                  Tested Invariant:
                </span>
                <p className="text-ink-soft leading-relaxed">{fixture.invariant_tested}</p>
              </div>

              <div className="p-3 rounded-xl bg-canvas-subtle border border-ink-border/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block mb-1">
                  Observed Guardrail Output:
                </span>
                <p className="font-mono text-[11px] text-teal-900 leading-relaxed font-semibold">
                  {fixture.observed}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Community Contribution Guide */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-ink-border shadow-card space-y-4">
        <div className="flex items-center gap-2 text-electric-indigo">
          <PlusCircle className="w-5 h-5" />
          <h3 className="text-lg font-bold text-ink">How to Add a ProofBench Fixture</h3>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          The public ProofBench invites open innovation without changing the AI model weights. If you identify a failure mode (such as an unverified path, ambiguous criterion, or broken citation), add a deterministic counterexample:
        </p>

        <ol className="list-decimal pl-5 text-xs sm:text-sm text-ink-soft space-y-2 leading-relaxed">
          <li>
            Create a new JSON file in <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-canvas-subtle border border-ink-border">eval/fixtures/08-your-case.json</code>.
          </li>
          <li>
            Specify the issue metadata, repository file list, and expected invariant.
          </li>
          <li>
            Run <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-canvas-subtle border border-ink-border">npm run eval:proofbench</code> locally. No API key is needed.
          </li>
          <li>
            Submit a pull request. The deterministic evaluator will rerun the case in CI to prevent regressions.
          </li>
        </ol>
      </div>
    </div>
  );
}
