<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Learning model: mastery, retention, and signals

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Partially Implemented
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Each subtopic carries a status computed from evidence, separating **exposure** (you studied it) from **demonstrated mastery** (you answered correctly over time). Spaced reviews re-test with fresh AI questions, and missed concepts are re-tested with *different* questions. Open: the mastery rule, the review schedule, and how Learn reports understanding.

---

## Originating Context

**Source**: [ADR-0010](0010-dat-study-coach-scope-curriculum-and-phases.md) (Jana's request, quoted in full there), the "Learning and retention" and "Progress tracking" sections. It also picks up [ADR-0007](0007-study-tracker-and-adaptive-learning.md), where Jana answered in her working tree (not yet committed): **store** = "this browser" (export/import is now requested explicitly), **adaptation signal** = "c" (quiz accuracy *and* self-rating).

**Agency Grant**: Ask, then implement (status model in Phase 1; reviews, mistakes, and adaptation in Phase 2).

---

## Explicitation

**What I understand**:

1. **Exposure ≠ mastery.** Finishing a Learn conversation means you *saw* it. Mastery has to be *demonstrated*: correct answers, recalled later, not just right after studying. Answering correctly five minutes after a lesson measures short-term memory, not retention.
2. **The unit of tracking is the subtopic** (e.g. General Chemistry → Gases → Ideal gas law). It's small enough to finish in one ADHD-sized session, and the official outline defines it, so names stay stable for tracking (the fragmentation problem ADR-0008 left open).
3. **Spaced repetition fits AI-generated questions well.** Classic flashcard schedulers track individual *cards*. Here every review can be a *new* question on the same subtopic, which is also how "revisit incorrect answers using different questions" works: the missed question is kept, and its *concept* is re-tested with new wording and a new setup.
4. **Learn must report something to count as tracking.** Today Learn is free conversation, and the app can't tell what was covered or whether your check answers were right. QST-LEARN-SIGNAL asks how it should report that.
5. **Status labels stay neutral.** Labels are *Not started → Learning → Practicing → Mastered*, plus *Review due*. Never "forgotten" or "failing."

**Confirm**: Jana.

---

## Questions

### QST-MASTERY: When should a subtopic count as "mastered"?
- Status: answered
- Why asking: You asked to separate studying something from actually mastering it. "Mastered" should mean you can still answer correctly later, not just right after a lesson. A rule that's too strict never lets you feel progress; one that's too loose turns "mastered" into a word that means nothing.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — evidence only**: Mastered = at least 4 of your last 5 quiz answers on the subtopic are correct, **and** correct answers on at least 2 different days. Phase 2 adds: and your latest spaced review was correct. Nothing can be marked mastered by hand.
- **B — evidence + test out**: Same rule as A, plus a **"I already know this — test me"** button that runs a 5-question check. Scoring 4/5 or better marks it mastered right away, and a spaced review later confirms it. Good for material you learned in class, so you don't grind through it again.
- **C — self-marked**: You mark subtopics as studied or mastered yourself, and quiz results are shown alongside but don't decide anything.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — evidence + test out.** *Rationale*: "Distinguish exposure from demonstrated mastery" rules out C. A alone would make you re-earn mastery on material you already know from coursework, which is the slog that kills motivation. B's test-out is still demonstration, just faster. The later spaced review keeps a lucky test-out from sticking. *Confidence*: 0.75 — because the thresholds (4/5, 2 days) are reasonable defaults, not research-derived numbers. *If wrong*: if test-outs feel like a loophole you're tempted to abuse, flip to A.

**ANS:** (by Jana Mourad)
B — evidence + test out. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-SRS: How should spaced reviews be scheduled?
- Status: answered
- Why asking: Spaced repetition means reviewing just before you'd forget, at intervals that grow when you remember and shrink when you don't. There are simple and sophisticated ways to schedule it, and the sophisticated ones are harder to understand and to trust.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — simple boxes (Leitner)**: Each subtopic sits in one of five boxes, reviewed after 1, 3, 7, 14, and 30 days. A correct review moves it up a box; a miss moves it back to box 1. Intervals shrink automatically as your exam approaches, so everything gets reviewed at least once more before test day. Easy to understand ("Gases: next review in 7 days").
- **B — adaptive algorithm (FSRS)**: The modern algorithm behind recent Anki versions (the open-source `ts-fsrs` library). It estimates your personal forgetting curve for each subtopic and picks intervals precisely. It's more efficient in theory, but opaque, and it's tuned for exact flashcards rather than a fresh question each time.
- **C — exam-countdown only**: No individual intervals. Every studied subtopic is reviewed in rotation, weakest first, at a pace set by the days left.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — simple boxes (Leitner).** *Rationale*: FSRS's precision assumes the same card each time, but here every review is a new question (Explicitation 3), which weakens its main advantage. Leitner is transparent, and for motivation it matters that you can see *why* something is due. The exam-date squeeze in A gives C's countdown benefit without losing spacing. *Confidence*: 0.65 — because FSRS is genuinely better at scheduling exact flashcards, and you may prefer that. *If wrong*: if the review load feels badly paced after a few weeks, flip to B.

**ANS:** (by Jana Mourad)
A — simple boxes (Leitner). (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-LEARN-SIGNAL: How should Learn mode report what you understood?
- Status: answered
- Why asking: The tutor checks your understanding every turn (ADR-0009), but the app can't currently see the results. Tracking "concepts covered in Learn" and "concepts I struggle with" needs a signal. Your ADR-0007 answer ("c") chose quiz accuracy *and* self-rating as inputs.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — tutor reports automatically**: The tutor adds a short hidden note at the end of each reply, stating the subtopic, whether your last check answer was correct, partly correct, or incorrect, and the concept involved. The app reads the note and strips it before display. No extra taps and no extra cost, but it depends on the model including the note consistently (the app copes when it doesn't).
- **B — you rate it**: When you finish a Learn session, tap **Got it / Shaky / Confused**. Reliable and quick, but it's self-judgment, and people (with or without ADHD) often over- or under-rate what they understand.
- **C — both**: A for each check answer, plus a one-tap B rating at session end. When they disagree (you tap "Got it" but missed the checks), the subtopic is flagged as worth reviewing.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**C — both.** *Rationale*: This matches your ADR-0007 answer: demonstrated understanding (the tutor grading your check answers) plus how you feel about it (your rating). The gap between the two is useful in its own right, and for a metacognition student it's the most interesting signal there is. The rating is one optional tap, so it doesn't add friction. *Confidence*: 0.7 — because A's reliability depends on the model, and I haven't measured it with a live key. *If wrong*: if the hidden notes turn out unreliable in practice, drop to B.

**ANS:** (by Jana Mourad)
C — both (tutor reports + self-rating). (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Chosen by Jana: QST-MASTERY B (evidence + test-out), QST-SRS A (Leitner boxes), QST-LEARN-SIGNAL C (tutor reports + self-rating)

**Built in Phase 1** (`src/progress/model.ts`, `store.ts`):
- A Learn conversation's first reply on a subtopic counts as one **exposure**.
- Each quiz answer is stored as **evidence**, with a timestamp and whether it was a quiz or test-out answer.
- **Mastered** = ≥4 of the last 5 answers correct, with correct answers on ≥2 different calendar days, **or** the latest test-out scored ≥4/5. **Test me** runs 5 questions.
- Free-study quiz answers still go to the ADR-0007/0008 `quiz-results` log, since they have no subtopic.

**Phase 2** adds the Leitner schedule (boxes at 1/3/7/14/30 days, squeezed toward the exam date), the "latest spaced review correct" condition on mastery (which also confirms test-outs), the mistake bank, Learn's hidden progress notes plus the end-of-session rating, and adaptive difficulty. Jana's ADR-0007 answers (in her working tree) are consistent with all of this.

Also decided under the agency grant:
- The subtopic is the unit of tracking.
- Status is **computed** from stored evidence (Learn sessions, quiz attempts with timestamps), never stored directly, so changing a rule never corrupts old data.
- Labels are neutral (Explicitation 5).
- The mistake bank (Phase 2) stores each missed question's stem, your choice, the correct choice, and the explanation. A retest prompt passes the *concept* and forbids reusing the wording.

---

## Action Items

- [x] Phase 1: evidence storage and status computation — Owner: Claude (2026-11-19)
- [ ] Phase 2: review scheduler, mistake bank, Learn signal, adaptive difficulty — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study coach request (ADR-0010)
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the mastery, scheduling, and Learn-signal questions
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers (all as recommended); Phase 1 implementation
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: Decision filled; status model and test-out built
- Outcome: `Draft → Partially Implemented`

---

## Links

- Picks up: [ADR-0007](0007-study-tracker-and-adaptive-learning.md)
- Related: [ADR-0010](0010-dat-study-coach-scope-curriculum-and-phases.md), [ADR-0012](0012-study-planning-and-adhd-friendly-coaching.md), [ADR-0009](0009-learn-mode-as-an-interactive-tutor.md) (check-and-wait tutor), [ADR-0006](0006-quiz-mode-question-format-and-feedback.md) (structured quiz)
