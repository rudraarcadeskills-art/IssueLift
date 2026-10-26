import {
  GitHubIssueMetadata,
  SourceEvidence,
  SetupTruth,
  ScanBoundaries,
} from './types';

// In-memory cache for issue and repo tree data (10-minute TTL)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export interface ParsedIssueUrl {
  owner: string;
  repo: string;
  issueNumber: number;
  canonicalUrl: string;
}

export function parseIssueUrl(url: string): { success: true; data: ParsedIssueUrl } | { success: false; error: string } {
  if (!url || typeof url !== 'string') {
    return { success: false, error: 'Issue URL must be a non-empty string.' };
  }

  const trimmed = url.trim();

  // Explicit check for pull request URLs
  if (trimmed.includes('/pull/')) {
    return {
      success: false,
      error: 'The provided URL is a Pull Request, not an Issue. IssueLift focuses on pre-implementation issues before PRs are created.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { success: false, error: 'Invalid URL format. Please provide a full URL like https://github.com/owner/repo/issues/123' };
  }

  if (parsed.hostname.toLowerCase() !== 'github.com' && parsed.hostname.toLowerCase() !== 'www.github.com') {
    return {
      success: false,
      error: `Unsupported host "${parsed.hostname}". Only public GitHub repositories (github.com) are supported.`,
    };
  }

  // Path format: /{owner}/{repo}/issues/{number}
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 4 || segments[2] !== 'issues') {
    return {
      success: false,
      error: 'Malformed issue path. Expected format: https://github.com/:owner/:repo/issues/:number',
    };
  }

  const owner = segments[0];
  const repo = segments[1];
  const numStr = segments[3];
  const issueNumber = parseInt(numStr, 10);

  if (isNaN(issueNumber) || issueNumber <= 0 || !Number.isInteger(issueNumber)) {
    return {
      success: false,
      error: `Invalid issue number "${numStr}". Issue number must be a positive integer.`,
    };
  }

  return {
    success: true,
    data: {
      owner,
      repo,
      issueNumber,
      canonicalUrl: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
    },
  };
}

function getGitHubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'IssueLift-Hacktoberfest/1.3',
  };
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 0) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN.trim()}`;
  }
  return headers;
}

export interface FetchIssueResult {
  metadata: GitHubIssueMetadata;
  sources: SourceEvidence[];
  repositoryFiles: string[];
  setupTruth: SetupTruth;
  scanBoundaries: ScanBoundaries;
}

export async function fetchLiveIssueAndRepo(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<FetchIssueResult> {
  const cacheKey = `issue:${owner}/${repo}/${issueNumber}`;
  const cached = getCached<FetchIssueResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const headers = getGitHubHeaders();

  // 1. Fetch Repository Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
    }
    if (repoRes.status === 403 || repoRes.status === 429) {
      const resetHeader = repoRes.headers.get('x-ratelimit-reset');
      const resetTime = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString() : 'shortly';
      throw new Error(`GitHub API rate limit exceeded. Rate limit resets at ${resetTime}. Configure GITHUB_TOKEN in .env.local to increase limit.`);
    }
    throw new Error(`Failed to fetch repository metadata (HTTP ${repoRes.status}): ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || 'main';

  // 2. Fetch Issue Details
  const issueRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    { headers, next: { revalidate: 60 } }
  );

  if (!issueRes.ok) {
    if (issueRes.status === 404) {
      throw new Error(`Issue #${issueNumber} not found in repository "${owner}/${repo}".`);
    }
    throw new Error(`Failed to fetch issue #${issueNumber} (HTTP ${issueRes.status}): ${issueRes.statusText}`);
  }

  const issueData = await issueRes.json();

  // Explicitly verify this is not a PR returned by the issues endpoint
  if (issueData.pull_request) {
    throw new Error(`Item #${issueNumber} is a pull request, not an issue. IssueLift operates on issues before PR creation.`);
  }

  // 3. Fetch Comments (first 10 for context)
  let comments: Array<{ author: string; body: string; created_at: string; html_url: string }> = [];
  if (issueData.comments > 0) {
    try {
      const commentsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=10`,
        { headers }
      );
      if (commentsRes.ok) {
        const rawComments = await commentsRes.json();
        comments = rawComments.map((c: any) => ({
          author: c.user?.login || 'unknown',
          body: c.body || '',
          created_at: c.created_at,
          html_url: c.html_url,
        }));
      }
    } catch {
      // Non-fatal, continue with issue body
    }
  }

  const checkedAt = new Date().toISOString();

  const metadata: GitHubIssueMetadata = {
    url: issueData.html_url,
    owner,
    repo,
    number: issueNumber,
    title: issueData.title || '',
    body: issueData.body || '',
    state: issueData.state === 'closed' ? 'closed' : 'open',
    created_at: issueData.created_at,
    updated_at: issueData.updated_at,
    closed_at: issueData.closed_at,
    author: {
      login: issueData.user?.login || 'unknown',
      avatar_url: issueData.user?.avatar_url || '',
      html_url: issueData.user?.html_url || '',
    },
    assignees: (issueData.assignees || []).map((a: any) => ({
      login: a.login,
      avatar_url: a.avatar_url,
      html_url: a.html_url,
    })),
    labels: (issueData.labels || []).map((l: any) => ({
      name: l.name,
      color: l.color,
      description: l.description,
    })),
    comments_count: issueData.comments || 0,
    comments,
    has_linked_pr_signal: Boolean(
      issueData.timeline_url ||
      (issueData.body && /pull request|fixes #|closes #|pr #/i.test(issueData.body))
    ),
    default_branch: defaultBranch,
    checked_at: checkedAt,
  };

  // 4. Fetch Repository Tree (Bounded)
  let repositoryFiles: string[] = [];
  let isTreeTruncated = false;

  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      isTreeTruncated = Boolean(treeData.truncated);
      if (Array.isArray(treeData.tree)) {
        repositoryFiles = treeData.tree
          .filter((item: any) => item.type === 'blob')
          .map((item: any) => item.path);
      }
    }
  } catch {
    // If recursive tree fails, we remain evidence-limited
  }

  // 5. Build Bounded Evidence Pack
  const sources: SourceEvidence[] = [];

  // Issue body source
  sources.push({
    source_id: 'issue-body',
    canonical_url: metadata.url,
    path: `issue#${issueNumber}`,
    source_type: 'issue_body',
    excerpt: metadata.body.slice(0, 300),
    verified_exists: true,
    verification_status: 'VERIFIED',
  });

  // Issue comments sources
  comments.forEach((c, idx) => {
    sources.push({
      source_id: `comment-${idx + 1}`,
      canonical_url: c.html_url,
      path: `comment#${idx + 1}`,
      source_type: 'issue_comment',
      excerpt: c.body.slice(0, 250),
      verified_exists: true,
      verification_status: 'VERIFIED',
    });
  });

  // 5. Fetch Manifests (package.json, lockfiles, etc.) and Documentation
  let readmeContent = '';
  let contributingContent = '';
  let packageJsonContent: string | undefined;
  let hasReadme = false;
  let hasContributing = false;
  const inspectedFiles: string[] = [];

  // Identify package manifest & lockfiles
  const packageJsonFile = repositoryFiles.find((p) => p.toLowerCase() === 'package.json');
  if (packageJsonFile) {
    inspectedFiles.push('package.json');
    try {
      const contentRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${packageJsonFile}`,
        { headers }
      );
      if (contentRes.ok) {
        packageJsonContent = await contentRes.text();
        sources.push({
          source_id: 'manifest-package',
          canonical_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${packageJsonFile}`,
          path: packageJsonFile,
          source_type: 'manifest',
          excerpt: packageJsonContent.slice(0, 300),
          verified_exists: true,
          verification_status: 'VERIFIED',
        });
      }
    } catch {
      // Ignored
    }
  }

  // Detect lockfiles in tree
  const lockfiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lockb', 'bun.lock', 'Cargo.lock', 'poetry.lock'];
  for (const lf of lockfiles) {
    if (repositoryFiles.includes(lf)) {
      inspectedFiles.push(lf);
    }
  }

  // Fetch README and CONTRIBUTING
  const readmeFile = repositoryFiles.find((p) => /^readme(\.md|\.markdown|\.txt)?$/i.test(p));
  if (readmeFile) {
    hasReadme = true;
    inspectedFiles.push(readmeFile);
    try {
      const contentRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${readmeFile}`,
        { headers }
      );
      if (contentRes.ok) {
        readmeContent = await contentRes.text();
        sources.push({
          source_id: 'doc-readme',
          canonical_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${readmeFile}`,
          path: readmeFile,
          source_type: 'readme',
          excerpt: readmeContent.slice(0, 300),
          verified_exists: true,
          verification_status: 'VERIFIED',
        });
      }
    } catch {
      // Ignored
    }
  }

  const contributingFile = repositoryFiles.find((p) => /^(\.github\/)?contributing(\.md|\.markdown|\.txt)?$/i.test(p));
  if (contributingFile) {
    hasContributing = true;
    inspectedFiles.push(contributingFile);
    try {
      const contentRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${contributingFile}`,
        { headers }
      );
      if (contentRes.ok) {
        contributingContent = await contentRes.text();
        sources.push({
          source_id: 'doc-contributing',
          canonical_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${contributingFile}`,
          path: contributingFile,
          source_type: 'contributing',
          excerpt: contributingContent.slice(0, 300),
          verified_exists: true,
          verification_status: 'VERIFIED',
        });
      }
    } catch {
      // Ignored
    }
  }

  // Add repository tree root as a verified evidence source
  sources.push({
    source_id: 'repo-tree',
    canonical_url: `https://github.com/${owner}/${repo}/tree/${defaultBranch}`,
    path: 'repository-tree',
    source_type: 'code',
    excerpt: `Repository tree index (${repositoryFiles.length} files scanned)`,
    verified_exists: true,
    verification_status: 'VERIFIED',
  });

  // Extract Documented Setup/Test Commands from Manifests & Docs
  const combinedDocs = `${readmeContent}\n${contributingContent}`;
  const setupTruth = extractDocumentedCommands(
    combinedDocs,
    repositoryFiles,
    owner,
    repo,
    defaultBranch,
    packageJsonContent
  );
  setupTruth.has_readme = hasReadme;
  setupTruth.has_contributing = hasContributing;

  // Add top ranked relevant candidate files to evidence pack
  const ranked = rankRepositoryPaths(
    repositoryFiles,
    metadata.title,
    metadata.body,
    metadata.labels.map((l) => l.name)
  );

  const topSourceFiles = ranked.sourceCandidates.slice(0, 5);
  const topTestFiles = ranked.testCandidates.slice(0, 5);

  topSourceFiles.forEach((filePath, i) => {
    sources.push({
      source_id: `file-${i + 1}`,
      canonical_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${filePath}`,
      path: filePath,
      source_type: 'code',
      excerpt: `Candidate implementation file identified in repository tree (${filePath})`,
      verified_exists: true,
      verification_status: 'VERIFIED',
    });
  });

  topTestFiles.forEach((testPath, i) => {
    sources.push({
      source_id: `test-file-${i + 1}`,
      canonical_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${testPath}`,
      path: testPath,
      source_type: 'test',
      excerpt: `Candidate test file identified in repository tree (${testPath})`,
      verified_exists: true,
      verification_status: 'VERIFIED',
    });
  });

  const scanBoundaries: ScanBoundaries = {
    total_files_in_tree: repositoryFiles.length,
    scanned_files_count: sources.length,
    is_tree_truncated: isTreeTruncated,
    checked_at: checkedAt,
  };

  const result: FetchIssueResult = {
    metadata,
    sources,
    repositoryFiles,
    setupTruth,
    scanBoundaries,
  };

  setCached(cacheKey, result);
  return result;
}

export function isLikelyTestFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    /(?:^|\/)(?:tests?|__tests__|e2e|specs?)\//i.test(lower) ||
    /\.(?:test|spec|_test)\.[a-z0-9]+$/i.test(lower) ||
    /[._-]test\.[a-z0-9]+$/i.test(lower) ||
    /[._-]spec\.[a-z0-9]+$/i.test(lower)
  );
}

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun' | 'cargo' | 'go' | 'pip' | 'poetry' | 'unknown';

export function detectPackageManagerFromTree(
  files: string[],
  packageJsonContent?: string
): PackageManager {
  const fileSet = new Set(files);

  if (packageJsonContent) {
    try {
      const parsed = JSON.parse(packageJsonContent);
      if (typeof parsed.packageManager === 'string') {
        const pm = parsed.packageManager.toLowerCase();
        if (pm.startsWith('pnpm')) return 'pnpm';
        if (pm.startsWith('yarn')) return 'yarn';
        if (pm.startsWith('bun')) return 'bun';
        if (pm.startsWith('npm')) return 'npm';
      }
    } catch {}
  }

  if (fileSet.has('pnpm-lock.yaml') || fileSet.has('pnpm-workspace.yaml')) return 'pnpm';
  if (fileSet.has('yarn.lock')) return 'yarn';
  if (fileSet.has('bun.lockb') || fileSet.has('bun.lock')) return 'bun';
  if (fileSet.has('package-lock.json')) return 'npm';

  if (fileSet.has('Cargo.lock') || fileSet.has('Cargo.toml')) return 'cargo';
  if (fileSet.has('go.mod')) return 'go';
  if (fileSet.has('poetry.lock')) return 'poetry';
  if (fileSet.has('pyproject.toml') || fileSet.has('requirements.txt')) return 'pip';

  if (fileSet.has('package.json')) return 'npm';

  return 'unknown';
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'has', 'had',
  'renders', 'render', 'rendering', 'empty', 'issue', 'when', 'does', 'will',
  'should', 'error', 'failed', 'what', 'about', 'there', 'only', 'into', 'also',
  'some', 'more', 'page', 'body', 'test', 'tests', 'code', 'file', 'files',
  'using', 'after', 'before', 'where', 'which', 'their', 'could', 'would', 'here'
]);

export interface RankedPathsResult {
  sourceCandidates: string[];
  testCandidates: string[];
  manifestFiles: string[];
  allRanked: string[];
}

export function rankRepositoryPaths(
  files: string[],
  issueTitle: string,
  issueBody: string = '',
  labels: string[] = [],
  criteriaDescriptions: string[] = []
): RankedPathsResult {
  const combinedText = `${issueTitle}\n${issueBody}\n${labels.join(' ')}\n${criteriaDescriptions.join('\n')}`;

  // Extract explicit technical identifiers: backticks, path segments, and camelCase/kebab-case terms
  const highValueTokens = new Set<string>();
  const generalTokens = new Set<string>();

  // 1. Backticked tokens e.g. `notFound()` or `__next_error__`
  const backtickMatches = combinedText.match(/`([^`]+)`/g) || [];
  for (const m of backtickMatches) {
    const raw = m.slice(1, -1).trim();
    const clean = raw.replace(/[()]/g, '').toLowerCase();
    if (clean.length >= 3 && !STOP_WORDS.has(clean)) {
      highValueTokens.add(clean);
      const splitTerms = clean.split(/[^a-z0-9_-]+/).filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
      splitTerms.forEach((t) => highValueTokens.add(t));
    }
  }

  // 2. Path-like strings e.g. packages/next/src/...
  const pathMatches = combinedText.match(/(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_.-]+/g) || [];
  for (const p of pathMatches) {
    const base = p.split('/').pop()?.toLowerCase();
    if (base && base.length >= 3) {
      highValueTokens.add(base);
    }
  }

  // 3. General tokens
  const words = combinedText
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  for (const w of words) {
    generalTokens.add(w);
    // Split kebab/snake
    if (w.includes('-') || w.includes('_')) {
      w.split(/[-_]+/).filter((sub) => sub.length >= 3 && !STOP_WORDS.has(sub)).forEach((sub) => generalTokens.add(sub));
    }
  }

  const scoredSources: Array<{ path: string; score: number }> = [];
  const scoredTests: Array<{ path: string; score: number }> = [];
  const manifestFiles: string[] = [];

  const manifestNames = new Set([
    'package.json', 'pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lockb', 'bun.lock',
    'cargo.toml', 'cargo.lock', 'go.mod', 'pyproject.toml', 'requirements.txt', 'tsconfig.json'
  ]);

  for (const file of files) {
    const lower = file.toLowerCase();

    // Skip vendor/build/cache directories
    if (
      lower.includes('node_modules/') ||
      lower.includes('vendor/') ||
      lower.includes('.git/') ||
      lower.includes('.next/') ||
      lower.includes('dist/') ||
      lower.includes('build/') ||
      lower.includes('.turbo/') ||
      lower.includes('coverage/') ||
      lower.includes('.cache/')
    ) {
      continue;
    }

    const basename = lower.split('/').pop() || lower;

    // Detect manifests
    if (manifestNames.has(basename)) {
      manifestFiles.push(file);
    }

    let score = 0;
    const isTest = isLikelyTestFile(file);

    // Score high-value tokens
    for (const token of highValueTokens) {
      if (basename.includes(token)) {
        score += 25;
      } else if (lower.includes(token)) {
        score += 10;
      }
    }

    // Score general tokens
    for (const token of generalTokens) {
      if (basename.includes(token)) {
        score += 8;
      } else if (lower.includes(token)) {
        score += 3;
      }
    }

    // Structural bonuses
    if (isTest) {
      if (score > 0) score += 10;
      scoredTests.push({ path: file, score });
    } else {
      // Bonus for files in standard implementation paths
      if (lower.startsWith('packages/') || lower.startsWith('src/') || lower.startsWith('lib/') || lower.startsWith('app/')) {
        score += 4;
      }
      // Prioritize primary code extensions
      if (/\.(?:ts|tsx|js|jsx|mjs|cjs|rs|go|py|java|c|cpp)$/i.test(lower)) {
        score += 2;
      }
      scoredSources.push({ path: file, score });
    }
  }

  scoredSources.sort((a, b) => b.score - a.score);
  scoredTests.sort((a, b) => b.score - a.score);

  // Filter to positive scores or fallback to top candidates
  const sourceCandidates = scoredSources.filter((s) => s.score > 0).map((s) => s.path);
  const testCandidates = scoredTests.filter((t) => t.score > 0).map((t) => t.path);

  // Fallbacks if no score match
  const fallbackSources = sourceCandidates.length > 0
    ? sourceCandidates
    : scoredSources.slice(0, 15).map((s) => s.path);

  const fallbackTests = testCandidates.length > 0
    ? testCandidates
    : scoredTests.slice(0, 10).map((t) => t.path);

  const allRanked = Array.from(new Set([...fallbackSources, ...fallbackTests]));

  return {
    sourceCandidates: fallbackSources,
    testCandidates: fallbackTests,
    manifestFiles,
    allRanked,
  };
}

export function selectBoundedRelevantFiles(
  files: string[],
  issueTitle: string,
  labels: string[] = [],
  issueBody: string = ''
): string[] {
  const ranked = rankRepositoryPaths(files, issueTitle, issueBody, labels);
  const combined = [
    ...ranked.manifestFiles.slice(0, 2),
    ...ranked.sourceCandidates.slice(0, 8),
    ...ranked.testCandidates.slice(0, 5),
  ];
  return Array.from(new Set(combined)).slice(0, 15);
}

export function extractDocumentedCommands(
  docs: string,
  files: string[],
  owner: string,
  repo: string,
  branch: string,
  packageJsonContent?: string
): SetupTruth {
  const inspectedFiles: string[] = [];
  const packageManager = detectPackageManagerFromTree(files, packageJsonContent);

  let installCommand: { command: string; label: 'DOCUMENTED'; source_id: string; source_url: string; provenance: string; path: string } | undefined;
  let testCommand: { command: string; label: 'DOCUMENTED'; source_id: string; source_url: string; provenance: string; path: string } | undefined;
  let runCommand: { command: string; label: 'DOCUMENTED'; source_id: string; source_url: string; provenance: string; path: string } | undefined;

  const pkgSourceUrl = `https://github.com/${owner}/${repo}/blob/${branch}/package.json`;
  const readmeSourceUrl = `https://github.com/${owner}/${repo}/blob/${branch}/README.md`;

  // 1. Deterministic Extraction from package.json
  if (packageJsonContent) {
    inspectedFiles.push('package.json');
    try {
      const pkg = JSON.parse(packageJsonContent);
      const scripts = pkg.scripts || {};

      // Install command derived from package manager & manifest/lockfile
      const pm = packageManager === 'unknown' ? 'npm' : packageManager;
      let installCmd = `${pm} install`;
      let lockfile = 'package.json';
      if (pm === 'pnpm' && files.includes('pnpm-lock.yaml')) lockfile = 'pnpm-lock.yaml';
      else if (pm === 'yarn' && files.includes('yarn.lock')) lockfile = 'yarn.lock';
      else if (pm === 'bun' && (files.includes('bun.lockb') || files.includes('bun.lock'))) lockfile = 'bun.lockb';
      else if (pm === 'npm' && files.includes('package-lock.json')) lockfile = 'package-lock.json';

      installCommand = {
        command: installCmd,
        label: 'DOCUMENTED',
        source_id: 'manifest-package',
        source_url: `https://github.com/${owner}/${repo}/blob/${branch}/${lockfile}`,
        provenance: `${lockfile} + package.json`,
        path: lockfile,
      };

      // Test command from scripts
      const testScriptKey = ['test', 'test:unit', 'test:all', 'test:ci', 'test:dev', 'test:core'].find(
        (k) => typeof scripts[k] === 'string'
      );
      if (testScriptKey) {
        testCommand = {
          command: pm === 'npm' ? `npm test` : `${pm} test`,
          label: 'DOCUMENTED',
          source_id: 'manifest-package',
          source_url: pkgSourceUrl,
          provenance: `package.json scripts.${testScriptKey}`,
          path: 'package.json',
        };
      }

      // Run / dev command from scripts
      const runScriptKey = ['dev', 'start', 'develop', 'serve'].find(
        (k) => typeof scripts[k] === 'string'
      );
      if (runScriptKey) {
        runCommand = {
          command: pm === 'npm' ? `npm run ${runScriptKey}` : `${pm} ${runScriptKey}`,
          label: 'DOCUMENTED',
          source_id: 'manifest-package',
          source_url: pkgSourceUrl,
          provenance: `package.json scripts.${runScriptKey}`,
          path: 'package.json',
        };
      }
    } catch {}
  }

  // 2. Language-Specific Manifests (Cargo, Go, Python) if package.json didn't provide
  if (!installCommand) {
    if (packageManager === 'cargo') {
      inspectedFiles.push('Cargo.toml');
      installCommand = {
        command: 'cargo build',
        label: 'DOCUMENTED',
        source_id: 'manifest-package',
        source_url: `https://github.com/${owner}/${repo}/blob/${branch}/Cargo.toml`,
        provenance: 'Cargo.toml manifest',
        path: 'Cargo.toml',
      };
      testCommand = {
        command: 'cargo test',
        label: 'DOCUMENTED',
        source_id: 'manifest-package',
        source_url: `https://github.com/${owner}/${repo}/blob/${branch}/Cargo.toml`,
        provenance: 'Cargo.toml test suite',
        path: 'Cargo.toml',
      };
      runCommand = {
        command: 'cargo run',
        label: 'DOCUMENTED',
        source_id: 'manifest-package',
        source_url: `https://github.com/${owner}/${repo}/blob/${branch}/Cargo.toml`,
        provenance: 'Cargo.toml run binary',
        path: 'Cargo.toml',
      };
    } else if (packageManager === 'go') {
      inspectedFiles.push('go.mod');
      installCommand = {
        command: 'go mod download',
        label: 'DOCUMENTED',
        source_id: 'manifest-package',
        source_url: `https://github.com/${owner}/${repo}/blob/${branch}/go.mod`,
        provenance: 'go.mod dependencies',
        path: 'go.mod',
      };
      testCommand = {
        command: 'go test ./...',
        label: 'DOCUMENTED',
        source_id: 'manifest-package',
        source_url: `https://github.com/${owner}/${repo}/blob/${branch}/go.mod`,
        provenance: 'go.mod test package',
        path: 'go.mod',
      };
    }
  }

  // 3. Documentation Fallback / Augmentation from README / CONTRIBUTING
  if (docs && docs.trim().length > 0) {
    inspectedFiles.push('README.md');

    if (!installCommand) {
      const npmInstallMatch = docs.match(/(npm (?:install|i)|pnpm (?:install|i)|yarn(?: install)?|cargo build|go mod download|pip install -r \S+)/i);
      if (npmInstallMatch) {
        installCommand = {
          command: npmInstallMatch[0],
          label: 'DOCUMENTED',
          source_id: 'doc-readme',
          source_url: readmeSourceUrl,
          provenance: 'README.md code block',
          path: 'README.md',
        };
      }
    }

    if (!testCommand) {
      const testMatch = docs.match(/(npm (?:test|run test)|pytest|cargo test|go test(?:\s+\.\/\.\.\.)?|yarn test|pnpm test)/i);
      if (testMatch) {
        testCommand = {
          command: testMatch[0],
          label: 'DOCUMENTED',
          source_id: 'doc-readme',
          source_url: readmeSourceUrl,
          provenance: 'README.md code block',
          path: 'README.md',
        };
      }
    }

    if (!runCommand) {
      const runMatch = docs.match(/(npm run (?:dev|start)|yarn (?:dev|start)|pnpm (?:dev|start)|cargo run)/i);
      if (runMatch) {
        runCommand = {
          command: runMatch[0],
          label: 'DOCUMENTED',
          source_id: 'doc-readme',
          source_url: readmeSourceUrl,
          provenance: 'README.md code block',
          path: 'README.md',
        };
      }
    }
  }

  // Construct truthful notes
  let notes = '';
  if (testCommand) {
    notes = `Test command substantiated from ${testCommand.provenance}.`;
  } else if (inspectedFiles.length > 0) {
    notes = `No test execution command substantiated in inspected files (${inspectedFiles.join(', ')}).`;
  } else {
    notes = 'No setup documentation or package manifest inspected in bounded scan.';
  }

  return {
    install_command: installCommand,
    test_command: testCommand,
    run_command: runCommand,
    has_readme: false,
    has_contributing: false,
    package_manager: packageManager,
    manifest_file: packageJsonContent ? 'package.json' : undefined,
    inspected_files: inspectedFiles,
    notes,
  };
}
