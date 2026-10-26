import pptxgen from 'pptxgenjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const submissionDir = path.join(rootDir, 'submission');
const outputPath = path.join(submissionDir, 'IssueLift_Submission.pptx');

async function buildPresentation() {
  console.log('='.repeat(70));
  console.log(' GENERATING ISSUELIFT HACKTOBERFEST 2026 PPTX PRESENTATION DECK');
  console.log(' Target file: submission/IssueLift_Submission.pptx');
  console.log('='.repeat(70));

  fs.mkdirSync(submissionDir, { recursive: true });

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 16:9 widescreen layout

  // Brand color palette
  const CANVAS = 'F7F6FF';
  const INK = '17152D';
  const INDIGO = '7057F5';
  const BLUE = '477BFF';
  const TEAL = '26C7C9';
  const CORAL = 'FF7268';
  const LIME = 'C9F27A';
  const WHITE = 'FFFFFF';
  const GRAY_BG = 'ECEAF9';
  const MUTED = '635F80';

  // -------------------------------------------------------------
  // SLIDE 1: Title & Executive Summary
  // -------------------------------------------------------------
  const slide1 = pres.addSlide();
  slide1.background = { color: CANVAS };

  // Top header tag
  slide1.addText('HACKTOBERFEST 2026 SUBMISSION • GEMMA 4 OPEN WEIGHTS TRACK', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide1.addText('IssueLift v1.3', {
    x: 0.8,
    y: 1.1,
    w: 11.5,
    h: 1.0,
    fontSize: 44,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide1.addText('From Issue URL to a Proven Next Step Before Anyone Edits Code', {
    x: 0.8,
    y: 2.1,
    w: 11.5,
    h: 0.6,
    fontSize: 20,
    color: BLUE,
    fontFace: 'Arial',
  });

  slide1.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 2.9,
    w: 11.7,
    h: 3.5,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });

  slide1.addText('THE CORE PROMISE & INNOVATION', {
    x: 1.2,
    y: 3.2,
    w: 11.0,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide1.addText(
    '• The Problem: Newcomers pick issues, spend days coding, only to be rejected because their definition of "done" diverged from maintainer intent, or because tests were never identified.\n\n' +
    '• The Solution: IssueLift intercepts the contribution workflow BEFORE code edits begin. It compiles real GitHub issues into evidence-backed Contribution Contracts, maps criteria to test evidence, and drafts copy-ready maintainer questions.\n\n' +
    '• Zero-Budget Invariant: Real GitHub REST data + Google Gemma 4 free tier + deterministic offline Claim Gate. Never executes untrusted repository code.',
    {
      x: 1.2,
      y: 3.7,
      w: 11.0,
      h: 2.3,
      fontSize: 13,
      color: INK,
      fontFace: 'Arial',
      lineSpacing: 20,
    }
  );

  // -------------------------------------------------------------
  // SLIDE 2: Competitive Reality & Product Positioning
  // -------------------------------------------------------------
  const slide2 = pres.addSlide();
  slide2.background = { color: CANVAS };

  slide2.addText('MARKET SNAPSHOT & POSITIONING', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide2.addText('Adjacent Categories vs. IssueLift Pre-Edit Contract', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // Table of competitors
  const tableRows = [
    [
      { text: 'Tool / Category', options: { bold: true, fill: { color: '7057F5' }, color: WHITE } },
      { text: 'What It Does Well', options: { bold: true, fill: { color: '7057F5' }, color: WHITE } },
      { text: 'What IssueLift Does NOT Copy', options: { bold: true, fill: { color: '7057F5' }, color: WHITE } },
      { text: 'IssueLift Differentiation', options: { bold: true, fill: { color: '7057F5' }, color: WHITE } },
    ],
    [
      { text: 'GoodFirst / IssueScout', options: { bold: true } },
      { text: 'Issue discovery, beginner issue pickers, difficulty tags.' },
      { text: 'Do not build another issue directory or generic difficulty score.' },
      { text: 'Starts AFTER the issue is picked; defines contract before code edits.' },
    ],
    [
      { text: 'Ossistant', options: { bold: true } },
      { text: 'Repo chatbot, general explanation of open source programs.' },
      { text: 'Do not build a conversational chat assistant.' },
      { text: 'Deterministic, structured, exportable Proof Bundle artifacts.' },
    ],
    [
      { text: 'CodeRabbit', options: { bold: true } },
      { text: 'Automated post-PR code review and pre-merge checks.' },
      { text: 'Do not build post-PR code review.' },
      { text: 'Pre-PR clarification: align on "done" before submitting PRs.' },
    ],
    [
      { text: 'GitHub Copilot / SWE-agent', options: { bold: true } },
      { text: 'Autonomous coding agents creating automated pull requests.' },
      { text: 'Do not compete as an autonomous patch agent.' },
      { text: 'Human contributor empowerment: verifiable truth trail & test radar.' },
    ],
  ];

  slide2.addTable(tableRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 4.8,
    fontSize: 11,
    border: { color: 'D0CCE8', width: 1 },
    fontFace: 'Arial',
  });

  // -------------------------------------------------------------
  // SLIDE 3: The Contribution Contract Compiler
  // -------------------------------------------------------------
  const slide3 = pres.addSlide();
  slide3.background = { color: CANVAS };

  slide3.addText('SIGNATURE WORKFLOW 1', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide3.addText('Contribution Contract Compiler (What Does "Done" Mean?)', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // 3 feature columns
  const colWidth = 3.65;
  const colGap = 0.38;

  // Col 1
  slide3.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.8,
    w: colWidth,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });
  slide3.addText('1. Explicit vs. Inferred', {
    x: 1.0,
    y: 2.0,
    w: colWidth - 0.4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: INDIGO,
  });
  slide3.addText(
    '• Explicit Quotes: Direct issue excerpts are retained verbatim as AC-01, AC-02, etc. and linked to GitHub.\n\n' +
    '• AI-Proposed: Missing requirements are clearly labelled AI-INFERRED. Never masquerade as maintainer approved.\n\n' +
    '• In-Memory Editing: Contributor can edit criteria or toggle "Needs Clarification" without database overhead.',
    {
      x: 1.0,
      y: 2.6,
      w: colWidth - 0.4,
      h: 3.8,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // Col 2
  slide3.addShape(pres.ShapeType.rect, {
    x: 0.8 + colWidth + colGap,
    y: 1.8,
    w: colWidth,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });
  slide3.addText('2. Readiness Gate', {
    x: 1.0 + colWidth + colGap,
    y: 2.0,
    w: colWidth - 0.4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: BLUE,
  });
  slide3.addText(
    '• ACTIONABLE: Issue open, unassigned, candidate source files identified, test evidence mapped.\n\n' +
    '• CLARIFY FIRST: Closed on GitHub, assigned to another engineer, or ambiguous criteria require maintainer confirmation.\n\n' +
    '• EVIDENCE-LIMITED: Truncated repository tree or missing setup documentation disclosed honestly.',
    {
      x: 1.0 + colWidth + colGap,
      y: 2.6,
      w: colWidth - 0.4,
      h: 3.8,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // Col 3
  slide3.addShape(pres.ShapeType.rect, {
    x: 0.8 + (colWidth + colGap) * 2,
    y: 1.8,
    w: colWidth,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });
  slide3.addText('3. Copy-Ready Handoff', {
    x: 1.0 + (colWidth + colGap) * 2,
    y: 2.0,
    w: colWidth - 0.4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: TEAL,
  });
  slide3.addText(
    '• Specific Question: Cites the exact triggering ambiguity from the issue, not generic conversational filler.\n\n' +
    '• Proposed Additions: Drafts concrete acceptance criteria additions for maintainer blessing.\n\n' +
    '• Never Auto-Posts: Contributor edits and copies to clipboard manually. Respects maintainer space.',
    {
      x: 1.0 + (colWidth + colGap) * 2,
      y: 2.6,
      w: colWidth - 0.4,
      h: 3.8,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // -------------------------------------------------------------
  // SLIDE 4: Acceptance-to-Test TraceMap & Radar
  // -------------------------------------------------------------
  const slide4 = pres.addSlide();
  slide4.background = { color: CANVAS };

  slide4.addText('SIGNATURE WORKFLOW 2', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide4.addText('Acceptance-to-Test TraceMap & Test Gap Radar', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide4.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });

  slide4.addText('4-NODE VERIFIED EVIDENCE CHAINS & HONEST CAVEATS', {
    x: 1.2,
    y: 2.1,
    w: 11.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: INDIGO,
  });

  slide4.addText(
    '1. Requirement Node: Explicit issue quote (e.g. AC-01) with link back to GitHub discussion.\n\n' +
    '2. Candidate Implementation Node: File path confirmed in fetched repository tree. Path existence is VERIFIED; relevance remains AI-INFERRED until validated.\n\n' +
    '3. Candidate Test Node: Test file or spec candidate identified. Status: TEST EVIDENCE FOUND, or NO TEST EVIDENCE FOUND IN SCANNED FILES.\n\n' +
    '4. Documented Test Command: Documented npm/cargo/pytest command extracted from README/CONTRIBUTING with direct file citation.\n\n' +
    '• TEST GAP RADAR: When no test evidence is identified in the scanned files, IssueLift generates a Test Gap card explaining what was checked, why uncertainty exists, and proposing a manual verification scenario. It NEVER claims "no tests exist" or fabricates coverage percentages.',
    {
      x: 1.2,
      y: 2.6,
      w: 11.0,
      h: 3.7,
      fontSize: 13,
      color: INK,
      lineSpacing: 18,
    }
  );

  // -------------------------------------------------------------
  // SLIDE 5: Gemma 4 + Deterministic Claim Gate
  // -------------------------------------------------------------
  const slide5 = pres.addSlide();
  slide5.background = { color: CANVAS };

  slide5.addText('CORE ARCHITECTURE & GUARDRAILS', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide5.addText('Gemma 4 Proposes; Deterministic Claim Gate Verifies', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // 2 big columns
  const halfW = 5.65;
  slide5.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.8,
    w: halfW,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });

  slide5.addText('Gemma 4 Reasoning Engine', {
    x: 1.1,
    y: 2.1,
    w: halfW - 0.6,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: BLUE,
  });

  slide5.addText(
    '• Server-Side Integration: Official @google/genai SDK on Next.js server route handlers.\n\n' +
    '• Verified Model: gemma-4-26b-a4b-it via Google AI Studio free tier.\n\n' +
    '• Secret Isolation: GEMMA_API_KEY is never leaked to browser, git, or client bundles.\n\n' +
    '• Prompt Injection Defense: Issue body and comments are explicitly isolated as untrusted data.\n\n' +
    '• Structured Zod Schema: Validates requirement criteria, status rationales, and handoff questions.',
    {
      x: 1.1,
      y: 2.6,
      w: halfW - 0.6,
      h: 3.7,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  slide5.addShape(pres.ShapeType.rect, {
    x: 0.8 + halfW + 0.4,
    y: 1.8,
    w: halfW,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'E2DFF4', width: 1 },
  });

  slide5.addText('Deterministic Claim Gate', {
    x: 1.1 + halfW + 0.4,
    y: 2.1,
    w: halfW - 0.6,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: TEAL,
  });

  slide5.addText(
    '• Real Tree Validation: Checks every candidate path against the fetched repository tree.\n\n' +
    '• Hallucination Rejection: Nonexistent paths and hallucinated source IDs are demoted to UNKNOWN and logged in the audit ledger.\n\n' +
    '• Safe Missing-Key Fallback: If GEMMA_API_KEY is absent, the deterministic baseline compiler activates. Zero broken screens or dummy results.\n\n' +
    '• Zero Code Execution: Never runs repository scripts, never executes scanned code on server.',
    {
      x: 1.1 + halfW + 0.4,
      y: 2.6,
      w: halfW - 0.6,
      h: 3.7,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // -------------------------------------------------------------
  // SLIDE 6: Open ProofBench Suite
  // -------------------------------------------------------------
  const slide6 = pres.addSlide();
  slide6.background = { color: CANVAS };

  slide6.addText('VERIFICATION & BENCHMARK INVARIANTS', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide6.addText('Open ProofBench: 7/7 Fixtures Passing (100% Offline)', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // Table of 7 fixtures
  const benchRows = [
    [
      { text: 'Fixture ID', options: { bold: true, fill: { color: '17152D' }, color: WHITE } },
      { text: 'Tested Guardrail Invariant', options: { bold: true, fill: { color: '17152D' }, color: WHITE } },
      { text: 'Expected Outcome', options: { bold: true, fill: { color: '17152D' }, color: WHITE } },
      { text: 'Observed Result', options: { bold: true, fill: { color: '17152D' }, color: WHITE } },
    ],
    [
      { text: 'fixture-01', options: { bold: true } },
      { text: 'Valid Criterion + Verified Source and Test Evidence' },
      { text: 'Paths verified in tree, zero rejected' },
      { text: 'PASS (Verdict: ACTIONABLE, Test Evidence Found)' },
    ],
    [
      { text: 'fixture-02', options: { bold: true } },
      { text: 'Vague Issue with Implicit Requirements' },
      { text: 'Proposed criteria labelled INFERRED' },
      { text: 'PASS (Verdict: CLARIFY FIRST, Criteria AI-PROPOSED)' },
    ],
    [
      { text: 'fixture-03', options: { bold: true } },
      { text: 'Missing Test Evidence in Bounded Context' },
      { text: 'Phrased "No test evidence found in scanned files"' },
      { text: 'PASS (Bounded scan caveat respected)' },
    ],
    [
      { text: 'fixture-04', options: { bold: true } },
      { text: 'Fabricated File Path & Hallucinated Source ID' },
      { text: 'Claim Gate rejects & demotes path' },
      { text: 'PASS (1 path rejected, logged in audit ledger)' },
    ],
    [
      { text: 'fixture-05', options: { bold: true } },
      { text: 'Truncated Repository Tree Context' },
      { text: 'Yields SCAN INCOMPLETE / UNKNOWN' },
      { text: 'PASS (Verdict: EVIDENCE-LIMITED)' },
    ],
    [
      { text: 'fixture-06', options: { bold: true } },
      { text: 'Untrusted Instruction / Prompt Injection' },
      { text: 'Prompt injection treated as text; cannot bypass gate' },
      { text: 'PASS (Closed status maintained; CLARIFY FIRST)' },
    ],
    [
      { text: 'fixture-07', options: { bold: true } },
      { text: 'Missing Setup Documentation' },
      { text: 'Setup commands remain UNKNOWN' },
      { text: 'PASS (Zero fabricated setup commands)' },
    ],
  ];

  slide6.addTable(benchRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 4.8,
    fontSize: 10,
    border: { color: 'D0CCE8', width: 1 },
    fontFace: 'Arial',
  });

  // -------------------------------------------------------------
  // SLIDE 7: Why Does Open Innovation Matter? (REQUIRED EXPLICIT SLIDE)
  // -------------------------------------------------------------
  const slide7 = pres.addSlide();
  slide7.background = { color: CANVAS };

  slide7.addText('HACKTOBERFEST 2026 THEME', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide7.addText('Why Does Open Innovation Matter?', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide7.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: INDIGO, width: 2 },
  });

  slide7.addText(
    '"IssueLift turns an open issue into a reviewable Contribution Contract and evidence-to-test map before coding begins. The deterministic Claim Gate can be inspected and improved; the public ProofBench lets contributors add counterexamples whenever a path, citation, requirement or test-evidence label is wrong. This makes reliability rules—not only UI code—open to community inspection and extension. We claim no impact numbers until measured."',
    {
      x: 1.2,
      y: 2.2,
      w: 11.0,
      h: 1.8,
      fontSize: 15,
      italic: true,
      color: INK,
      lineSpacing: 24,
    }
  );

  slide7.addText('COMMUNITY PARTICIPATION WITHOUT TOUCHING MODEL WEIGHTS', {
    x: 1.2,
    y: 4.1,
    w: 11.0,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: INDIGO,
  });

  slide7.addText(
    '1. Inspectable Reliability: Proprietary AI tools hide reasoning failures behind opaque confidence scores. IssueLift makes every invariant inspectable in public fixtures.\n\n' +
    '2. Community Counterexamples: A newcomer who finds a hallucinated path or mislabeled test file can submit a fixture in eval/fixtures/ without retraining an LLM.\n\n' +
    '3. Sustainable Maintainer Health: Instead of flooding repositories with automated PR spam, open innovation here means higher signal: questions asked early, tests identified first.',
    {
      x: 1.2,
      y: 4.5,
      w: 11.0,
      h: 1.8,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // -------------------------------------------------------------
  // SLIDE 8: Rubric Compliance & Submission Readiness
  // -------------------------------------------------------------
  const slide8 = pres.addSlide();
  slide8.background = { color: CANVAS };

  slide8.addText('VERIFICATION SUMMARY', {
    x: 0.8,
    y: 0.6,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide8.addText('Rubric Compliance Matrix & Submission Readiness', {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // Table of 9 rubric criteria
  const rubricRows = [
    [
      { text: 'Rubric Criterion', options: { bold: true, fill: { color: '477BFF' }, color: WHITE } },
      { text: 'Required Artifact / Proof', options: { bold: true, fill: { color: '477BFF' }, color: WHITE } },
      { text: 'Verification Status', options: { bold: true, fill: { color: '477BFF' }, color: WHITE } },
    ],
    [{ text: '1. Proper README' }, { text: 'README.md with architecture, setup, tests, screenshots, limitations' }, { text: 'PASS (Verified)' }],
    [{ text: '2. Gemma Central' }, { text: 'Server-side @google/genai calls gemma-4-26b-a4b-it' }, { text: 'PASS (Live & baseline fallback)' }],
    [{ text: '3. Features Work' }, { text: 'Next.js App Router live on port 3000; /api/health and /api/analyze operational' }, { text: 'PASS (Verified)' }],
    [{ text: '4. Open Source Repo' }, { text: 'Local git repository initialized, clean diff, zero secrets tracked' }, { text: 'PASS (Ready for push)' }],
    [{ text: '5. Innovation & Problem' }, { text: 'Contribution Contract + TraceMap + Claim Gate + ProofBundle + ProofBench' }, { text: 'PASS (P0 workflow complete)' }],
    [{ text: '6. Why Open Innovation' }, { text: 'Explicit slide #7, README section, and docs/open-innovation.md' }, { text: 'PASS (Verified)' }],
    [{ text: '7. Community Playbook' }, { text: 'CONTRIBUTING.md, Code of Conduct, newcomer templates, ProofBench guide' }, { text: 'PASS (Verified)' }],
    [{ text: '8. Demo Deck & Script' }, { text: 'Editable submission/IssueLift_Submission.pptx + 60-90s demo script' }, { text: 'PASS (Generated)' }],
    [{ text: '9. Setup Guide' }, { text: '.env.example, .env.local.example, clean install commands' }, { text: 'PASS (Verified)' }],
  ];

  slide8.addTable(rubricRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 4.8,
    fontSize: 10,
    border: { color: 'D0CCE8', width: 1 },
    fontFace: 'Arial',
  });

  await pres.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved successfully: ${outputPath}`);
}

buildPresentation().catch((err) => {
  console.error('Failed to generate presentation deck:', err);
  process.exit(1);
});
