/**
 * ShaderCanvas — the LOAD-BEARING WebGL engine for @okaybabe/shaders.
 *
 * Implements the okaybabe WebGL 5-pattern stack per
 * the okaybabe WebGL shader-stability guidelines:
 *
 *   #1 Kill temporal in-shader grain (consumer-responsibility — handled in GLSL author)
 *   #2 Render at RES_SCALE=0.65 of native DPR ('auto' tier default)
 *   #3 Triple-gate render: !paused && isVisible && !isScrolling && !document.hidden
 *   #4 Continuous-time game loop — uTime + uMouse advance EVERY frame; gate ONLY render
 *   #5 Slow mouse lerp = 0.07 default
 *
 * SSR-safe: renders only after `useEffect(setMounted)` fires. Server output is the
 * wrapping <div> with the fallback CSS gradient; client takes over WebGL post-hydration.
 *
 * Public API is via per-shader wrappers (Halation.tsx etc.); this is internal.
 */

import { useEffect, useRef, useState } from 'react';
import type {
  ShaderBaseProps,
  ShaderReadyStatus,
  UniformValue,
} from '../types';
import { createShaderProgram } from './createShaderProgram';
import { useReducedMotion } from './useReducedMotion';
import { useIntersection } from './useIntersection';
import { useScrollGate } from './useScrollGate';
import { useWebGLSupported } from './useWebGLSupported';

export interface ShaderCanvasProps extends ShaderBaseProps {
  /** Vertex shader GLSL source (typically shared.vert.glsl). */
  vert: string;
  /** Fragment shader GLSL source (per-shader). */
  frag: string;
  /** Uniform names declared by the fragment shader. */
  uniformNames: string[];
  /**
   * Uniform value resolver — called with current time (seconds) + mouse
   * coordinates, returns the current uniform values. Called every frame
   * after uTime advances (Pattern #4: even when render is gated).
   */
  resolveUniforms: (ctx: {
    uTime: number;
    uMouse: [number, number];
    uResolution: [number, number];
    uReducedMotion: number;
  }) => Record<string, UniformValue>;
}

const RES_SCALE = 0.65; // Per webgl-shader-visual-stability.md Pattern #2

function applyUniform(
  gl: WebGLRenderingContext,
  loc: WebGLUniformLocation,
  value: UniformValue
): void {
  if (typeof value === 'number') {
    gl.uniform1f(loc, value);
  } else if (value.length === 2) {
    gl.uniform2f(loc, value[0], value[1]);
  } else if (value.length === 3) {
    gl.uniform3f(loc, value[0], value[1], value[2]);
  } else if (value.length === 4) {
    gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }
}

export function ShaderCanvas({
  vert,
  frag,
  uniformNames,
  resolveUniforms,
  className,
  style,
  children,
  quality = 'auto',
  reducedMotion = 'auto',
  paused = false,
  timeOffset = 0,
  time,
  alwaysRender = false,
  mouseLerp = 0.07, // Pattern #5
  fallback,
  onReady,
}: ShaderCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programInfoRef = useRef<{
    program: WebGLProgram;
    uniformLocs: Record<string, WebGLUniformLocation | null>;
    attribLocs: Record<string, number>;
  } | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 5-pattern gates
  const isReducedMotion = useReducedMotion(reducedMotion);
  const isScrollingRef = useScrollGate(150);
  const { ref: wrapperRef, isIntersecting } = useIntersection<HTMLDivElement>({
    disabled: alwaysRender,
  });
  const webGLSupported = useWebGLSupported();

  // Mouse tracking (Pattern #5)
  const mouseTargetRef = useRef<[number, number]>([0.5, 0.5]);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);

  // Defer to client to prevent SSR mismatch
  useEffect(() => setMounted(true), []);

  // Fire onReady once we know the support state
  useEffect(() => {
    if (!mounted || webGLSupported === null) return;
    const status: ShaderReadyStatus = webGLSupported ? 'webgl' : 'fallback';
    onReady?.(status);
  }, [mounted, webGLSupported, onReady]);

  // WebGL setup
  useEffect(() => {
    if (!mounted || !webGLSupported || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: false,
      powerPreference: quality === 'low' ? 'low-power' : 'default',
      failIfMajorPerformanceCaveat: false,
      antialias: false,
    });
    if (!gl) return;
    glRef.current = gl;

    let programInfo;
    try {
      programInfo = createShaderProgram(
        gl,
        vert,
        frag,
        ['uTime', 'uResolution', 'uMouse', 'uReducedMotion', ...uniformNames],
        ['aPosition']
      );
    } catch (err) {
      console.error('[@okaybabe/shaders] shader compile failed:', err);
      return;
    }
    programInfoRef.current = programInfo;

    // Fullscreen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    positionBufferRef.current = buffer;

    startTimeRef.current = performance.now();

    return () => {
      if (programInfoRef.current) {
        gl.deleteProgram(programInfoRef.current.program);
        programInfoRef.current = null;
      }
      if (positionBufferRef.current) {
        gl.deleteBuffer(positionBufferRef.current);
        positionBufferRef.current = null;
      }
      glRef.current = null;
    };
  }, [mounted, webGLSupported, vert, frag, quality, uniformNames]);

  // Resize handling (ResizeObserver, container-bound — Pattern #2)
  useEffect(() => {
    if (!mounted || !webGLSupported || !wrapperRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const computeDpr = (): number => {
      const native = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
      if (quality === 'low') return Math.min(native, 1);
      if (quality === 'high') return Math.min(native, 2);
      // 'auto' — apply RES_SCALE per webgl-shader-visual-stability.md
      return Math.min(native * RES_SCALE, 1.3);
    };

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const dpr = computeDpr();
      const w = Math.max(1, Math.floor(width * dpr));
      const h = Math.max(1, Math.floor(height * dpr));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      if (glRef.current) glRef.current.viewport(0, 0, w, h);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [mounted, webGLSupported, quality, wrapperRef]);

  // Mouse target tracking
  useEffect(() => {
    if (!mounted || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      mouseTargetRef.current = [
        Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      ];
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [mounted, wrapperRef]);

  // The game loop (Pattern #3 + #4)
  useEffect(() => {
    if (!mounted || !webGLSupported) return;

    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      // EXTERNAL time mode (Remotion / headless render) takes precedence over wall-clock.
      // When `time` is set, uTime tracks the prop value deterministically + timeOffset.
      // Otherwise: Pattern #4 — wall-clock advancement via performance.now().
      const externalTimeMode = time !== undefined;
      const elapsed = externalTimeMode
        ? (time as number) + timeOffset
        : (performance.now() - startTimeRef.current) / 1000 + timeOffset;

      // Pattern #5 — slow mouse lerp (still applies in external mode; consumer can
      // pass mouse position via the `uniforms` escape hatch if Remotion needs it)
      mouseRef.current[0] +=
        (mouseTargetRef.current[0] - mouseRef.current[0]) * mouseLerp;
      mouseRef.current[1] +=
        (mouseTargetRef.current[1] - mouseRef.current[1]) * mouseLerp;

      // Pattern #3 — triple-gate render (skipped in external-time mode since headless
      // render contexts don't trigger IntersectionObserver / scroll / document.hidden)
      if (paused) return;
      if (!externalTimeMode) {
        if (
          !isIntersecting ||
          isScrollingRef.current ||
          (typeof document !== 'undefined' && document.hidden)
        ) {
          return;
        }
      }

      const gl = glRef.current;
      const info = programInfoRef.current;
      const canvas = canvasRef.current;
      const buffer = positionBufferRef.current;
      if (!gl || !info || !canvas || !buffer) return;

      const reducedMotionFlag = isReducedMotion ? 1.0 : 0.0;
      const effectiveTime = isReducedMotion ? 0.5 : elapsed;
      const uMouseValue: [number, number] = [
        mouseRef.current[0],
        mouseRef.current[1],
      ];

      const resolved = resolveUniforms({
        uTime: effectiveTime,
        uMouse: uMouseValue,
        uResolution: [canvas.width, canvas.height],
        uReducedMotion: reducedMotionFlag,
      });

      gl.useProgram(info.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const aPos = info.attribLocs['aPosition'];
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // Built-in uniforms
      const builtins: Record<string, UniformValue> = {
        uTime: effectiveTime,
        uResolution: [canvas.width, canvas.height],
        uMouse: uMouseValue,
        uReducedMotion: reducedMotionFlag,
      };
      for (const [name, value] of Object.entries(builtins)) {
        const loc = info.uniformLocs[name];
        if (loc) applyUniform(gl, loc, value);
      }
      // Caller-resolved uniforms (resolved already includes builtins; overwrite is OK)
      for (const [name, value] of Object.entries(resolved)) {
        const loc = info.uniformLocs[name];
        if (loc) applyUniform(gl, loc, value);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [
    mounted,
    webGLSupported,
    isIntersecting,
    isReducedMotion,
    paused,
    timeOffset,
    time,
    mouseLerp,
    isScrollingRef,
    resolveUniforms,
  ]);

  const fallbackBg =
    fallback ??
    'radial-gradient(ellipse at center, #6366F1 0%, #7C3AED 50%, #0A0A0F 100%)';

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: fallbackBg,
        overflow: 'hidden',
        ...style,
      }}
    >
      {mounted && webGLSupported && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
          aria-hidden="true"
        />
      )}
      {children !== undefined && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {children}
        </div>
      )}
    </div>
  );
}
