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

  // Fetch README and CONTRIBUTING
  let readmeContent = '';
  let contributingContent = '';
  let hasReadme = false;
  let hasContributing = false;

  const readmeFile = repositoryFiles.find(p => /^readme(\.md|\.markdown|\.txt)?$/i.test(p));
  if (readmeFile) {
    hasReadme = true;
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

  const contributingFile = repositoryFiles.find(p => /^(\.github\/)?contributing(\.md|\.markdown|\.txt)?$/i.test(p));
  if (contributingFile) {
    hasContributing = true;
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

  // Extract Documented Setup/Test Commands from README/CONTRIBUTING
  const combinedDocs = `${readmeContent}\n${contributingContent}`;
  const setupTruth = extractDocumentedCommands(combinedDocs, repositoryFiles, owner, repo, defaultBranch);
  setupTruth.has_readme = hasReadme;
  setupTruth.has_contributing = hasContributing;

  // Add key package manifests and test files to evidence pack
  const keyFiles = selectBoundedRelevantFiles(repositoryFiles, metadata.title, metadata.labels.map(l => l.name));
  for (let i = 0; i < Math.min(keyFiles.length, 8); i++) {
    const filePath = keyFiles[i];
    const isTest = isLikelyTestFile(filePath);
    sources.push({
      source_id: `file-${i + 1}`,
      canonical_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${filePath}`,
      path: filePath,
      source_type: isTest ? 'test' : 'code',
      excerpt: `File exists in repository tree (${filePath})`,
      verified_exists: true,
      verification_status: 'VERIFIED',
    });
  }

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
    lower.includes('.test.') ||
    lower.includes('.spec.') ||
    lower.includes('_test.') ||
    lower.includes('tests/') ||
    lower.includes('test/') ||
    lower.includes('__tests__/')
  );
}

export function selectBoundedRelevantFiles(files: string[], issueTitle: string, labels: string[]): string[] {
  const scored: Array<{ path: string; score: number }> = [];
  const queryTerms = `${issueTitle} ${labels.join(' ')}`
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter(t => t.length > 2);

  for (const file of files) {
    let score = 0;
    const lower = file.toLowerCase();

    // Prioritize package manifests & config
    if (lower === 'package.json' || lower === 'cargo.toml' || lower === 'go.mod' || lower === 'pyproject.toml') {
      score += 10;
    }
    // Prioritize test files
    if (isLikelyTestFile(file)) {
      score += 5;
    }

    // Keyword matching
    for (const term of queryTerms) {
      if (lower.includes(term)) {
        score += 3;
      }
    }

    // Skip deeply nested or vendor files
    if (lower.includes('node_modules/') || lower.includes('vendor/') || lower.includes('.git/')) {
      continue;
    }

    if (score > 0) {
      scored.push({ path: file, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 15).map(s => s.path);
}

export function extractDocumentedCommands(
  docs: string,
  files: string[],
  owner: string,
  repo: string,
  branch: string
): SetupTruth {
  let installCommand: string | undefined;
  let testCommand: string | undefined;
  let runCommand: string | undefined;

  // Search markdown code blocks for common commands
  const npmInstallMatch = docs.match(/(npm (?:install|i)|pnpm (?:install|i)|yarn(?: install)?|cargo build|go mod download)/i);
  if (npmInstallMatch) {
    installCommand = npmInstallMatch[0];
  }

  const testMatch = docs.match(/(npm (?:test|run test)|pytest|cargo test|go test(?:\s+\.\/\.\.\.)?|yarn test|pnpm test)/i);
  if (testMatch) {
    testCommand = testMatch[0];
  }

  const runMatch = docs.match(/(npm run (?:dev|start)|yarn (?:dev|start)|pnpm (?:dev|start)|cargo run)/i);
  if (runMatch) {
    runCommand = runMatch[0];
  }

  const sourceUrl = `https://github.com/${owner}/${repo}/blob/${branch}/README.md`;

  return {
    install_command: installCommand
      ? { command: installCommand, label: 'DOCUMENTED', source_id: 'doc-readme', source_url: sourceUrl }
      : undefined,
    test_command: testCommand
      ? { command: testCommand, label: 'DOCUMENTED', source_id: 'doc-readme', source_url: sourceUrl }
      : undefined,
    run_command: runCommand
      ? { command: runCommand, label: 'DOCUMENTED', source_id: 'doc-readme', source_url: sourceUrl }
      : undefined,
    has_readme: false,
    has_contributing: false,
    notes: testCommand
      ? 'Test command extracted from repository documentation.'
      : 'No test execution command documented in inspected files.',
  };
}
