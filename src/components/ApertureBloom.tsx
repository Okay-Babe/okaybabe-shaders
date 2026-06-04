/**
 * ApertureBloom — brand-canonical 5-fold polar bloom echoing the okaybabe aperture mark.
 *
 * Per the okaybabe aperture-mark guidelines (Path γ compound-mark lock):
 * The shader IS the named "Aperture Bloom" trademark. The 5-blade radial
 * symmetry + 4 brand gradient stops are canonical — do not parameterize
 * the blade count away from 5 unless the consumer explicitly wants
 * off-brand decorative use.
 *
 * @example
 * <ApertureBloom className="absolute inset-0" intensity={0.75} bloomRadius={0.55} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/aperture-bloom.frag.glsl';
import type { ApertureBloomProps, UniformValue } from '../types';

const APERTURE_BLOOM_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uBloomRadius', 'uShadowAmount'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.92 0.06 293) 0%, oklch(0.55 0.24 293) 20%, oklch(0.30 0.20 285) 50%, oklch(0.10 0.08 275) 100%)';

export function ApertureBloom({
  intensity = 0.75,
  brandHue = 293,
  color,
  speed = 1,
  bloomRadius = 0.55,
  shadowAmount = 0.4,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: ApertureBloomProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uBloomRadius: bloomRadius,
      uShadowAmount: shadowAmount,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, bloomRadius, shadowAmount, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={APERTURE_BLOOM_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
