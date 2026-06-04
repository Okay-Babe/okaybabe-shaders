# okaybabe-shaders — AGENTS.md

> Agent operating instructions for Cursor + Codex (and any other coding agent working on this repo).

## What This Is

`@okaybabe/shaders` — npm package. 13 GLSL fragment shaders + zero-dep React wrappers + optional react-three-fiber materials. MIT.

## Tech Stack

TypeScript strict + Node 24 + pnpm. Build via tsup (dual ESM/CJS, `.glsl` as text). Test via vitest. Bundle size via size-limit.

Peer deps: React 18/19. Optional: `@react-three/fiber` + `three` (for `/r3f` subpath only).

## Key Commands

```bash
nvm use         # Node 24 — DO NOT skip
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm size
```

## Critical Rules

- **WebGL 5-pattern stack** is load-bearing (see `the okaybabe WebGL shader-stability guidelines`). All 5 patterns implemented in `ShaderCanvas.tsx`. Don't violate.
- **Determinism:** GLSL bundled at build time, never fetched at runtime. `timeOffset` for phase-shifting.
- **SSR safety:** CSS gradient fallback on server-render, WebGL via useEffect post-hydration. Zero hydration mismatches.
- **No-WebGL fallback:** every shader ships with `fallback` CSS gradient default.
- **`three`/`@react-three/fiber` in `/r3f` subpath only** — never in main `index.ts` barrel.

## Per-PR deliverables

This is a static npm package — no runtime service to deploy. npm publish is manual (maintainer executes locally with 2FA).

## What NOT to do

- Don't use per-pixel `uTime`-seeded noise (causes matrix-rain buzz)
- Don't default DPR > 1.3 (mobile perf)
- Don't skip render-loop gates (intersection / scroll / hidden)
- Don't bake `'use client'` into library (consumer's boundary)
- Don't fetch GLSL at runtime (bundle as text-string)
