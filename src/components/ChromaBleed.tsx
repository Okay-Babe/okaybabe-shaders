/**
 * ChromaBleed — aggressive multi-channel spectral fringing at field edges.
 *
 * 5-channel (R / Y / G / C / B) angular sampling with edge-driven bleed
 * amplitude. Reads as deliberate aesthetic — tune `bleedAmount` carefully
 * (too high reads as render-bug, too low fades into Halation territory).
 *
 * @example
 * <ChromaBleed className="absolute inset-0" intensity={0.75} bleedAmount={0.6} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/chroma-bleed.frag.glsl';
import type { ChromaBleedProps, UniformValue } from '../types';

const CHROMA_BLEED_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uBleedAmount', 'uEdgeStrength'];

const DEFAULT_FALLBACK =
  'linear-gradient(135deg, oklch(0.62 0.24 28) 0%, oklch(0.78 0.20 90) 20%, oklch(0.62 0.22 145) 40%, oklch(0.65 0.20 230) 65%, oklch(0.50 0.24 293) 100%)';

export function ChromaBleed({
  intensity = 0.75,
  brandHue = 293,
  color,
  speed = 1,
  bleedAmount = 0.6,
  edgeStrength = 0.7,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: ChromaBleedProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uBleedAmount: bleedAmount,
      uEdgeStrength: edgeStrength,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, bleedAmount, edgeStrength, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={CHROMA_BLEED_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
