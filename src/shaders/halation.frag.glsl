// Halation — okaybabe's UI-grade glow primitive
//
// Optical halation: high-luminance regions bleed into surrounding low-luminance
// regions, with wavelength-dependent radii (red scatters more than blue).
// Approximation: layered spatial fbm noise field + chromatic-separation
// sampling + brand-anchored linear-RGB mix.
//
// CRITICAL: noise is SPATIAL (driven by fragment position) with slow temporal
// DRIFT (not per-pixel uTime-seeded). Per the okaybabe WebGL shader-stability guidelines
// Pattern #1 — no matrix-rain buzzing.
//
// Loop period: 24s (driftLoop with T=24 returns to (0,0) at t=24s).
// MP4 export: 12s (half-period, seamless).

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;       // 0-1, glow strength
uniform vec3  uColor;            // brand color, linear-RGB
uniform float uSpeed;            // 0-2 multiplier
uniform float uChromaticGrain;  // 0-1, spatial chromatic separation amplitude

const float TAU = 6.28318530718;

// ─── Inline canonical utility lib ─────────────────────────────────────
// (NOTE: shared.utils.glsl is inlined here at build time when GLSL imports
//  are wired up; until then, kept self-contained per file.)

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

// ─── Halation core ────────────────────────────────────────────────────

void main() {
  // Reduced-motion → freeze at t=0.5s seed frame
  float t = mix(uTime, 0.5, uReducedMotion) * uSpeed;

  // Aspect-correct sample coords
  vec2 uv = vUv;
  vec2 p = uv * 1.4 + driftLoop(t, 24.0, 0.5);

  // Chromatic separation amplitude — spatial offset per channel
  float ab = uChromaticGrain * 0.025;
  float lumR = fbm3(p + vec2( ab,  ab * 0.5));
  float lumG = fbm3(p);
  float lumB = fbm3(p + vec2(-ab, -ab * 0.5));

  // Soft bright-pass + glow falloff
  float threshold = 0.55;
  float knee = 0.18;
  float glowR = smoothstep(threshold - knee, threshold + knee, lumR);
  float glowG = smoothstep(threshold - knee, threshold + knee, lumG);
  float glowB = smoothstep(threshold - knee, threshold + knee, lumB);

  // Base brand mix — indigo → uColor across the luminance field
  vec3 indigo = vec3(0.144, 0.156, 0.781);
  vec3 base = mix(indigo, uColor, smoothstep(0.0, 1.0, lumG));

  // Halate: push highlights with channel offsets (chromatic separation)
  vec3 halo = vec3(glowR, glowG, glowB);
  vec3 col = base + halo * uIntensity * vec3(1.05, 0.95, 1.15);

  // Gentle vignette to anchor composition
  float v = smoothstep(1.2, 0.4, length(uv - 0.5));
  col *= mix(0.85, 1.0, v);

  // Linear → sRGB output (approximated via gamma 2.2)
  col = pow(col, vec3(1.0 / 2.2));

  gl_FragColor = vec4(col, 1.0);
}
