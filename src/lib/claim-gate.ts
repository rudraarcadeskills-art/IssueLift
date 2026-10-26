import {
  AcceptanceCriterion,
  CandidateFile,
  CandidateTestFile,
  ContributionContract,
  GitHubIssueMetadata,
  ReadinessGate,
  ReadinessVerdict,
  ScanBoundaries,
  SetupTruth,
  SourceEvidence,
  TestEvidenceStatus,
} from './types';

export interface ClaimGateValidationResult {
  validatedCriteria: AcceptanceCriterion[];
  validatedSources: SourceEvidence[];
  readinessGate: ReadinessGate;
  audit: {
    rejected_paths_count: number;
    rejected_source_ids_count: number;
    warnings: string[];
  };
}

export function runDeterministicClaimGate(
  rawCriteria: AcceptanceCriterion[],
  sources: SourceEvidence[],
  repositoryFiles: string[],
  metadata: GitHubIssueMetadata,
  scanBoundaries: ScanBoundaries,
  setupTruth: SetupTruth
): ClaimGateValidationResult {
  const fileSet = new Set(repositoryFiles);
  const sourceIdSet = new Set(sources.map((s) => s.source_id));

  let rejectedPathsCount = 0;
  let rejectedSourceIdsCount = 0;
  const warnings: string[] = [];

  // 1. Validate Sources
  const validatedSources: SourceEvidence[] = sources.map((source) => {
    if (source.source_id === 'repo-tree') {
      return {
        ...source,
        verified_exists: true,
        verification_status: 'VERIFIED',
      };
    }

    if (source.source_type === 'code' || source.source_type === 'test' || source.source_type === 'config' || source.source_type === 'manifest') {
      const exists = fileSet.has(source.path);
      if (!exists) {
        rejectedPathsCount++;
        warnings.push(`Claim Gate: Source path "${source.path}" not found in fetched repository tree. Demoted.`);
        return {
          ...source,
          verified_exists: false,
          verification_status: 'UNKNOWN',
          rejection_reason: 'Path not found in scanned repository tree.',
        };
      }
      return {
        ...source,
        verified_exists: true,
        verification_status: 'VERIFIED',
      };
    }
    return source;
  });

  // 2. Validate Criteria & TraceMap
  const validatedCriteria: AcceptanceCriterion[] = rawCriteria.map((criterion, idx) => {
    const id = criterion.id || `AC-${String(idx + 1).padStart(2, '0')}`;
    
    // Explicit vs Inferred: ensure exact quote actually exists in issue body or comments
    const allIssueText = `${metadata.body}\n${(metadata.comments || []).map((c) => c.body).join('\n')}`.toLowerCase();
    const quoteInBody = Boolean(
      criterion.exact_quote &&
      criterion.exact_quote.trim().length > 0 &&
      allIssueText.includes(criterion.exact_quote.trim().toLowerCase())
    );
    const isExplicit = criterion.criterion_type === 'EXPLICIT' && quoteInBody;
    const criterion_type = isExplicit ? 'EXPLICIT' : 'AI-PROPOSED';

    // Validate Candidate Implementation Files
    const validatedImplFiles: CandidateFile[] = (criterion.candidate_implementation_files || []).map((file) => {
      const existsInTree = fileSet.has(file.path);
      const validSourceId = sourceIdSet.has(file.source_id);

      if (!existsInTree) {
        rejectedPathsCount++;
        warnings.push(`Claim Gate: Candidate path "${file.path}" in ${id} does not exist in repository files.`);
      }

      if (!validSourceId) {
        rejectedSourceIdsCount++;
        warnings.push(`Claim Gate: Fabricated source_id "${file.source_id}" in ${id} rejected.`);
      }

      return {
        ...file,
        verified_exists: existsInTree,
        source_id: validSourceId ? file.source_id : 'unverified',
        relevance_status: existsInTree ? 'AI-INFERRED' : 'UNKNOWN',
      };
    });

    // Validate Test Evidence
    let testStatus: TestEvidenceStatus = criterion.test_evidence?.status || 'NO TEST EVIDENCE FOUND IN SCANNED FILES';
    const validatedTestFiles: CandidateTestFile[] = [];

    if (scanBoundaries.is_tree_truncated) {
      testStatus = 'SCAN INCOMPLETE / UNKNOWN';
    } else {
      for (const tFile of criterion.test_evidence?.candidate_test_files || []) {
        if (fileSet.has(tFile.path)) {
          validatedTestFiles.push({
            ...tFile,
            verified_exists: true,
            assertions_inspected: Boolean(tFile.assertions_inspected),
          });
        } else {
          rejectedPathsCount++;
          warnings.push(`Claim Gate: Candidate test path "${tFile.path}" in ${id} not found in tree.`);
        }
      }

      if (validatedTestFiles.length > 0) {
        const hasInspected = validatedTestFiles.some((f) => f.assertions_inspected);
        testStatus = hasInspected ? 'TEST EVIDENCE FOUND' : 'POSSIBLE TEST CANDIDATE';
      } else {
        testStatus = 'NO TEST EVIDENCE FOUND IN SCANNED FILES';
      }
    }

    const hasInspectedAssertions = validatedTestFiles.some((f) => f.assertions_inspected);
    // Never claim tests passed or executed without actual execution
    const rationale = testStatus === 'TEST EVIDENCE FOUND'
      ? `Located candidate test file(s) in repository tree (${validatedTestFiles.map((f) => f.path).join(', ')}). Test assertions inspected in bounded scan. Test execution has not occurred (security guardrail).`
      : testStatus === 'POSSIBLE TEST CANDIDATE'
      ? `Candidate test path(s) found in repository tree (${validatedTestFiles.map((f) => f.path).join(', ')}). Assertions not inspected; test execution has not occurred.`
      : testStatus === 'SCAN INCOMPLETE / UNKNOWN'
      ? 'Repository tree was truncated by GitHub API limit; test evidence scan is incomplete.'
      : 'No test evidence found in scanned files. Test coverage cannot be established from bounded context.';

    return {
      ...criterion,
      id,
      criterion_type,
      candidate_implementation_files: validatedImplFiles,
      test_evidence: {
        status: testStatus,
        candidate_test_files: validatedTestFiles,
        rationale,
        proposed_manual_validation:
          criterion.test_evidence?.proposed_manual_validation ||
          'Verify locally by reproducing issue steps before and after changes.',
        assertions_inspected: hasInspectedAssertions,
        test_executed: false,
      },
    };
  });

  // 3. Compute Deterministic Readiness Gate
  const reasons: string[] = [];
  let verdict: ReadinessVerdict = 'ACTIONABLE';

  if (metadata.state === 'closed') {
    verdict = 'CLARIFY FIRST';
    reasons.push('Issue is marked CLOSED on GitHub. Confirm with maintainer before investing time.');
  }

  if (metadata.assignees && metadata.assignees.length > 0) {
    verdict = 'CLARIFY FIRST';
    const names = metadata.assignees.map((a) => `@${a.login}`).join(', ');
    reasons.push(`Issue is currently assigned to ${names}. Verify with maintainer if contribution is open.`);
  }

  if (metadata.has_linked_pr_signal) {
    verdict = 'CLARIFY FIRST';
    reasons.push('Linked pull request or active PR reference detected. An implementation may already be in flight.');
  }

  const hasAmbiguousCriteria = validatedCriteria.some((c) => c.status === 'AMBIGUOUS' || c.needs_maintainer_clarification);
  if (hasAmbiguousCriteria) {
    if (verdict === 'ACTIONABLE') verdict = 'CLARIFY FIRST';
    reasons.push('One or more acceptance criteria are ambiguous or require maintainer confirmation.');
  }

  if (scanBoundaries.is_tree_truncated) {
    if (verdict === 'ACTIONABLE') verdict = 'EVIDENCE-LIMITED';
    reasons.push('Repository file tree scan was truncated by GitHub API size limits. Context is bounded.');
  }

  if (validatedCriteria.length === 0) {
    if (verdict === 'ACTIONABLE') verdict = 'EVIDENCE-LIMITED';
    reasons.push('No acceptance criteria could be derived from the issue description.');
  }

  if (reasons.length === 0) {
    reasons.push('Issue is open, unassigned, has verified candidate files, and clear acceptance criteria.');
  }

  return {
    validatedCriteria,
    validatedSources,
    readinessGate: {
      verdict,
      reasons,
    },
    audit: {
      rejected_paths_count: rejectedPathsCount,
      rejected_source_ids_count: rejectedSourceIdsCount,
      warnings,
    },
  };
}
