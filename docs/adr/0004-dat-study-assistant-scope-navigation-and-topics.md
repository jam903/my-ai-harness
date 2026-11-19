<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# DAT study assistant: scope, navigation, and topics

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Subject dropdown and three tabs (Learn | Quiz | Chat). Topics come from a DAT outline list plus an optional free-text focus. Model replies render as Markdown, sanitized by DOMPurify. The tracker and adaptivity come later (ADR-0007).

> **Superseded in part by [ADR-0008](0008-general-purpose-study-assistant.md) (2026-11-19):** the assistant is now general-purpose. The fixed subject and outline-topic lists are replaced by free-text subject and topic fields, the focus field is folded into the topic field, and `src/dat/` is now `src/study/`. The three tabs and sanitized Markdown still stand. This record is kept as written, as history (ADR-0008 QST-ADR-HISTORY).

---

## Originating Context

**Source**: `Human dump (below)` — Jana's request, 2026-11-19.

> I would like to customize my existing harness into a personalized DAT study assistant. I am currently studying biology and general chemistry for dental school admissions.
>
> I want the harness to have the following features:
>
> - Subject selection: Biology, General Chemistry, and Organic Chemistry.
> - Learn mode: Explains difficult concepts in simple terms, step by step, with examples.
> - Quiz mode: Generates DAT-style multiple-choice questions one at a time and explains incorrect answers.
> - Study tracker: Records topics I struggle with so I can review them later.
> - Adaptive learning: Adjusts explanations and question difficulty based on my understanding.
>
> I want the interface to be simple, clean, and easy to navigate.
>
> Please create ADR questions for the important design decisions before implementing anything. We can start with Learn mode and Quiz mode and add the other features later.

**Agency Grant**: Ask before implementing; build Learn and Quiz first; tracker and adaptivity later.

---

## Explicitation

**What I understand**:

1. **Two axes organize everything: subject × mode.** The cross-cutting decisions (navigation, topics, formatting) live here. Each mode has its own ADR: Learn is [ADR-0005](0005-learn-mode-explanation-design.md) and Quiz is [ADR-0006](0006-quiz-mode-question-format-and-feedback.md). Tracker and adaptivity are recorded now but deferred to [ADR-0007](0007-study-tracker-and-adaptive-learning.md).
2. **Each mode is a hidden system prompt that the app writes.** This does not contradict [ADR-0003](0003-chat-interface-scope-and-model-selection.md), which declined a *user-editable* system prompt box. That decision was about exposing the prompt. This one is about the app owning it.
3. **The future tracker needs stable topic names.** "Records topics I struggle with" only works if the same topic is always recorded under the same name, so the topic decision below shapes ADR-0007.
4. **Learn and Quiz text is longer and more structured than chat replies.** It has numbered steps, bold key terms, and chemistry notation. That reopens [ADR-0002](0002-openrouter-api-key-handling-in-the-browser.md)'s text-only rendering rule (QST-FORMATTING).
5. **Out of scope:** the DAT's other sections (Perceptual Ability, Reading Comprehension, Quantitative Reasoning). Jana named only the three sciences.

**Assumptions**:

- Single user (Jana), on her own browser. Key handling (ADR-0002) and the model picker (ADR-0003) carry over unchanged.
- The DAT's Survey of the Natural Sciences has 100 items: 40 Biology, 30 General Chemistry, and 30 Organic Chemistry. That split is reported consistently by prep sources (Kaplan, Booster Prep). The official ADA DAT User's Manual PDF could not be machine-read on 2026-11-19, so it was not confirmed there.

**Confirm**: Jana.

---

## Questions

### QST-NAV: How do you switch subject and mode, and does the original free chat stay?
- Status: answered
- Why asking: This is the whole layout of the app. You asked for "simple, clean, and easy to navigate," and you'll switch often, for example from a missed quiz question straight into Learn mode on that topic. The harness was originally built for your metacognition class, so it matters whether you still need the plain, unrestricted chat.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — two tabs**: A top bar with a Subject dropdown and two tabs, **Learn | Quiz**. The original free chat is removed. Learn mode is itself a conversation, so follow-up questions still work there.
- **B — three tabs**: The same layout plus a third tab, **Chat**, which is the existing unrestricted chat, kept for off-syllabus or class use. It costs almost nothing because the code already exists.
- **C — start screen**: A landing page with three subject cards; picking one shows Learn / Quiz buttons, and **Back** returns to the start. More guided, but every switch is one click longer.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — three tabs.** *Rationale*: The plain chat already works and is the tool the harness was originally built for (ADR-0003). Keeping it as one extra tab costs a tab label, not code. Tabs make Learn ↔ Quiz a single click, which C does not. *Confidence*: 0.65 — because only you know whether the harness still serves the metacognition class. *If wrong*: if this is now purely a DAT tool and the extra tab feels like clutter, flip to A.

**ANS:** (by Jana Mourad)
B — three tabs (Learn | Quiz | Chat). (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-TOPICS: Within a subject, how do you choose what to study?
- Status: answered
- Why asking: Learn mode needs to know what to explain, and Quiz mode needs to know what to ask about. The answer also decides what the future study tracker (ADR-0007) can record. If topics are free text, "enzymes," "Enzyme kinetics," and "enzymes!" are three different topics to a tracker.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — fixed outline list**: Each subject has a dropdown of DAT outline topics, for example Biology: Cell & Molecular Biology, Genetics, Evolution/Ecology; General Chemistry: Stoichiometry, Acids & Bases, Thermodynamics. Each list also has **Mixed (all topics)**. Names stay stable, which suits the tracker, but you can't narrow below an outline heading.
- **B — free text**: You type any topic ("glycolysis", "SN1 vs SN2"). Most flexible, but the tracker would see near-duplicates as separate topics.
- **C — outline list + optional focus**: You pick an outline topic as in A, then optionally type a narrower focus ("Genetics → Hardy-Weinberg"). The tracker records the outline topic, and the focus only steers the model.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**C — outline list + optional focus.** *Rationale*: The outline gives the future tracker stable categories (Explicitation 3). The free-text focus gives Learn mode the precision it needs, since you'll usually ask about a specific concept, not a whole outline heading. B gives up the tracker, and A gives up precision. *Confidence*: 0.75 — because both needs are explicit in your request. *If wrong*: if the outline headings feel too coarse to be useful even as categories, flip to B.

**ANS:** (by Jana Mourad)
C — outline list + optional focus. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-FORMATTING: How should Learn and Quiz text be displayed?
- Status: answered
- Why asking: ADR-0002 currently requires every model reply to be inserted as plain text. That rule ensures a reply can never run code on the page that holds your API key. Step-by-step explanations with bold key terms and chemistry notation read much better formatted, and models tend to write Markdown (`**bold**`, `1.` lists), which plain text shows as raw symbols.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — plain text, Unicode chemistry**: Keep ADR-0002 exactly as is. The prompts tell the model not to use Markdown and to write chemistry in Unicode (H₂O, →, ⇌, ΔH°). No new code and no new risk, but models sometimes slip in raw `**asterisks**` anyway.
- **B — Markdown, sanitized**: Render Markdown (bold, lists, headings, tables) with the `marked` library, and clean the result with `DOMPurify` before it reaches the page. Cleanest look. It adds two small, widely used dependencies and changes ADR-0002's rule from "plain text only" to "sanitized HTML only."
- **C — small custom renderer**: About 40 lines of our own code that handle only bold, lists, and paragraphs, building page elements directly with no HTML parsing. No dependencies and no parsing risk, but it's our own code to maintain, and tables or headings would still show as raw symbols.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**B — Markdown, sanitized.** *Rationale*: Numbered steps and bold key terms are the core of Learn mode (ADR-0005), and raw asterisks work against "simple, clean." DOMPurify is the standard browser sanitizer and is heavily tested, so this trades a small, well-understood risk for readability. Under any option, the chemistry prompts ask for Unicode notation; rendering LaTeX (KaTeX) is not proposed. *Confidence*: 0.6 — because this trades a hard guarantee for a soft one, and preferring A is reasonable. *If wrong*: if you'd rather keep ADR-0002's guarantee absolute, flip to A.

**ANS:** (by Jana Mourad)
B — Markdown, sanitized (marked + DOMPurify). (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Chosen: three tabs (QST-NAV B); outline list + optional focus (QST-TOPICS C); sanitized Markdown (QST-FORMATTING B)

**Rationale**: Jana accepted all three recommendations. The plain chat stays as a tab for class use. Stable outline topics prepare the future tracker, and a free-text focus gives Learn mode precision. Formatted explanations read cleanly, with DOMPurify as the safety boundary.

**Trade-offs accepted**: Two new runtime dependencies (`marked`, `dompurify`). ADR-0002's rule is amended from "plain text only" to "sanitized HTML only." The topic headings are only partly verified (see Open Follow-ups).

### Consequences
- The Subject and Topic selectors apply to Learn and Quiz. The Chat tab ignores them.
- Changing the subject or topic starts a fresh Learn conversation and a fresh quiz.
- The topic lists live in one data file (`src/dat/topics.ts`) so they are easy to correct.
- The user's own messages stay plain text. Only model output is rendered as Markdown.

---

## Open Follow-ups

- [ ] Unverified assumption: the topic lists will come from the ADA DAT outline. Before building them, check them against the current DAT Guide or User's Manual from ada.org. The PDF could not be machine-read on 2026-11-19, so either Jana checks it or `brew install poppler` lets Claude extract it.
  - NOT: partial check, 2026-11-19. One secondary page ([siue.edu/~cbwilso/DATtopics.htm](https://siue.edu/~cbwilso/DATtopics.htm), undated and not citing an ADA edition) supports the *content* of every candidate heading but not their exact wording. The Kaplan pages returned HTTP 403. Two gaps were noted. First, that page lists organic "analysis" (IR, ¹H NMR, chemical tests) as its own area, which the candidate list lacks. Second, it does not list "Laboratory" under General Chemistry. The lists were shipped as candidates; Jana should check them against her study materials.

---

## Action Items

- [ ] Verify the outline topic lists against the current ADA DAT Guide — Owner: Claude, confirmed by Jana
- [ ] Implement navigation, topic selection, and rendering per the answers — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: Jana's DAT study assistant request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the navigation, topic, and formatting questions
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers via the Claude Code question dialog
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: QST-NAV → B, QST-TOPICS → C, QST-FORMATTING → B; Decision filled; partial topic verification noted
- Outcome: `Draft → Accepted`

---

## Links

- Related ADRs: [ADR-0002](0002-openrouter-api-key-handling-in-the-browser.md) (amended if QST-FORMATTING → B or C), [ADR-0003](0003-chat-interface-scope-and-model-selection.md), [ADR-0005](0005-learn-mode-explanation-design.md), [ADR-0006](0006-quiz-mode-question-format-and-feedback.md), [ADR-0007](0007-study-tracker-and-adaptive-learning.md)
- Sources: [Kaplan, What's Tested on the DAT: Survey of Natural Sciences](https://www.kaptest.com/study/dat/whats-tested-dat-survey-natural-sciences); [ADA DAT User's Manual (PDF)](https://www.ada.org/-/media/project/ada-organization/ada/ada-org/files/education/dat_users_manual.pdf)
