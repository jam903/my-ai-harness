<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Quiz mode: question format and feedback

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Each question is generated as a structured reply, with the model's worked solution written before the answer letter, then shown as five clickable choices and graded instantly. After every answer, all choices are explained.

---

## Originating Context

**Source**: `Human dump` — Jana's request, 2026-11-19 (quoted in full in [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md)). The relevant line:

> Quiz mode: Generates DAT-style multiple-choice questions one at a time and explains incorrect answers.

**Agency Grant**: Ask before implementing.

---

## Explicitation

**What I understand**:

1. **The biggest risk in an AI quiz is a wrong answer key.** If the model marks the wrong choice as correct, the quiz *teaches a wrong fact* and tells you you were mistaken. Everything about how questions are generated should reduce that risk.
2. **"Explains incorrect answers" can be read two ways.** It could mean explaining why each wrong *option* is wrong, or giving an explanation *when you answer incorrectly*. QST-QUIZ-FEEDBACK asks which you meant.
3. **"DAT-style" means** a single-best-answer question with five options (A–E), at undergraduate first-year-course level, often with plausible distractors built on common misconceptions. Five options is what most prep sources report; Kaplan and some sources say "four or five."
4. **Quiz results feed the future tracker (ADR-0007).** Each answered question should leave a record (subject, topic, right/wrong) even if v1 shows only a session score.

**Assumptions**:

- v1 difficulty is fixed at "typical DAT" level. Adapting it is deferred to ADR-0007.
- The session avoids repeats by sending the model the stems of questions already asked.
- A session score (for example 7/10) is shown in v1. It is cheap and motivating, and it is not yet the tracker.

**Confirm**: Jana.

---

## Questions

### QST-QUIZ-FORMAT: How does a quiz question get from the model to your screen, and how is it graded?
- Status: answered
- Why asking: This decides whether answer choices are clickable buttons that the app grades instantly, or a typed chat exchange. It also decides how much effort goes into catching wrong answer keys (Explicitation 1).
- Need: pick a letter (or override — any shape answers)

Options:
- **A — structured, solve first**: The app requests a structured reply containing the question, five choices, the model's **worked solution**, the **correct letter**, and a one-line explanation per choice. The solution is requested *before* the letter, so the model reasons before committing to an answer, which reduces wrong keys. Choices appear as buttons, the app grades instantly, and results are saved for the future tracker. One API call per question.
- **B — structured + second check**: Same as A, plus a second API call in which the model solves the question again without seeing the key. If the two answers disagree, the question is thrown out and a new one is generated. Most reliable answer keys, at roughly twice the cost and wait per question.
- **C — chat quiz**: The model writes the question as ordinary text, you type a letter, and the model grades you in the conversation. Nothing to parse, but there are no buttons, grading happens in prose, and the future tracker would have to guess what happened.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — structured, solve first.** *Rationale*: Clickable choices and instant grading match "simple, easy to navigate." Asking for the worked solution before the answer letter is the cheapest known way to reduce wrong keys, because it makes the model reason before it commits. B doubles the wait on *every* question to guard against an occasional error. Moving from A to B later is an addition, not a rewrite. A **Flag this question** button would let you mark a suspected bad key. *Confidence*: 0.75 — because the risk is real but rare with capable models, and the upgrade path is cheap. *If wrong*: if you catch wrong answer keys more than occasionally, flip to B.

**ANS:** (by Jana Mourad)
A — structured, solve first. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-QUIZ-FEEDBACK: What should you see after you pick an answer?
- Status: answered
- Why asking: Your request said "explains incorrect answers." That could mean explaining every wrong *option*, or explaining *when you get it wrong*. Each reading produces a different screen.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — explain everything, always**: After any answer, right or wrong, show the correct answer, why it's right, and why each of the four wrong choices is wrong.
- **B — focus on misses**: If you're **right**, show a short ✓ with why it's right, and keep the other choices' explanations collapsed under "Show all." If you're **wrong**, show why *your* choice is wrong and why the right one is right, with the remaining choices collapsed.
- **C — explain only mistakes**: A right answer gets just ✓ Correct. A wrong answer gets why yours is wrong plus the correct answer. Nothing else.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — focus on misses.** *Rationale*: A miss gets full attention on the specific misconception you just showed, which is where learning happens. A correct answer still gets one line of why, which guards against lucky guesses. Every distractor explanation is one click away, so nothing from A is lost. *Confidence*: 0.65 — because many DAT prep guides advise reviewing every distractor, which favors A. *If wrong*: if you find yourself clicking "Show all" every time, flip to A.

**ANS:** (by Jana Mourad)
A — explain everything, always (recommendation was B; Jana chose A). (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Chosen: structured, solve first (QST-QUIZ-FORMAT A); explain everything, always (QST-QUIZ-FEEDBACK A)

**Rationale**: On format, Jana accepted the recommendation. On feedback, **she overrode it**: the recommendation was B (focus on misses), and she chose A, a full explanation of every option after every answer. That matches the common DAT-prep advice to review every distractor, which the recommendation's Confidence clause had named as the case for A.

**Trade-offs accepted**: Wrong answer keys are reduced but not eliminated, because there is no second verification call. Every answer produces a longer feedback block.

### Consequences
- The model returns JSON: `{question, choices[5], solution, answer, explanations[5]}`, with `solution` before `answer`. The app validates the structure and retries once if the reply can't be parsed.
- After each answer, the screen shows a ✓ or ✗ verdict, the worked solution, and every choice with its explanation. The correct choice and your pick are both highlighted.
- A session score is shown. Each answered question is saved as `{subject, topic, correct, timestamp}` for ADR-0007.

---

## Open Follow-ups

- [ ] Concern: structured replies depend on the model following the requested format. `openrouter/auto` may route to a weaker model. The app should retry once on unparseable output, and the default quiz model may need to be something stronger than auto.
- [ ] Future task: a **Flag this question** button, which feeds a review list in ADR-0007.

---

## Action Items

- [ ] Implement quiz generation, grading, and feedback per the answers — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study assistant request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the format and feedback questions
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers via the Claude Code question dialog
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: QST-QUIZ-FORMAT → A; QST-QUIZ-FEEDBACK → A (overriding the B recommendation); Decision filled
- Outcome: `Draft → Accepted`

---

## Links

- Related ADRs: [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md), [ADR-0005](0005-learn-mode-explanation-design.md), [ADR-0007](0007-study-tracker-and-adaptive-learning.md)
- Sources: [Kaplan, What Is the DAT?](https://www.kaptest.com/study/dat/what-is-the-dental-admission-test-dat/); [Booster Prep, Format of the DAT](https://intercom.help/boosterprep/en/articles/2704900-format-of-the-dat)
