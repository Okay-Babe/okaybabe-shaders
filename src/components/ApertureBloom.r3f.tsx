/**
 * ApertureBloomMaterial — react-three-fiber Material variant.
 *
 * Brand-canonical: 5-fold symmetry + 4 brand gradient stops baked into
 * the GLSL. Default brandHue=293 (#7C3AED OKLCH anchor); do not override
 * for brand surfaces.
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/aperture-bloom.frag.glsl';

export interface ApertureBloomMaterialProps {
  intensity?: number;
  brandHue?: number;
  color?: string;
  speed?: number;
  bloomRadius?: number;
  shadowAmount?: number;
  mouse?: readonly [number, number];
}

export function ApertureBloomMaterial({
  intensity = 0.75,
  brandHue = 293,
  color,
  speed = 1,
  bloomRadius = 0.55,
  shadowAmount = 0.4,
  mouse,
}: ApertureBloomMaterialProps) {
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
      uBloomRadius: { value: bloomRadius },
      uShadowAmount: { value: shadowAmount },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useMemo(() => {
    uniforms.uIntensity.value = intensity;
    uniforms.uColor.value = resolvedColor;
    uniforms.uSpeed.value = speed;
    uniforms.uBloomRadius.value = bloomRadius;
    uniforms.uShadowAmount.value = shadowAmount;
    if (mouse) uniforms.uMouse.value.set(mouse[0], mouse[1]);
  }, [intensity, resolvedColor, speed, bloomRadius, shadowAmount, mouse, uniforms]);

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
