<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# OpenRouter API key handling in the browser

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: The key is pasted into the page at runtime, kept in `localStorage` until **Forget key** is clicked, sent only to openrouter.ai, and never present in source, build, or git.

---

## Originating Context

**Source**: `Human dump` — Jana's opening request, 2026-11-19 (quoted in full in [ADR-0001](0001-stack-build-and-deployment-to-github-pages.md)). The relevant line:

> Allow me to enter my own OpenRouter API key privately without committing it to GitHub.

**Agency Grant**: Recommend; Jana decides.

---

## Explicitation

**What I understand**:

1. **"Not committed" is guaranteed by design.** The key is never an environment variable or a build-time constant. A key baked into a static site's JavaScript would be readable by anyone, even if it were never committed. So the only safe place for it is the visitor's own browser, entered at runtime.
2. **"Privately" has a second edge.** A key stored in the browser can be read by any script running on the page. The main way a hostile script could get onto the page is **AI output rendered as HTML**. So model replies must be inserted as plain text (`textContent`), never as HTML (`innerHTML`). That constraint follows from this ADR and binds ADR-0003.
3. The key travels only to `https://openrouter.ai`, in the `Authorization: Bearer` header.

**Assumptions**:

- Jana uses one personal browser profile for the class.

**Confirm**: Jana.

---

## Questions

### QST-KEY-STORAGE: Where should the browser keep your OpenRouter key?
- Status: answered
- Why asking: This trades convenience against how long the key sits on the device. The key is never in git or the deployed code under any option. The question is only whether you must paste it again on each visit.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — remember (localStorage)**: Saved in this browser until you click **Forget key**. You paste it once per browser. It stays on disk in your browser profile.
- **B — per-tab (sessionStorage)**: Kept until the tab closes. You paste it at the start of each sitting. It survives page reloads.
- **C — memory only**: Kept only in the running page. Gone on reload, so you re-paste after every refresh. Smallest exposure, most friction.
- **D — OpenRouter login (OAuth PKCE)**: A "Connect with OpenRouter" button sends you to openrouter.ai, which hands back a key generated for this app. No copy-pasting, but more code, and the returned key still has to be stored somewhere (A/B/C again).

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — remember (localStorage), with a visible Forget key button.** *Rationale*: For a personal class tool on your own laptop, re-pasting every session (B, C) is friction without a real threat model behind it. D adds an auth flow and still lands on A–C. Two cheap mitigations matter more than the storage choice. First, render replies as text only (Explicitation 2). Second, **create a dedicated OpenRouter key with a credit limit** for this harness, so the worst case of a leak is bounded. *Confidence*: 0.7 — because the choice depends on where you'll use it, which only you know. *If wrong*: if you'll use shared or lab computers, flip to B.

**ANS:** (by Jana Mourad)
A — remember (localStorage), with a Forget key button. (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Chosen: remember in localStorage, with a Forget key button (QST-KEY-STORAGE A)

**Rationale**: This is a personal tool on Jana's own browser, so re-pasting the key each session adds friction without protecting against a real threat. A dedicated, credit-limited key bounds the worst case.

**Trade-offs accepted**: The key persists on disk in the browser profile. If a script were ever injected into the page, it could read the key, which is why model output is rendered as text only.

Fixed regardless of the answer: the key is entered at runtime, it is never in source, build, or git, it is sent only to openrouter.ai, and model output is rendered as text, not HTML.

---

## Action Items

- [ ] Jana: create a dedicated OpenRouter key with a credit limit at https://openrouter.ai/settings/keys — Owner: Jana
- [ ] Implement the key field, storage, and Forget key button per the answer — Owner: Claude

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: initial draft from Jana's opening request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the storage question; recorded the text-only-rendering constraint
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answer via the Claude Code question dialog
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: QST-KEY-STORAGE → A; Decision filled
- Outcome: `Draft → Accepted`

---

## Links

- Related ADRs: [ADR-0001](0001-stack-build-and-deployment-to-github-pages.md), [ADR-0003](0003-chat-interface-scope-and-model-selection.md)
