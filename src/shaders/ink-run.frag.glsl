// Ink Run — wet ink soaking into warm absorbent paper (redesign 2026-05-22).
//
// Two-pass fbm domain warping produces organic ink-flow shapes. SOFT
// smoothstep transitions (0.20 → 0.92) simulate how ink gradually soaks
// into paper fibers — no sharp boundaries.
//
// Capillary "tide line" — real wet ink leaves a slightly DARKER pigment
// rim just inside the soaked edge as water wicks outward and pigment
// remains behind. Subtle, not the main visual.
//
// Ink color is heavily saturated/dark to read as real ink, not watercolor.
//
// Per visual-review feedback 2026-05-22: original draft used
// brighter edge fringe + sharp smoothstep → produced cellular "DNA
// microscope" look. That implementation forked off as the `membrane`
// shader; this is the redesign toward "actual wet ink."
//
// 5-pattern compliance: spatial fbm + spatial warping only; 28s loop;
// reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // ink anchor — brand violet default
uniform float uSpeed;
uniform float uFlow;           // 0-1, capillary flow warp strength
uniform float uCapillary;      // 0-1, pigment tide-line edge intensity

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i),               hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

vec2 driftLoop(float t, float T, float amp) {
  float w = TAU * t / T;
  return vec2(sin(w), cos(w)) * amp;
}

void main() {
  float t = mix(uTime, 0.5, uReducedMotion) * uSpeed;
  vec2 uv = vUv;
  uv.x *= uResolution.x / uResolution.y;

  // Slow drift seeds the warp positions
  vec2 drift = driftLoop(t, 28.0, 0.5);

  // Pass 1: warp uv by fbm of (uv + drift). Gravity bias = ink flows down + right
  vec2 q = uv * 1.8 + drift;
  vec2 warp1 = vec2(
    fbm3(q + vec2(0.0, 0.0)),
    fbm3(q + vec2(5.2, 1.3))
  );
  warp1 += vec2(0.18, -0.22);

  // Pass 2: warp again, lighter touch than Membrane for less aggressive cellularity
  vec2 r2 = uv * 2.4 + warp1 * uFlow * 0.8 + drift * 0.5;
  vec2 warp2 = vec2(
    fbm3(r2 + vec2(1.7, 9.2)),
    fbm3(r2 + vec2(8.3, 2.8))
  );

  // Final ink-density field — slightly lower frequency than Membrane (×3 vs ×4)
  // so we get larger soft blob shapes, not tight cells
  vec2 finalP = uv * 3.0 + warp2 * uFlow;
  float ink = fbm3(finalP);

  // SOFT smoothstep — this is the key change. Wide range = gradual soak,
  // no hard edges. Real wet ink doesn't have crisp boundaries.
  ink = smoothstep(0.20, 0.92, ink);

  // Tide-line edge detection — narrow band JUST INSIDE the ink boundary
  // where pigment accumulates as water wicks out (the "coffee ring effect"
  // applied to ink, basically). Peak at ink ≈ 0.55-0.75 transition zone.
  float tideLine = smoothstep(0.35, 0.55, ink) * (1.0 - smoothstep(0.65, 0.85, ink));

  // Paper base — warm vellum cream (consistent with Vellum shader)
  vec3 paper = vec3(0.78, 0.62, 0.45);

  // Ink color — DEEP and saturated for real-ink read.
  // Center of stroke: very dark (uColor * 0.18). Outer soak: still rich (uColor * 0.45).
  vec3 ink_deep    = uColor * 0.18;   // densest center
  vec3 ink_outer   = uColor * 0.45;   // outer soak zone
  vec3 ink_color = mix(ink_outer, ink_deep, ink);

  // Mix paper and ink — soft, gradient transition
  vec3 col = mix(paper, ink_color, ink * uIntensity);

  // Pigment tide-line: DARKEN slightly along the transition rim
  // (NOT brighten — real ink rim is darker, not lighter)
  vec3 tide_color = uColor * 0.12;   // even darker than ink
  col = mix(col, tide_color, tideLine * uCapillary * 0.40);

  // Subtle paper grain for tactile feel
  vec2 grainP = uv * 60.0;
  float grain = (fbm3(grainP) - 0.5) * 0.035;
  col += vec3(grain);

  // Soft vignette
  vec2 c = vUv - 0.5;
  col *= smoothstep(1.3, 0.3, length(c) * 1.4);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
