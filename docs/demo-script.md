# IssueLift 60–90 Second Demo Script

*A concise, high-impact walkthrough demonstrating the core pre-contribution contract workflow on a real public GitHub issue.*

---

## Demo Overview
- **Total Time:** 75 seconds
- **Target Audience:** Hacktoberfest judges, open-source maintainers, and newcomer contributors.
- **Demo Issue:** `https://github.com/facebook/react/issues/1000` (or any public open issue)

---

## Scene-by-Scene Script

| Timestamp | Visual Action on Screen | Speaker Narration |
| :---: | :--- | :--- |
| **00:00 – 00:15** | Open `http://localhost:3000`. Show the clean hero landing page in Luminous Developer Studio aesthetic. Cursor hovers over search bar. | *"Every Hacktoberfest, newcomers pick an issue, spend days coding, only to have their PR rejected because their definition of 'done' differed from maintainer intent, or because tests were never identified. Meet IssueLift: the pre-contribution contract compiler that defines 'done' before anyone edits code."* |
| **00:15 – 00:30** | Paste `https://github.com/facebook/react/issues/1000` and click **"Scan Issue"**. The 4-stage pipeline animates: Fetching Issue → Inspecting Repo → Gemma 4 Reasoning → Deterministic Claim Gate. | *"We paste a real public GitHub issue. IssueLift inspects the issue metadata, fetches the bounded repository tree, and uses Google Gemma 4 to compile a structured Contribution Contract. Notice our deterministic Claim Gate: every candidate file path is strictly verified against the actual repository tree to prevent hallucinations."* |
| **00:30 – 00:45** | Scroll down to the **Contribution Contract Card** and **Acceptance-to-Test TraceMap**. Expand a criterion row to reveal the 4-node chain. | *"Here is the contract: explicit requirements retain verbatim issue quotes linked to GitHub, while proposed requirements are honestly labelled AI-INFERRED. In the TraceMap, every requirement is traced to candidate implementation files, candidate test files, and documented test commands. When test evidence is missing, our Test Gap Radar explains the uncertainty with bounded-scan caveats."* |
| **00:45 – 00:60** | Show the **Maintainer Handoff Card**. Click "Edit Draft", then click "Copy Full Comment". | *"Instead of posting generic 'Can I work on this?' comments, IssueLift drafts a specific, copy-ready clarification citing the exact ambiguity. IssueLift never auto-posts: the contributor reviews, edits, and copies it manually."* |
| **00:60 – 00:75** | Click **"Download Proof Bundle"**. Modal opens showing the full Markdown artifact. Then quickly switch to `/proofbench` showing 7/7 passing fixtures. | *"Contributors can download a verifiable Contribution Proof Bundle. And with our open ProofBench suite, the community can add deterministic counterexamples in plain JSON without touching model weights. That's IssueLift: turning open issues into proven contracts before anyone edits code."* |

---

## Presenter Checklist Before Recording
- [ ] Dev server running (`npm run start` or `npm run dev`) on `http://localhost:3000`
- [ ] Sample issue URL pre-copied to clipboard or clicked via quick samples
- [ ] ProofBench route (`/proofbench`) accessible via top navigation
- [ ] Browser zoom set to 100% with clean dark/lavender contrast
