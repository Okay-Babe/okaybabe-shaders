# shaders-demo

Local Next.js App Router app that imports `@okaybabe/shaders` via pnpm workspace and renders each shader in multiple variants. Visual-verification surface for the pack; not published.

## Run

From the repo root:

```bash
pnpm install                                      # install workspace
pnpm --filter @okaybabe/shaders build             # build the shader package once
pnpm --filter shaders-demo dev                    # serves http://localhost:3737
```

If you're iterating on a shader's GLSL or wrapper code, run the shader package in tsup watch mode in a second terminal:

```bash
pnpm --filter @okaybabe/shaders dev               # tsup --watch
```

Next will pick up the rebuilt `dist/` automatically.

## What to verify visually (Halation acceptance criteria)

| Variant | Expected behavior |
|---|---|
| Hero (default) | Soft violet/indigo glow with chromatic separation, slow 24s breath cycle. NO matrix-rain buzzing. NO frame-step pops during scroll-resume. |
| Pause button | Render freezes; time keeps advancing internally so resume is seamless. |
| Color override `#22D3EE` | Same chromatic-separation pattern in cyan instead of violet. Proves `colorParseLinear` path. |
| Reduced-motion forced | Completely static frame (no animation). Validates Pattern #1 reduced-motion gate. |
| Low quality | Visibly chunkier shader output (DPR=1 instead of `0.65 × devicePixelRatio`). |

## 5-pattern stack gates to confirm

1. **Pattern #1** — no temporal grain buzzing
2. **Pattern #2** — render scaling (Network tab / DPR debug)
3. **Pattern #3** — render pauses during scroll + when shader scrolls off-screen + when tab is backgrounded
4. **Pattern #4** — scroll-resume has no time-jump pop
5. **Pattern #5** — mouse-follow drift is slow/cinematic (lerp 0.07)

## Cross-browser

Verify in Chrome + Safari + Firefox + iOS Safari. WebGL1 fallback should kick in if WebGL2 fails.
