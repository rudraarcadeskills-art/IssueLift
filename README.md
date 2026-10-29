# IssueLift v1.3

> **From Issue URL to a Proven Next Step Before Anyone Edits Code.**  
> *A Hacktoberfest 2026 Submission • Powered by Google Gemma 4 & Deterministic Claim Gate*

[![Live Demo](https://img.shields.io/badge/Live_App-issue--lift.vercel.app-0070F3?style=flat-square&logo=vercel)](https://issue-lift.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-rudraarcadeskills--art%2FIssueLift-181717?style=flat-square&logo=github)](https://github.com/rudraarcadeskills-art/IssueLift)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemma 4](https://img.shields.io/badge/Google_Gemma_4-26B--A4B-7057F5?style=flat-square&logo=google)](https://ai.google.dev/gemma)
[![Unit Tests](https://img.shields.io/badge/Unit_Tests-78%2F78_Passing-brightgreen?style=flat-square)](tests/)
[![ProofBench](https://img.shields.io/badge/ProofBench-7%2F7_Passing-26C7C9?style=flat-square)](docs/eval-report.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Live Web Application:** [https://issue-lift.vercel.app/](https://issue-lift.vercel.app/)<br>
**Public Repository:** [https://github.com/rudraarcadeskills-art/IssueLift](https://github.com/rudraarcadeskills-art/IssueLift)

---

## 1. The Problem: The Pre-Implementation Alignment Gap

Every Hacktoberfest, enthusiastic contributors find an open issue, spend hours or days writing code, and excitedly submit a pull request—only to receive an immediate rejection or silence.

Why? Because:
1. **Unclear Definition of "Done":** The issue description was vague, and the newcomer made incorrect architectural assumptions.
2. **Missing Test Evidence:** The contributor didn't identify existing test patterns or verify how the project tests that specific requirement.
3. **Burden on Maintainers:** Floods of generic comments (*"Can I work on this?"*) or speculative automated PRs drain maintainer goodwill.

**IssueLift solves this by starting BEFORE anyone edits code.**  
You paste any public GitHub issue URL. IssueLift inspects the issue metadata, fetches the bounded repository tree, and uses Google Gemma 4 combined with a deterministic Claim Gate to compile an evidence-backed **Contribution Contract**, map criteria to real test files, and draft a copy-ready maintainer question.

---

## 2. Interactive Workspace & Pre-Implementation Flow

IssueLift delivers a live, interactive developer workspace organized into five focused stages:

1. **Intake & Bounded Scan:** Paste any public GitHub issue URL. IssueLift validates the issue status, checks for existing PR signals, indexes the repository tree, and safely fetches manifests (`package.json`, lockfiles) and documentation (`README.md`, `CONTRIBUTING.md`).
2. **Setup Truth Ledger:** Extracts verified development, build, test, and install commands directly from package manifests and lockfiles (`pnpm`, `yarn`, `npm`, `bun`, `cargo`, `go`). Commands display exact provenance files rather than AI guesses.
3. **Evidence-Backed Contribution Contract:** Deconstructs issue discussions into discrete criteria (`AC-01`, `AC-02`...). Verbatim requirements retain clickable links to GitHub. AI proposals are quarantined with `AI-PROPOSED` tags and support in-memory editing.
4. **Acceptance-to-Test TraceMap & Gap Radar:** Traverses the indexed repository tree within bounded API limits. Maps each criterion to verified candidate source files, candidate test files, and substantiated test commands. When no test candidate exists or relevance cannot be definitively proven without full test execution, flags an honest Test Gap or unconfirmed test evidence with manual reproduction steps.
5. **Deterministic Claim Gate & Proof Bundle:** Enforces strict security invariants: every candidate file path must exist in the repository tree. Hallucinations are rejected and logged in the truth ledger. Exports a verifiable Markdown or JSON Proof Bundle before you write a single line of code.

### Product Screenshots & Live Workspace Views

#### 1. Landing & Issue Intake Workspace
![IssueLift Landing & Issue Intake Workspace showing the GitHub issue URL input, recent analysis shortcuts, verified setup truth commands, and Gemma 4 model status badge](docs/screenshots/01-landing-hero.jpg)
*Figure 1: Issue intake workspace — paste any public GitHub issue URL to trigger bounded repository scanning, manifest extraction, and Gemma 4 reasoning.*

#### 2. Autonomous Analysis, Contribution Contract & TraceMap
![IssueLift Contribution Contract and TraceMap results displaying derived acceptance criteria AC-01 through AC-03, solid existence links to candidate source and test files, verified test execution commands, and copy-ready maintainer question](docs/screenshots/02-tracemap-results.jpg)
*Figure 2: Contribution Contract and 4-node TraceMap — discrete criteria mapped to verified candidate source files, candidate test files, and substantiated test commands with Claim Gate audit.*

#### 3. Open ProofBench Deterministic Guardrail Console
![IssueLift Open ProofBench Deterministic Console displaying 7 offline fixtures passing with 100% deterministic guardrail compliance](docs/screenshots/03-proofbench-suite.jpg)
*Figure 3: ProofBench Console — 7 deterministic test fixtures validating Claim Gate invariants, path verification, and honest bounded-scan reporting.*

---

## 3. Signature Product Features

### 3.1 Contribution Contract Compiler
- Derives discrete requirement IDs (`AC-01`, `AC-02`...) from real issue text.
- **Explicit Quotes:** Verbatim issue excerpts are retained and linked directly back to GitHub.
- **AI-Proposed Criteria:** Missing or ambiguous requirements are clearly isolated and labelled `AI-INFERRED`. Never masquerades as maintainer-approved.
- **In-Memory Editing:** Contributors can edit criteria or toggle *"Needs Clarification"* in real time without database overhead.

### 3.2 Acceptance-to-Test TraceMap & Test Gap Radar
- **4-Node Evidence Chains:** Maps each criterion:  
  `Criterion (AC-XX) → Candidate Source File → Candidate Test File → Documented Test Command`
- **Solid vs. Dashed Links:** Solid links indicate verified-existence files confirmed in the repository tree; dashed links represent AI-inferred relevance.
- **Bounded Scanning & Honest Uncertainty:** Repository scans are bounded context (top candidate files and test suites within GitHub API thresholds). IssueLift does not claim that all scans always find relevant tests. When candidate files cannot be definitively confirmed without executing the project's test suite, relevance is reported honestly as inferred or unconfirmed (`SCAN INCOMPLETE / UNKNOWN`), rather than fabricating false certainty.
- **Test Gap Radar:** When bounded scan identifies no automated test candidate, IssueLift explains what was checked, why uncertainty exists, and suggests a manual reproduction scenario. It **never** claims "no tests exist" in the repository or invents false coverage percentages.

### 3.3 Deterministic Claim Gate & Truth Ledger
- **Core Invariant:** *Gemma proposes; deterministic code verifies.*
- **Two-Tier Engine:** Server-side Google Gemma 4 (`gemma-4-26b-a4b-it`) performs contract extraction and semantic reasoning. If an API key is absent or exhausted, IssueLift gracefully defaults to its internal deterministic heuristic compiler without disruption.
- **Path & Citation Verification:** Validates that every candidate file path exists in the fetched GitHub tree.
- **Hallucination Rejection:** Hallucinated paths or fabricated source IDs are rejected, demoted to `UNKNOWN`, and logged in the audit ledger.
- **Zero Remote Code Execution:** Untrusted repository scripts are never executed on the host.

### 3.4 Copy-Ready Maintainer Handoff
- Drafts a concise, respectful clarification comment grounded in the actual issue ambiguity.
- Suggests concrete acceptance-criteria additions for maintainer approval.
- **Never auto-posts:** The contributor edits and copies the markdown to clipboard manually.

### 3.5 Downloadable Contribution Proof Bundle
- Generates a self-contained, verifiable Markdown export artifact (`.md`) or structured JSON (`.json`) matching the current on-screen state.

### 3.6 Open ProofBench Suite (7 Labelled Fixtures)
- 100% offline, deterministic benchmark in `eval/fixtures/` validating Claim Gate invariants.
- Runs without an API key: `npm run eval:proofbench`.

---

## 4. Why Does Open Innovation Matter?

> **IssueLift turns an open issue into a reviewable Contribution Contract and evidence-to-test map before coding begins. The deterministic Claim Gate can be inspected and improved; the public ProofBench lets contributors add counterexamples whenever a path, citation, requirement or test-evidence label is wrong. This makes reliability rules—not only UI code—open to community inspection and extension. We claim no impact numbers until measured.**

### Community Participation Without Retraining Models
In proprietary AI tools, reliability failures are hidden behind opaque confidence scores. With IssueLift, reliability rules are open to everyone:
1. **Inspectable Guardrails:** The validation code in [`src/lib/claim-gate.ts`](src/lib/claim-gate.ts) is open-source.
2. **Community Counterexamples:** Anyone can add a new edge-case fixture in `eval/fixtures/` without machine learning infrastructure.
3. **Sustainable Open Source:** Higher signal for maintainers, less wasted effort for newcomers.

---

## 5. Architecture & Data Flow

```mermaid
flowchart LR
    A[Public GitHub Issue URL] --> B[Server-Side GitHub Client]
    B --> C[Bounded Repo Context Pack]
    C --> D[Gemma 4 Reasoning Engine]
    D --> E[Zod Schema Validator]
    E --> F[Deterministic Claim Gate]
    F --> G[Contribution Contract & TraceMap]
    G --> H[Maintainer Handoff]
    G --> I[Contribution Proof Bundle Export]
```

Detailed architectural specifications, threat models, and validation invariants are documented in [docs/architecture.md](docs/architecture.md).

---

## 6. Competitive Reality & Market Positioning

| Tool | Category | What IssueLift Does NOT Copy | IssueLift Pre-Edit Positioning |
| :--- | :--- | :--- | :--- |
| **GoodFirst** | Beginner issue picker | No issue directory or chatbot | Starts **after** issue is picked; compiles pre-edit contract |
| **IssueScout** | Issue search & score | No arbitrary difficulty percentages | Deterministic **Readiness Gate** (`ACTIONABLE` / `CLARIFY FIRST`) |
| **Ossistant** | Open source AI chat | No free-form conversational chat | Verifiable, evidence-linked **Proof Bundle** artifacts |
| **CodeRabbit** | Post-PR code review | Does not operate post-PR | **Pre-PR alignment**: agree on "done" before coding begins |
| **GitHub Copilot / SWE-agent** | Autonomous coding agent | Does not auto-create PRs or execute code | Empowers **human newcomers** with verified truth trails |

*See [docs/competitive-audit.md](docs/competitive-audit.md) for full competitive analysis.*

---

## 7. Prerequisites & Quick Start

### Prerequisites
- Node.js `v18.17+` or `v20+` (compatible with Next.js 15 and React 19; tested on Node.js v24)
- npm `v9+` or `v10+`
- Git
- Modern web browser

### Installation & Local Run
```bash
# 1. Clone repository
git clone https://github.com/rudraarcadeskills-art/IssueLift.git
cd IssueLift

# 2. Install dependencies
npm install

# 3. Configure local environment (Optional for AI reasoning; baseline works out-of-the-box)
cp .env.local.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. One-Step Gemma 4 API Key Configuration

IssueLift runs out-of-the-box with its deterministic baseline compiler. To activate real Google Gemma 4 analysis:

1. Visit [Google AI Studio](https://aistudio.google.com/apikey) and copy your free-tier key.
2. Edit `.env.local` in the project root:
   ```bash
   GEMMA_API_KEY=your_copied_api_key_here
   GEMMA_MODEL=gemma-4-26b-a4b-it
   # Optional: GITHUB_TOKEN=your_github_token_for_rate_limits
   ```
3. Restart the server. The status indicator will flip to **Live Gemma 4**.

> [!NOTE]
> Never prefix sensitive API keys with `NEXT_PUBLIC_`. Keep `.env.local` strictly server-side and ignored by Git.

---

## 9. Verification & Testing Commands

All four verification suites can be executed independently in local development:

### 1. Unit Tests (`npm test`)
Runs the Vitest test suite covering the deterministic Claim Gate, GitHub issue parser, repository tree indexing, false-positive heuristics, and setup command provenance:
```bash
npm test
```
- **Command:** `vitest run`
- **Current Result:** **78 passed across 4 test suites (100% passing)**
  - `tests/claim-gate.test.ts` (4 tests) — Claim Gate invariants, path verification, and hallucination rejection
  - `tests/regression-fixes-v13.test.ts` (48 tests) — Bounded scan edge cases, test evidence relevance, and TypeScript #63380 regressions
  - `tests/setup-truth-and-ranking.test.ts` (20 tests) — Manifest provenance, lockfile detection, and command ranking
  - `tests/github-parser.test.ts` (6 tests) — GitHub issue URL validation, PR link rejection, and owner/repo extraction
- **Duration:** ~7.4s

### 2. ProofBench Evaluation Suite (`npm run eval:proofbench`)
Runs the standalone, 100% offline deterministic benchmark against 7 labelled fixtures in `eval/fixtures/` with zero external API calls or keys required:
```bash
npm run eval:proofbench
# (alias: npm run eval)
```
- **Command:** `node scripts/run-proofbench.mjs`
- **Current Result:** **7/7 fixtures passed (100% deterministic guardrail compliance)**
  - `[PASS] fixture-01`: Valid Criterion + Verified Source and Test Evidence
  - `[PASS] fixture-02`: Vague Issue with Implicit Requirements (flags `CLARIFY FIRST`)
  - `[PASS] fixture-03`: No Test Evidence in Bounded Scanned Context (honest bounded phrasing)
  - `[PASS] fixture-04`: Fabricated File Path and Hallucinated Source ID (path rejected and recorded)
  - `[PASS] fixture-05`: Truncated Repository Tree Context (`SCAN INCOMPLETE / UNKNOWN`)
  - `[PASS] fixture-06`: Untrusted Instruction Embedded in Issue Body (injection isolation)
  - `[PASS] fixture-07`: Missing Setup Documentation (undocumented setup handled gracefully)
- **Evaluation Report:** Auto-updates [`docs/eval-report.md`](docs/eval-report.md)

### 3. Type Checking (`npm run typecheck`)
Runs the TypeScript compiler in no-emit mode to enforce strict type checking across all components, API routes, and Claim Gate logic:
```bash
npm run typecheck
```
- **Command:** `tsc --noEmit`
- **Current Result:** **0 errors (exited with code 0)**

### 4. Production Build (`npm run build`)
Executes the Next.js production build, compiling pages, checking types and linting, bundling client/server assets, and generating static routes:
```bash
npm run build
```
- **Command:** `next build`
- **Current Result:** **Compiled successfully in ~16s (exited with code 0)**
  - All 6 App Router routes generated cleanly (4 static pages, 2 dynamic API endpoints)
  - Zero build warnings or runtime compilation errors

### Supplementary Command: Presentation Deck Generation
```bash
npm run generate:pptx
```
Generates the 8-slide widescreen presentation deck at [`submission/IssueLift_Submission.pptx`](submission/IssueLift_Submission.pptx) (251 KB).

---

## 10. Submission Artifacts & Links

- **Live Application:** [https://issue-lift.vercel.app/](https://issue-lift.vercel.app/)
- **Public GitHub Repository:** [https://github.com/rudraarcadeskills-art/IssueLift](https://github.com/rudraarcadeskills-art/IssueLift)
- **QA Verification Report:** [docs/qa-report.md](docs/qa-report.md)
- **ProofBench Evaluation Report:** [docs/eval-report.md](docs/eval-report.md)
- **Rubric Compliance Matrix (All 9 Criteria):** [docs/rubric-compliance.md](docs/rubric-compliance.md)
- **60–90 Second Demo Script:** [docs/demo-script.md](docs/demo-script.md)
- **Newcomer Task Roadmap:** [docs/newcomer-roadmap.md](docs/newcomer-roadmap.md)
- **Editable Presentation Deck:** [submission/IssueLift_Submission.pptx](submission/IssueLift_Submission.pptx) (251 KB, 8 widescreen slides including "Why Does Open Innovation Matter?")

---

## 11. Zero-Budget & Security Guardrails

- **Zero Billing:** Runs entirely within free-tier limits (Google AI Studio Gemma 4 free tier + unauthenticated public GitHub REST API).
- **No Database / Login:** Operates in-memory with zero persistent user tracking or credential storage.
- **Zero Remote Code Execution:** Untrusted repository scripts are never executed on the host server.
- **Bounded Scanning & Rate Limiting:** All GitHub API operations are bounded, cached, and fail gracefully if rate limits are reached.

---

## 12. License & Terms

- **Source Code:** Original application code, Claim Gate validators, and ProofBench fixtures are released under the [MIT License](LICENSE).
- **Gemma Weights & API:** Google Gemma model weights and API usage are governed by Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
