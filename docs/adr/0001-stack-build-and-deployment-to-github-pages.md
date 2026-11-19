<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs4ai
  plugin: adr@adrs4ai
-->

# Stack, build, and deployment to GitHub Pages

- **Date**: 2026-11-19
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jana Mourad, Claude (Opus 5.5)

**TL;DR**: Vite (vanilla-ts) builds a static single-page app that a GitHub Actions workflow deploys to Pages on every push to `main`; the gate is `npm run check` (typecheck + Vitest + build).

---

## Originating Context

**Source**: `Human dump (below)` — Jana's opening request, 2026-11-19.

> I would like to build a very simple AI harness for my Computationally Assisted Metacognition class. It should:
> - Be built using TypeScript.
> - Be hosted on GitHub Pages.
> - Connect to AI models through the OpenRouter API directly from the browser.
> - Allow me to enter my own OpenRouter API key privately without committing it to GitHub.
> - Provide a simple chat interface where I can send messages and receive AI responses.
>
> Please keep the project as simple as possible. Create the necessary ADR questions, ask me for my decisions, and help me deploy a working version as soon as possible.

**Agency Grant**: Structure the decisions, recommend, implement once answered, deploy fast.

---

## Explicitation

**What I understand**:

1. **GitHub Pages serves only static files.** There is no backend, so the browser talks to OpenRouter directly. That works because OpenRouter's API allows cross-origin (CORS) requests from browsers.
2. **TypeScript must be compiled to JavaScript** before Pages can serve it, so some build step exists. The open question is how much tooling that step uses.
3. **"As soon as possible" favors the fewest moving parts** that still give a working dev loop and a correct deploy.

**Assumptions**:

- Repo `jam903/my-ai-harness` is **public** (verified 2026-11-19 via `gh repo view`). Free-plan Pages requires this. The site will be at `https://jam903.github.io/my-ai-harness/`.
- Node v26 and npm are installed locally (verified).

**Confirm**: Jana.

---

## Questions

### QST-STACK: Which build tooling and deploy mechanism?
- Status: answered
- Why asking: TypeScript has to become JavaScript before GitHub Pages can serve it. The tooling choice decides how much config the project carries and whether a local dev server with live reload exists. The site is served from the `/my-ai-harness/` subpath, not the domain root, so asset paths must account for that.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — vite-actions**: Vite (vanilla-ts template) builds the site. A GitHub Actions workflow builds on every push to `main` and publishes with the official `actions/deploy-pages`. You get a dev server with live reload (`npm run dev`), a one-line subpath fix (`base`), and no compiled output in git.
- **B — tsc-actions**: Only the TypeScript compiler (`tsc`) plus a hand-written `index.html`. Same Actions deploy as A. One fewer dependency, but no dev server, and browser module imports need explicit `.js` extensions.
- **C — tsc-committed**: `tsc` compiles into a `docs/` folder that you commit, and Pages serves that folder from the branch. No CI at all, but you must remember to rebuild before every push, and compiled code lives in git. (This also collides with this repo's existing `docs/` folder for ADRs.)

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — vite-actions.** *Rationale*: Vite's `vanilla-ts` template is the smallest setup that gives you a dev server and correct bundling. The subpath problem is fixed by one setting (`base: '/my-ai-harness/'`). C collides with `docs/adr/` in this repo, and its "rebuild before push" step is the kind that gets forgotten. B saves one dependency but makes local iteration worse. *Confidence*: 0.85 — because this is the stock path for a TypeScript single-page app on Pages, and the subpath and folder facts were checked against this repo. *If wrong*: if you want to see exactly what the compiler emits with no bundler in between (a reasonable choice for a learning project), flip to B.

**ANS:** (by Jana Mourad)
A — vite-actions. (Chosen via Claude Code question dialog, 2026-11-19.)

---

### QST-GATE: What is the verification gate run before every commit?
- Status: answered
- Why asking: CLAUDE.md's Fifth Directive requires a real gate command, and currently it holds only a placeholder. The gate should catch real bugs without slowing a tiny project down.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — typecheck+tests+build**: `npm run check` runs `tsc --noEmit`, then `vitest run`, then `vite build`. A few meaningful unit tests cover the logic most likely to break silently: building the OpenRouter request and turning API errors into readable messages.
- **B — typecheck+build**: `npm run check` runs `tsc --noEmit` and `vite build` only. Faster, but logic bugs, such as a dropped system prompt or a mis-parsed error, pass the gate.
- **C — build only**: `vite build`. Vite strips types without checking them, so type errors would ship.

**Recommendation**: (by Claude Opus 5.5, 2026-11-19)

**A — typecheck+tests+build.** *Rationale*: The Third and Fourth Directives (regression tests, meaningful tests) assume a test runner exists. Vitest needs no config alongside Vite. The request-building and error-mapping code is pure functions, so it can be tested without mocks. C misses a real gap: Vite does not typecheck. *Confidence*: 0.8 — because the gate costs seconds at this size. *If wrong*: if the tests turn out to be testing nothing real (Fourth Directive), drop to B instead of padding them.

**ANS:** (by Jana Mourad)
A — typecheck+tests+build. (Chosen via Claude Code question dialog, 2026-11-19.)

---

## Decision

### Context
GitHub Pages serves only static files, and TypeScript must be compiled before it can be served.

### Chosen: Vite + GitHub Actions (QST-STACK A); typecheck + tests + build gate (QST-GATE A)

**Rationale**: The smallest setup with a real dev loop. The `/my-ai-harness/` subpath is handled by Vite's `base`. No compiled output goes into git. Vitest reuses Vite's config, so the gate needs no extra setup.

**Trade-offs accepted**: Vite and Vitest are dev dependencies. The deployed site is only as fresh as the last green Actions run.

### Consequences
- `npm run dev` gives a local dev server. `npm run check` is the Fifth Directive gate.
- `.github/workflows/deploy.yml` builds and deploys. Pages source is set to "GitHub Actions".
- Live at `https://jam903.github.io/my-ai-harness/`.

---

## Open Follow-ups

- [ ] Concern: the site is publicly reachable at its Pages URL. That is fine because it holds no secrets (see ADR-0002), but anyone can load it and use it with **their own** key.

---

## Action Items

- [ ] Scaffold per QST-STACK — Owner: Claude
- [ ] Wire the gate into CLAUDE.md's Fifth Directive per QST-GATE — Owner: Claude
- [ ] Enable Pages (source: GitHub Actions) and confirm the live URL — Owner: Claude, verified by Jana

---

## Iterations

### Iteration 1 (2026-11-19)
- Trigger: initial draft from Jana's opening request
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: framed the stack/deploy and gate questions
- Outcome: Draft

### Iteration 2 (2026-11-19)
- Trigger: Jana's answers via the Claude Code question dialog
- Contributors: Jana Mourad, Claude Opus 5.5
- Changes: QST-STACK → A, QST-GATE → A; Decision filled
- Outcome: `Draft → Accepted`

---

## Links

- Related ADRs: [ADR-0002](0002-openrouter-api-key-handling-in-the-browser.md), [ADR-0003](0003-chat-interface-scope-and-model-selection.md)
