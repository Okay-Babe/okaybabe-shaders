/**
 * QuarryMaterial — react-three-fiber Material variant of Quarry.
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/quarry.frag.glsl';

export interface QuarryMaterialProps {
  intensity?: number;
  brandHue?: number;
  color?: string;
  speed?: number;
  textureScale?: number;
  contrast?: number;
  mouse?: readonly [number, number];
}

export function QuarryMaterial({
  intensity = 0.4,
  brandHue = 280,
  color,
  speed = 1,
  textureScale = 4,
  contrast = 0.7,
  mouse,
}: QuarryMaterialProps) {
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
      uTextureScale: { value: textureScale },
      uContrast: { value: contrast },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useMemo(() => {
    uniforms.uIntensity.value = intensity;
    uniforms.uColor.value = resolvedColor;
    uniforms.uSpeed.value = speed;
    uniforms.uTextureScale.value = textureScale;
    uniforms.uContrast.value = contrast;
    if (mouse) uniforms.uMouse.value.set(mouse[0], mouse[1]);
  }, [intensity, resolvedColor, speed, textureScale, contrast, mouse, uniforms]);

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
