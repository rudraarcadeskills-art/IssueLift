import { describe, it, expect } from 'vitest';
import {
  detectPackageManagerFromTree,
  extractDocumentedCommands,
  rankRepositoryPaths,
  isLikelyTestFile,
} from '../src/lib/github';
import { runDeterministicClaimGate } from '../src/lib/claim-gate';
import { compileDeterministicBaselineContract } from '../src/lib/contract-compiler';
import {
  AcceptanceCriterion,
  GitHubIssueMetadata,
  ScanBoundaries,
  SetupTruth,
  SourceEvidence,
} from '../src/lib/types';

describe('FIX 1 & FIX 2: Setup Truth, Manifest Scripts, and Path Ranking', () => {
  const baseMetadata: GitHubIssueMetadata = {
    url: 'https://github.com/vercel/next.js/issues/100596',
    owner: 'vercel',
    repo: 'next.js',
    number: 100596,
    title: 'notFound() thrown from a dynamic segment renders an empty <body> (__next_error__)',
    body: 'When notFound() is called in a dynamic segment, the response renders an empty body with id __next_error__.',
    state: 'open',
    created_at: '2026-10-26T12:00:00Z',
    updated_at: '2026-10-26T12:00:00Z',
    author: { login: 'molovo', avatar_url: '', html_url: '' },
    assignees: [],
    labels: [{ name: 'bug', color: 'd73a4a' }, { name: 'app-router', color: '1d76db' }],
    comments_count: 0,
    has_linked_pr_signal: false,
    default_branch: 'canary',
    checked_at: '2026-10-26T12:00:00Z',
  };

  const scanBoundaries: ScanBoundaries = {
    total_files_in_tree: 5000,
    scanned_files_count: 10,
    is_tree_truncated: false,
    checked_at: '2026-10-26T12:00:00Z',
  };

  it('detects pnpm package manager and extracts install/test/dev commands from pnpm-lock.yaml and package.json', () => {
    const files = ['pnpm-lock.yaml', 'package.json', 'README.md'];
    const packageJsonContent = JSON.stringify({
      name: 'next-root',
      scripts: {
        dev: 'next dev',
        test: 'turbo run test',
        build: 'next build',
      },
    });

    const pm = detectPackageManagerFromTree(files, packageJsonContent);
    expect(pm).toBe('pnpm');

    const setupTruth = extractDocumentedCommands(
      '# Next.js\nDocumentation is online.',
      files,
      'vercel',
      'next.js',
      'canary',
      packageJsonContent
    );

    expect(setupTruth.install_command).toBeDefined();
    expect(setupTruth.install_command?.command).toBe('pnpm install');
    expect(setupTruth.install_command?.provenance).toContain('pnpm-lock.yaml');
    expect(setupTruth.install_command?.label).toBe('DOCUMENTED');

    expect(setupTruth.test_command).toBeDefined();
    expect(setupTruth.test_command?.command).toBe('pnpm test');
    expect(setupTruth.test_command?.provenance).toBe('package.json scripts.test');

    expect(setupTruth.run_command).toBeDefined();
    expect(setupTruth.run_command?.command).toBe('pnpm dev');
    expect(setupTruth.run_command?.provenance).toBe('package.json scripts.dev');
  });

  it('detects yarn package manager when yarn.lock is present', () => {
    const files = ['yarn.lock', 'package.json'];
    const packageJsonContent = JSON.stringify({
      scripts: { test: 'jest', dev: 'webpack-dev-server' },
    });

    const pm = detectPackageManagerFromTree(files, packageJsonContent);
    expect(pm).toBe('yarn');

    const setupTruth = extractDocumentedCommands(
      '',
      files,
      'owner',
      'repo',
      'main',
      packageJsonContent
    );

    expect(setupTruth.install_command?.command).toBe('yarn install');
    expect(setupTruth.test_command?.command).toBe('yarn test');
    expect(setupTruth.run_command?.command).toBe('yarn dev');
  });

  it('detects bun package manager when bun.lock is present', () => {
    const files = ['bun.lock', 'package.json'];
    const packageJsonContent = JSON.stringify({
      scripts: { test: 'bun test' },
    });

    const pm = detectPackageManagerFromTree(files, packageJsonContent);
    expect(pm).toBe('bun');

    const setupTruth = extractDocumentedCommands(
      '',
      files,
      'owner',
      'repo',
      'main',
      packageJsonContent
    );

    expect(setupTruth.install_command?.command).toBe('bun install');
    expect(setupTruth.test_command?.command).toBe('bun test');
  });

  it('detects packageManager field from package.json when present', () => {
    const files = ['package.json'];
    const packageJsonContent = JSON.stringify({
      packageManager: 'pnpm@9.1.0',
      scripts: { test: 'vitest run' },
    });

    const pm = detectPackageManagerFromTree(files, packageJsonContent);
    expect(pm).toBe('pnpm');

    const setupTruth = extractDocumentedCommands('', files, 'o', 'r', 'main', packageJsonContent);
    expect(setupTruth.install_command?.command).toBe('pnpm install');
    expect(setupTruth.test_command?.command).toBe('pnpm test');
  });

  it('extracts commands for Cargo and Go repositories', () => {
    const cargoFiles = ['Cargo.toml', 'Cargo.lock'];
    const cargoSetup = extractDocumentedCommands('', cargoFiles, 'o', 'r', 'main');
    expect(cargoSetup.install_command?.command).toBe('cargo build');
    expect(cargoSetup.test_command?.command).toBe('cargo test');
    expect(cargoSetup.run_command?.command).toBe('cargo run');

    const goFiles = ['go.mod'];
    const goSetup = extractDocumentedCommands('', goFiles, 'o', 'r', 'main');
    expect(goSetup.install_command?.command).toBe('go mod download');
    expect(goSetup.test_command?.command).toBe('go test ./...');
  });

  it('ranks relevant source and test paths from a large tree without truncation bias', () => {
    // Generate 5,000 files where first 500 are dotfiles / unrelated configs
    const largeTree: string[] = [];
    for (let i = 0; i < 500; i++) {
      largeTree.push(`.github/workflows/job-${i}.yml`);
    }
    for (let i = 0; i < 4000; i++) {
      largeTree.push(`packages/other-pkg/src/utils/file-${i}.ts`);
    }

    // Insert target Next.js files deep in the list (index > 4500)
    const targetSource = 'packages/next/src/client/components/not-found.tsx';
    const targetTest = 'test/e2e/app-dir/not-found/index.test.ts';
    const targetServerSource = 'packages/next/src/server/app-render/next-error.ts';

    largeTree.push(targetSource);
    largeTree.push(targetTest);
    largeTree.push(targetServerSource);

    const ranked = rankRepositoryPaths(
      largeTree,
      baseMetadata.title,
      baseMetadata.body,
      ['bug', 'app-router']
    );

    // Assert that the relevant source and test candidate files rank at the very top
    expect(ranked.sourceCandidates).toContain(targetSource);
    expect(ranked.sourceCandidates.slice(0, 3)).toContain(targetSource);
    expect(ranked.testCandidates).toContain(targetTest);
    expect(ranked.testCandidates.slice(0, 3)).toContain(targetTest);
  });

  it('correctly handles repositories with zero test evidence and never invents test passes', () => {
    const noTestFiles = ['src/index.ts', 'src/server.ts', 'package.json'];
    const setupTruth: SetupTruth = {
      install_command: { command: 'npm install', label: 'DOCUMENTED' },
      test_command: undefined,
      has_readme: true,
      has_contributing: false,
      inspected_files: ['package.json', 'README.md'],
      notes: 'No test command substantiated in inspected files.',
    };

    const contract = compileDeterministicBaselineContract(
      baseMetadata,
      [],
      noTestFiles,
      setupTruth,
      scanBoundaries
    );

    contract.criteria.forEach((c) => {
      expect(c.test_evidence.status).toBe('NO TEST EVIDENCE FOUND IN SCANNED FILES');
      expect(c.test_evidence.candidate_test_files).toHaveLength(0);
      expect(c.test_evidence.rationale).not.toContain('pass');
      expect(c.test_evidence.rationale).not.toContain('0%');
    });
  });

  it('rejects proposed candidate source or test path absent from repository tree', () => {
    const validTree = ['packages/next/src/client/not-found.tsx', 'package.json'];
    const rawCriteria: AcceptanceCriterion[] = [
      {
        id: 'AC-01',
        description: 'Verify notFound behavior',
        criterion_type: 'EXPLICIT',
        exact_quote: 'When notFound() is called',
        status: 'ACTIONABLE',
        status_rationale: 'Quoted requirement',
        needs_maintainer_clarification: false,
        candidate_implementation_files: [
          {
            path: 'packages/hallucinated/not-found.tsx', // DOES NOT EXIST
            relevance_rationale: 'Invented file',
            source_id: 'src-1',
            verified_exists: false,
            relevance_status: 'AI-INFERRED',
          },
        ],
        test_evidence: {
          status: 'TEST EVIDENCE FOUND',
          candidate_test_files: [
            {
              path: 'test/nonexistent/fake.test.ts', // DOES NOT EXIST
              source_id: 'src-1',
              verified_exists: false,
            },
          ],
          rationale: 'Invented test file',
        },
      },
    ];

    const sources: SourceEvidence[] = [
      {
        source_id: 'src-1',
        canonical_url: 'https://github.com/vercel/next.js/blob/canary/packages/next/src/client/not-found.tsx',
        path: 'packages/next/src/client/not-found.tsx',
        source_type: 'code',
        excerpt: 'export function notFound() {}',
        verified_exists: true,
        verification_status: 'VERIFIED',
      },
    ];

    const setupTruth: SetupTruth = {
      install_command: { command: 'pnpm install', label: 'DOCUMENTED' },
      test_command: { command: 'pnpm test', label: 'DOCUMENTED' },
      has_readme: true,
      has_contributing: false,
      notes: 'pnpm setup',
    };

    const claimGateResult = runDeterministicClaimGate(
      rawCriteria,
      sources,
      validTree,
      baseMetadata,
      scanBoundaries,
      setupTruth
    );

    // Verify rejection audit
    expect(claimGateResult.audit.rejected_paths_count).toBe(2);
    expect(claimGateResult.validatedCriteria[0].candidate_implementation_files[0].verified_exists).toBe(false);
    expect(claimGateResult.validatedCriteria[0].candidate_implementation_files[0].relevance_status).toBe('UNKNOWN');
    expect(claimGateResult.validatedCriteria[0].test_evidence.candidate_test_files).toHaveLength(0);
    expect(claimGateResult.validatedCriteria[0].test_evidence.status).toBe('NO TEST EVIDENCE FOUND IN SCANNED FILES');
  });

  it('distinguishes verified file existence from verified test evidence', () => {
    const files = ['packages/next/src/components/button.tsx', 'package.json'];
    const sources: SourceEvidence[] = [
      {
        source_id: 'src-btn',
        canonical_url: 'https://github.com/vercel/next.js/blob/canary/packages/next/src/components/button.tsx',
        path: 'packages/next/src/components/button.tsx',
        source_type: 'code',
        excerpt: 'Button component',
        verified_exists: true,
        verification_status: 'VERIFIED',
      },
    ];

    expect(isLikelyTestFile('packages/next/src/components/button.tsx')).toBe(false);

    const rawCriteria: AcceptanceCriterion[] = [
      {
        id: 'AC-01',
        description: 'Button component',
        criterion_type: 'EXPLICIT',
        exact_quote: 'Button should be primary',
        status: 'ACTIONABLE',
        status_rationale: 'Explicit',
        needs_maintainer_clarification: false,
        candidate_implementation_files: [
          {
            path: 'packages/next/src/components/button.tsx',
            relevance_rationale: 'Implementation',
            source_id: 'src-btn',
            verified_exists: false,
            relevance_status: 'AI-INFERRED',
          },
        ],
        test_evidence: {
          status: 'NO TEST EVIDENCE FOUND IN SCANNED FILES',
          candidate_test_files: [],
          rationale: 'No test files mapped',
        },
      },
    ];

    const result = runDeterministicClaimGate(
      rawCriteria,
      sources,
      files,
      baseMetadata,
      scanBoundaries,
      {
        has_readme: false,
        has_contributing: false,
        notes: 'none',
      }
    );

    // Source file is verified to exist in tree
    expect(result.validatedCriteria[0].candidate_implementation_files[0].verified_exists).toBe(true);
    // But test evidence remains strictly NO TEST EVIDENCE FOUND
    expect(result.validatedCriteria[0].test_evidence.status).toBe('NO TEST EVIDENCE FOUND IN SCANNED FILES');
    expect(result.validatedCriteria[0].test_evidence.candidate_test_files).toHaveLength(0);
  });

  it('produces clear fallback statuses and lists inspected files when manifest contents cannot be fetched', () => {
    const files = ['README.md', 'CONTRIBUTING.md'];
    const setupTruth = extractDocumentedCommands(
      '# Contributing Guide\nNo code snippets here.',
      files,
      'owner',
      'repo',
      'main',
      undefined // Manifest fetch failed / 404
    );

    expect(setupTruth.install_command).toBeUndefined();
    expect(setupTruth.test_command).toBeUndefined();
    expect(setupTruth.run_command).toBeUndefined();
    expect(setupTruth.inspected_files).toContain('README.md');
    expect(setupTruth.notes).toContain('No test execution command substantiated in inspected files');
  });
});
