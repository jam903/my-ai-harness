<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Chat interface scope and model selection

- **Date**: 2026-11-19
- **Iteration**: 1
- **Status**: Draft
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: A single-page chat: a message list, an input, and a send button, calling OpenRouter's `/api/v1/chat/completions`. Which extras ship in v1 is pending Jana's answer.

---

## Originating Context

**Source**: `Human dump` — Jana's opening request, 2026-11-19 (quoted in full in [ADR-0001](0001-stack-build-and-deployment-to-github-pages.md)). The relevant line:

> Provide a simple chat interface where I can send messages and receive AI responses.

**Agency Grant**: Recommend a minimal v1; Jana picks the extras.

---

## Explicitation

**What I understand**:

1. **The baseline is fixed.** It has a conversation shown as alternating messages, an input with Send (Enter sends, Shift+Enter adds a newline), and a full-history request on each turn, since the API is stateless. API errors (bad key, no credits, unknown model) appear as readable messages in the chat.
2. **Replies render as plain text** (constraint from [ADR-0002](0002-openrouter-api-key-handling-in-the-browser.md)), so no Markdown formatting in v1.
3. **The class context matters.** A *metacognition* harness is a tool for observing how a model responds. Features that make the *conditions* of a response visible and controllable (which model, what instructions) are worth more here than polish.

**Assumptions**:

- Without a model picker, the app uses `openrouter/auto` (OpenRouter's router, which picks a model per request and reports which one it used). It is a stable ID that will not go stale.

**Confirm**: Jana.

---

## Questions

### QST-V1-SCOPE: Which extras ship in v1, beyond the bare chat?
- Status: unanswered
- Why asking: Each extra adds code between you and a first deploy. The bare chat is a message list, an input, Send, and a fixed model (`openrouter/auto`). Everything here is optional and can come later.
- Need: pick any letters (none is a valid answer), or override

Options:
- **A — model picker**: A text field for the OpenRouter model ID (e.g. `anthropic/…`, `openai/…`), with suggestions loaded live from OpenRouter's public model list, so no IDs are hardcoded to go stale. Each reply is labeled with the model that actually answered.
- **B — system prompt box**: An optional text area whose contents are sent as the `system` message on every turn, so you can vary the model's instructions and observe the effect.
- **C — streaming replies**: Text appears word by word as it is generated instead of all at once. Nicer to watch, and adds server-sent-event parsing code.
- **D — keep conversation across reloads**: Save the chat in the browser so a refresh doesn't erase it. Without this, a **New chat** button and reloads clear it.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A + B — model picker and system prompt; defer C and D.** *Rationale*: A and B together are about 40 lines, and they are the two variables a metacognition class most plausibly manipulates: who is answering, and under what instructions (Explicitation 3). C is pure UX and adds the most code (stream parsing). D raises a data-retention question about storing transcripts that deserves its own decision. *Confidence*: 0.65 — because I'm inferring the course's exercises from its name. *If wrong*: if your assignments involve long sessions that must survive a refresh, add D. If you'll watch reasoning unfold live, add C.

**ANS:** (by Jana Mourad)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

*Pending QST-V1-SCOPE.*

---

## Action Items

- [ ] Implement the baseline chat plus chosen extras — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: initial draft from Jana's opening request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the v1-scope question; recorded the baseline and default model
- Outcome: Draft

---

## Links

- Related ADRs: [ADR-0001](0001-stack-build-and-deployment-to-github-pages.md), [ADR-0002](0002-openrouter-api-key-handling-in-the-browser.md)
