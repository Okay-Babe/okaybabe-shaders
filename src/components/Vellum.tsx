/**
 * Vellum — warm cream parchment with paper grain and soft light drift.
 *
 * Renamed for clarity (paper material; avoids
 * okaybabe email-product naming collision).
 *
 * @example
 * <Vellum className="absolute inset-0" intensity={0.5} brandHue={35} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/vellum.frag.glsl';
import type { VellumProps, UniformValue } from '../types';

const VELLUM_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uGrain', 'uWarmth'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.92 0.06 70) 0%, oklch(0.78 0.10 60) 60%, oklch(0.42 0.06 50) 100%)';

export function Vellum({
  intensity = 0.5,
  brandHue = 35,
  color,
  speed = 1,
  grain = 0.5,
  warmth = 0.6,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: VellumProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uGrain: grain,
      uWarmth: warmth,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, grain, warmth, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={VELLUM_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
