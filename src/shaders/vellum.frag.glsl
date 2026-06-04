// Vellum — warm cream parchment with paper grain and soft light drift.
//
// Renamed for clarity (paper material; avoids
// collision with okaybabe email-product naming).
//
// Reads as translucent vellum paper held to soft light. Low-frequency
// fbm for paper grain, mid-frequency warm light wash, gentle vignette
// for paper-edge feel.
//
// 5-pattern compliance: spatial fbm only; 30s drift loop; reduced-motion
// freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // warm cream anchor, linear-RGB
uniform float uSpeed;
uniform float uGrain;          // 0-1, paper-fiber amplitude
uniform float uWarmth;         // 0-1, warm-tint intensity

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

  // High-frequency paper grain — spatial only (Pattern #1)
  vec2 gP = uv * 80.0;
  float grain = (fbm3(gP) - 0.5) * uGrain * 0.18;

  // Low-frequency warm light wash that drifts slowly
  vec2 lP = uv * 1.4 + driftLoop(t, 30.0, 0.3);
  float wash = fbm3(lP);
  wash = smoothstep(0.25, 0.85, wash);

  // Warm base — cream + ivory, brand-anchor weighted
  vec3 cream  = vec3(0.78, 0.62, 0.45);    // linear-RGB warm cream
  vec3 ivory  = vec3(0.86, 0.78, 0.62);
  vec3 base   = mix(cream, ivory, wash);

  // Brand-tint pull (warmth modulates how much uColor pushes vs neutral cream)
  base = mix(base, uColor, uWarmth * 0.45);

  // Soft central highlight (held-to-light feel)
  vec2 c = vUv - 0.5;
  float center = smoothstep(0.7, 0.0, length(c)) * 0.18 * uIntensity;
  vec3 col = base + vec3(1.05, 0.95, 0.78) * center;

  // Paper grain overlay
  col += vec3(grain);

  // Vignette (paper-edge feel)
  col *= smoothstep(1.4, 0.45, length(c) * 1.5);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
