<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Learn mode: explanation design

- **Date**: 2026-11-19
- **Iteration**: 1
- **Status**: Draft
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Learn mode is a conversation scoped to the chosen subject and topic, driven by a hidden tutor prompt. The shape of each explanation is pending Jana's answer.

---

## Originating Context

**Source**: `Human dump` — Jana's request, 2026-11-19 (quoted in full in [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md)). The relevant line:

> Learn mode: Explains difficult concepts in simple terms, step by step, with examples.

**Agency Grant**: Ask before implementing.

---

## Explicitation

**What I understand**:

1. **"Simple terms, step by step, with examples" is three explicit requirements.** Every option below meets all three. They differ in *structure* and *who leads*.
2. **Learn mode is multi-turn.** You ask about a concept, get an explanation, and can follow up ("why does that happen?", "simpler please") in the same conversation. Switching subject or topic starts a fresh conversation.
3. **The prompt stays DAT-anchored.** It explains at the depth the DAT tests and flags what the exam likes to trick you on. This is test prep, not a full textbook.

**Assumptions**:

- Difficulty adaptation is deferred to ADR-0007. In v1, you steer depth by asking ("simpler", "go deeper").

**Confirm**: Jana.

---

## Questions

### QST-LEARN-STYLE: What shape should a Learn-mode explanation take?
- Status: unanswered
- Why asking: This is the core teaching style you'll experience every session. You asked for simple terms, step by step, with examples, and all three options deliver that. The difference is how predictable the layout is and whether the tutor lectures or asks you questions.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — free tutor**: A patient-tutor prompt (simple terms, step by step, examples), with the model shaping each answer as it sees fit. Feels natural, but the layout varies from answer to answer.
- **B — fixed structure**: Every first explanation of a concept uses the same five sections: **Big idea** (1–2 sentences) → **Step by step** → **Example** (a worked DAT-style example) → **Common DAT trap** → **Check yourself** (one short question for you to answer). Follow-ups in the same conversation are answered freely, without the template.
- **C — Socratic**: The tutor first asks what you already know, then builds up the concept through guiding questions. Deepest engagement, but slowest, and it can feel tedious when you just need the answer the night before.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — fixed structure.** *Rationale*: A predictable layout is easier to scan and to review later. The **Common DAT trap** section targets the test-specific mistakes that general explanations skip. **Check yourself** turns each explanation into a quick retrieval check and gives a natural signal for ADR-0007's adaptive learning later. Because follow-ups are free-form, the template doesn't make small questions rigid. *Confidence*: 0.7 — because this is a learning-style preference, and you know how you learn. *If wrong*: if five sections feel heavy for quick questions, flip to A. If explanations aren't sticking, flip to C.

**ANS:** (by Jana Mourad)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

*Pending QST-LEARN-STYLE.*

---

## Open Follow-ups

- [ ] Future task: one-click "Explain simpler" / "Go deeper" buttons under each explanation. This is a small step toward ADR-0007 adaptivity.

---

## Action Items

- [ ] Write the Learn-mode system prompt per the answer, with subject, topic, and focus filled in from ADR-0004 — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study assistant request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the explanation-style question
- Outcome: Draft

---

## Links

- Related ADRs: [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md), [ADR-0006](0006-quiz-mode-question-format-and-feedback.md), [ADR-0007](0007-study-tracker-and-adaptive-learning.md)
