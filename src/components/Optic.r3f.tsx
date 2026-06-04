/**
 * OpticMaterial — react-three-fiber Material variant of Optic.
 *
 * Default apertureBlades=5 is brand canon (echoes the okaybabe aperture).
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/optic.frag.glsl';

export interface OpticMaterialProps {
  intensity?: number;
  brandHue?: number;
  color?: string;
  speed?: number;
  apertureBlades?: number;
  chromaticEdge?: number;
  mouse?: readonly [number, number];
}

export function OpticMaterial({
  intensity = 0.7,
  brandHue = 293,
  color,
  speed = 1,
  apertureBlades = 5,
  chromaticEdge = 0.5,
  mouse,
}: OpticMaterialProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const resolvedColor = useMemo(() => {
    const [r, g, b] = color ? colorParseLinear(color) : hueToLinearRgb(brandHue);
    return new THREE.Vector3(r, g, b);
  }, [color, brandHue]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uReducedMotion: { value: 0 },
      uIntensity: { value: intensity },
      uColor: { value: resolvedColor },
      uSpeed: { value: speed },
      uApertureBlades: { value: apertureBlades },
      uChromaticEdge: { value: chromaticEdge },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useMemo(() => {
    uniforms.uIntensity.value = intensity;
    uniforms.uColor.value = resolvedColor;
    uniforms.uSpeed.value = speed;
    uniforms.uApertureBlades.value = apertureBlades;
    uniforms.uChromaticEdge.value = chromaticEdge;
    if (mouse) uniforms.uMouse.value.set(mouse[0], mouse[1]);
  }, [intensity, resolvedColor, speed, apertureBlades, chromaticEdge, mouse, uniforms]);

  useFrame((_state, delta) => {
    uniforms.uTime.value += delta * speed;
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <shaderMaterial
      ref={matRef}
      args={[{ uniforms, vertexShader: vertSource, fragmentShader: fragSource }]}
    />
  );
}
