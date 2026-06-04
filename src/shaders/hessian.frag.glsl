// Hessian — tan/khaki burlap weave with cross-hatched fiber + organic variance.
//
// Natural, earthy material reading. Cross-hatched sin patterns approximate
// the woven texture; fbm modulates organic variance so the weave doesn't
// look mechanical.
//
// 5-pattern compliance: spatial fbm + spatial sin only; 28s drift loop;
// reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // warm tan anchor, linear-RGB
uniform float uSpeed;
uniform float uWeaveScale;     // 30-120, cross-hatch frequency
uniform float uFiberVariance;  // 0-1, organic weave variation

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

  // Cross-hatched weave — two orthogonal sin patterns
  float warp = sin(uv.x * uWeaveScale) * 0.5 + 0.5;
  float weft = sin(uv.y * uWeaveScale) * 0.5 + 0.5;
  float weave = mix(warp, weft, 0.5);

  // Fiber-variance — fbm modulates the weave so it reads organic
  vec2 vP = uv * 4.0 + driftLoop(t, 28.0, 0.25);
  float variance = fbm3(vP);
  weave = mix(weave, variance, uFiberVariance * 0.55);

  // Mild contrast lift on the weave
  weave = smoothstep(0.25, 0.85, weave);

  // Dark base + brand-tan highlight
  vec3 dark  = vec3(0.10, 0.07, 0.04);    // deep burlap shadow
  vec3 light = uColor;                      // brand-warm anchor (tan)
  vec3 base  = mix(dark, light, mix(0.35, 1.0, weave));

  // Subtle chromatic warmth in the lit fibers
  float ab = 0.003;
  float wR = fbm3(vP + vec2(ab, 0.0));
  float wB = fbm3(vP - vec2(ab, 0.0));
  vec3 shimmer = (vec3(wR, weave, wB) - 0.5) * uIntensity * 0.12;

  vec3 col = base + shimmer;

  // Vignette
  vec2 c = vUv - 0.5;
  col *= smoothstep(1.15, 0.25, length(c) * 1.4);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
