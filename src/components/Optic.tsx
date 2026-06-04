/**
 * Optic — lens/aperture-aware central highlight with 5-fold symmetry.
 *
 * Echoes the okaybabe canonical aperture (5-blade glassmorphic flower).
 * Default `apertureBlades=5` is brand canon — only change for off-brand
 * decorative use.
 *
 * @example
 * <Optic className="absolute inset-0" intensity={0.7} chromaticEdge={0.6} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/optic.frag.glsl';
import type { OpticProps, UniformValue } from '../types';

const OPTIC_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uApertureBlades', 'uChromaticEdge'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.70 0.24 293) 0%, oklch(0.42 0.22 285) 40%, oklch(0.14 0.10 275) 100%)';

export function Optic({
  intensity = 0.7,
  brandHue = 293,
  color,
  speed = 1,
  apertureBlades = 5,
  chromaticEdge = 0.5,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: OpticProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uApertureBlades: apertureBlades,
      uChromaticEdge: chromaticEdge,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, apertureBlades, chromaticEdge, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={OPTIC_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
