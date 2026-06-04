/**
 * Sirocco — warm desert wind with horizontal streaks and dust drift.
 *
 * @example
 * <Sirocco className="absolute inset-0" intensity={0.7} brandHue={25} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/sirocco.frag.glsl';
import type { SiroccoProps, UniformValue } from '../types';

const SIROCCO_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uWindStrength', 'uDustAmount'];

const DEFAULT_FALLBACK =
  'linear-gradient(to bottom, oklch(0.86 0.20 50) 0%, oklch(0.62 0.22 38) 40%, oklch(0.30 0.16 30) 80%, oklch(0.10 0.04 28) 100%)';

export function Sirocco({
  intensity = 0.7,
  brandHue = 25,
  color,
  speed = 1,
  windStrength = 0.6,
  dustAmount = 0.5,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: SiroccoProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uWindStrength: windStrength,
      uDustAmount: dustAmount,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, windStrength, dustAmount, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={SIROCCO_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
