'use client';

import {
  Halation,
  Foxglove,
  TwilightRun,
  Quarry,
  Optic,
  Vellum,
  Hessian,
  Sirocco,
  PrismStop,
  ApertureBloom,
  InkRun,
  ChromaBleed,
  Membrane,
} from '@okaybabe/shaders';
import { useState } from 'react';

export default function DemoPage() {
  const [paused, setPaused] = useState(false);

  return (
    <main className="min-h-screen w-full">
      {/* Hero — full default (brandHue=293 = #7C3AED OKLCH hue) */}
      <section className="relative h-screen w-full overflow-hidden">
        <Halation
          className="absolute inset-0"
          intensity={0.6}
          brandHue={293}
          paused={paused}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              @okaybabe/shaders — Halation
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
              ambient light from inside the screen
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/70 sm:text-base">
              brandHue=293 (#7C3AED OKLCH anchor) · intensity=0.6 · chromaticGrain=0.4
            </p>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="mt-8 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              {paused ? 'Resume' : 'Pause'} render
            </button>
          </div>
        </Halation>
      </section>

      {/* Section divider — adds enough vertical space to exercise scroll-gate + IntersectionObserver */}
      <section className="px-6 py-32 text-center">
        <p className="mx-auto max-w-2xl text-xs uppercase tracking-[0.3em] text-white/40">
          Scroll between sections to exercise the scroll-debounce + IntersectionObserver gates
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-white/50">
          Pattern #3 of the WebGL 5-pattern stack triple-gates render: visible + not scrolling + tab visible.
          Both shaders below should pause briefly during active scroll.
        </p>
      </section>

      {/* Variant 2 — color override (proves colorParseLinear path; cyan, NOT brand) */}
      <section className="relative h-[60vh] w-full overflow-hidden border-y border-white/5">
        <Halation
          className="absolute inset-0"
          color="#22D3EE"
          intensity={0.5}
          chromaticGrain={0.6}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Variant — color override</p>
            <p className="mt-2 text-sm text-white/70">color="#22D3EE" cyan · chromaticGrain=0.6</p>
          </div>
        </div>
      </section>

      {/* Variant 3 — reduced-motion forced (validates Pattern #1 reduced-motion freeze) */}
      <section className="relative h-[60vh] w-full overflow-hidden border-b border-white/5">
        <Halation
          className="absolute inset-0"
          brandHue={250}
          intensity={0.7}
          reducedMotion="force-static"
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Variant — reduced-motion force-static
            </p>
            <p className="mt-2 text-sm text-white/70">
              time frozen at uTime=0.5s seed frame · brandHue=250 (deep blue-violet)
            </p>
          </div>
        </div>
      </section>

      {/* Variant 4 — low-quality (DPR=1, mobile/battery-friendly) */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <Halation
          className="absolute inset-0"
          intensity={0.55}
          brandHue={293}
          quality="low"
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Variant — low quality</p>
            <p className="mt-2 text-sm text-white/70">
              quality=&quot;low&quot; · DPR=1 (no RES_SCALE applied) · battery-friendly
            </p>
          </div>
        </div>
      </section>

      {/* ─── Shader gallery — the 4 remaining shaders ──────────────── */}

      <section className="px-6 pb-12 pt-32 text-center">
        <p className="mx-auto max-w-2xl text-xs uppercase tracking-[0.3em] text-white/40">
          Shader gallery
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-white/50">
          Each shader below uses the same ShaderCanvas engine + 5-pattern WebGL stack. Only the GLSL fragment shader and the per-shader prop interface change.
        </p>
      </section>

      {/* Foxglove — soft floral chromatic bloom */}
      <section className="relative h-[80vh] w-full overflow-hidden border-y border-white/5">
        <Foxglove className="absolute inset-0" intensity={0.55} brandHue={310} petals={5} stippling={0.5} />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Foxglove</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              soft floral chromatic bloom
            </h2>
            <p className="mt-3 text-sm text-white/80">
              5 radial petals · pink-violet anchor · throat stippling 0.5
            </p>
          </div>
        </div>
      </section>

      {/* Twilight Run — horizontal streak gradient, warm-top / deep-bottom */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <TwilightRun
          className="absolute inset-0"
          intensity={0.7}
          brandHue={18}
          streakAmp={0.6}
          horizon={0.55}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Twilight Run</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              horizontal streaks · twilight horizon
            </h2>
            <p className="mt-3 text-sm text-white/80">
              warm coral top · deep blue-violet bottom · streakAmp=0.6
            </p>
          </div>
        </div>
      </section>

      {/* Quarry — stone-textured ambient field */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <Quarry
          className="absolute inset-0"
          intensity={0.45}
          brandHue={280}
          textureScale={4}
          contrast={0.75}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Quarry</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              stone-textured ambient field
            </h2>
            <p className="mt-3 text-sm text-white/80">
              background-grade · textureScale=4 · contrast=0.75
            </p>
          </div>
        </div>
      </section>

      {/* Optic — lens/aperture-aware central highlight (5-fold symmetry) */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <Optic
          className="absolute inset-0"
          intensity={0.75}
          brandHue={293}
          apertureBlades={5}
          chromaticEdge={0.55}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Optic</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              lens with 5-blade aperture symmetry
            </h2>
            <p className="mt-3 text-sm text-white/80">
              brand-canonical 5 blades · chromaticEdge=0.55 · echoes the aperture
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4 medium-tier shaders ───────────────────────── */}

      <section className="px-6 pb-12 pt-32 text-center">
        <p className="mx-auto max-w-2xl text-xs uppercase tracking-[0.3em] text-white/40">
          Shader gallery — medium tier
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-white/50">
          Textural set (Vellum + Hessian) and atmospheric set (Sirocco + Prism Stop). All inherit the locked ShaderCanvas wrapper + 5-pattern stack.
        </p>
      </section>

      {/* Vellum — warm cream parchment with paper grain */}
      <section className="relative h-[80vh] w-full overflow-hidden border-y border-white/5">
        <Vellum className="absolute inset-0" intensity={0.5} brandHue={35} grain={0.5} warmth={0.6} />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Vellum</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              warm parchment · paper grain
            </h2>
            <p className="mt-3 text-sm text-white/80">
              brandHue=35 (cream) · grain=0.5 · warmth=0.6
            </p>
          </div>
        </div>
      </section>

      {/* Hessian — tan burlap weave */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <Hessian
          className="absolute inset-0"
          intensity={0.55}
          brandHue={35}
          weaveScale={60}
          fiberVariance={0.45}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Hessian</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              burlap weave · cross-hatched fiber
            </h2>
            <p className="mt-3 text-sm text-white/80">
              weaveScale=60 · fiberVariance=0.45 · pairs with Vellum + Quarry
            </p>
          </div>
        </div>
      </section>

      {/* Sirocco — warm desert wind */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <Sirocco
          className="absolute inset-0"
          intensity={0.7}
          brandHue={25}
          windStrength={0.65}
          dustAmount={0.55}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Sirocco</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              desert wind · horizontal streaks · dust drift
            </h2>
            <p className="mt-3 text-sm text-white/80">
              brandHue=25 · windStrength=0.65
            </p>
          </div>
        </div>
      </section>

      {/* Prism Stop — central refractive band */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <PrismStop
          className="absolute inset-0"
          intensity={0.85}
          brandHue={293}
          dispersion={0.6}
          bandWidth={0.2}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Prism Stop</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              prism dispersion · refractive band
            </h2>
            <p className="mt-3 text-sm text-white/80">
              R/G/B channel split · dispersion=0.6 · bandWidth=0.2 · brand-anchor base
            </p>
          </div>
        </div>
      </section>

      {/* ─── 3 hard-tier shaders (the showcase pieces) ───── */}

      <section className="px-6 pb-12 pt-32 text-center">
        <p className="mx-auto max-w-2xl text-xs uppercase tracking-[0.3em] text-white/40">
          Shader gallery — hard tier · showcase pieces
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-white/50">
          Aperture Bloom = brand-canonical identity (5-blade polar symmetry, 4 brand gradient stops). Ink Run = domain-warped capillary flow. Chroma Bleed = 5-channel spectral fringing.
        </p>
      </section>

      {/* Aperture Bloom — brand-canonical 5-fold polar bloom */}
      <section className="relative h-[80vh] w-full overflow-hidden border-y border-white/5">
        <ApertureBloom
          className="absolute inset-0"
          intensity={0.78}
          brandHue={293}
          bloomRadius={0.55}
          shadowAmount={0.4}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Aperture Bloom</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              5-blade polar symmetry · brand-canonical
            </h2>
            <p className="mt-3 text-sm text-white/80">
              echoes the okaybabe aperture mark · 4 brand gradient stops · #7C3AED anchor (Path γ trademark)
            </p>
          </div>
        </div>
      </section>

      {/* Ink Run — domain-warped capillary ink */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <InkRun
          className="absolute inset-0"
          intensity={0.72}
          brandHue={280}
          flow={0.55}
          capillary={0.5}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Ink Run</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              wet ink · capillary flow · warm paper
            </h2>
            <p className="mt-3 text-sm text-white/80">
              two-pass fbm domain warp · capillary edge fringe 0.5 · pairs with Vellum
            </p>
          </div>
        </div>
      </section>

      {/* Chroma Bleed — 5-channel spectral fringing */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <ChromaBleed
          className="absolute inset-0"
          intensity={0.75}
          brandHue={293}
          bleedAmount={0.6}
          edgeStrength={0.7}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Chroma Bleed</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              5-channel spectral fringing · edge-driven
            </h2>
            <p className="mt-3 text-sm text-white/80">
              R/Y/G/C/B angular sampling · bleedAmount=0.6 · edges erupt in spectrum
            </p>
          </div>
        </div>
      </section>

      {/* Membrane — leaned-into cellular character (forked from Ink Run v1 draft) */}
      <section className="relative h-[80vh] w-full overflow-hidden border-b border-white/5">
        <Membrane
          className="absolute inset-0"
          intensity={0.7}
          brandHue={280}
          density={0.6}
          membraneStrength={0.5}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Membrane</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              cellular outlines · microscope-view tissue
            </h2>
            <p className="mt-3 text-sm text-white/80">
              forked from Ink Run v1 draft · density=0.6 · membraneStrength=0.5 · biological / petri-dish character
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 py-12 text-center text-xs text-white/40">
        @okaybabe/shaders local demo · port 3737 · 13 of 13 shaders · pack complete · MIT
      </footer>
    </main>
  );
}
