<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# General-purpose study assistant

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Implemented
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: The study assistant is no longer tied to one exam. Users type their own subject and optional topic, Learn and Quiz work for any subject, and exam-specific presets, wording, and `src/dat` are gone (now `src/study`). ADRs 0004–0007 are kept as history with superseded notes, and quizzes keep five choices.

> **Superseded in part by [ADR-0010](0010-dat-study-coach-scope-curriculum-and-phases.md) (2026-11-19):** at Jana's request, the DAT returns as a **built-in curriculum** (`src/curriculum/dat.ts`, from the official ADA outline), shown on screen when you study from it. Free study for any subject, which is this ADR's core, is kept unchanged.

---

## Originating Context

**Source**: `Human dump (below)` — Jana's request, 2026-11-19.

> Please make the study assistant general-purpose rather than DAT-specific. I want users to be able to study any subject they choose. Remove references to the DAT and dental school from the interface, source code, documentation, and study presets. Rename the src/dat directory appropriately.
>
> Keep the Learn and Quiz features. Allow users to enter their own subjects and topics.
>
> Please test the updated application, commit the changes, push to GitHub, and verify that the updated website is deployed successfully.

**Agency Grant**: Implement, test, commit, push, and verify the deploy.

---

## Explicitation

**What I understand**:

1. **This supersedes the exam-specific parts of [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md), [ADR-0005](0005-learn-mode-explanation-design.md), and [ADR-0006](0006-quiz-mode-question-format-and-feedback.md).** The fixed subject list, the outline topic lists, the exam-anchored prompts, and the "five choices because the exam uses five" rationale all go.
2. **Survives unchanged:** the three tabs (Learn | Quiz | Chat), the optional focus field, sanitized Markdown rendering, the five-section Learn structure (with "Common DAT trap" generalized to "Common mistake"), structured solve-first quiz questions, explain-every-choice feedback, and the quiz results log.
3. **Free-text subjects conflict with ADR-0004's rationale for the future tracker.** ADR-0004 chose outline lists partly because free text fragments topic names ("enzymes" vs "Enzymes"). Mitigation, decided below: the subject and topic fields suggest your own previous entries, so you reuse the same names.
4. **Level.** Without a named exam, the prompts no longer imply a difficulty level. They will match the level implied by what you type (e.g. "AP Biology", "Grad-level statistics"), defaulting to introductory university level.

**Confirm**: Jana.

---

## Questions

### QST-ADR-HISTORY: Should the earlier ADRs (0004–0007) keep their exam-specific wording?
- Status: answered
- Why asking: You asked for exam and dental-school references to be removed from "documentation." ADRs 0004–0007 contain about 35 such references, because they record *why* the exam-specific design was chosen, including your original request quoted verbatim. This project's methodology treats ADRs as a permanent decision record: superseded decisions are marked superseded, not rewritten. The interface, source code, tests, presets, and CLAUDE.md are cleaned under every option.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — keep as history, mark superseded**: ADRs 0004–0007 stay as written, with a one-line note at the top of each pointing to this ADR. User-facing material and code contain no exam references. Anyone reading the ADR folder can still see the project's actual path.
- **B — rewrite them generically**: Edit ADRs 0004–0007 to remove exam and dental-school references, including the quoted request, and rename `0004-dat-study-assistant-…md`. The repo's current files contain no trace of the exam, but git history still does, and the records no longer explain why choices like five-option questions were made.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — keep as history, mark superseded.** *Rationale*: CLAUDE.md's Prime Directive exists to preserve reasoning, and the adr-authoring skill names silent walk-backs as the one dishonesty the format guards against. Rewriting 0004–0007 would turn real decisions into fictional ones while git history still holds the originals, so B removes the reasoning without actually removing the references. *Confidence*: 0.7 — because "documentation" could reasonably include the ADRs, and the repo is public, which may matter to you for privacy. *If wrong*: if the goal is that a visitor to the public repo sees no sign of your exam plans, flip to B. Truly erasing it from the public repo would also need a git-history rewrite, which is a separate, destructive step.

**ANS:** (by Jana Mourad)
A — keep as history, mark superseded. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-CHOICES: How many answer choices should quiz questions have?
- Status: answered
- Why asking: ADR-0006 chose five choices (A–E) because the exam used five. For a general-purpose tool that reason is gone. Four choices (A–D) is the more common format across school and university tests.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — keep five (A–E)**: No behavior change. One more plausible wrong answer per question, which makes guessing harder but each question longer to read.
- **B — four (A–D)**: The most common general format. Shorter questions and feedback, and it's easier for the model to write convincing wrong answers.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — four (A–D).** *Rationale*: Four is the common default outside the exam that justified five, so the original rationale no longer applies. Four distractors are also harder for a model to make all plausible, so a fifth weak option mostly adds reading time. The code change is one constant plus tests. *Confidence*: 0.6 — because both are reasonable, and you asked to keep the Quiz feature, which could mean "unchanged." *If wrong*: if you're still preparing for a five-option test, flip to A.

**ANS:** (by Jana Mourad)
A — keep five (A–E) (recommendation was B; Jana chose A). (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Decided under the agency grant (not open questions)

- **Subject and topic entry**: two free-text fields. **Subject** (e.g. "Organic Chemistry", "US History") is needed for Quiz and optional for Learn. **Topic** (e.g. "Stereochemistry") is optional; leaving it blank means the whole subject. The existing optional **focus** field becomes unnecessary: the topic field now does that job, so it is folded in.
- **Suggestions**: both fields offer your previously used subjects and topics (browser-local), so names stay consistent for the future tracker (Explicitation 3).
- **Scope change**: changing the subject or topic and leaving the field starts a fresh Learn conversation and quiz. This is the ADR-0004 behavior, now triggered on field change instead of dropdown change.
- **Directory**: `src/dat/` → `src/study/`. `topics.ts` (the presets) is deleted.
- **Results log**: the localStorage key becomes `quiz-results`. Rows logged under the old key (a few hours of use at most) are not migrated, so no exam-specific key name remains in the source.
- **Learn template**: "Common DAT trap" → **"Common mistake"**. The other four sections are unchanged.

### Chosen by Jana

- **QST-ADR-HISTORY → A (keep as history, mark superseded)**, as recommended. ADRs 0004–0007 each carry a superseded note at the top. CLAUDE.md, the interface, source, tests, and the built bundle contain no exam references (verified by grep, 2026-11-19).
- **QST-CHOICES → A (keep five, A–E)**, **overriding** the recommendation of four. The prompt, parser, and tests still require exactly five choices.

**Trade-offs accepted**: Quiz rows logged under the old storage key are not migrated. Free-text names can still fragment the future tracker; suggestions reduce this but don't prevent it.

---

## Open Follow-ups

- [ ] Future task: an optional **Level** field (e.g. high school / university / professional exam), if level inference from the subject text proves unreliable.

---

## Action Items

- [x] Generalize the interface, prompts, tests, and CLAUDE.md; rename `src/dat` → `src/study` — Owner: Claude
- [x] Apply the QST-ADR-HISTORY and QST-CHOICES answers — Owner: Claude
- [ ] Test, commit, push, and verify the deploy — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's general-purpose request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: recorded the decisions taken under the agency grant; two questions open
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers via the Claude Code question dialog; implementation
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: QST-ADR-HISTORY → A; QST-CHOICES → A (overriding B); generalization implemented, gate green (32 tests); superseded notes added to ADRs 0004–0007
- Outcome: `Draft → Implemented`

---

## Links

- Supersedes (in part): [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md) (subject list, outline topics), [ADR-0005](0005-learn-mode-explanation-design.md) (exam-anchored prompt), [ADR-0006](0006-quiz-mode-question-format-and-feedback.md) (five-choice rationale, exam level)
- Related: [ADR-0007](0007-study-tracker-and-adaptive-learning.md) (tracker input changes from outline topics to user-entered names)
