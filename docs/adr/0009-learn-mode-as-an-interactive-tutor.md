<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Learn mode as an interactive tutor

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Implemented
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Learn mode is now an interactive tutor. Each reply teaches one idea for a first-time learner (terms defined first, the why and how, an analogy or example, links to earlier ideas), ends with one check question, and waits; confusion gets a different explanation. The five-section template is gone (no roadmap), and diagrams are text drawn inside code blocks, with no new dependencies.

---

## Originating Context

**Source**: `Human dump (below)` — Jana's request, 2026-11-19.

> I want to improve the teaching style in Learn Mode. The current explanations don't feel intuitive enough.
>
> Please update the tutor's system instructions so that it:
>
> - Assumes the user is learning the concept for the first time.
> - Explains one concept at a time instead of overwhelming the user with information.
> - Defines unfamiliar terminology before using it.
> - Explains why and how something happens, rather than simply stating facts.
> - Uses simple analogies, real-world examples, and step-by-step breakdowns.
> - Connects new concepts to previously explained concepts.
> - Checks the user's understanding before moving on.
> - When a user expresses confusion, explains the concept differently instead of repeating the same explanation.
> - Uses diagrams and visual explanations when appropriate.
>
> I want it to feel like a patient, interactive personal tutor rather than a textbook or a generic chatbot.
>
> Please preserve the existing features, test the changes, and deploy the updated version.

**Agency Grant**: Rewrite the tutor instructions, test, and deploy. Existing features are preserved.

---

## Explicitation

**What I understand**:

1. **The request conflicts with [ADR-0005](0005-learn-mode-explanation-design.md)'s answer.** There, Jana chose the fixed five-section template (Big idea → Step by step → Example → Common mistake → Check yourself), delivered in one message. "One concept at a time" and "check understanding before moving on" describe the opposite rhythm: a short piece of explanation, a check question, a wait for the answer, then the next piece. A five-section message *is* the "overwhelming" format being asked against. QST-LEARN-FLOW asks which wins.
2. **"First time" and the subject's level need to be reconciled.** Since [ADR-0008](0008-general-purpose-study-assistant.md), the prompt matches the level implied by the subject ("graduate statistics"). The two are compatible: assume no prior knowledge of *this concept*, but let the subject's level decide how far the explanation eventually goes and which prerequisites can be assumed. A graduate student meeting a new idea still needs it built from the ground up, just faster.
3. **"Connects to previously explained concepts"** works within a Learn conversation, since the model sees the whole conversation. Across sessions there is nothing to connect to, because Learn conversations aren't saved (ADR-0003 declined persistence). That is a follow-up, not part of this change.
4. **"Diagrams" needs a rendering decision (QST-DIAGRAMS).** Today, model output is Markdown, sanitized by DOMPurify (ADR-0004, amending ADR-0002). Text sketches in code blocks already work. Drawn diagrams would need a diagram renderer.
5. **Preserved regardless:** the Quiz tab, the Chat tab, user-entered subject and topic, the model picker, key handling, and sanitized rendering. Only the Learn tab's tutor instructions and its start-of-conversation hint change.

**Assumptions**:

- Jana's ADR-0007 answers (made 2026-11-19 in her working tree, not yet committed) include self-rating as a signal of understanding. Ending each tutor turn with a check question fits that, but no rating capture is built here.

**Confirm**: Jana.

---

## Questions

### QST-LEARN-FLOW: Should Learn mode keep the five-section template?
- Status: answered
- Why asking: In ADR-0005 you chose a fixed five-section answer (Big idea → Step by step → Example → Common mistake → Check yourself), all in one message. Your new request asks for one concept at a time and a check before moving on. That means short turns that wait for you, which a five-section message can't do. This question decides which pattern Learn mode follows from now on.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — one step per turn**: Drop the template. Each tutor reply teaches one small idea: it defines any new term, explains why and how with an analogy or example, then asks one check question and stops. The next step comes only after your answer. Big idea, example, and common mistake still appear, but woven into the conversation where they fit.
- **B — template, slimmed**: Keep the five sections in one message, but shorter and following all the new rules (define terms first, analogies, why and how). The whole explanation still arrives at once, followed by a single check at the end.
- **C — roadmap, then one step per turn**: Like A, but the first reply opens with a two-to-four-item roadmap ("Here's the path: 1) … 2) … 3) …"), then teaches only step 1 and checks. Later turns go one step at a time, saying where you are on the roadmap ("Step 2 of 3"), and connect each step back to the earlier ones.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**C — roadmap, then one step per turn.** *Rationale*: Your request asks for one idea at a time with a check between, which only A and C deliver. B still sends everything at once. Between those two, C's short roadmap adds orientation without more content: you see where you're headed, and each step can be explicitly tied to the ones before (your "connects new concepts" item). *Confidence*: 0.65 — because this reverses your ADR-0005 choice, and whether a roadmap feels helpful or like overhead is a matter of taste. *If wrong*: if the roadmap feels like a lecture outline rather than a conversation, flip to A. If short turns feel slow when reviewing material you mostly know, flip to B.

**ANS:** (by Jana Mourad)
A — one step per turn, no roadmap (recommendation was C; Jana chose A). (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-DIAGRAMS: How should the tutor draw diagrams?
- Status: answered
- Why asking: You asked for diagrams and visual explanations where helpful. Today the app shows formatted text (Markdown) only, so any "diagram" has to be drawn out of characters. Real drawn diagrams need a rendering library, which has costs in download size and in security, since this is a page that holds your API key.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — text diagrams**: The tutor draws with characters in fixed-width blocks (arrows, boxes, simple cycles) and uses tables and step lists. Works today with no new code or dependencies, but model-drawn text art is often crude or misaligned.
- **B — drawn diagrams (Mermaid)**: The tutor can also write diagrams in Mermaid, a simple diagram language most models know well: flowcharts, cycles, timelines, sequences, and hierarchy trees. The app turns them into real drawings. The library is large (estimated at over 1 MB) but downloads only the first time a diagram appears. It runs in its strict security mode, and its output also passes through DOMPurify. If a diagram fails to draw, its text source is shown instead. Text sketches remain available for shapes Mermaid can't draw, such as a molecule.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — drawn diagrams (Mermaid).** *Rationale*: Flows and cycles (a cell cycle, a supply-and-demand shift, a recursion call stack) are where visuals help most, and they are exactly what Mermaid draws. Loading it only when a diagram appears keeps the first page load as fast as today. Strict mode plus a second DOMPurify pass keeps ADR-0002's sanitized-only rule. *Confidence*: 0.6 — because it adds the project's largest dependency and a new path from model output to the page, which you may reasonably not want. *If wrong*: if diagrams render unreliably or slowly in practice, or if you'd rather keep the dependency list minimal, flip to A.

**ANS:** (by Jana Mourad)
A — text diagrams only (recommendation was B; Jana chose A). (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Chosen

- **QST-LEARN-FLOW → A (one step per turn, no roadmap)**, **overriding** the recommendation of C. This supersedes ADR-0005's QST-LEARN-STYLE B.
- **QST-DIAGRAMS → A (text diagrams only)**, **overriding** the recommendation of B. No diagram library is added, and ADR-0002's sanitized-rendering boundary is unchanged.
- **Decided under the agency grant**: the tutor instructions (`learnSystemPrompt` in `src/study/prompts.ts`) are rewritten as ten numbered rules, one for each of Jana's nine points, plus "respond to the answer," which turns the check question into a real loop. "First time" is reconciled with the subject's level as in Explicitation 2. A quick factual question gets a direct answer plus an offer to explain the why, so the tutor doesn't make you walk through steps for one fact.
- **Supporting change**: code blocks now render as fixed-width, unwrapped, and side-scrolling, so text diagrams keep their alignment (CSS). A test asserts the renderer leaves diagram spacing intact.

**Trade-offs accepted**: Learning a whole topic takes more turns, and therefore more API calls, than a single five-section message. Text diagrams are only as tidy as the model draws them. Prompt quality has **not** been evaluated against a live model in this session, because no key was available. The tests verify the instructions and rendering, not the tutor's actual behavior.

### Consequences
- The Learn tab's start hint now describes the step-by-step rhythm and the "I'm confused" escape hatch.
- Quiz and Chat are unchanged.

---

## Open Follow-ups

- [ ] Future task: connect to concepts from *earlier sessions* (Explicitation 3). This needs Learn history to be saved, which ties into the ADR-0007 tracker.
- [ ] Future task: one-click **"Explain it another way"** / **"I'm confused"** buttons under tutor replies. These were already noted in ADR-0005, and the tutor instructions now handle such requests when typed.

---

## Action Items

- [x] Rewrite the Learn tutor instructions and the Learn tab's start hint — Owner: Claude
- [x] Apply the QST-LEARN-FLOW and QST-DIAGRAMS answers — Owner: Claude
- [ ] Test, commit, push, and verify the deploy — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's teaching-style request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the template-vs-turns conflict with ADR-0005 and the diagram rendering question
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers via the Claude Code question dialog; implementation
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: QST-LEARN-FLOW → A (overriding C); QST-DIAGRAMS → A (overriding B); tutor instructions rewritten; code-block CSS for diagrams; gate green (34 tests); ADR-0005 marked superseded
- Outcome: `Draft → Implemented`

---

## Links

- Supersedes (pending QST-LEARN-FLOW): [ADR-0005](0005-learn-mode-explanation-design.md) QST-LEARN-STYLE B
- Related: [ADR-0002](0002-openrouter-api-key-handling-in-the-browser.md) / [ADR-0004](0004-dat-study-assistant-scope-navigation-and-topics.md) (sanitized rendering), [ADR-0007](0007-study-tracker-and-adaptive-learning.md) (understanding signal), [ADR-0008](0008-general-purpose-study-assistant.md) (level inferred from subject)
