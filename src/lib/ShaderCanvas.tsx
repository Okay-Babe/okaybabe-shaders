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
 * Plus two robustness behaviors beyond the 5-pattern stack:
 *   - WebGL context-loss recovery: webglcontextlost/restored handlers rebuild the
 *     program + buffer on the recovered context (Firefox/GPU resets would otherwise
 *     leave a permanently blank canvas).
 *   - Reduced motion renders a SINGLE static frame then stops the rAF loop — no
 *     ongoing per-frame work when prefers-reduced-motion is set.
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
  // Context-loss state. `contextLost` (state) drives canvas visibility + re-runs
  // the render effect; `contextLostRef` is the synchronous guard the rAF tick
  // reads to bail mid-flight before React re-renders.
  const [contextLost, setContextLost] = useState(false);
  const contextLostRef = useRef(false);
  // Bumped on resize while reduced-motion is active to force a single static
  // redraw (the reduced-motion path runs no continuous loop — see below).
  const [renderTick, setRenderTick] = useState(0);
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
  // Last applied backing-store size, so the ResizeObserver skips no-op fires
  // (RO fires for many reasons): avoids needless canvas-buffer clears and, under
  // reduced motion, avoids a re-render storm during continuous drag-resize.
  const lastSizeRef = useRef<[number, number]>([0, 0]);

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

    // Build (or rebuild) the program + fullscreen-quad buffer on `gl`. Extracted
    // so `webglcontextrestored` can re-create resources on the same recovered
    // context (GPU resets, tab backgrounding, OOM — common on Firefox). Returns
    // false if compilation fails so the caller can keep the canvas hidden.
    function buildGLResources(glCtx: WebGLRenderingContext): boolean {
      let programInfo;
      try {
        programInfo = createShaderProgram(
          glCtx,
          vert,
          frag,
          ['uTime', 'uResolution', 'uMouse', 'uReducedMotion', ...uniformNames],
          ['aPosition']
        );
      } catch (err) {
        console.error('[@okaybabe/shaders] shader compile failed:', err);
        return false;
      }
      programInfoRef.current = programInfo;

      // Fullscreen quad
      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const buffer = glCtx.createBuffer();
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buffer);
      glCtx.bufferData(glCtx.ARRAY_BUFFER, positions, glCtx.STATIC_DRAW);
      positionBufferRef.current = buffer;

      // Viewport is part of GL state, which is reset on a restored context.
      glCtx.viewport(0, 0, canvas.width || 1, canvas.height || 1);
      return true;
    }

    // If the very first compile fails, hide the canvas (parity with the restore
    // path) so the wrapper's CSS fallback shows instead of a transparent canvas.
    if (!buildGLResources(gl)) setContextLost(true);
    startTimeRef.current = performance.now();

    // --- WebGL context-loss recovery (separate from the 5-pattern stack) ---
    // preventDefault() in the lost handler is REQUIRED — without it the browser
    // never dispatches 'webglcontextrestored'. On loss we drop the now-invalid
    // resource refs (so the running tick no-ops) and hide the canvas; on restore
    // we rebuild against the recovered context and resume.
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLostRef.current = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      programInfoRef.current = null;
      positionBufferRef.current = null;
      setContextLost(true);
    };
    const handleContextRestored = () => {
      if (!glRef.current) return;
      const ok = buildGLResources(glRef.current);
      // Only clear the lost-guard if the rebuild actually succeeded — otherwise
      // the ref stays true (consistent with setContextLost(true) below) so the
      // canvas remains hidden until a later successful restore.
      if (ok) contextLostRef.current = false;
      startTimeRef.current = performance.now();
      // Flipping state back to false re-runs the render effect, which rebuilds
      // the loop (or redraws the single reduced-motion frame).
      setContextLost(!ok);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
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
      // Skip when the backing-store size is unchanged — assigning canvas.width/
      // height clears the drawing buffer even to the same value, and bumping
      // renderTick would needlessly re-render.
      if (w === lastSizeRef.current[0] && h === lastSizeRef.current[1]) return;
      lastSizeRef.current = [w, h];
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      if (glRef.current) glRef.current.viewport(0, 0, w, h);
      // Reduced-motion renders a single static frame with no continuous loop,
      // so a real resize must explicitly request a redraw or the frame goes stale.
      if (isReducedMotion) setRenderTick(t => t + 1);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [mounted, webGLSupported, quality, wrapperRef, isReducedMotion]);

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

  // The render loop (Pattern #3 + #4). Skipped entirely while the context is
  // lost; see the context-loss handlers in the setup effect.
  useEffect(() => {
    if (!mounted || !webGLSupported || contextLost) return;

    // EXTERNAL time mode (Remotion / headless render) takes precedence over
    // wall-clock and always runs a continuous loop (deterministic per-frame).
    const externalTimeMode = time !== undefined;

    // Draw a single frame at the given wall-clock `elapsed` (ignored under
    // reduced motion, which freezes uTime at 0.5). Bails if the context is lost
    // mid-flight or resources aren't ready.
    function drawFrame(elapsed: number) {
      if (contextLostRef.current) return;
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

    // Reduced motion (interactive mode): render exactly ONE static frame, then
    // stop. No continuous requestAnimationFrame — honoring prefers-reduced-motion
    // means no ongoing per-frame work. Re-runs (and redraws) when `renderTick`
    // bumps on resize or `contextLost` flips back on restore. External-time mode
    // (Remotion) is exempt — it always animates deterministically.
    if (isReducedMotion && !externalTimeMode) {
      // Local id (not rafRef): this one-shot isn't part of the continuous loop
      // the lost handler cancels. The effect cleanup below cancels it on
      // unmount/re-run, and drawFrame bails on contextLostRef if it fires while lost.
      const id = requestAnimationFrame(() => drawFrame(0));
      return () => cancelAnimationFrame(id);
    }

    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      // External-time: track the prop value + timeOffset. Otherwise Pattern #4 —
      // wall-clock advancement via performance.now().
      const elapsed = externalTimeMode
        ? (time as number) + timeOffset
        : (performance.now() - startTimeRef.current) / 1000 + timeOffset;

      // Pattern #5 — slow mouse lerp (advances every frame, even while gated, so
      // the cursor doesn't jump when render resumes).
      mouseRef.current[0] +=
        (mouseTargetRef.current[0] - mouseRef.current[0]) * mouseLerp;
      mouseRef.current[1] +=
        (mouseTargetRef.current[1] - mouseRef.current[1]) * mouseLerp;

      // Pattern #3 — triple-gate render (skipped in external-time mode since
      // headless render contexts don't trigger IO / scroll / document.hidden)
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

      drawFrame(elapsed);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [
    mounted,
    webGLSupported,
    contextLost,
    renderTick,
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
            // While the context is lost the canvas is blank (preserveDrawingBuffer
            // is false); hide it so the wrapper's CSS fallback shows until restore.
            opacity: contextLost ? 0 : 1,
            transition: 'opacity 200ms ease',
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
