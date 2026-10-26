'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IssueInputForm } from '@/components/IssueInputForm';
import { ScanProgressBar, ScanStage } from '@/components/ScanProgressBar';
import { IssueOverviewCard } from '@/components/IssueOverviewCard';
import { ContributionContractCard } from '@/components/ContributionContractCard';
import { TraceMapRadar } from '@/components/TraceMapRadar';
import { DeterministicClaimGateCard } from '@/components/DeterministicClaimGateCard';
import { SetupTruthCard } from '@/components/SetupTruthCard';
import { MaintainerHandoffCard } from '@/components/MaintainerHandoffCard';
import { ProofBundleExportModal } from '@/components/ProofBundleExportModal';
import { MissingKeyBanner } from '@/components/MissingKeyBanner';
import { ContributionContract, AcceptanceCriterion, MaintainerHandoff } from '@/lib/types';
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  FileText,
  ListChecks,
  Compass,
  ArrowRight,
  GitPullRequest,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<ContributionContract | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGemmaConfigured, setIsGemmaConfigured] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.gemma?.configured) {
          setIsGemmaConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleScan = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setContract(null);

    // Realistic scan stage transitions
    setScanStage('fetching_issue');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      setScanStage('inspecting_repo');
      await new Promise((r) => setTimeout(r, 300));

      setScanStage('reasoning_gemma');
      await new Promise((r) => setTimeout(r, 400));

      setScanStage('claim_gate');
      await new Promise((r) => setTimeout(r, 300));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Scan failed with status ${response.status}`);
      }

      const contractData: ContributionContract = await response.json();
      setContract(contractData);
      setScanStage('complete');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while scanning the issue.');
      setScanStage('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCriteria = (updatedCriteria: AcceptanceCriterion[]) => {
    if (!contract) return;
    setContract({
      ...contract,
      criteria: updatedCriteria,
    });
  };

  const handleUpdateHandoff = (updatedHandoff: MaintainerHandoff) => {
    if (!contract) return;
    setContract({
      ...contract,
      maintainer_handoff: updatedHandoff,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-4xl mx-auto pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-electric-indigo/10 border border-electric-indigo/20 text-electric-indigo text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Before Anyone Edits Code</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight">
            Turn Any Public GitHub Issue into a{' '}
            <span className="text-transparent bg-clip-text gradient-accent">
              Proven Contribution Contract
            </span>
          </h1>

          <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
            Define what "done" means, map requirements to verified repository test evidence, and export a reviewable Proof Bundle before writing your first line of code.
          </p>

          {/* Intake Hero Form */}
          <div className="pt-4">
            <IssueInputForm onScan={handleScan} isLoading={isLoading} error={error} />
          </div>
        </section>

        {/* Live Scan Stages Indicator */}
        <ScanProgressBar currentStage={scanStage} />

        {/* Missing Key Guidance Banner */}
        {!isGemmaConfigured && <MissingKeyBanner />}

        {/* Interactive Analysis Workspace */}
        {contract && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Top Export & Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-ink-border">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-verified-teal animate-pulse" />
                <span className="font-semibold text-sm text-ink">
                  Analysis Active: {contract.issue_metadata.owner}/{contract.issue_metadata.repo} #{contract.issue_metadata.number}
                </span>
                <span className="text-xs text-ink-muted hidden md:inline">
                  • {contract.criteria.length} Criteria Compiled
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl gradient-accent text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-electric-indigo/20 hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Proof Bundle</span>
                </button>
              </div>
            </div>

            {/* 1. Issue Overview & Readiness Gate */}
            <IssueOverviewCard contract={contract} />

            {/* 2. Contribution Contract Compiler */}
            <ContributionContractCard
              criteria={contract.criteria}
              onUpdateCriteria={handleUpdateCriteria}
            />

            {/* 3. Acceptance-to-Test TraceMap & Test Gap Radar */}
            <TraceMapRadar
              criteria={contract.criteria}
              defaultBranch={contract.issue_metadata.default_branch}
              owner={contract.issue_metadata.owner}
              repo={contract.issue_metadata.repo}
              globalTestCommand={contract.setup_truth.test_command}
            />

            {/* 4. Deterministic Claim Gate */}
            <DeterministicClaimGateCard contract={contract} />

            {/* 5. Setup Truth */}
            <SetupTruthCard setupTruth={contract.setup_truth} />

            {/* 6. Maintainer Handoff */}
            <MaintainerHandoffCard
              handoff={contract.maintainer_handoff}
              issueNumber={contract.issue_metadata.number}
              onUpdateHandoff={handleUpdateHandoff}
            />

            {/* 7. First-Hour Route & PR Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-ink-border shadow-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-ink-border/70">
                  <Compass className="w-5 h-5 text-electric-indigo" />
                  <h3 className="font-bold text-base text-ink">First-Hour Contributor Route</h3>
                </div>
                <ol className="space-y-3 text-xs sm:text-sm text-ink-soft">
                  {contract.first_hour_route.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-electric-indigo/10 text-electric-indigo font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-white rounded-2xl border border-ink-border shadow-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-ink-border/70">
                  <ListChecks className="w-5 h-5 text-verified-teal" />
                  <h3 className="font-bold text-base text-ink">Pre-PR Readiness Checklist</h3>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-ink-soft">
                  {contract.pr_checklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-verified-teal shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Export Modal */}
            <ProofBundleExportModal
              contract={contract}
              isOpen={isExportOpen}
              onClose={() => setIsExportOpen(false)}
            />
          </section>
        )}

        {/* How It Works & Open Innovation Section */}
        <section id="how-it-works" className="pt-12 border-t border-ink-border/70 space-y-8">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              The 5-Step Pre-Implementation Architecture
            </h2>
            <p className="text-sm text-ink-muted">
              Why IssueLift starts after an issue is picked and before anyone writes code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-ink-border shadow-card space-y-3">
              <div className="w-9 h-9 rounded-xl bg-electric-indigo/10 text-electric-indigo flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-ink">Contribution Contract</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Derives AC-01, AC-02... from real issue quotes. AI-proposed criteria are clearly separated and marked inferred.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-ink-border shadow-card space-y-3">
              <div className="w-9 h-9 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-ink">TraceMap & Radar</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Maps each criterion toward candidate source files and test candidates. Honest bounded scan wording: never claims "no tests exist".
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-ink-border shadow-card space-y-3">
              <div className="w-9 h-9 rounded-xl bg-verified-surface text-verified-teal flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-ink">Claim Gate & Proof</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Deterministic code validates that every suggested path exists in the GitHub tree. Reusable Contribution Proof Bundle export.
              </p>
            </div>
          </div>

          {/* Why Open Innovation Matters Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-electric-indigo/5 via-electric-blue/5 to-verified-teal/5 border border-electric-indigo/20 space-y-4">
            <div className="flex items-center gap-2 text-electric-indigo font-bold text-sm uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Hacktoberfest 2026 Core Theme</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Why Does Open Innovation Matter?
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed max-w-4xl">
              IssueLift turns an open issue into a reviewable Contribution Contract and evidence-to-test map before coding begins. The deterministic Claim Gate can be inspected and improved; the public ProofBench lets contributors add counterexamples whenever a path, citation, requirement or test-evidence label is wrong. This makes reliability rules—not only UI code—open to community inspection and extension. We claim no impact numbers until measured.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
