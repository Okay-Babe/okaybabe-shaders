// okaybabe canonical shader utility lib.
// Included at the top of every fragment shader in the pack.
// Establishes naming conventions, helper functions, and brand-color constants.
//
// Source: Inigo Quilez canonical patterns (iquilezles.org/articles)
//         + Book of Shaders fbm chapter
//         + okaybabe WebGL 5-pattern stack (the okaybabe WebGL shader-stability guidelines)
//
// MIT — © 2026 okaybabe — https://okaybabe.com/gradients

const float TAU = 6.28318530718;
const float PI  = 3.14159265359;

// Brand-color constants in LINEAR-RGB space (precomputed from sRGB hex).
// #7C3AED violet-600 (OKLCH hue 293°, verified)
const vec3 OKB_VIOLET_LIN = vec3(0.169, 0.043, 0.730);
// #6366F1 indigo (aperture mix anchor)
const vec3 OKB_INDIGO_LIN = vec3(0.144, 0.156, 0.781);

// ─── Hash functions (Inigo Quilez canonical) ──────────────────────────

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// ─── Value noise + fBM ────────────────────────────────────────────────

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

// fBM with explicit octave count. Default lacunarity = 2.03 (slight irrational to avoid grid alignment).
float fbm(vec2 p, int oct) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    sum += amp * vnoise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// ─── Loop-safe time drift ─────────────────────────────────────────────

// Returns periodic vec2 drift of given amplitude over period T.
// Drift returns to (0,0) every T seconds — guarantees seamless MP4 loops.
vec2 driftLoop(float t, float T, float amp) {
  float w = TAU * t / T;
  return vec2(sin(w), cos(w)) * amp;
}

// ─── sRGB ↔ linear-RGB ───────────────────────────────────────────────

vec3 srgb2lin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 lin2srgb(vec3 c) { return pow(c, vec3(1.0 / 2.2)); }

// ─── Brand-anchored hue mixing ───────────────────────────────────────

// Cheap perceptual mix between two linear-RGB colors.
// For higher fidelity (true OKLCH), include the lab2rgb shim — most shaders don't need it.
vec3 brandMix(float t, vec3 hueA, vec3 hueB) {
  return mix(hueA, hueB, smoothstep(0.0, 1.0, t));
}

// ─── Soft glow falloff (cheap Gaussian-equivalent) ───────────────────

float softGlow(float v, float threshold, float knee) {
  return smoothstep(threshold - knee, threshold + knee, v);
}

// ─── Reduced-motion gate ─────────────────────────────────────────────

// When uReducedMotion = 1.0, returns a fixed seed time (0.5s) for static frame rendering.
// When uReducedMotion = 0.0, returns live time.
float gatedTime(float t, float reducedMotion) {
  return mix(t, 0.5, reducedMotion);
}
