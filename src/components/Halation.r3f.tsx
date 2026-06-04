/**
 * HalationMaterial — react-three-fiber Material variant of Halation.
 *
 * Drop into a `<Canvas>` scene as a ShaderMaterial. Peer deps `three` +
 * `@react-three/fiber` required.
 *
 * @example
 * import { Canvas } from '@react-three/fiber';
 * import { HalationMaterial } from '@okaybabe/shaders/r3f';
 *
 * <Canvas>
 *   <mesh>
 *     <planeGeometry args={[2, 2]} />
 *     <HalationMaterial intensity={0.6} brandHue={293} />
 *   </mesh>
 * </Canvas>
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { colorParseLinear, hueToLinearRgb } from '../lib/colorParse';
import vertSource from '../shaders/shared.vert.glsl';
import fragSource from '../shaders/halation.frag.glsl';

export interface HalationMaterialProps {
  intensity?: number;
  brandHue?: number;
  color?: string;
  speed?: number;
  chromaticGrain?: number;
  /**
   * Optional pointer coordinates in [0,1] range. The host scene drives this
   * (raycasting, pointer events, etc.) — the material does NOT track input
   * internally. Default `[0.5, 0.5]` (centered).
   */
  mouse?: readonly [number, number];
}

/**
 * NOTE: r3f variant does NOT implement the full 5-pattern stack — that's the
 * Canvas wrapper's responsibility (you're already in a r3f scene, the host
 * Canvas manages render gating). The brand-canon + chromatic semantics are
 * preserved; performance gating + mouse-lerp smoothing belong to the host
 * scene's `useFrame`.
 */
export function HalationMaterial({
  intensity = 0.6,
  brandHue = 293,
  color,
  speed = 1,
  chromaticGrain = 0.4,
  mouse,
}: HalationMaterialProps) {
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
      uChromaticGrain: { value: chromaticGrain },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Keep prop-derived uniforms live
  useMemo(() => {
    uniforms.uIntensity.value = intensity;
    uniforms.uColor.value = resolvedColor;
    uniforms.uSpeed.value = speed;
    uniforms.uChromaticGrain.value = chromaticGrain;
    if (mouse) uniforms.uMouse.value.set(mouse[0], mouse[1]);
  }, [intensity, resolvedColor, speed, chromaticGrain, mouse, uniforms]);

  // Resolution + time tick (deterministic, scene-driven via delta)
  useFrame((_state, delta) => {
    uniforms.uTime.value += delta * speed;
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <shaderMaterial
      ref={matRef}
      args={[
        {
          uniforms,
          vertexShader: vertSource,
          fragmentShader: fragSource,
        },
      ]}
    />
  );
}
