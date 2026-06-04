# WebGL Shader Visual Stability — the 5-pattern stack

Every shader in `@okaybabe/shaders` implements this 5-pattern stack by default — it's baked into `ShaderCanvas.tsx` so consumers get the correctness for free.

If you're integrating WebGL fragment shaders elsewhere (Three.js, react-three-fiber, Paper Design, OGL, raw WebGL), missing any one of these patterns produces a specific user-visible bug. Apply all 5 up-front rather than ping-ponging on bug reports.

---

## The 5 patterns (all required)

### 1. Kill temporal grain, or use a STATIC CSS overlay

**Bug if skipped:** "Matrix rain" / TV-static buzzing behind the shader, especially during mouse movement or scroll resume.

**Cause:** Per-pixel noise seeded by `uTime` re-samples every frame. At 60fps it reads as film texture. At reduced resolution + bilinear upscale (pattern #2), each noise pixel becomes a 1.5×1.5px bilinear blob that shifts every frame → the brain interprets it as TV static.

**Fix (in-shader):** `uGrainAmount: 0.0` — disable the shader's own grain uniform.

**Fix (if film texture desired):** Static CSS overlay via SVG noise or PNG data URI on `::after` with `pointer-events: none`. Zero GPU cost, no buzzing.

### 2. Render at 60–70% of display resolution, CSS-upscale via `width: 100%`

**Bug if skipped at DPR=2 Retina:** Compositor thread is GPU-bound shading ~4M pixels × N raymarch steps per frame → scroll jank synchronized with shader frames.

**Fix:**

```js
const RES_SCALE = 0.65;
renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * RES_SCALE, 1.3));
```

Canvas backing-store is 65% of display resolution. The browser bilinear-upscales via CSS `width: 100%`. For a BACKGROUND shader with a mask fade, the quality drop is imperceptible.

**Exception:** Do NOT apply to foreground / sharp shaders (product renders, UI elements).

### 3. Triple-gate the render loop

**Bug if skipped:** The GPU burns cycles + battery when the user isn't looking, and the shader fights the compositor during scroll.

**Fix:**

```js
if (!running || scrolling || document.hidden) return;
renderer.render(scene, camera);
```

Gates:
- `running` = `IntersectionObserver` on the hero element, false when offscreen (rootMargin: 100px)
- `scrolling` = true for 150ms after any wheel / scroll / touchmove event
- `document.hidden` = true when the tab is backgrounded

### 4. Continuous-time, conditional-render (fixed-timestep game-loop)

**Bug if skipped:** When render resumes from scroll-pause, `uTime` jumps from the last-rendered value to the current wall-time → visible "pop" / frame step on resume.

**Fix:** Always advance `uTime` and `uMouse` uniforms, even when skipping render. The clock ticks wall-time continuously; when render resumes, it picks up at "now" with no discontinuity.

```js
function animate() {
  requestAnimationFrame(animate);
  // ALWAYS advance time + mouse, regardless of render
  uniforms.uTime.value = clock.getElapsedTime();
  uniforms.uMouse.value.x += (mouseTarget.x - uniforms.uMouse.value.x) * 0.07;
  uniforms.uMouse.value.y += (mouseTarget.y - uniforms.uMouse.value.y) * 0.07;
  // Gate render only
  if (!running || scrolling || document.hidden) return;
  renderer.render(scene, camera);
}
```

Industry-standard game-loop technique (see Glenn Fiedler, "Fix Your Timestep!").

### 5. Slow mouse lerp for cinematic feel

**Bug if skipped (at default lerp 0.15–0.20):** The camera darts with the mouse → shader output shifts rapidly → combined with reduced resolution, this creates a "frantic" feel and amplifies any residual noise.

**Fix:** Mouse-follow lerp rate `0.07` — the camera drifts ~2.5× more gradually.

**Exception:** For interactive 3D product viewers, use a higher lerp (0.15–0.25). For background shaders, slow always wins.

---

## Baseline values used in `@okaybabe/shaders`

```js
// Three.js / WebGL renderer
const RES_SCALE = 0.65;
renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * RES_SCALE, 1.3));

// Volumetric / raymarching shader uniforms
uGrainAmount:     0.0,
uVolSteps:        120,    // tight sampling; medium zones need it
uMaxDist:         18.0,

// Camera follow
mouse lerp:       0.07,

// Render loop gates
if (!running || scrolling || document.hidden) return;
// scrolling debounced 150ms; running from IntersectionObserver on hero
```

## Brand color tokens (when adapting a third-party shader)

When mapping a shader's default colors to the okaybabe palette:

| Shader role | Hex | Normalized vec3 |
|---|---|---|
| Primary | `#7C3AED` (violet-600) | `[0.486, 0.227, 0.929]` |
| Indigo accent | `#6366F1` (indigo-500) | `[0.388, 0.400, 0.945]` |
| Light tint | `#A5B4FC` (indigo-300) | `[0.647, 0.706, 0.988]` |
| Background / void | `#0A0A0F` | `[0.039, 0.039, 0.059]` |

## Where this applies

- Any WebGL / WebGPU fragment shader used as a background layer (hero, cover, decorative)
- Three.js / react-three-fiber / Paper Design / OGL / raw WebGL — same patterns regardless of integration library

**Does NOT apply to:**
- Foreground 3D viewers (product renders, interactive 3D)
- UI element shaders (need crisp pixel-perfect rendering)

## Failure mode this prevents

User sees buzzing / blur / jank / pop → reports it → 2–3 debug passes → engineer blames the shader code itself → eventually realizes the bug lives in the integration wrapper, not in the GLSL. The GLSL is almost always correct when ported from a canonical source; the integration is almost always where these bugs live.

Apply this 5-pattern stack up-front and skip the ping-pong.
