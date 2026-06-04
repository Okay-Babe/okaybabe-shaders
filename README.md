<!-- @okaybabe/shaders — README -->

<div align="center">

# @okaybabe/shaders

### 13 hand-authored GLSL fragment shaders for React + react-three-fiber. MIT. Free for any use.

<br>

[![MIT License](https://img.shields.io/badge/License-MIT-7C3AED?style=for-the-badge)](LICENSE)
[![npm](https://img.shields.io/badge/npm-@okaybabe%2Fshaders-7C3AED?style=for-the-badge)](https://www.npmjs.com/package/@okaybabe/shaders)
[![GitHub](https://img.shields.io/badge/GitHub-Okay--Babe%2Fokaybabe--shaders-18181B?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Okay-Babe/okaybabe-shaders)

<br>

Companion to [okaybabe-gradient-pack](https://github.com/Okay-Babe/okaybabe-gradient-pack) — the gradient + texture pack ships the static surfaces, this ships the live WebGL.

</div>

<br>

## What's in the pack

13 hand-authored fragment shaders, UI-grade restraint, brand-prismatic-anchored to `#7C3AED` + `#6366F1`:

| Shader | Character |
|---|---|
| **Aperture Bloom** | Animated prismatic radial — 5-blade okaybabe identity, alive |
| **Halation** | Subtle chromatic-aberration glow — the UI-grade primitive |
| **Quarry** | Slow flowing layered noise, geological pace |
| **Ink Run** | Domain-warped ink bleed, wet ink soaking into warm paper |
| **Optic** | Concentric rings of refraction |
| **Foxglove** | Soft pink-violet breath cycle |
| **Prism Stop** | 6 prismatic bands rotating |
| **Twilight Run** | Warm-to-cool dusk gradient drift |
| **Vellum** | Premium-stationery near-static texture |
| **Sirocco** | Warm-palette wave displacement |
| **Hessian** | Burlap-weave noise with chromatic shift |
| **Chroma Bleed** | Discrete chromatic fringing around bright peaks — CRT-style spectral artifacts |
| **Membrane** | Cellular outlines on warm substrate, microscope-view tissue |

Each ships as: raw `.glsl` source + zero-dep React wrapper + optional react-three-fiber component + MP4 preview.

## Install

```bash
pnpm add @okaybabe/shaders
# or
npm install @okaybabe/shaders
```

## Quick start

```tsx
'use client'; // if you're on Next.js App Router
import { Halation } from '@okaybabe/shaders';

export default function Hero() {
  return (
    <section className="relative h-screen">
      <Halation className="absolute inset-0" intensity={0.6} brandHue={293} />
      <h1 className="relative z-10">Your headline</h1>
    </section>
  );
}
```

That's it. 3 lines + a wrapping section. Zero dependencies pulled in (no three.js, no r3f unless you opt into the `/r3f` subpath).

## r3f integration (optional)

If you're already in a `@react-three/fiber` scene:

```tsx
import { Canvas } from '@react-three/fiber';
import { HalationMaterial } from '@okaybabe/shaders/r3f';

<Canvas>
  <mesh>
    <planeGeometry args={[2, 2]} />
    <HalationMaterial intensity={0.6} brandHue={293} />
  </mesh>
</Canvas>
```

Peer dep — `pnpm add three @react-three/fiber` is on you.

### Color accuracy in r3f

The shaders do manual sRGB conversion internally. Three.js r155+ enables color management by default with `outputColorSpace = SRGBColorSpace`, which would apply sRGB encoding a second time — visibly desaturating the brand violet `#7C3AED`. For accurate color in r3f, set the Canvas's output color space to linear:

```tsx
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { HalationMaterial } from '@okaybabe/shaders/r3f';

<Canvas gl={{ outputColorSpace: THREE.LinearSRGBColorSpace }}>
  <mesh>
    <planeGeometry args={[2, 2]} />
    <HalationMaterial intensity={0.6} brandHue={293} />
  </mesh>
</Canvas>
```

The zero-dep wrappers (the `Quick start` example above) handle this internally — only r3f consumers need to opt in.

## Designed for real product surfaces

Every shader implements the [WebGL 5-pattern stack](docs/webgl-5-pattern-stack.md) by default:

1. **Spatial noise, no temporal grain** — no matrix-rain buzzing
2. **DPR-scaled to 65% of native** — buttery on Retina, kind to mobile GPUs
3. **Triple-gate render loop** — pauses on offscreen / scrolling / tab-hidden
4. **Continuous-time game loop** — no time-jump pops on scroll resume
5. **Slow mouse lerp (0.07)** — cinematic, never frantic

You get this for free. Just drop the component.

## Performance + accessibility

- **`prefers-reduced-motion`** → renders single static seed frame, stops rAF loop
- **No-WebGL fallback** → static CSS gradient (per-shader sensible default)
- **IntersectionObserver auto-pause** when scrolled out of view
- **Bundle:** ~1KB per shader incremental; full 13-shader pack 15.16KB (tree-shaken; 35KB limit budget); r3f variants +12.96KB if you opt into them

## License

MIT — see `LICENSE`. Free for personal and commercial use. No attribution required.

## Built by

[the okaybabe studio](https://okaybabe.com) — the design studio that ships end-to-end.

Companion to **[okaybabe-gradient-pack](https://github.com/Okay-Babe/okaybabe-gradient-pack)** — 41 hand-authored gradients + 10 procedural texture filters. Same MIT license, same brand canon.
