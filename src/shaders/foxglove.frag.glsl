// Foxglove — soft floral chromatic bloom with stippled center.
//
// Inspired by digitalis foxglove bell-flowers: layered radial petals with
// darker spotted texture (the throat spots) under a soft outer bloom.
// Default character is pink-violet but the brand-hue prop drives the
// petal anchor color.
//
// 5-pattern compliance: spatial fbm only (no per-pixel uTime noise);
// 30s drift loop; reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;     // 0-1, outer bloom strength
uniform vec3  uColor;          // brand color, linear-RGB
uniform float uSpeed;          // 0-2 multiplier
uniform float uPetals;         // 3-8, radial petal count
uniform float uStippling;      // 0-1, spotting amplitude

const float TAU = 6.28318530718;

// Inlined utility lib (until JS-side concat lands)

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

  // Aspect-correct centered coords
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // Polar
  float r = length(uv);
  float a = atan(uv.y, uv.x);

  // Slow petal-fold rotation (radial symmetry — petal count is the prop)
  float pf = cos(a * uPetals + sin(t * 0.25) * 0.4) * 0.5 + 0.5;

  // Outer bloom falloff modulated by petal fold
  float bloom = smoothstep(0.85, 0.0, r) * mix(0.55, 1.0, pf);

  // Throat stippling — spatial fbm at high freq
  vec2 sP = uv * 9.0 + driftLoop(t, 30.0, 0.4);
  float spots = fbm3(sP);
  float throat = mix(0.0, spots, smoothstep(0.45, 0.0, r) * uStippling);

  // Soft chromatic separation across petal edges
  float ab = 0.012;
  float bloomR = smoothstep(0.85, 0.0, length(uv + vec2(ab, 0.0))) * mix(0.55, 1.0, pf);
  float bloomB = smoothstep(0.85, 0.0, length(uv - vec2(ab, 0.0))) * mix(0.55, 1.0, pf);

  // Deep base — almost-black with brand-warm undertone
  vec3 dark = vec3(0.04, 0.015, 0.08);
  // Petal color = uColor brightened slightly
  vec3 petal = uColor * 1.05;

  vec3 base = mix(dark, petal, max(0.0, bloom - throat * 0.6));

  // Chromatic-separated highlight
  vec3 halo = vec3(bloomR, bloom, bloomB) * uIntensity * 0.45;

  vec3 col = base + halo;

  // Outer vignette
  col *= smoothstep(1.5, 0.3, r * 1.5);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
