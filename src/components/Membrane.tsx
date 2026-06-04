/**
 * Membrane — organic cellular outlines on warm substrate (microscope-view tissue).
 *
 * Forked from the Ink Run draft after visual review: the
 * cellular character was leaned into rather than fixed away. Reads as
 * biological microscope view, not wet ink.
 *
 * @example
 * <Membrane className="absolute inset-0" intensity={0.7} density={0.6} membraneStrength={0.5} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/membrane.frag.glsl';
import type { MembraneProps, UniformValue } from '../types';

const MEMBRANE_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uDensity', 'uMembraneStrength'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at 40% 40%, oklch(0.86 0.06 60) 0%, oklch(0.55 0.16 290) 40%, oklch(0.20 0.12 280) 80%, oklch(0.10 0.05 270) 100%)';

export function Membrane({
  intensity = 0.7,
  brandHue = 280,
  color,
  speed = 1,
  density = 0.6,
  membraneStrength = 0.5,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: MembraneProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uDensity: density,
      uMembraneStrength: membraneStrength,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, density, membraneStrength, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={MEMBRANE_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
