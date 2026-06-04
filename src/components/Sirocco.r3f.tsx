/**
 * SiroccoMaterial — react-three-fiber Material variant of Sirocco.
 *
 * Warm-palette wave displacement shader.
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/sirocco.frag.glsl';

export interface SiroccoMaterialProps {
  intensity?: number;
  brandHue?: number;
  color?: string;
  speed?: number;
  windStrength?: number;
  dustAmount?: number;
  mouse?: readonly [number, number];
}

export function SiroccoMaterial({
  intensity = 0.7,
  brandHue = 25,
  color,
  speed = 1,
  windStrength = 0.6,
  dustAmount = 0.5,
  mouse,
}: SiroccoMaterialProps) {
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
      uWindStrength: { value: windStrength },
      uDustAmount: { value: dustAmount },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useMemo(() => {
    uniforms.uIntensity.value = intensity;
    uniforms.uColor.value = resolvedColor;
    uniforms.uSpeed.value = speed;
    uniforms.uWindStrength.value = windStrength;
    uniforms.uDustAmount.value = dustAmount;
    if (mouse) uniforms.uMouse.value.set(mouse[0], mouse[1]);
  }, [intensity, resolvedColor, speed, windStrength, dustAmount, mouse, uniforms]);

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
