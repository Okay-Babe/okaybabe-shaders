/**
 * Quarry — stone-textured ambient field, brand-tinted, low-contrast.
 *
 * Designed for "background-grade" use behind product UI. Low intensity
 * by default so it doesn't compete with foreground content.
 *
 * @example
 * <Quarry className="absolute inset-0" intensity={0.4} textureScale={4} />
 */

import { useCallback, useMemo } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/quarry.frag.glsl';
import type { QuarryProps, UniformValue } from '../types';

const QUARRY_UNIFORMS = ['uIntensity', 'uColor', 'uSpeed', 'uTextureScale', 'uContrast'];

const DEFAULT_FALLBACK =
  'radial-gradient(ellipse at center, oklch(0.32 0.10 290) 0%, oklch(0.18 0.06 280) 60%, oklch(0.08 0.03 270) 100%)';

export function Quarry({
  intensity = 0.4,
  brandHue = 280,
  color,
  speed = 1,
  textureScale = 4,
  contrast = 0.7,
  uniforms,
  fallback = DEFAULT_FALLBACK,
  children,
  ...base
}: QuarryProps) {
  const resolvedColor = useMemo<[number, number, number]>(() => {
    if (color) return colorParseLinear(color);
    return hueToLinearRgb(brandHue);
  }, [color, brandHue]);

  const resolveUniforms = useCallback(
    (): Record<string, UniformValue> => ({
      uIntensity: intensity,
      uColor: resolvedColor,
      uSpeed: speed,
      uTextureScale: textureScale,
      uContrast: contrast,
      ...uniforms,
    }),
    [intensity, resolvedColor, speed, textureScale, contrast, uniforms]
  );

  return (
    <ShaderCanvas
      vert={vertSource}
      frag={fragSource}
      uniformNames={QUARRY_UNIFORMS}
      resolveUniforms={resolveUniforms}
      fallback={fallback}
      {...base}
    >
      {children}
    </ShaderCanvas>
  );
}
