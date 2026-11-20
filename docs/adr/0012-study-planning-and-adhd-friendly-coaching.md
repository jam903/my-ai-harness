<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Study planning and ADHD-friendly coaching

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Phase 3 adds a **Today** screen that says exactly what to do next, built from your exam date, progress, due reviews, and weak areas. It offers 5/10/15/25-minute sessions and a low-motivation "one small thing" mode, absorbs missed days without guilt or backlog, and celebrates milestones rather than streaks. Open: how the plan is computed, and what counts as "high-yield."

---

## Originating Context

**Source**: [ADR-0010](0010-dat-study-coach-scope-curriculum-and-phases.md) (Jana's request, quoted in full there), the "Personalized study planning" and "ADHD-friendly experience" sections.

**Agency Grant**: Ask, then implement in Phase 3. Phase 1 gets only a minimal "continue where you left off."

---

## Explicitation

**What I understand**:

1. **"Tell me exactly what to study when I open the app" is the core ADHD feature.** It removes the deciding step, which is often where starting fails. The Today screen should show **one** primary task, with alternatives tucked away.
2. **Missed days must not create debt.** Many planners carry missed work forward, so a two-day break becomes a wall of overdue tasks. Here, every day's plan is recomputed from *today's* state. Overdue reviews are spread over the coming days at a capped daily amount. No "you missed N days" message and no red counters appear anywhere.
3. **No streaks.** Celebrations mark *meaningful* progress: a subtopic mastered, a topic fully covered, a review remembered after a long gap, or a weak area that improved. They are never tied to consecutive days.
4. **The ADA does not publish per-topic "high-yield" weights.** The official manual gives item counts only per *section* (Biology 40, General Chemistry 30, Organic Chemistry 30, Quantitative Reasoning 40, PAT 90, Reading Comprehension 50). Any finer high-yield ranking is a third-party estimate (QST-HIGH-YIELD).
5. **Session lengths map to task sizes**: 5 min ≈ one Learn step or 2–3 review questions; 10 min ≈ one subtopic's review set; 15 min ≈ a new subtopic's first Learn pass; 25 min ≈ new material plus a review block.

**Confirm**: Jana.

---

## Questions

### QST-PLAN-ENGINE: How should the daily plan be decided?
- Status: answered
- Why asking: The plan has to weigh your exam date, what's due for review, your weak areas, what you haven't started, and the time you choose. That can be done by fixed rules inside the app or by asking the AI each day. The choice trades predictability against flexibility.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — rules in the app**: A fixed recipe runs on your device: due reviews first (capped per day), then weak areas, then the next new subtopics, paced so the whole syllabus is covered before your exam with time left for review. Each task shows *why* it was chosen ("due for review", "weak area", "new — on pace for exam"). Instant, free, works offline, and behaves the same every day.
- **B — AI-generated plan**: Each day, your progress summary goes to the model, which writes the plan. More flexible and conversational, but it costs an API call each time, can vary from day to day, and can't be tested.
- **C — rules + AI pep note**: A's plan, plus one short AI-written message framing today's task warmly and personally.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — rules in the app.** *Rationale*: For "tell me exactly what to do," predictability is the feature: the same state gives the same plan, and every task shows its reason, so the plan earns trust instead of feeling arbitrary. A is fully testable, including the missed-days behavior that must never produce guilt, and costs nothing per day. C's pep note can be added later without changing A. *Confidence*: 0.75 — because model-written encouragement might motivate you more than I expect. *If wrong*: if the Today screen feels mechanical after a week, flip to C.

**ANS:** (by Jana Mourad)
A — rules in the app. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-HIGH-YIELD: What should "high-yield" mean when prioritizing topics?
- Status: answered
- Why asking: You asked to prioritize high-yield topics. The ADA publishes only how many questions each *section* has (Biology 40, General Chemistry 30, and so on), not which topics within a section appear most. Any finer ranking is an estimate from prep companies or student consensus, not official data.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — official counts only**: Time is split by the official section item counts (Biology gets the most), and evenly across topics within a section. Nothing is guessed, but within Biology, "Viruses" gets as much time as "Structure and Function of Systems."
- **B — estimated weights, labeled**: A plus per-topic weights from common prep consensus (e.g. Structure and Function of Systems and Cell and Molecular Biology weigh more than Diversity of Life), each shown as an *estimate*. You can raise or lower any topic's priority. Coverage is still guaranteed: every subtopic is scheduled at least once.
- **C — your weaknesses only**: Ignore yield; the plan is driven by official counts plus your own quiz performance, so weak areas get more time.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — estimated weights, labeled.** *Rationale*: You explicitly asked for high-yield prioritization, which A can't deliver. B does it honestly: estimates are labeled as estimates, you can override them, and full coverage is guaranteed. Weak-area weighting (C's idea) applies under every option through ADR-0011's signals; this question is only about *yield*. *Confidence*: 0.55 — because the estimates would come from Claude's general knowledge of prep consensus, not a verified source. That makes this a judgment you're better placed to make or check. *If wrong*: if you'd rather nothing in the plan rest on unofficial numbers, flip to A.

**ANS:** (by Jana Mourad)
B — estimated weights, labeled. (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Chosen by Jana: QST-PLAN-ENGINE A (rules in the app), QST-HIGH-YIELD B (estimated weights, labeled, adjustable, with full coverage guaranteed)

Phase 1 delivered only "resume exactly where you left off" (ADR-0010). The rest is Phase 3. Decided under the agency grant (to be built in Phase 3):
- The **Today** screen is the landing tab. It shows one primary task with its reason, plus "something smaller" and "something else" links.
- Session lengths: **5, 10, 15, 25 minutes**, with a gentle timer that suggests stopping rather than forcing it.
- **Low-motivation mode** ("Just one small thing"): one task of 2–5 minutes, usually a single review question or one Learn step. Finishing it counts and says so, with no "keep going?" pressure.
- Missed days are absorbed (Explicitation 2), and celebrations are milestone-based (Explicitation 3). The interface stays minimal, with one primary action per screen.

---

## Action Items

- [x] Phase 1: a minimal "Continue where you left off" — Owner: Claude (2026-11-19, as full resume)
- [ ] Phase 3: exam date, plan engine, Today screen, sessions, low-motivation mode, celebrations — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study coach request (ADR-0010)
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the plan-engine and high-yield questions; recorded the ADHD-friendly design decisions
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers (all as recommended)
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: Decision filled
- Outcome: `Draft → Accepted`

---

## Links

- Related: [ADR-0010](0010-dat-study-coach-scope-curriculum-and-phases.md), [ADR-0011](0011-learning-model-mastery-retention-and-signals.md)
- Source: ADA DAT User's Manual (March 2026), section item counts, pp. 2–3
