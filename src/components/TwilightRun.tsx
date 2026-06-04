/**
 * TwilightRun — horizontal streak gradient with warm-top / deep-bottom horizon.
 *
 * @example
 * <TwilightRun className="absolute inset-0" brandHue={20} streakAmp={0.7} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/twilight-run.frag.glsl';
import type { TwilightRunProps, UniformValue } from '../types';

const TWILIGHT_RUN_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uStreakAmp', 'uHorizon'];

const DEFAULT_FALLBACK =
  'linear-gradient(to bottom, oklch(0.78 0.18 35) 0%, oklch(0.50 0.20 340) 35%, oklch(0.28 0.18 280) 70%, oklch(0.12 0.10 270) 100%)';

export function TwilightRun({
  intensity = 0.65,
  brandHue = 20,
  color,
  speed = 1,
  streakAmp = 0.6,
  horizon = 0.55,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: TwilightRunProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uStreakAmp: streakAmp,
      uHorizon: horizon,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, streakAmp, horizon, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={TWILIGHT_RUN_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
