/**
 * PrismStop — central refractive band with prism-style chromatic dispersion.
 *
 * Brand anchor sits as base color; the dispersion (rainbow R/G/B split)
 * is the highlight. Pair with Halation or Optic for visually rich heroes.
 *
 * @example
 * <PrismStop className="absolute inset-0" intensity={0.8} dispersion={0.6} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/prism-stop.frag.glsl';
import type { PrismStopProps, UniformValue } from '../types';

const PRISM_STOP_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uDispersion', 'uBandWidth'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.50 0.24 293) 0%, oklch(0.25 0.18 280) 50%, oklch(0.08 0.04 270) 100%)';

export function PrismStop({
  intensity = 0.8,
  brandHue = 293,
  color,
  speed = 1,
  dispersion = 0.55,
  bandWidth = 0.18,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: PrismStopProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uDispersion: dispersion,
      uBandWidth: bandWidth,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, dispersion, bandWidth, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={PRISM_STOP_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
