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

export function extractExplicitCriteria(
  body: string,
  issueUrl: string,
  testCommand?: any
): AcceptanceCriterion[] {
  if (!body || body.trim().length === 0) return [];

  const criteria: AcceptanceCriterion[] = [];
  const lines = body.split('\n');

  // 1. Look for explicit Expected Behavior / Acceptance Criteria section
  const sectionHeaderRegex = /^#{1,4}\s*(?:expected\s+(?:behavior|result|outcome)|acceptance\s+criteria|what\s+should\s+happen\??)/i;
  let inExpectedSection = false;
  const expectedSectionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (sectionHeaderRegex.test(trimmed)) {
      inExpectedSection = true;
      continue;
    }

    if (inExpectedSection) {
      if (/^#{1,4}\s+/.test(trimmed)) {
        inExpectedSection = false;
      } else if (trimmed.length > 0) {
        expectedSectionLines.push(trimmed);
      }
    }
  }

  // If explicit expected section exists, extract criteria from it
  if (expectedSectionLines.length > 0) {
    let idx = 0;
    for (const line of expectedSectionLines) {
      const clean = line.replace(/^(- \[[ x]\]|\* |- |\d+\. )/, '').trim();
      if (clean.length > 5) {
        idx++;
        criteria.push({
          id: `AC-${String(idx).padStart(2, '0')}`,
          description: clean,
          criterion_type: 'EXPLICIT',
          exact_quote: line,
          source_url: issueUrl,
          status: 'ACTIONABLE',
          status_rationale: 'Extracted verbatim from explicit expected-behavior section in issue description.',
          needs_maintainer_clarification: false,
          candidate_implementation_files: [],
          test_evidence: {
            status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
            candidate_test_files: [],
            rationale: 'Candidate test files mapped from repository tree index.',
            proposed_manual_validation: `Manually verify "${clean}" before submitting pull request.`,
            test_executed: false,
          },
          test_command: testCommand,
        });
        if (criteria.length >= 5) break;
      }
    }
  }

  // 2. If no expected section, check for markdown task lists or bulleted items
  if (criteria.length === 0) {
    const taskLines = lines.map((l) => l.trim()).filter((l) => /^(- \[[ x]\]|\* |- |\d+\. )/.test(l));
    taskLines.slice(0, 5).forEach((line, idx) => {
      const clean = line.replace(/^(- \[[ x]\]|\* |- |\d+\. )/, '').trim();
      if (clean.length > 5) {
        criteria.push({
          id: `AC-${String(idx + 1).padStart(2, '0')}`,
          description: clean,
          criterion_type: 'EXPLICIT',
          exact_quote: line,
          source_url: issueUrl,
          status: 'ACTIONABLE',
          status_rationale: 'Extracted directly from issue task list or bullet point.',
          needs_maintainer_clarification: false,
          candidate_implementation_files: [],
          test_evidence: {
            status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
            candidate_test_files: [],
            rationale: 'Candidate test files mapped from repository tree index.',
            proposed_manual_validation: `Manually verify "${clean}" before submitting pull request.`,
            test_executed: false,
          },
          test_command: testCommand,
        });
      }
    });
  }

  return criteria;
}

export function buildMaintainerHandoff(
  metadata: GitHubIssueMetadata,
  criteria: AcceptanceCriterion[],
  candidateSourceFile?: string
): MaintainerHandoff {
  if (metadata.has_linked_pr_signal) {
    const prRef = metadata.linked_pr_reference || 'an existing pull request';
    return {
      clarification_question: `I noticed ${prRef} may already be addressing or referencing issue #${metadata.number}. Before starting duplicate implementation work, would maintainers prefer help reviewing edge cases, contributing regression tests, or verifying the fix on that existing PR instead?`,
      triggering_ambiguity: `Active pull request reference detected (${prRef}). Implementation may already be in flight.`,
      proposed_criteria_addition: `- Confirm if ${prRef} covers the acceptance criteria for #${metadata.number} or if independent regression tests/validation are needed.`,
      suggested_validation_scenario: `Checkout the branch associated with ${prRef} and run the test suite to verify if issue #${metadata.number} is fully resolved.`,
      user_edited: false,
    };
  }

  return {
    clarification_question: `Regarding issue #${metadata.number} ("${metadata.title}"): Could you clarify the exact expected behavior and confirm if ${candidateSourceFile || 'the candidate module'} is the intended location for this change?`,
    triggering_ambiguity: criteria.some((c) => c.status === 'AMBIGUOUS' || c.needs_maintainer_clarification)
      ? 'Issue description does not specify formal acceptance criteria or expected edge-case handling.'
      : 'Initial architectural placement requires maintainer confirmation.',
    proposed_criteria_addition: `- Confirm acceptance test criteria for #${metadata.number}`,
    suggested_validation_scenario: 'Verify functionality with existing automated test suite.',
    user_edited: false,
  };
}

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

    const inspectedTestSources = new Set(
      sources
        .filter((s) => s.source_type === 'test' && s.source_id.startsWith('test-content-'))
        .map((s) => s.path)
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
        assertions_inspected: inspectedTestSources.has(t.path),
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
            assertions_inspected: inspectedTestSources.has(p),
          }));
          const hasInspected = candidateTestFiles.some((f) => f.assertions_inspected);
          testEvidenceStatus = scanBoundaries.is_tree_truncated
            ? 'SCAN INCOMPLETE / UNKNOWN'
            : hasInspected
            ? 'TEST EVIDENCE FOUND'
            : 'POSSIBLE TEST CANDIDATE';
        }
      }

      const defaultRationale = testEvidenceStatus === 'TEST EVIDENCE FOUND'
        ? `Located candidate test file(s) in repository tree (${candidateTestFiles.map((t) => t.path).join(', ')}). Test assertions inspected in bounded scan. Test execution has not occurred (security guardrail).`
        : testEvidenceStatus === 'POSSIBLE TEST CANDIDATE'
        ? `Candidate test path(s) found in repository tree (${candidateTestFiles.map((t) => t.path).join(', ')}). Assertions not inspected; test execution has not occurred.`
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
          assertions_inspected: candidateTestFiles.some((f) => f.assertions_inspected),
          test_executed: false,
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

    const maintainerHandoff: MaintainerHandoff = metadata.has_linked_pr_signal
      ? buildMaintainerHandoff(metadata, claimGateResult.validatedCriteria, ranked.sourceCandidates[0])
      : {
          clarification_question: aiData.maintainer_handoff.clarification_question,
          triggering_ambiguity: aiData.maintainer_handoff.triggering_ambiguity,
          proposed_criteria_addition: aiData.maintainer_handoff.proposed_criteria_addition,
          suggested_validation_scenario: aiData.maintainer_handoff.suggested_validation_scenario,
          user_edited: false,
        };

    return {
      issue_metadata: metadata,
      issue_summary: aiData.issue_summary,
      expected_outcome: aiData.expected_outcome,
      readiness_gate: claimGateResult.readinessGate,
      criteria: claimGateResult.validatedCriteria,
      setup_truth: setupTruth,
      maintainer_handoff: maintainerHandoff,
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
  // Extract explicit criteria preserving verbatim quotes from expected behavior or task list
  const explicitCriteria = extractExplicitCriteria(metadata.body, metadata.url, setupTruth.test_command);

  const criteria: AcceptanceCriterion[] = explicitCriteria.length > 0
    ? explicitCriteria
    : [
        {
          id: 'AC-01',
          description: metadata.title,
          criterion_type: 'AI-PROPOSED',
          exact_quote: undefined,
          source_url: metadata.url,
          status: 'AMBIGUOUS',
          status_rationale: 'No explicit task list or bulleted acceptance criteria found in issue description; proposed from issue title.',
          needs_maintainer_clarification: true,
          candidate_implementation_files: [],
          test_evidence: {
            status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
            candidate_test_files: [],
            rationale: 'No explicit test file mapped.',
            proposed_manual_validation: 'Reproduce issue behavior in local development environment.',
            test_executed: false,
          },
          test_command: setupTruth.test_command,
        },
      ];

  // Populate candidate files from ranked repo tree
  const ranked = rankRepositoryPaths(
    repositoryFiles,
    metadata.title,
    metadata.body,
    metadata.labels.map((l) => l.name)
  );
  const potentialSourceFiles = ranked.sourceCandidates.slice(0, 3);
  const potentialTestFiles = ranked.testCandidates.slice(0, 3);

  const inspectedTestSources = new Set(
    sources
      .filter((s) => s.source_type === 'test' && s.source_id.startsWith('test-content-'))
      .map((s) => s.path)
  );

  criteria.forEach((c) => {
    c.candidate_implementation_files = potentialSourceFiles.map((p) => ({
      path: p,
      relevance_rationale: 'Candidate source file identified in repository tree.',
      source_id: 'repo-tree',
      verified_exists: true,
      relevance_status: 'AI-INFERRED',
    }));

    if (potentialTestFiles.length > 0) {
      const hasInspected = potentialTestFiles.some((p) => inspectedTestSources.has(p));
      const testStatus: TestEvidenceStatus = scanBoundaries.is_tree_truncated
        ? 'SCAN INCOMPLETE / UNKNOWN'
        : hasInspected
        ? 'TEST EVIDENCE FOUND'
        : 'POSSIBLE TEST CANDIDATE';

      c.test_evidence = {
        status: testStatus,
        candidate_test_files: potentialTestFiles.map((p) => ({
          path: p,
          source_id: 'repo-tree',
          verified_exists: true,
          assertions_inspected: inspectedTestSources.has(p),
        })),
        rationale: testStatus === 'TEST EVIDENCE FOUND'
          ? `Located candidate test file(s) in repository tree: ${potentialTestFiles.join(', ')}. Test assertions inspected in bounded scan. Tests have not been executed.`
          : `Candidate test path(s) found in repository tree: ${potentialTestFiles.join(', ')}. Assertions not inspected; tests have not been executed.`,
        proposed_manual_validation: 'Run local test suite and inspect test coverage for affected components.',
        assertions_inspected: hasInspected,
        test_executed: false,
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

  const maintainerHandoff = buildMaintainerHandoff(
    metadata,
    claimGateResult.validatedCriteria,
    potentialSourceFiles[0]
  );

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
