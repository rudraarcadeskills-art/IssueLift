import {
  AcceptanceCriterion,
  CandidateFile,
  ContributionContract,
  GitHubIssueMetadata,
  MaintainerHandoff,
  ScanBoundaries,
  SetupTruth,
  SourceEvidence,
  TestEvidenceStatus,
} from './types';
import { analyzeIssueWithGemma } from './gemma';
import { runDeterministicClaimGate } from './claim-gate';
import { isLikelyTestFile, rankRepositoryPaths } from './github';

export async function compileContributionContract(
  metadata: GitHubIssueMetadata,
  sources: SourceEvidence[],
  repositoryFiles: string[],
  setupTruth: SetupTruth,
  scanBoundaries: ScanBoundaries
): Promise<ContributionContract> {
  const gemmaResult = await analyzeIssueWithGemma(
    metadata,
    sources,
    repositoryFiles,
    setupTruth,
    scanBoundaries
  );

  if (gemmaResult.success) {
    const aiData = gemmaResult.data;

    // Rank repository paths across the full tree for fallback / backfill
    const ranked = rankRepositoryPaths(
      repositoryFiles,
      metadata.title,
      metadata.body,
      metadata.labels.map((l) => l.name)
    );

    // Convert AI criteria to AcceptanceCriterion format
    const rawCriteria: AcceptanceCriterion[] = aiData.criteria.map((c, idx) => {
      const id = c.id || `AC-${String(idx + 1).padStart(2, '0')}`;

      // Candidate implementation files: preserve AI proposed or map from ranked tree
      let candidateImplFiles: CandidateFile[] = (c.candidate_files || []).map((f) => ({
        path: f.path,
        relevance_rationale: f.relevance_rationale,
        source_id: f.source_id,
        verified_exists: false, // Claim gate will verify
        relevance_status: 'AI-INFERRED',
      }));

      if (candidateImplFiles.length === 0 && ranked.sourceCandidates.length > 0) {
        const critRanked = rankRepositoryPaths(
          repositoryFiles,
          c.description,
          metadata.body,
          metadata.labels.map((l) => l.name)
        );
        const topSources = critRanked.sourceCandidates.length > 0
          ? critRanked.sourceCandidates.slice(0, 2)
          : ranked.sourceCandidates.slice(0, 2);

        candidateImplFiles = topSources.map((p) => ({
          path: p,
          relevance_rationale: `Candidate source file mapped from repository tree tokens matching criterion`,
          source_id: 'repo-tree',
          verified_exists: true,
          relevance_status: 'AI-INFERRED',
        }));
      }

      // Test evidence: preserve AI proposed or map from ranked tree
      let candidateTestFiles = (c.test_evidence?.candidate_test_files || []).map((t) => ({
        path: t.path,
        source_id: t.source_id,
        verified_exists: false,
      }));

      let testEvidenceStatus: TestEvidenceStatus = (c.test_evidence?.status as TestEvidenceStatus) || 'NO TEST EVIDENCE FOUND IN SCANNED FILES';

      if (candidateTestFiles.length === 0 && ranked.testCandidates.length > 0) {
        const critRanked = rankRepositoryPaths(
          repositoryFiles,
          c.description,
          metadata.body,
          metadata.labels.map((l) => l.name)
        );
        const topTests = critRanked.testCandidates.length > 0
          ? critRanked.testCandidates.slice(0, 2)
          : ranked.testCandidates.slice(0, 2);

        if (topTests.length > 0) {
          candidateTestFiles = topTests.map((p) => ({
            path: p,
            source_id: 'repo-tree',
            verified_exists: true,
          }));
          testEvidenceStatus = scanBoundaries.is_tree_truncated
            ? 'SCAN INCOMPLETE / UNKNOWN'
            : 'TEST EVIDENCE FOUND';
        }
      }

      const defaultRationale = candidateTestFiles.length > 0
        ? `Located candidate test file(s) in repository tree (${candidateTestFiles.map((t) => t.path).join(', ')}). Test execution has not occurred.`
        : scanBoundaries.is_tree_truncated
        ? 'Repository tree was truncated by GitHub API limit; test evidence scan is incomplete.'
        : 'No test evidence found in scanned files. Test coverage cannot be established from bounded context.';

      return {
        id,
        description: c.description,
        criterion_type: c.criterion_type,
        exact_quote: c.exact_quote,
        source_url: metadata.url,
        status: c.status,
        status_rationale: c.status_rationale,
        needs_maintainer_clarification: c.status === 'AMBIGUOUS' || c.status === 'NOT_SPECIFIED',
        candidate_implementation_files: candidateImplFiles,
        test_evidence: {
          status: testEvidenceStatus,
          candidate_test_files: candidateTestFiles,
          rationale: c.test_evidence?.rationale || defaultRationale,
          proposed_manual_validation: c.test_evidence?.proposed_manual_validation || `Verify "${c.description}" locally before opening pull request.`,
        },
        test_command: setupTruth.test_command,
      };
    });

    // Run Deterministic Claim Gate
    const claimGateResult = runDeterministicClaimGate(
      rawCriteria,
      sources,
      repositoryFiles,
      metadata,
      scanBoundaries,
      setupTruth
    );

    return {
      issue_metadata: metadata,
      issue_summary: aiData.issue_summary,
      expected_outcome: aiData.expected_outcome,
      readiness_gate: claimGateResult.readinessGate,
      criteria: claimGateResult.validatedCriteria,
      setup_truth: setupTruth,
      maintainer_handoff: {
        clarification_question: aiData.maintainer_handoff.clarification_question,
        triggering_ambiguity: aiData.maintainer_handoff.triggering_ambiguity,
        proposed_criteria_addition: aiData.maintainer_handoff.proposed_criteria_addition,
        suggested_validation_scenario: aiData.maintainer_handoff.suggested_validation_scenario,
        user_edited: false,
      },
      sources: claimGateResult.validatedSources,
      first_hour_route: aiData.first_hour_route,
      pr_checklist: aiData.pr_checklist,
      scan_boundaries: scanBoundaries,
      model_id: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it',
      ai_configured: true,
      claim_gate_audit: claimGateResult.audit,
    };
  }

  // Fallback: Deterministic baseline compile when Gemma is missing or unconfigured
  return compileDeterministicBaselineContract(
    metadata,
    sources,
    repositoryFiles,
    setupTruth,
    scanBoundaries,
    gemmaResult.error
  );
}

export function compileDeterministicBaselineContract(
  metadata: GitHubIssueMetadata,
  sources: SourceEvidence[],
  repositoryFiles: string[],
  setupTruth: SetupTruth,
  scanBoundaries: ScanBoundaries,
  aiErrorMessage?: string
): ContributionContract {
  // Extract explicit lines or tasks from issue body
  const lines = metadata.body.split('\n').map((l) => l.trim());
  const taskLines = lines.filter((l) => /^(- \[[ x]\]|\* |- |\d+\. )/.test(l));

  const criteria: AcceptanceCriterion[] = [];

  if (taskLines.length > 0) {
    taskLines.slice(0, 5).forEach((line, idx) => {
      const cleanDesc = line.replace(/^(- \[[ x]\]|\* |- |\d+\. )/, '').trim();
      criteria.push({
        id: `AC-${String(idx + 1).padStart(2, '0')}`,
        description: cleanDesc,
        criterion_type: 'EXPLICIT',
        exact_quote: line,
        source_url: metadata.url,
        status: 'ACTIONABLE',
        status_rationale: 'Extracted directly from issue task list or bullet point.',
        needs_maintainer_clarification: false,
        candidate_implementation_files: [],
        test_evidence: {
          status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
          candidate_test_files: [],
          rationale: 'Bounded scan has not mapped test files to this criterion.',
          proposed_manual_validation: `Manually verify "${cleanDesc}" before submitting PR.`,
        },
        test_command: setupTruth.test_command,
      });
    });
  } else {
    // Single criterion based on title
    criteria.push({
      id: 'AC-01',
      description: metadata.title,
      criterion_type: 'AI-PROPOSED',
      status: 'AMBIGUOUS',
      status_rationale: 'No explicit task list or bulleted acceptance criteria found in issue description.',
      needs_maintainer_clarification: true,
      candidate_implementation_files: [],
      test_evidence: {
        status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
        candidate_test_files: [],
        rationale: 'No explicit test file mapped.',
        proposed_manual_validation: 'Reproduce issue behavior in local development environment.',
      },
      test_command: setupTruth.test_command,
    });
  }

  // Populate candidate files from ranked repo tree
  const ranked = rankRepositoryPaths(
    repositoryFiles,
    metadata.title,
    metadata.body,
    metadata.labels.map((l) => l.name)
  );
  const potentialSourceFiles = ranked.sourceCandidates.slice(0, 3);
  const potentialTestFiles = ranked.testCandidates.slice(0, 3);

  criteria.forEach((c) => {
    c.candidate_implementation_files = potentialSourceFiles.map((p) => ({
      path: p,
      relevance_rationale: 'Candidate source file identified in repository tree.',
      source_id: 'repo-tree',
      verified_exists: true,
      relevance_status: 'AI-INFERRED',
    }));

    if (potentialTestFiles.length > 0) {
      c.test_evidence = {
        status: scanBoundaries.is_tree_truncated ? 'SCAN INCOMPLETE / UNKNOWN' : 'TEST EVIDENCE FOUND',
        candidate_test_files: potentialTestFiles.map((p) => ({
          path: p,
          source_id: 'repo-tree',
          verified_exists: true,
        })),
        rationale: `Located candidate test file(s) in repository tree: ${potentialTestFiles.join(', ')}. Tests have not been run.`,
        proposed_manual_validation: 'Run local test suite and inspect test coverage for affected components.',
      };
    }
  });

  const claimGateResult = runDeterministicClaimGate(
    criteria,
    sources,
    repositoryFiles,
    metadata,
    scanBoundaries,
    setupTruth
  );

  const issueSummary = metadata.body
    ? metadata.body.slice(0, 200).replace(/\r?\n/g, ' ') + '...'
    : metadata.title;

  const maintainerHandoff: MaintainerHandoff = {
    clarification_question: `Regarding issue #${metadata.number} ("${metadata.title}"): Could you clarify the exact expected behavior and confirm if ${potentialSourceFiles[0] || 'the candidate module'} is the intended location for this change?`,
    triggering_ambiguity: criteria.some((c) => c.status === 'AMBIGUOUS')
      ? 'Issue description does not specify formal acceptance criteria or expected edge-case handling.'
      : 'Initial architectural placement requires maintainer confirmation.',
    proposed_criteria_addition: `- Confirm acceptance test criteria for #${metadata.number}`,
    suggested_validation_scenario: 'Verify functionality with existing automated test suite.',
    user_edited: false,
  };

  return {
    issue_metadata: metadata,
    issue_summary: issueSummary,
    expected_outcome: `Resolution of issue #${metadata.number} satisfying identified acceptance criteria.`,
    readiness_gate: claimGateResult.readinessGate,
    criteria: claimGateResult.validatedCriteria,
    setup_truth: setupTruth,
    maintainer_handoff: maintainerHandoff,
    sources: claimGateResult.validatedSources,
    first_hour_route: [
      `1. Clone ${metadata.owner}/${metadata.repo} and checkout a new branch (e.g. fix/issue-${metadata.number}).`,
      `2. Run documented setup: ${setupTruth.install_command?.command || 'inspect package manifest'}`,
      `3. Execute test suite: ${setupTruth.test_command?.command || 'inspect test configuration'}`,
      `4. Verify candidate files: ${potentialSourceFiles.slice(0, 2).join(', ') || 'locate relevant module'}`,
      '5. Confirm requirements with maintainer before opening PR if criteria are marked clarify-first.',
    ],
    pr_checklist: [
      `Reference issue #${metadata.number} in PR description ("Fixes #${metadata.number}")`,
      'Include tests verifying all explicit acceptance criteria',
      'Ensure code adheres to CONTRIBUTING guidelines',
      'Validate that all existing tests pass before submission',
    ],
    scan_boundaries: scanBoundaries,
    ai_configured: false,
    claim_gate_audit: {
      ...claimGateResult.audit,
      warnings: [
        ...(aiErrorMessage ? [`Gemma Analysis Notice: ${aiErrorMessage}`] : []),
        ...claimGateResult.audit.warnings,
      ],
    },
  };
}
