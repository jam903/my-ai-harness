<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# DAT study coach: scope, curriculum, and phases

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Partially Implemented
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Expand the study assistant into a personal DAT study coach for an ADHD learner, built on the official ADA content outline, in four phases: (1) curriculum, progress, and resume; (2) retention; (3) daily coaching and planning; (4) insights. Open: how this relates to the general-purpose assistant (ADR-0008), and which DAT tests the curriculum covers.

---

## Originating Context

**Source**: `Human dump (below)` — Jana's request, 2026-11-19.

> I want to expand my learning assistant into a personalized DAT study coach designed for someone with ADHD who struggles with motivation, attention, information retention, and consistency.
>
> My goal is to achieve a high DAT score while genuinely understanding the material.
>
> Please implement the following features incrementally:
>
> **DAT curriculum**
> - Include the complete DAT curriculum based on the current official ADA exam specifications.
> - Organize subjects into topics and subtopics.
> - Allow me to track which topics I have studied, mastered, or still need to learn.
> - Allow me to add custom topics from my study materials.
>
> **Learning and retention**
> - Track concepts covered in both Learn Mode and Quiz Mode.
> - Remember concepts I struggle to understand.
> - Distinguish between exposure to material and demonstrated mastery.
> - Use active recall and spaced repetition to improve long-term retention.
> - Save incorrect answers and revisit them later using different questions.
> - Adapt explanations and question difficulty based on my understanding.
>
> **Personalized study planning**
> - Allow me to enter my target DAT exam date.
> - Automatically create and adjust a study plan based on my progress, weaknesses, remaining topics, and available time.
> - Tell me exactly what to study when I open the application.
> - Prioritize high-yield topics while ensuring complete syllabus coverage.
>
> **ADHD-friendly experience**
> - Break large topics into small, manageable learning sessions.
> - Offer 5-, 10-, 15-, and 25-minute study sessions.
> - Include a low-motivation mode that gives me one small, achievable task.
> - Automatically adjust my study plan when I miss days without making me feel behind or guilty.
> - Celebrate meaningful progress without relying on streaks.
> - Keep the interface clean and minimize distractions.
> - Let me resume exactly where I left off.
>
> **Progress tracking**
> - Show mastery by subject, topic, and subtopic.
> - Display upcoming reviews and weak areas.
> - Track performance trends and syllabus coverage.
> - Save my progress locally with export/import functionality.
> - Never include my API key in exported study data.
>
> Please preserve the existing interactive teaching style and quiz functionality. Create ADR questions for important design decisions and implement these features in manageable phases.
>
> I want this to feel like a personal tutor and study coach that knows what I have learned, what I have forgotten, and what I should do next.

**Agency Grant**: Ask about important design decisions, then implement in phases, preserving Learn (ADR-0009) and Quiz (ADR-0006).

---

## Explicitation

**What I understand**:

1. **This reverses part of [ADR-0008](0008-general-purpose-study-assistant.md).** About two hours earlier, Jana asked for every DAT reference to be removed from the interface, code, and docs, so that the assistant would be general-purpose. A DAT curriculum puts the DAT back. QST-COACH-SCOPE asks how the two goals fit together. If the earlier removal was about **privacy**, that matters, because the repo and site are public.
2. **The official outline is now in hand.** The ADA *DAT User's Manual* (© 2026, dated March 2026, Figures 1–4) was extracted with `scripts/ephemeral/2026-11-19-extract-ada-dat-spec.mjs`. The DAT has four tests:
   - **Survey of the Natural Sciences**, 100 items: Biology (40 items, 5 topics), General Chemistry (30 items, 13 topics), and Organic Chemistry (30 items, 7 topics). The figures list subtopics for all three, and some Organic Chemistry subtopics go a level deeper.
   - **Perceptual Ability Test (PAT)**, 90 visual items: angle discrimination, block counting, paper folding, form development, and two forms of object visualization. There is no figure, only prose.
   - **Reading Comprehension Test (RCT)**, 50 items on three science passages of about 1,100–1,400 words each. Prose only.
   - **Quantitative Reasoning Test (QRT)**, 40 items: 30 mathematics and 10 applied. It has a figure: Algebra (6 subtopics), Data analysis/sufficiency, Quantitative comparison, Probability and statistics, and Applied (word) problems.
3. **The ADR-0004 topic list was wrong in places,** confirming its own "unverified" follow-up. The official Biology outline has no top-level *Developmental Biology*; it is subtopic IV.F "Developmental mechanisms." The last Biology topic is titled *Evolution and Ecology*. Organic Chemistry *does* include spectroscopy (II.A). The new curriculum comes from the manual, not from memory.
4. **The request is roughly four products in one,** so it ships in phases (Decision). Each phase is deployed and usable on its own.
5. **On ADHD.** Claude is not a clinician. The ADHD-friendly choices here follow common practice: small tasks, less choosing, no streak pressure, and no backlog guilt. They are design judgments to check against Jana's own experience, not clinical claims.
6. **Preserved:** the interactive Learn tutor (ADR-0009), structured quizzes with every choice explained (ADR-0006), sanitized rendering (ADR-0002/0004), the model picker, key handling, and the Chat tab.

**Assumptions**:

- Single user, single browser, progress stored in localStorage with export/import (Jana's ADR-0007 answer "this browser," plus export as requested here).
- The API key never enters exported data. This is enforced by construction, since the key is stored under a different key from progress, and verified by a test.

**Confirm**: Jana.

---

## Questions

### QST-COACH-SCOPE: How should the DAT coach relate to the general-purpose study assistant?
- Status: answered
- Why asking: Earlier today (ADR-0008) you asked to remove all DAT references so the assistant would work for any subject. Now you want a full DAT curriculum and coach. Both can be satisfied, but in different ways. If the earlier removal was for privacy, note that this repo and website are **public**: anything built in shows that this tool is for the DAT.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — curriculum as data**: The app stays general. The coach (tracking, reviews, plan) works on a *curriculum*, and the official DAT outline ships as the built-in one. Custom topics extend it, and free-text study (as today) remains available for anything outside it. "DAT" appears in the curriculum data file and on screen, but not throughout the code.
- **B — DAT-only coach**: The app becomes a DAT coach. The curriculum is hard-wired, and free-text subjects are removed. Simplest to build, but it undoes ADR-0008.
- **C — private curriculum file**: Like A, but the DAT curriculum is **not** in the public repo. It's a file Claude generates for you, which you import once on your device. The public site stays fully general and shows no sign of the DAT. It costs one import step, and you need to keep the file.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — curriculum as data.** *Rationale*: A keeps ADR-0008's work (any subject still works) and gives the coach a clean structure (a curriculum tree), so custom topics are just nodes added to it. B throws away working features, and C adds an import step and a file you could lose, unless privacy is the concern. *Confidence*: 0.6 — because I don't know why you removed the DAT references earlier. *If wrong*: if that removal was about keeping your DAT plans out of a public repo, flip to C.

**ANS:** (by Jana Mourad)
A — curriculum as data. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-DAT-SECTIONS: Which DAT tests should the curriculum and plan cover?
- Status: answered
- Why asking: You asked for the complete DAT curriculum. The official outline covers four tests (Explicitation 2). A text AI can teach and quiz the sciences and math well, and can write practice reading passages. It **cannot** reliably generate Perceptual Ability (PAT) puzzles, which are images (keyholes, cube stacks, folded paper). The answer decides what the plan schedules time for, and where it should send you elsewhere.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — all four, honest about PAT**: Biology, General Chemistry, Organic Chemistry, and Quantitative Reasoning get full Learn/Quiz. Reading Comprehension gets AI-written practice passages in a later phase. PAT is in the plan and tracked: Learn can teach strategies for each of its six question types, but practice happens in an outside PAT tool, and you log those sessions by hand.
- **B — sciences only**: Only Biology, General Chemistry, and Organic Chemistry, which is what you're studying now. The plan ignores the other three tests until they're added.
- **C — sciences + Quantitative Reasoning**: Every test the AI can fully quiz. Reading Comprehension and PAT are left out of the plan.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — all four, honest about PAT.** *Rationale*: A plan that leaves out three of the four tests isn't a plan for a high DAT score. It would tell you you're "on track" while PAT and Reading Comprehension go unscheduled. The PAT limitation is real, so the coach says so and sends you to dedicated practice instead of faking image puzzles in text. *Confidence*: 0.7 — because whether the coach should cover tests you'll prepare for elsewhere is your call. *If wrong*: if you're already using a separate PAT/RC program and want this tool focused, flip to C.

**ANS:** (by Jana Mourad)
A — all four, honest about PAT. (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Phases (decided under the agency grant; each phase is deployed when it's green)

1. **Phase 1 — Curriculum, progress, resume.**
   - The official outline as a subject → topic → subtopic tree, plus custom topics and subtopics.
   - Per-subtopic progress records. Learn sessions count as **exposure**; quiz answers count as **evidence**. Status is computed per ADR-0011.
   - A **Progress** view with coverage and mastery by subject, topic, and subtopic.
   - **Study this** starts Learn or Quiz on a subtopic.
   - Export/import that never includes the key.
   - **Resume**: the last tab, subtopic, Learn conversation, and open quiz question are restored on reload.
2. **Phase 2 — Retention** (ADR-0011): spaced reviews, the mistake bank (missed concepts re-tested with *different* questions), struggle tracking from Learn, and adaptive difficulty.
3. **Phase 3 — Coach** (ADR-0012): exam date, a **Today** screen ("do this next"), 5/10/15/25-minute sessions, a low-motivation mode, rebalancing missed days without guilt, and celebrations without streaks.
4. **Phase 4 — Insights**: performance trends, upcoming reviews, and a weak-areas view.

### Chosen by Jana: QST-COACH-SCOPE A (curriculum as data), QST-DAT-SECTIONS A (all four tests, honest about PAT)

**Phase 1, as built (2026-11-19):**
- **Curriculum**: `src/curriculum/dat.ts`, transcribed from Figures 1–4.
  - Each subject records its exam item count and a `practice` mode:
    - `ai` for Biology, General Chemistry, Organic Chemistry, and Quantitative Reasoning;
    - `external` for PAT: Learn teaches strategy, and Quiz is disabled with an explanation;
    - `passage` for Reading Comprehension: Learn works now, and AI passages come later.
  - Fourth-level official items are folded into subtopic titles or details.
  - The PAT and Reading Comprehension topics are labelled as *not* official content figures.
  - Custom topics and subtopics live in the progress data (`withCustom` never mutates the built-in tree). A new custom topic is created with one subtopic of the same name, so it can be studied right away.
- **Scope**: you study a **curriculum subtopic** (chosen from Progress) or use **free study**, which is the ADR-0008 free-text fields, still available. Prompts receive the subject as e.g. "DAT General Chemistry", so the tutor and quiz know the exam level.
- **Progress tab**: a collapsible tree showing coverage (started) vs. mastery bars per subject and topic, plus a status pill and Learn / Quiz / **Test me** buttons per subtopic, with add/remove for custom items. It ends with **Export / Import**.
- **Resume**: the tab, scope, Learn conversation, Chat conversation, and open quiz question (answered or not) survive a reload (`src/session/resume.ts`), with a "Welcome back" note. A fresh visit opens on Progress.
- **Celebration**: a one-line 🎉 when a subtopic becomes mastered or a test-out passes. A failed test-out is framed as useful information, never as failure.
- **Tests**: the gate has 55 tests. They pin the official structure (including regression tests for the ADR-0004 list's errors), the mastery rules, that exports exclude the key, import validation, and resume across a reload.

**Phases 2–4 remain** (Action Items).

---

## Open Follow-ups

- [ ] Concern: as the build grows, the single-page app gains state. Watch localStorage size for resumed Learn conversations; the cap is about 5 MB per site.

---

## Action Items

- [x] Phase 1 — Owner: Claude (2026-11-19)
- [ ] Phases 2–4, each after Jana has used the previous phase — Owner: Claude, prioritized by Jana

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study coach request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: official outline extracted; phases laid out; scope and test-coverage questions opened
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers (all as recommended) via the Claude Code question dialog; Phase 1 implementation
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: Decision filled; Phase 1 built, tested (55), and deployed
- Outcome: `Draft → Partially Implemented`

---

## Links

- Supersedes (pending QST-COACH-SCOPE): parts of [ADR-0008](0008-general-purpose-study-assistant.md); picks up [ADR-0007](0007-study-tracker-and-adaptive-learning.md)
- Related: [ADR-0011](0011-learning-model-mastery-retention-and-signals.md), [ADR-0012](0012-study-planning-and-adhd-friendly-coaching.md), [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md) (earlier topic list, now corrected)
- Source: [ADA DAT User's Manual, March 2026 (PDF)](https://www.ada.org/-/media/project/ada-organization/ada/ada-org/files/education/dat_users_manual.pdf), Figures 1–4, pp. 31–34; test descriptions p. 2–3
