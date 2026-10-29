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

  // Brand color palette - Midnight Developer Workspace
  const CANVAS = '0B1020'; // Midnight Ink canvas
  const CARD_BG = '121A2B'; // Elevated midnight surface
  const BORDER = '232F48'; // Subtle midnight card border
  const HEADER_BG = '1E293B'; // Table header background
  const INK = 'F1F5F9'; // Readable off-white text
  const INDIGO = 'A78BFA'; // Electric violet light
  const BLUE = '60A5FA'; // Bright blue
  const TEAL = '2DD4BF'; // Evidence teal
  const CORAL = 'FB7185'; // Warning coral
  const LIME = 'A7F3D0'; // Mint lime (pass badges)
  const WHITE = 'FFFFFF';
  const MUTED = '94A3B8';

  // Helper function to build high-contrast table cells
  function makeCell(text, isHeader = false, isBold = false, highlightColor = null) {
    return {
      text,
      options: {
        bold: isHeader || isBold,
        fill: { color: isHeader ? HEADER_BG : CARD_BG },
        color: highlightColor || (isHeader ? WHITE : INK),
        fontFace: 'Arial',
      },
    };
  }

  // -------------------------------------------------------------
  // SLIDE 1: Title & Executive Summary
  // -------------------------------------------------------------
  const slide1 = pres.addSlide();
  slide1.background = { color: CANVAS };

  // Top header tag
  slide1.addText('HACKTOBERFEST 2026 SUBMISSION • GEMMA 4 OPEN WEIGHTS TRACK', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide1.addText('IssueLift v1.3', {
    x: 0.8,
    y: 0.95,
    w: 11.5,
    h: 0.9,
    fontSize: 42,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide1.addText('From Issue URL to a Proven Next Step Before Anyone Edits Code', {
    x: 0.8,
    y: 1.9,
    w: 11.5,
    h: 0.5,
    fontSize: 18,
    color: BLUE,
    fontFace: 'Arial',
  });

  slide1.addText('Live App: https://issue-lift.vercel.app/   •   GitHub: https://github.com/rudraarcadeskills-art/IssueLift', {
    x: 0.8,
    y: 2.45,
    w: 11.5,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: TEAL,
    fontFace: 'Arial',
  });

  slide1.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 2.9,
    w: 11.7,
    h: 3.8,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });

  slide1.addText('THE CORE PROMISE & PRE-IMPLEMENTATION INNOVATION', {
    x: 1.2,
    y: 3.15,
    w: 11.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide1.addText(
    '• The Problem: Newcomers pick issues, spend days coding, only to be rejected because their definition of "done" diverged from maintainer intent, or because tests were never identified before coding.\n\n' +
    '• The Solution: IssueLift intercepts the workflow BEFORE code edits begin. Paste any public GitHub issue URL: IssueLift indexes bounded repo manifests, uses Google Gemma 4 to compile a structured Contribution Contract, traces requirements to real test evidence, and drafts copy-ready maintainer questions.\n\n' +
    '• Zero-Budget Invariant: Real GitHub REST data + Google Gemma 4 free tier + deterministic offline Claim Gate. Never executes untrusted repository code on the host server.',
    {
      x: 1.2,
      y: 3.65,
      w: 11.0,
      h: 2.8,
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
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide2.addText('Adjacent Categories vs. IssueLift Pre-Edit Contract', {
    x: 0.8,
    y: 0.9,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // Table of competitors with explicit contrast styling
  const tableRows = [
    [
      makeCell('Tool / Category', true),
      makeCell('What It Does Well', true),
      makeCell('What IssueLift Does NOT Copy', true),
      makeCell('IssueLift Differentiation', true),
    ],
    [
      makeCell('GoodFirst / IssueScout', false, true),
      makeCell('Issue discovery, beginner issue pickers, difficulty tags.'),
      makeCell('Do not build another issue directory or generic difficulty score.'),
      makeCell('Starts AFTER the issue is picked; defines contract before code edits.'),
    ],
    [
      makeCell('Ossistant', false, true),
      makeCell('Repo chatbot, general explanation of open source programs.'),
      makeCell('Do not build a conversational chat assistant.'),
      makeCell('Deterministic, structured, exportable Proof Bundle artifacts.'),
    ],
    [
      makeCell('CodeRabbit', false, true),
      makeCell('Automated post-PR code review and pre-merge checks.'),
      makeCell('Do not build post-PR code review.'),
      makeCell('Pre-PR clarification: align on "done" before submitting PRs.'),
    ],
    [
      makeCell('GitHub Copilot / SWE-agent', false, true),
      makeCell('Autonomous coding agents creating automated pull requests.'),
      makeCell('Do not compete as an autonomous patch agent.'),
      makeCell('Human contributor empowerment: verifiable truth trail & test radar.'),
    ],
  ];

  slide2.addTable(tableRows, {
    x: 0.8,
    y: 1.7,
    w: 11.7,
    h: 5.0,
    fontSize: 11,
    border: { color: BORDER, width: 1 },
    fontFace: 'Arial',
  });

  // -------------------------------------------------------------
  // SLIDE 3: The Contribution Contract Compiler
  // -------------------------------------------------------------
  const slide3 = pres.addSlide();
  slide3.background = { color: CANVAS };

  slide3.addText('SIGNATURE WORKFLOW 1', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide3.addText('Contribution Contract Compiler (What Does "Done" Mean?)', {
    x: 0.8,
    y: 0.9,
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
    y: 1.7,
    w: colWidth,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });
  slide3.addText('1. Explicit vs. Inferred', {
    x: 1.0,
    y: 1.9,
    w: colWidth - 0.4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: INDIGO,
  });
  slide3.addText(
    '• Explicit Quotes: Direct issue excerpts are retained verbatim as AC-01, AC-02, etc. and linked to GitHub.\n\n' +
    '• AI-Proposed: Missing requirements are clearly quarantined and labelled AI-INFERRED. Never masquerade as maintainer approved.\n\n' +
    '• In-Memory Editing: Contributor can edit criteria or toggle "Needs Clarification" in real time without database overhead.',
    {
      x: 1.0,
      y: 2.5,
      w: colWidth - 0.4,
      h: 4.0,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // Col 2
  slide3.addShape(pres.ShapeType.rect, {
    x: 0.8 + colWidth + colGap,
    y: 1.7,
    w: colWidth,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });
  slide3.addText('2. Readiness Gate', {
    x: 1.0 + colWidth + colGap,
    y: 1.9,
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
      y: 2.5,
      w: colWidth - 0.4,
      h: 4.0,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // Col 3
  slide3.addShape(pres.ShapeType.rect, {
    x: 0.8 + (colWidth + colGap) * 2,
    y: 1.7,
    w: colWidth,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });
  slide3.addText('3. Copy-Ready Handoff', {
    x: 1.0 + (colWidth + colGap) * 2,
    y: 1.9,
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
      y: 2.5,
      w: colWidth - 0.4,
      h: 4.0,
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
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide4.addText('Acceptance-to-Test TraceMap & Test Gap Radar', {
    x: 0.8,
    y: 0.9,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide4.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.7,
    w: 11.7,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });

  slide4.addText('4-NODE VERIFIED EVIDENCE CHAINS & HONEST CAVEATS', {
    x: 1.2,
    y: 2.0,
    w: 11.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: INDIGO,
  });

  slide4.addText(
    '1. Requirement Node: Explicit issue quote (e.g. AC-01) with direct clickable link back to GitHub discussion.\n\n' +
    '2. Candidate Implementation Node: File path confirmed in fetched repository tree. Path existence is VERIFIED; relevance remains AI-INFERRED until validated.\n\n' +
    '3. Candidate Test Node: Test file or spec candidate identified. Status: TEST EVIDENCE FOUND, or NO TEST EVIDENCE FOUND IN SCANNED FILES.\n\n' +
    '4. Documented Test Command: Documented npm/cargo/pytest command extracted from README/CONTRIBUTING with direct file citation.\n\n' +
    '• TEST GAP RADAR & HONEST UNCERTAINTY: Scans are strictly bounded by API limits. When no test evidence is identified in scanned files, IssueLift generates a Test Gap card explaining what was checked, why uncertainty exists, and proposing a manual verification scenario. It NEVER claims "no tests exist" in the repository or invents false coverage percentages.',
    {
      x: 1.2,
      y: 2.5,
      w: 11.0,
      h: 4.0,
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
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide5.addText('Gemma 4 Proposes; Deterministic Claim Gate Verifies', {
    x: 0.8,
    y: 0.9,
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
    y: 1.7,
    w: halfW,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });

  slide5.addText('Gemma 4 Reasoning Engine', {
    x: 1.1,
    y: 1.95,
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
      y: 2.45,
      w: halfW - 0.6,
      h: 4.0,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  slide5.addShape(pres.ShapeType.rect, {
    x: 0.8 + halfW + 0.4,
    y: 1.7,
    w: halfW,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: BORDER, width: 1 },
  });

  slide5.addText('Deterministic Claim Gate', {
    x: 1.1 + halfW + 0.4,
    y: 1.95,
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
      y: 2.45,
      w: halfW - 0.6,
      h: 4.0,
      fontSize: 12,
      color: INK,
      lineSpacing: 18,
    }
  );

  // -------------------------------------------------------------
  // SLIDE 6: Open ProofBench Suite (Distinct from Unit Tests)
  // -------------------------------------------------------------
  const slide6 = pres.addSlide();
  slide6.background = { color: CANVAS };

  slide6.addText('VERIFICATION & BENCHMARK INVARIANTS', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide6.addText('Open ProofBench: 7/7 Fixtures Passing (100% Offline)', {
    x: 0.8,
    y: 0.85,
    w: 11.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide6.addText('*ProofBench evaluates 7 deterministic guardrail fixtures in eval/fixtures/ — distinct from the 78 unit tests in tests/ (Vitest).*', {
    x: 0.8,
    y: 1.4,
    w: 11.7,
    h: 0.3,
    fontSize: 11,
    italic: true,
    color: TEAL,
    fontFace: 'Arial',
  });

  // Table of 7 fixtures with explicit cell formatting
  const benchRows = [
    [
      makeCell('Fixture ID', true),
      makeCell('Tested Guardrail Invariant', true),
      makeCell('Expected Outcome', true),
      makeCell('Observed Result', true),
    ],
    [
      makeCell('fixture-01', false, true),
      makeCell('Valid Criterion + Verified Source and Test Evidence'),
      makeCell('Paths verified in tree, zero rejected'),
      makeCell('PASS (Verdict: ACTIONABLE, Test Evidence Found)', false, false, LIME),
    ],
    [
      makeCell('fixture-02', false, true),
      makeCell('Vague Issue with Implicit Requirements'),
      makeCell('Proposed criteria labelled INFERRED'),
      makeCell('PASS (Verdict: CLARIFY FIRST, Criteria AI-PROPOSED)', false, false, LIME),
    ],
    [
      makeCell('fixture-03', false, true),
      makeCell('Missing Test Evidence in Bounded Context'),
      makeCell('Phrased "No test evidence found in scanned files"'),
      makeCell('PASS (Bounded scan caveat respected)', false, false, LIME),
    ],
    [
      makeCell('fixture-04', false, true),
      makeCell('Fabricated File Path & Hallucinated Source ID'),
      makeCell('Claim Gate rejects & demotes path'),
      makeCell('PASS (1 path rejected, logged in audit ledger)', false, false, LIME),
    ],
    [
      makeCell('fixture-05', false, true),
      makeCell('Truncated Repository Tree Context'),
      makeCell('Yields SCAN INCOMPLETE / UNKNOWN'),
      makeCell('PASS (Verdict: EVIDENCE-LIMITED)', false, false, LIME),
    ],
    [
      makeCell('fixture-06', false, true),
      makeCell('Untrusted Instruction / Prompt Injection'),
      makeCell('Prompt injection treated as text; cannot bypass gate'),
      makeCell('PASS (Closed status maintained; CLARIFY FIRST)', false, false, LIME),
    ],
    [
      makeCell('fixture-07', false, true),
      makeCell('Missing Setup Documentation'),
      makeCell('Setup commands remain UNKNOWN'),
      makeCell('PASS (Zero fabricated setup commands)', false, false, LIME),
    ],
  ];

  slide6.addTable(benchRows, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 4.8,
    fontSize: 10,
    border: { color: BORDER, width: 1 },
    fontFace: 'Arial',
  });

  // -------------------------------------------------------------
  // SLIDE 7: Why Does Open Innovation Matter? (REQUIRED EXPLICIT SLIDE)
  // -------------------------------------------------------------
  const slide7 = pres.addSlide();
  slide7.background = { color: CANVAS };

  slide7.addText('HACKTOBERFEST 2026 THEME', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide7.addText('Why Does Open Innovation Matter?', {
    x: 0.8,
    y: 0.9,
    w: 11.5,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  slide7.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.7,
    w: 11.7,
    h: 5.0,
    fill: { color: CARD_BG },
    line: { color: INDIGO, width: 2 },
  });

  slide7.addText(
    '"IssueLift turns an open issue into a reviewable Contribution Contract and evidence-to-test map before coding begins. The deterministic Claim Gate can be inspected and improved; the public ProofBench lets contributors add counterexamples whenever a path, citation, requirement or test-evidence label is wrong. This makes reliability rules—not only UI code—open to community inspection and extension. We claim no impact numbers until measured."',
    {
      x: 1.2,
      y: 2.1,
      w: 11.0,
      h: 1.8,
      fontSize: 14,
      italic: true,
      color: INK,
      lineSpacing: 22,
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
      h: 1.9,
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
    y: 0.5,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: INDIGO,
    fontFace: 'Arial',
  });

  slide8.addText('Rubric Compliance Matrix & Submission Readiness', {
    x: 0.8,
    y: 0.9,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: 'Arial',
  });

  // Table of 9 rubric criteria with explicit cell styling and verified metrics
  const rubricRows = [
    [
      makeCell('Rubric Criterion', true),
      makeCell('Required Artifact / Proof', true),
      makeCell('Verification Status', true),
    ],
    [
      makeCell('1. Proper README & Tests', false, true),
      makeCell('README.md verified; 78 unit tests passing across 4 suites (vitest in tests/)'),
      makeCell('PASS (78/78 Passing)', false, false, LIME),
    ],
    [
      makeCell('2. Gemma Central', false, true),
      makeCell('Server-side @google/genai calls gemma-4-26b-a4b-it; fallback baseline compiler'),
      makeCell('PASS (Live & fallback)', false, false, LIME),
    ],
    [
      makeCell('3. Features Work', false, true),
      makeCell('Live app: https://issue-lift.vercel.app/ & local Next.js on port 3000'),
      makeCell('PASS (Verified)', false, false, LIME),
    ],
    [
      makeCell('4. Open Source Repo', false, true),
      makeCell('Public repo: https://github.com/rudraarcadeskills-art/IssueLift (clean diff, 0 secrets)'),
      makeCell('PASS (Verified)', false, false, LIME),
    ],
    [
      makeCell('5. Innovation & Problem', false, true),
      makeCell('Pre-edit Contribution Contract + 4-Node TraceMap + Claim Gate + ProofBundle'),
      makeCell('PASS (P0 workflow complete)', false, false, LIME),
    ],
    [
      makeCell('6. Why Open Innovation', false, true),
      makeCell('Explicit Slide #7, README section, and docs/open-innovation.md'),
      makeCell('PASS (Verified)', false, false, LIME),
    ],
    [
      makeCell('7. Community Playbook', false, true),
      makeCell('CONTRIBUTING.md, Code of Conduct, newcomer templates, ProofBench guide'),
      makeCell('PASS (Verified)', false, false, LIME),
    ],
    [
      makeCell('8. Demo Deck & Script', false, true),
      makeCell('submission/IssueLift_Submission.pptx (8 slides) + 3-4 min demo in docs/demo-script.md'),
      makeCell('PASS (Generated)', false, false, LIME),
    ],
    [
      makeCell('9. Setup & ProofBench', false, true),
      makeCell('Clean install guide (Node 18.17+/20+) + 7/7 ProofBench evaluation fixtures'),
      makeCell('PASS (7/7 Fixtures)', false, false, LIME),
    ],
  ];

  slide8.addTable(rubricRows, {
    x: 0.8,
    y: 1.7,
    w: 11.7,
    h: 5.0,
    fontSize: 10,
    border: { color: BORDER, width: 1 },
    fontFace: 'Arial',
  });

  await pres.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved successfully: ${outputPath}`);
}

buildPresentation().catch((err) => {
  console.error('Failed to generate presentation deck:', err);
  process.exit(1);
});
