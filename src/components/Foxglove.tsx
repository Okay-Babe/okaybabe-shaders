/**
 * Foxglove — soft floral chromatic bloom with stippled center.
 *
 * @example
 * <Foxglove className="absolute inset-0" intensity={0.55} brandHue={310} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/foxglove.frag.glsl';
import type { FoxgloveProps, UniformValue } from '../types';

const FOXGLOVE_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uPetals', 'uStippling'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.62 0.22 320) 0%, oklch(0.40 0.20 305) 50%, oklch(0.14 0.08 290) 100%)';

export function Foxglove({
  intensity = 0.55,
  brandHue = 310,
  color,
  speed = 1,
  petals = 5,
  stippling = 0.5,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: FoxgloveProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uPetals: petals,
      uStippling: stippling,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, petals, stippling, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={FOXGLOVE_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
