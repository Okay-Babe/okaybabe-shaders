// Optic — lens/aperture-aware central highlight with 5-fold symmetry.
//
// Echoes the okaybabe canonical aperture (5-blade glassmorphic flower,
// per the okaybabe aperture-mark guidelines). Central focused glow
// with lens-style chromatic separation at the edges. The 5-fold radial
// symmetry is intentional brand canon.
//
// 5-pattern compliance: spatial fbm only; 20s drift loop; reduced-motion
// freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;          // optional pointer for lens-center tracking
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // brand violet anchor, linear-RGB
uniform float uSpeed;
uniform float uApertureBlades; // 3-8, blade count (default 5 — canonical)
uniform float uChromaticEdge;  // 0-1, lens chromatic aberration

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

  // Mouse-aware center (defaults to (0.5, 0.5) if uMouse not driven)
  vec2 center = uMouse;
  vec2 uv = vUv - center;
  uv.x *= uResolution.x / uResolution.y;

  // Polar
  float r = length(uv);
  float a = atan(uv.y, uv.x);

  // Aperture-blade modulation — 5-fold radial symmetry by default
  // (canonical aperture has 5 blades; uApertureBlades=5 is the brand default)
  float blade = cos(a * uApertureBlades + t * 0.25) * 0.5 + 0.5;

  // Central focused glow
  float core = smoothstep(0.65, 0.0, r) * mix(0.55, 1.0, blade);

  // Lens chromatic separation — R/B channels offset by aperture edge
  float ab = uChromaticEdge * 0.045;
  float rR = length(uv + vec2(ab, 0.0));
  float rB = length(uv - vec2(ab, 0.0));
  float coreR = smoothstep(0.65, 0.0, rR) * mix(0.55, 1.0, blade);
  float coreB = smoothstep(0.65, 0.0, rB) * mix(0.55, 1.0, blade);

  // Brand mix — indigo cool + uColor anchor (the aperture canonical pair)
  vec3 indigo = vec3(0.144, 0.156, 0.781);
  vec3 base = mix(indigo, uColor, smoothstep(0.0, 1.0, core));

  // Chromatic highlight injection
  vec3 highlight = vec3(coreR, core, coreB) * uIntensity * vec3(1.10, 0.95, 1.15);
  vec3 col = base + highlight;

  // Soft outer fbm haze (spatial only — Pattern #1)
  vec2 hP = uv * 4.0 + driftLoop(t, 20.0, 0.3);
  float haze = fbm3(hP) * 0.08;
  col += uColor * haze;

  // Outer fade
  col *= smoothstep(1.5, 0.1, r * 1.4);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
