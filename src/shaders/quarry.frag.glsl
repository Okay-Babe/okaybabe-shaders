// Quarry — stone-textured ambient field, brand-tinted, low-contrast.
//
// Mid-frequency layered fbm reads as cut/polished stone (slate, granite,
// quartzite). Brand-tinted but mostly neutral so it sits well behind UI
// without competing. Slow 36s circular drift gives a sense of light
// moving across stone.
//
// 5-pattern compliance: spatial fbm only; 36s drift loop; reduced-motion
// freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // brand tint anchor, linear-RGB
uniform float uSpeed;
uniform float uTextureScale;   // 1-8, stone freq (higher = finer grain)
uniform float uContrast;       // 0-1, stone contrast

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

  // Two layered stone fields at offset positions, blended
  vec2 sP = uv * uTextureScale + driftLoop(t, 36.0, 0.4);
  float n1 = fbm3(sP);
  float n2 = fbm3(sP * 2.07 + 5.3);
  float stone = mix(n1, n2, 0.5);

  // Contrast lift — make the stone "edges" more visible
  stone = smoothstep(0.32, 0.72, stone);

  // Subtle chromatic shimmer for polished-stone feel
  float ab = 0.004;
  float sR = fbm3(sP + vec2(ab, 0.0));
  float sB = fbm3(sP - vec2(ab, 0.0));

  // Dark base + brand-tinted highlight, weighted by contrast prop
  vec3 dark = vec3(0.025, 0.020, 0.040);
  vec3 mid  = uColor;
  vec3 base = mix(dark, mid, mix(0.35, 1.0, stone) * uContrast);

  // Chromatic shimmer overlay
  vec3 shimmer = (vec3(sR, stone, sB) - 0.5) * uIntensity * 0.18;

  vec3 col = base + shimmer;

  // Slight central highlight (polished-stone gleam, mouse-independent for
  // background use; consumers can override via uniforms)
  vec2 c = vUv - 0.5;
  col += smoothstep(0.55, 0.0, length(c)) * uColor * 0.08;

  // Vignette
  col *= smoothstep(1.1, 0.25, length(c) * 1.4);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
