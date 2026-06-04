/**
 * Hessian — tan/khaki burlap weave with cross-hatched fiber + organic variance.
 *
 * Natural, earthy material reading. Pairs well with Vellum + Quarry
 * for textural sets.
 *
 * @example
 * <Hessian className="absolute inset-0" intensity={0.55} weaveScale={60} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/hessian.frag.glsl';
import type { HessianProps, UniformValue } from '../types';

const HESSIAN_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uWeaveScale', 'uFiberVariance'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.62 0.12 60) 0%, oklch(0.42 0.10 55) 60%, oklch(0.18 0.05 50) 100%)';

export function Hessian({
  intensity = 0.55,
  brandHue = 35,
  color,
  speed = 1,
  weaveScale = 60,
  fiberVariance = 0.45,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: HessianProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uWeaveScale: weaveScale,
      uFiberVariance: fiberVariance,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, weaveScale, fiberVariance, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={HESSIAN_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
