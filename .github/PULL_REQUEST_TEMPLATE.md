## What this changes

<!-- 1-3 sentences on what the PR does and why -->

## Checklist

- [ ] `deployment.md` updated if this is a version-bump-worthy change
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes (dual ESM/CJS dist clean)
- [ ] `pnpm test` passes (vitest)
- [ ] `pnpm size` passes — bundle within budget (≤ 6 KB Halation alone, ≤ 35 KB full pack, ≤ 15 KB r3f variants)
- [ ] WebGL 5-pattern stack preserved (no per-pixel `uTime` noise, DPR ≤ 1.3, triple-gate render, continuous-time loop, mouse lerp ≤ 0.10)
- [ ] SSR-safe (no top-level `window` / `document` access; `useEffect` boundary respected)
- [ ] `prefers-reduced-motion` honored on new shaders
- [ ] No `three` / `@react-three/fiber` imports in the main `index.ts` barrel (r3f-specific code lives in `/r3f` subpath only)
- [ ] GLSL bundled as text-string at build time (no runtime fetching)
