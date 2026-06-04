/**
 * @okaybabe/shaders — shared type surface.
 *
 * `ShaderBaseProps` is implemented by every per-shader wrapper.
 * Per-shader extensions add 3-5 named uniforms each.
 */

import type { CSSProperties, ReactNode } from 'react';

export type ReducedMotionMode = 'auto' | 'force-static' | 'force-animate';
export type QualityTier = 'low' | 'auto' | 'high';
export type ShaderReadyStatus = 'webgl' | 'fallback';

/** Loose uniform value type — escape hatch for consumer-supplied custom uniforms. */
export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

export interface ShaderBaseProps {
  /** Wrapper className. Canvas sizing is via the parent's CSS. */
  className?: string;
  /** Wrapper inline style. Defaults to 100%/100%. */
  style?: CSSProperties;
  /** Children render on top of the canvas (stacking context handled automatically). */
  children?: ReactNode;
  /**
   * Render quality tier.
   * - `low`: DPR = 1 (mobile / battery-friendly)
   * - `auto`: DPR = min(devicePixelRatio * 0.65, 1.3) — applies the okaybabe canonical RES_SCALE
   * - `high`: DPR = min(devicePixelRatio, 2) — cap at 2x even on 3x Retina
   *
   * Default: 'auto'.
   */
  quality?: QualityTier;
  /** prefers-reduced-motion handling. Default 'auto' (respects OS). */
  reducedMotion?: ReducedMotionMode;
  /** Pause render loop. Time continues advancing internally; only render is gated. Default false. */
  paused?: boolean;
  /** Time offset (seconds). Useful for phase-shifting identical shaders side-by-side. Default 0. */
  timeOffset?: number;
  /**
   * External time source (seconds). When set, REPLACES the internal wall-clock entirely —
   * shader's uTime tracks this value directly + timeOffset, no RAF accumulation.
   *
   * Use this for Remotion / headless MP4 capture / external animation drivers where
   * time must advance deterministically per frame rather than via wall-clock.
   *
   * When set, all render gates EXCEPT `paused` are bypassed (IntersectionObserver,
   * scroll-debounce, document.hidden) since headless render contexts don't trigger them.
   *
   * Default: undefined (internal wall-clock via requestAnimationFrame).
   */
  time?: number;
  /** Disable IntersectionObserver auto-pause. Default false. */
  alwaysRender?: boolean;
  /**
   * Mouse-tracking lerp rate. okaybabe canonical = 0.07 (cinematic, slow).
   * Higher = more responsive (NOT recommended for background shaders).
   * Default 0.07.
   */
  mouseLerp?: number;
  /**
   * CSS gradient fallback string used when WebGL is unavailable OR
   * `prefers-reduced-motion + force-static` is in effect.
   * Per-shader sensible default is applied if omitted.
   */
  fallback?: string;
  /** Loose-typed uniforms escape hatch. Merged on top of computed uniforms. */
  uniforms?: Record<string, UniformValue>;
  /** Called once after WebGL context resolves OR falls back. */
  onReady?: (status: ShaderReadyStatus) => void;
}

// ─── Per-shader prop interfaces (extensions of ShaderBaseProps) ────────

export interface HalationProps extends ShaderBaseProps {
  /** 0–1, bloom strength around bright spots. Default 0.6. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 293 (okaybabe violet anchor, OKLCH hue of #7C3AED). */
  brandHue?: number;
  /** Color anchor override — accepts hex/oklch/rgb string. If set, overrides brandHue. */
  color?: string;
  /** Animation speed multiplier. 0 = static, 1 = default, 2 = 2x. Default 1. */
  speed?: number;
  /** 0–1, chromatic separation amplitude (spatial, not temporal). Default 0.4. */
  chromaticGrain?: number;
}

export interface FoxgloveProps extends ShaderBaseProps {
  /** 0–1, outer bloom strength. Default 0.55. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 310 (pink-violet, foxglove canonical). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Radial petal count (3–8). Default 5. */
  petals?: number;
  /** 0–1, throat-spot amplitude. Default 0.5. */
  stippling?: number;
}

export interface TwilightRunProps extends ShaderBaseProps {
  /** 0–1, streak + bloom intensity. Default 0.65. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 20 (warm coral/orange — twilight top). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, horizontal streak amplitude. Default 0.6. */
  streakAmp?: number;
  /** 0–1, horizon y-position (0 = bottom, 1 = top). Default 0.55. */
  horizon?: number;
}

export interface QuarryProps extends ShaderBaseProps {
  /** 0–1, stone shimmer intensity. Default 0.4 (background-grade). */
  intensity?: number;
  /** Hue in degrees (0–360). Default 280 (deep violet undertone). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Stone texture frequency (1–8). Higher = finer grain. Default 4. */
  textureScale?: number;
  /** 0–1, stone-edge contrast. Default 0.7. */
  contrast?: number;
}

export interface OpticProps extends ShaderBaseProps {
  /** 0–1, central glow intensity. Default 0.7. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 293 (okaybabe aperture violet anchor). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Aperture blade count (3–8). Default 5 — brand canon (canonical aperture has 5 blades). */
  apertureBlades?: number;
  /** 0–1, lens chromatic aberration at edges. Default 0.5. */
  chromaticEdge?: number;
}

export interface VellumProps extends ShaderBaseProps {
  /** 0–1, central highlight intensity. Default 0.5. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 35 (warm cream). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, paper-fiber grain amplitude. Default 0.5. */
  grain?: number;
  /** 0–1, warm-tint intensity (how much uColor pushes vs neutral cream). Default 0.6. */
  warmth?: number;
}

export interface HessianProps extends ShaderBaseProps {
  /** 0–1, weave-shimmer intensity. Default 0.55. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 35 (warm tan). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Cross-hatch frequency (30–120). Higher = finer weave. Default 60. */
  weaveScale?: number;
  /** 0–1, organic-variance amount (0 = mechanical weave, 1 = fully fbm-modulated). Default 0.45. */
  fiberVariance?: number;
}

export interface SiroccoProps extends ShaderBaseProps {
  /** 0–1, overall intensity. Default 0.7. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 25 (warm desert orange). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, horizontal wind-streak amplitude. Default 0.6. */
  windStrength?: number;
  /** 0–1, dust-particle layer amplitude. Default 0.5. */
  dustAmount?: number;
}

export interface PrismStopProps extends ShaderBaseProps {
  /** 0–1, dispersion brightness. Default 0.8. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 293 (brand violet base). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, chromatic dispersion spread (R/G/B channel offset). Default 0.55. */
  dispersion?: number;
  /** 0.05–0.4, central refractive band width. Default 0.18. */
  bandWidth?: number;
}

export interface ApertureBloomProps extends ShaderBaseProps {
  /** 0–1, bloom intensity. Default 0.75. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 293 (okaybabe canonical violet anchor — brand-locked). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set; only use for off-brand decorative purposes. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0.3–0.8, radial bloom extent. Default 0.55. */
  bloomRadius?: number;
  /** 0–1, drop-shadow halo density. Default 0.4. */
  shadowAmount?: number;
}

export interface InkRunProps extends ShaderBaseProps {
  /** 0–1, ink saturation. Default 0.7. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 280 (deep violet ink). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, capillary flow / warp strength. Default 0.55. */
  flow?: number;
  /** 0–1, capillary edge fringe amount. Default 0.45. */
  capillary?: number;
}

export interface ChromaBleedProps extends ShaderBaseProps {
  /** 0–1, spectral overlay intensity. Default 0.75. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 293 (brand violet base). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, channel-offset distance (spectral width). Default 0.6. Too high reads as render-bug. */
  bleedAmount?: number;
  /** 0–1, edge-gradient weighting on the bleed amplitude. Default 0.7. */
  edgeStrength?: number;
}

export interface MembraneProps extends ShaderBaseProps {
  /** 0–1, cell-body fill intensity. Default 0.7. */
  intensity?: number;
  /** Hue in degrees (0–360). Default 280 (deep violet cells). */
  brandHue?: number;
  /** Color anchor override (hex/rgb). Overrides brandHue if set. */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** 0–1, cell-packing density (warp strength). Default 0.6. */
  density?: number;
  /** 0–1, membrane outline brightness. Default 0.5. */
  membraneStrength?: number;
}
