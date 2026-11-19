<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Study tracker and adaptive learning

- **Date**: 2026-11-19
- **Iteration**: 1
- **Status**: Draft
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Deferred until Learn and Quiz ship. This ADR records the request and its open questions so the later work starts from them instead of from memory. Its one current effect is that v1 quiz results are already recorded with subject, topic, and correctness.

---

## Originating Context

**Source**: `Human dump` — Jana's request, 2026-11-19 (quoted in full in [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md)). The relevant lines:

> - Study tracker: Records topics I struggle with so I can review them later.
> - Adaptive learning: Adjusts explanations and question difficulty based on my understanding.
>
> We can start with Learn mode and Quiz mode and add the other features later.

**Agency Grant**: Record now; decide later.

---

## Explicitation

**What I understand**:

1. **The tracker and adaptive learning share one input: evidence of understanding.** That evidence can be quiz accuracy per topic, self-reports after Learn mode, or both. Once the tracker exists, adaptivity is mostly a matter of feeding what it has recorded into the prompts.
2. **"Struggle" needs a definition**, for example "below 60% over your last 5 questions on a topic," or "you flagged it."
3. **The design already leans toward the tracker.** Stable outline topics (ADR-0004 QST-TOPICS), structured quiz results (ADR-0006 QST-QUIZ-FORMAT), and Learn mode's **Check yourself** (ADR-0005) all produce evidence the tracker can use.

**Confirm**: Jana, when this ADR is picked up.

---

## Questions

### QST-TRACKER-STORE: Where should your study history live?
- Status: deferred — picked up after Learn and Quiz ship
- Why asking: The tracker must survive closing the browser. The harness has no server. GitHub Pages serves only static files, as recorded in ADR-0001.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — this browser + export**: Saved in localStorage, with **Export** and **Import** buttons that move a JSON file between devices or back it up. No accounts and no server, but history is tied to one browser unless you export it.
- **B — sync service**: Stored in a hosted database (for example Supabase or Firebase) under a login, so it syncs across devices. Adds an account system and a third party holding your data.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — this browser + export** (provisional; revisit when this ADR is picked up). *Rationale*: This matches ADR-0002's no-server, browser-only design and the "keep it simple" constraint. Export covers backups. *Confidence*: 0.6 — because it depends on whether you study on more than one device. *If wrong*: if you regularly switch between a laptop and a phone, flip to B.

**ANS:** (by Jana Mourad)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-ADAPT-SIGNAL: What evidence should drive adaptive difficulty and explanation depth?
- Status: deferred — picked up after Learn and Quiz ship
- Why asking: "Based on my understanding" needs a measurable input before anything can adapt to it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — quiz accuracy**: Recent accuracy per topic sets the question difficulty and the depth of Learn explanations for that topic. Objective, but blind to topics you've only studied in Learn mode.
- **B — self-rating**: After each Learn explanation you tap **Got it**, **Mostly**, or **Still confused**. Covers Learn mode, but it's subjective, and people often overrate what they understand.
- **C — both**: Quiz accuracy where it exists, self-rating otherwise. When the two disagree (you rated a topic "Got it" but then missed its quiz questions), the topic is flagged, which is itself useful metacognitive feedback.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**C — both** (provisional). *Rationale*: The gap between how well you *think* you understand something and how you actually perform is exactly what a metacognition course studies, and only C measures it. *Confidence*: 0.6 — because it's the most complex option and is deferred anyway. *If wrong*: if self-ratings turn out to be noise, flip to A.

**ANS:** (by Jana Mourad)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

*Deferred.* Committed now: v1 quiz answers keep a record of `{subject, topic, correct, timestamp}`, so this ADR can start from real data.

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study assistant request, which explicitly deferred these features
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: recorded the request and two deferred questions
- Outcome: Draft

---

## Links

- Related ADRs: [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md), [ADR-0005](0005-learn-mode-explanation-design.md), [ADR-0006](0006-quiz-mode-question-format-and-feedback.md)
