/**
 * InkRun — domain-warped capillary ink bleeding into warm paper.
 *
 * Two-pass fbm warping + capillary edge fringe. Pairs visually with
 * Vellum (warm paper base color matches by design).
 *
 * @example
 * <InkRun className="absolute inset-0" intensity={0.7} flow={0.55} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/ink-run.frag.glsl';
import type { InkRunProps, UniformValue } from '../types';

const INK_RUN_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uFlow', 'uCapillary'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at 40% 40%, oklch(0.86 0.06 60) 0%, oklch(0.62 0.10 55) 30%, oklch(0.30 0.20 285) 65%, oklch(0.14 0.10 280) 100%)';

export function InkRun({
  intensity = 0.7,
  brandHue = 280,
  color,
  speed = 1,
  flow = 0.55,
  capillary = 0.45,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: InkRunProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uFlow: flow,
      uCapillary: capillary,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, flow, capillary, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={INK_RUN_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
