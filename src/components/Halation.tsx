/**
 * Halation — okaybabe's UI-grade glow primitive.
 *
 * Subtle chromatic-aberration glow with slow breath cycle. Reads as "ambient
 * light from inside the screen." Designed to sit BEHIND product UI without
 * competing.
 *
 * @example
 * <Halation className="absolute inset-0" intensity={0.6} brandHue={293} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/halation.frag.glsl';
import type { HalationProps, UniformValue } from '../types';

const HALATION_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uChromaticGrain'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.55 0.20 280) 0%, oklch(0.40 0.24 293) 50%, oklch(0.18 0.10 270) 100%)';

export function Halation({
  intensity = 0.6,
  brandHue = 293,
  color,
  speed = 1,
  chromaticGrain = 0.4,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: HalationProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uChromaticGrain: chromaticGrain,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, chromaticGrain, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={HALATION_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
