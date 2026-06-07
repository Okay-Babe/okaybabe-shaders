# Changelog

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] — 2026-06-07

### Changed

- `package.json` `homepage` → `https://okaybabe.com/shaders/` (trailing slash aligns with site canonical + `_redirects`).

## [1.0.1] — 2026-06-07

### Fixed

- **WebGL context-loss recovery.** `ShaderCanvas` now handles `webglcontextlost`
  (`preventDefault()` + drop the invalidated program/buffer + hide the canvas so
  the CSS fallback shows) and `webglcontextrestored` (rebuild the program + quad
  buffer on the recovered context, reset the viewport, resume). Previously a
  GPU/driver reset — common on Firefox, tab backgrounding, or GPU OOM — left a
  permanently blank canvas with no recovery path. Benefits every React consumer.
- **Reduced motion now truly stops the render loop.** Under
  `prefers-reduced-motion` the engine draws a single static frame and cancels
  `requestAnimationFrame` (redrawing only on resize or context restore), instead
  of redrawing a frozen frame on every rAF tick. This makes the implementation
  match the behavior the v1.0.0 changelog already documented. External/Remotion
  time mode is unaffected and continues to animate deterministically.

### Changed

- `package.json` `homepage` → `https://okaybabe.com/shaders`.
- Corrected MP4 preview host references to `previews.okaybabe.dev` (the R2
  manifest source of truth; the prior `.com` was drift).
- Doc-comment shader count `12` → `13` (`shared.vert.glsl`, `useWebGLSupported`).

## [1.0.0] — 2026-05-23

### Added

- **13 hand-authored GLSL fragment shaders** with zero-dep React wrappers and optional `react-three-fiber` materials:
  - **Aperture Bloom** — animated 5-blade prismatic, the okaybabe identity alive
  - **Halation** — subtle chromatic-aberration glow, the UI-grade primitive
  - **Quarry** — slow flowing layered noise, geological pace
  - **Ink Run** — domain-warped wet ink soaking into warm paper
  - **Optic** — concentric rings of refraction
  - **Foxglove** — soft pink-violet breath cycle
  - **Prism Stop** — 6 prismatic bands rotating
  - **Twilight Run** — warm-to-cool dusk gradient drift
  - **Vellum** — premium-stationery near-static texture
  - **Sirocco** — warm-palette wave displacement
  - **Hessian** — burlap-weave noise with chromatic shift
  - **Chroma Bleed** — discrete chromatic fringing, CRT spectral artifacts
  - **Membrane** — cellular outlines on warm substrate, microscope-view tissue
- **Dual ESM/CJS build** via tsup. `.glsl` source bundled as text-string (no runtime fetching).
- **Peer-dep matrix**: React `^18.2.0 || ^19.0.0` (required); `@react-three/fiber` `^8.0.0 || ^9.0.0` + `three` `^0.150.0 || ^0.160.0 || ^0.170.0 || ^0.184.0` (optional, only for the `/r3f` subpath).
- **Bundle sizes** (size-limit enforced in CI):
  - Halation alone (zero-dep): ≤ 6 KB
  - Full 13-shader pack (zero-dep wrappers, tree-shaken): ≤ 35 KB
  - r3f variants (peer deps excluded): ≤ 15 KB
- **WebGL 5-pattern stack** baked into every component:
  1. Spatial noise only — no temporal `uTime`-seeded grain (no matrix-rain buzzing)
  2. DPR-scaled to 65% of native (Retina-friendly, mobile-safe)
  3. Triple-gate render loop (offscreen / scrolling / tab-hidden)
  4. Continuous-time game loop (no time-jump pops on scroll resume)
  5. Slow mouse lerp (0.07) for cinematic feel
- **SSR safety**: CSS gradient fallback on server-render, WebGL via `useEffect` post-hydration — zero hydration mismatches.
- **`prefers-reduced-motion` support**: renders single static seed frame, stops the rAF loop.
- **No-WebGL fallback**: every shader ships with a sensible CSS gradient `fallback` default.
- **IntersectionObserver auto-pause** when scrolled out of view.
- **r3f color-accuracy directive**: `react-three-fiber` consumers must pass `gl={{ outputColorSpace: THREE.LinearSRGBColorSpace }}` on their `<Canvas>` to prevent double-gamma of brand violet `#7C3AED` under three.js r155+ default color management. Documented in README; zero-dep wrappers handle this internally.
- **Sigstore provenance attestation**: published builds carry npm sigstore provenance via the CI release workflow. Consumers can verify with `npm audit signatures` once the package lands on the registry.
- **MP4 previews** color-graded in DaVinci Resolve and hosted at `previews.okaybabe.dev/v1/{shader}-{tier}.mp4` (1080p · 1080sq · 720p · 540sq + poster JPG per shader).

### License

MIT. Free for personal and commercial use. No attribution required.

### Built by

[the okaybabe studio](https://okaybabe.com) — the design studio that ships end-to-end.

Companion to [`okaybabe-gradient-pack`](https://github.com/Okay-Babe/okaybabe-gradient-pack) — 41 hand-authored gradients + 10 procedural texture filters. Same MIT license, same brand canon.

[Unreleased]: https://github.com/Okay-Babe/okaybabe-shaders/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Okay-Babe/okaybabe-shaders/releases/tag/v1.0.0
