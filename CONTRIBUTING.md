# Contributing

Thanks for thinking about contributing to `@okaybabe/shaders`.

## How we evaluate additions

This pack is **curated** — every shader is hand-authored GLSL, UI-grade restraint, brand-prismatic-anchored to `#7C3AED` + `#6366F1`, and tonally coherent with the rest of the pack. We don't accept arbitrary shader PRs.

If you have an idea for a new shader we should consider:

1. Open a feature request issue describing the use case + the proposed visual character.
2. If it's a fit, we'll iterate on it together before any GLSL lands.

## How we maintain quality

- **WebGL 5-pattern stack** is load-bearing — every shader implements all 5 patterns (see [`README.md`](README.md#designed-for-real-product-surfaces)). Violating any pattern is a publish blocker.
- **SSR safety** — no top-level `window` / `document` access; WebGL mounts via `useEffect` post-hydration.
- **No-WebGL fallback** — every shader ships with a sensible CSS gradient `fallback` default.
- **`prefers-reduced-motion`** — renders a single static seed frame, stops the rAF loop.
- **GLSL bundled as text-string** at build time — never fetched at runtime.
- **Bundle size discipline** — each new shader must fit the size-limit budget (≤ 1 KB incremental contribution to the pack).

## Local dev

```bash
nvm use            # Node 24 — required
pnpm install
pnpm typecheck
pnpm build         # dual ESM/CJS dist
pnpm test          # vitest
pnpm size          # size-limit check
```

## License

By contributing, you agree your contribution is licensed under the MIT License of this repository.
