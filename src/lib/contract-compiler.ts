import {
  AcceptanceCriterion,
  CandidateFile,
  CandidateTestFile,
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
import {
  evaluateTestRelevance,
  extractReproductionEnvironment,
  isLikelyTestFile,
  rankRepositoryPaths,
} from './github';
import { isGemmaConfigured } from './config';

export function extractExplicitCriteria(
  body: string,
  issueUrl: string,
  testCommand?: any
): AcceptanceCriterion[] {
  if (!body || body.trim().length === 0) return [];

  const criteria: AcceptanceCriterion[] = [];
  const normalizedBody = body.replace(/\r\n/g, '\n');
  const lines = normalizedBody.split('\n');

  // Regex to detect reproduction sections that should NEVER yield acceptance criteria
  const reproSectionRegex = /^#{1,4}\s*(?:to\s+reproduce|steps\s+to\s+reproduce|how\s+to\s+reproduce|reproduction\s+steps)/i;
  // Regex to detect expected behavior / acceptance criteria section headings
  const expectedSectionHeaderRegex = /^#{1,4}\s*(?:.*?(?:expected\s+(?:behavior|result|outcome|behaviour)|acceptance\s+criteria|definition\s+of\s+done|what\s+should\s+happen\??)|expected(?:\s*[:\-])?$)/i;

  // Patterns for inline Expected and Current markers
  const expectedInlineMarkerRegex = /^\s*(?:\*{1,2}|_{1,2})?\s*expected(?:\s+(?:behavior|result|outcome|behaviour))?\s*[:\-]?(?:\*{1,2}|_{1,2})?\s*[:\-]?\s*(.*)$/i;
  const currentInlineMarkerRegex = /^\s*(?:\*{1,2}|_{1,2})?\s*(?:current|actual)(?:\s+(?:behavior|result|outcome|behaviour))?\s*[:\-]?(?:\*{1,2}|_{1,2})?\s*[:\-]?/i;

  const isCommandOrReproLine = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      /^(?:npm|pnpm|yarn|bun|npx|curl|git clone|git\s|cd\s)\b/i.test(trimmed) ||
      /curl\s+-s/i.test(trimmed) ||
      /^clone the repo/i.test(trimmed) ||
      /^https?:\/\/\S+$/i.test(trimmed) ||
      /^```/i.test(trimmed)
    );
  };

  let inReproSection = false;
  let inExpectedSection = false;
  let readingExpectedInline = false;
  const expectedInlineLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (reproSectionRegex.test(trimmed)) {
      inReproSection = true;
      inExpectedSection = false;
      readingExpectedInline = false;
      continue;
    }

    if (trimmed.startsWith('#')) {
      inReproSection = false;
      readingExpectedInline = false;
      if (expectedSectionHeaderRegex.test(trimmed)) {
        inExpectedSection = true;
      } else {
        inExpectedSection = false;
      }
      continue;
    }

    // Never extract criteria from reproduction sections
    if (inReproSection) {
      continue;
    }

    // Check for inline Expected label (e.g. **Expected:**, Expected:, etc.)
    const expectedMatch = trimmed.match(expectedInlineMarkerRegex);
    if (expectedMatch) {
      readingExpectedInline = true;
      let inlineContent = expectedMatch[1].trim();
      // Remove any residual markdown formatting or leading punctuation
      inlineContent = inlineContent.replace(/^[\s*_:\-]+|[\s*_:\-]+$/g, '').trim();
      if (inlineContent.length > 0 && !isCommandOrReproLine(inlineContent)) {
        expectedInlineLines.push(inlineContent);
      }
      continue;
    }

    // Check for inline Current / Actual marker
    if (currentInlineMarkerRegex.test(trimmed)) {
      readingExpectedInline = false;
      continue;
    }

    // If reading expected inline content
    if (readingExpectedInline) {
      // Empty line terminates the expected paragraph (prevents reading trailing repro/version notes)
      if (trimmed.length === 0) {
        readingExpectedInline = false;
        continue;
      }

      // Stop if line indicates reproduction / version notes or curl / commands
      if (/^(?:the same happens with|it reproduces on|reproduces on|tested on|reproduction:)\b/i.test(trimmed)) {
        readingExpectedInline = false;
        continue;
      }

      if (!isCommandOrReproLine(trimmed) && !trimmed.startsWith('#') && !trimmed.startsWith('<')) {
        expectedInlineLines.push(trimmed);
      }
      continue;
    }
  }

  // 1. If inline expected behavior was found
  if (expectedInlineLines.length > 0) {
    const fullExpectedText = expectedInlineLines.join(' ');
    // Find verbatim quote in original issue text
    let exactQuote: string | undefined = undefined;

    const bodyContains = (text: string) => body.includes(text) || normalizedBody.includes(text);

    if (bodyContains(expectedInlineLines[0])) {
      exactQuote = expectedInlineLines[0];
    } else if (bodyContains(fullExpectedText)) {
      exactQuote = fullExpectedText;
    } else {
      for (const line of expectedInlineLines) {
        if (line.length > 10 && bodyContains(line)) {
          exactQuote = line;
          break;
        }
      }
    }

    const isVerbatim = Boolean(exactQuote && exactQuote.trim().length > 5 && bodyContains(exactQuote));
    const criterionType = isVerbatim ? 'EXPLICIT' : 'AI-PROPOSED';

    criteria.push({
      id: `AC-${String(criteria.length + 1).padStart(2, '0')}`,
      description: fullExpectedText,
      criterion_type: criterionType,
      exact_quote: isVerbatim ? exactQuote : undefined,
      source_url: issueUrl,
      status: 'ACTIONABLE',
      status_rationale: isVerbatim
        ? 'Extracted verbatim from explicit expected-behavior in issue description.'
        : 'Proposed from expected behavior section; verbatim quote not confirmed.',
      needs_maintainer_clarification: false,
      candidate_implementation_files: [],
      test_evidence: {
        status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
        candidate_test_files: [],
        rationale: 'Candidate test files mapped from repository tree index.',
        proposed_manual_validation: `Manually verify expected behavior before submitting pull request.`,
        test_executed: false,
      },
      test_command: testCommand,
    });
    return criteria;
  }

  // 2. If inside a standalone expected section (not Current vs Expected)
  let standaloneExpectedLines: string[] = [];
  let inStandaloneExpected = false;
  let inStandaloneRepro = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (reproSectionRegex.test(trimmed)) {
      inStandaloneRepro = true;
      inStandaloneExpected = false;
      continue;
    }
    if (trimmed.startsWith('#')) {
      inStandaloneRepro = false;
      // Standalone Expected heading (excluding sections with "Current")
      if (expectedSectionHeaderRegex.test(trimmed) && !/current/i.test(trimmed)) {
        inStandaloneExpected = true;
      } else {
        inStandaloneExpected = false;
      }
      continue;
    }
    if (inStandaloneRepro) continue;
    if (inStandaloneExpected && trimmed.length > 0) {
      if (currentInlineMarkerRegex.test(trimmed)) {
        inStandaloneExpected = false;
        continue;
      }
      if (!isCommandOrReproLine(trimmed) && !trimmed.startsWith('<')) {
        standaloneExpectedLines.push(trimmed);
      }
    }
  }

  if (standaloneExpectedLines.length > 0) {
    for (const line of standaloneExpectedLines) {
      const clean = line.replace(/^(- \[[ x]\]|\* |- |\d+\. )/, '').trim();
      if (clean.length > 5) {
        const bodyContains = (text: string) => body.includes(text) || normalizedBody.includes(text);
        const quoteToUse = bodyContains(line) ? line : (bodyContains(clean) ? clean : undefined);
        const isVerbatim = Boolean(quoteToUse && quoteToUse.trim().length > 5);
        criteria.push({
          id: `AC-${String(criteria.length + 1).padStart(2, '0')}`,
          description: clean,
          criterion_type: isVerbatim ? 'EXPLICIT' : 'AI-PROPOSED',
          exact_quote: isVerbatim ? quoteToUse : undefined,
          source_url: issueUrl,
          status: 'ACTIONABLE',
          status_rationale: isVerbatim
            ? 'Extracted verbatim from explicit expected-behavior section in issue description.'
            : 'Proposed from expected-behavior section; verbatim quote not confirmed.',
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
    if (criteria.length > 0) return criteria;
  }

  // 3. Task lists outside reproduction sections
  let taskCurrentIsRepro = false;
  const taskLines: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (reproSectionRegex.test(trimmed)) {
      taskCurrentIsRepro = true;
      continue;
    }
    if (trimmed.startsWith('#')) {
      taskCurrentIsRepro = false;
    }
    if (!taskCurrentIsRepro) {
      const isCheckbox = /^- \[[ x]\]\s*(.+)/.test(trimmed);
      const isBullet = /^[\*-]\s+(.+)/.test(trimmed);
      if ((isCheckbox || isBullet) && !isCommandOrReproLine(trimmed)) {
        taskLines.push(trimmed);
      }
    }
  }

  taskLines.slice(0, 5).forEach((line) => {
    const clean = line.replace(/^(- \[[ x]\]|\* |- )/, '').trim();
    if (clean.length > 5) {
      const isVerbatim = body.includes(line);
      criteria.push({
        id: `AC-${String(criteria.length + 1).padStart(2, '0')}`,
        description: clean,
        criterion_type: isVerbatim ? 'EXPLICIT' : 'AI-PROPOSED',
        exact_quote: isVerbatim ? line : undefined,
        source_url: issueUrl,
        status: 'ACTIONABLE',
        status_rationale: 'Extracted directly from issue task list.',
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

    const inspectedTestMap = new Map(
      sources
        .filter((s) => s.source_type === 'test' && s.source_id.startsWith('test-content-'))
        .map((s) => [s.path, s.excerpt])
    );

    // Extract deterministic explicit criteria from issue body
    const explicitCriteria = extractExplicitCriteria(
      metadata.body,
      metadata.url,
      setupTruth.test_command
    );

    let rawCriteriaInputs: Array<{
      id?: string;
      description: string;
      criterion_type: 'EXPLICIT' | 'AI-PROPOSED';
      exact_quote?: string;
      status: import('./types').CriterionStatus;
      status_rationale: string;
      candidate_files?: Array<{ path: string; relevance_rationale: string; source_id: string }>;
      test_evidence?: any;
    }> = aiData.criteria;

    if (explicitCriteria.length > 0) {
      const explicitRaw = explicitCriteria.map((ec, idx) => ({
        id: `AC-${String(idx + 1).padStart(2, '0')}`,
        description: ec.description,
        criterion_type: ec.criterion_type,
        exact_quote: ec.exact_quote,
        status: ec.status,
        status_rationale: ec.status_rationale,
        candidate_files: ec.candidate_implementation_files.map((cf) => ({
          path: cf.path,
          relevance_rationale: cf.relevance_rationale,
          source_id: cf.source_id,
        })),
        test_evidence: ec.test_evidence,
      }));

      // Filter remaining AI criteria so they don't redundantly repeat the explicit expected behavior
      const remainingAi = aiData.criteria.filter((ac) => {
        const descLower = ac.description.toLowerCase();
        return !explicitCriteria.some((ec) =>
          descLower.includes(ec.description.toLowerCase().slice(0, 30))
        );
      });

      rawCriteriaInputs = [
        ...explicitRaw,
        ...remainingAi.slice(0, Math.max(3, 4 - explicitRaw.length)),
      ];
    }

    // Convert criteria to AcceptanceCriterion format
    const rawCriteria: AcceptanceCriterion[] = rawCriteriaInputs.map((c, idx) => {
      const id = `AC-${String(idx + 1).padStart(2, '0')}`;

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
      let candidateTestFiles: CandidateTestFile[] = (c.test_evidence?.candidate_test_files || []).map((t: CandidateTestFile) => {
        const isInspected = inspectedTestMap.has(t.path);
        const excerpt = inspectedTestMap.get(t.path);
        const relevance = isInspected
          ? evaluateTestRelevance(t.path, excerpt, c.description, c.exact_quote)
          : { isRelevant: false, rationale: 'Uninspected path in tree.' };

        return {
          path: t.path,
          source_id: t.source_id,
          verified_exists: false,
          assertions_inspected: isInspected,
          relevance_verdict: (isInspected ? (relevance.isRelevant ? 'RELEVANT' : 'UNRELATED') : 'UNKNOWN') as CandidateTestFile['relevance_verdict'],
        };
      });

      if (candidateTestFiles.length === 0 && ranked.testCandidates.length > 0) {
        const critRanked = rankRepositoryPaths(
          repositoryFiles,
          c.description,
          metadata.body,
          metadata.labels.map((l) => l.name)
        );
        const topTests = critRanked.testCandidates.length > 0
          ? critRanked.testCandidates.slice(0, 3)
          : ranked.testCandidates.slice(0, 3);

        if (topTests.length > 0) {
          candidateTestFiles = topTests.map((p) => {
            const isInspected = inspectedTestMap.has(p);
            const excerpt = inspectedTestMap.get(p);
            const relevance = isInspected
              ? evaluateTestRelevance(p, excerpt, c.description, c.exact_quote)
              : { isRelevant: false, rationale: 'Uninspected path in tree.' };

            return {
              path: p,
              source_id: 'repo-tree',
              verified_exists: true,
              assertions_inspected: isInspected,
              relevance_verdict: (isInspected ? (relevance.isRelevant ? 'RELEVANT' : 'UNRELATED') : 'UNKNOWN') as CandidateTestFile['relevance_verdict'],
            };
          });
        }
      }

      const relevantInspectedTests = candidateTestFiles.filter((t) => t.assertions_inspected && t.relevance_verdict === 'RELEVANT');
      const unrelatedInspectedTests = candidateTestFiles.filter((t) => t.assertions_inspected && t.relevance_verdict === 'UNRELATED');

      let testEvidenceStatus: TestEvidenceStatus;
      let defaultRationale: string;

      if (scanBoundaries.is_tree_truncated) {
        testEvidenceStatus = 'SCAN INCOMPLETE / UNKNOWN';
        defaultRationale = 'Repository tree was truncated by GitHub API limit; test evidence scan is incomplete.';
      } else if (relevantInspectedTests.length > 0) {
        testEvidenceStatus = 'TEST EVIDENCE FOUND';
        defaultRationale = `Located relevant candidate test file(s) in repository tree (${relevantInspectedTests.map((t) => t.path).join(', ')}). Test assertions inspected in bounded scan. Test execution has not occurred (security guardrail).`;
      } else if (unrelatedInspectedTests.length > 0 && candidateTestFiles.every((t) => t.relevance_verdict === 'UNRELATED')) {
        testEvidenceStatus = 'NO TEST EVIDENCE FOUND IN SCANNED FILES';
        defaultRationale = `Inspected candidate test files in bounded scan (${unrelatedInspectedTests.map((t) => t.path).join(', ')}) do not verify criterion requirements. No relevant automated test evidence confirmed in bounded scan. Candidate tests were not executed (security guardrail).`;
      } else if (candidateTestFiles.some((t) => !t.assertions_inspected)) {
        testEvidenceStatus = 'POSSIBLE TEST CANDIDATE';
        defaultRationale = `Candidate test path(s) found in repository tree (${candidateTestFiles.map((t) => t.path).join(', ')}). Assertions not inspected; test execution has not occurred.`;
      } else {
        testEvidenceStatus = 'NO TEST EVIDENCE FOUND IN SCANNED FILES';
        defaultRationale = 'No test evidence found in scanned files. Test coverage cannot be established from bounded context.';
      }

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

    // Clean first_hour_route items so they never carry leading numbers
    const cleanFirstHourRoute = aiData.first_hour_route.map((step) =>
      step.replace(/^\d+[\.\)]\s*/, '').trim()
    );

    return {
      issue_metadata: metadata,
      issue_summary: aiData.issue_summary,
      expected_outcome: aiData.expected_outcome,
      readiness_gate: claimGateResult.readinessGate,
      criteria: claimGateResult.validatedCriteria,
      setup_truth: setupTruth,
      reproduction_environment: extractReproductionEnvironment(metadata.body),
      maintainer_handoff: maintainerHandoff,
      sources: claimGateResult.validatedSources,
      first_hour_route: cleanFirstHourRoute,
      pr_checklist: aiData.pr_checklist,
      scan_boundaries: scanBoundaries,
      model_id: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it',
      ai_configured: true,
      engine: 'gemma',
      analysis_status: 'gemma_success',
      engine_details: {
        model_id: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it',
        configured: true,
        guardrails_passed: true,
      },
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
    gemmaResult.error,
    gemmaResult.missing_key
  );
}

export function compileDeterministicBaselineContract(
  metadata: GitHubIssueMetadata,
  sources: SourceEvidence[],
  repositoryFiles: string[],
  setupTruth: SetupTruth,
  scanBoundaries: ScanBoundaries,
  aiErrorMessage?: string,
  isMissingKey?: boolean
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
          status_rationale: 'No explicit expected behavior or acceptance criteria found in issue description; proposed from issue title.',
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

  const inspectedTestMap = new Map(
    sources
      .filter((s) => s.source_type === 'test' && s.source_id.startsWith('test-content-'))
      .map((s) => [s.path, s.excerpt])
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
      const candidateTestFiles = potentialTestFiles.map((p) => {
        const isInspected = inspectedTestMap.has(p);
        const excerpt = inspectedTestMap.get(p);
        const relevance = isInspected
          ? evaluateTestRelevance(p, excerpt, c.description, c.exact_quote)
          : { isRelevant: false, rationale: 'Uninspected path in tree.' };

        return {
          path: p,
          source_id: 'repo-tree',
          verified_exists: true,
          assertions_inspected: isInspected,
          relevance_verdict: (isInspected ? (relevance.isRelevant ? 'RELEVANT' : 'UNRELATED') : 'UNKNOWN') as CandidateTestFile['relevance_verdict'],
        };
      });

      const relevantInspectedTests = candidateTestFiles.filter((t) => t.assertions_inspected && t.relevance_verdict === 'RELEVANT');
      const unrelatedInspectedTests = candidateTestFiles.filter((t) => t.assertions_inspected && t.relevance_verdict === 'UNRELATED');

      let testStatus: TestEvidenceStatus;
      let defaultRationale: string;

      if (scanBoundaries.is_tree_truncated) {
        testStatus = 'SCAN INCOMPLETE / UNKNOWN';
        defaultRationale = 'Repository tree was truncated by GitHub API limit; test evidence scan is incomplete.';
      } else if (relevantInspectedTests.length > 0) {
        testStatus = 'TEST EVIDENCE FOUND';
        defaultRationale = `Located candidate test file(s) in repository tree (${relevantInspectedTests.map((t) => t.path).join(', ')}). Test assertions inspected in bounded scan. Tests have not been executed (security guardrail).`;
      } else if (unrelatedInspectedTests.length > 0 && candidateTestFiles.every((t) => t.relevance_verdict === 'UNRELATED')) {
        testStatus = 'NO TEST EVIDENCE FOUND IN SCANNED FILES';
        defaultRationale = `Inspected candidate test files in bounded scan (${unrelatedInspectedTests.map((t) => t.path).join(', ')}) do not verify criterion requirements. No relevant automated test evidence confirmed in bounded scan. Candidate tests were not executed (security guardrail).`;
      } else if (candidateTestFiles.some((t) => !t.assertions_inspected)) {
        testStatus = 'POSSIBLE TEST CANDIDATE';
        defaultRationale = `Candidate test path(s) found in repository tree (${candidateTestFiles.map((t) => t.path).join(', ')}). Assertions not inspected; tests have not been executed.`;
      } else {
        testStatus = 'NO TEST EVIDENCE FOUND IN SCANNED FILES';
        defaultRationale = 'No test evidence found in scanned files. Test coverage cannot be established from bounded context.';
      }

      c.test_evidence = {
        status: testStatus,
        candidate_test_files: candidateTestFiles,
        rationale: defaultRationale,
        proposed_manual_validation: 'Run local test suite and inspect test coverage for affected components.',
        assertions_inspected: candidateTestFiles.some((t) => t.assertions_inspected),
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

  const gemmaConfigured = isGemmaConfigured();
  const fallbackNotice = aiErrorMessage
    ? `Gemma request failed — Baseline fallback used: ${aiErrorMessage}`
    : isMissingKey
    ? 'GEMMA_API_KEY is not configured in server environment.'
    : 'Deterministic baseline compiler used.';

  return {
    issue_metadata: metadata,
    issue_summary: issueSummary,
    expected_outcome: `Resolution of issue #${metadata.number} satisfying identified acceptance criteria.`,
    readiness_gate: claimGateResult.readinessGate,
    criteria: claimGateResult.validatedCriteria,
    setup_truth: setupTruth,
    reproduction_environment: extractReproductionEnvironment(metadata.body),
    maintainer_handoff: maintainerHandoff,
    sources: claimGateResult.validatedSources,
    first_hour_route: [
      `Clone ${metadata.owner}/${metadata.repo} and checkout a new branch (e.g. fix/issue-${metadata.number}).`,
      `Run documented setup: ${setupTruth.install_command?.command || 'inspect package manifest'}`,
      `Execute test suite: ${setupTruth.test_command?.command || 'inspect test configuration'}`,
      `Verify candidate files: ${potentialSourceFiles.slice(0, 2).join(', ') || 'locate relevant module'}`,
      'Confirm requirements with maintainer before opening PR if criteria are marked clarify-first.',
    ],
    pr_checklist: [
      `Reference issue #${metadata.number} in PR description ("Fixes #${metadata.number}")`,
      'Include tests verifying all explicit acceptance criteria',
      'Ensure code adheres to CONTRIBUTING guidelines',
      'Validate that all existing tests pass before submission',
    ],
    scan_boundaries: scanBoundaries,
    ai_configured: gemmaConfigured,
    engine: 'baseline',
    analysis_status: 'baseline_fallback',
    engine_details: {
      model_id: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it',
      configured: gemmaConfigured,
      fallback_reason: fallbackNotice,
      guardrails_passed: true,
    },
    claim_gate_audit: {
      ...claimGateResult.audit,
      warnings: [
        ...(aiErrorMessage ? [`Gemma Analysis Notice: ${aiErrorMessage}`] : []),
        ...claimGateResult.audit.warnings,
      ],
    },
  };
}
