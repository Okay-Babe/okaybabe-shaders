// Prism Stop — central refractive band with prism-style chromatic dispersion.
//
// Evokes white light passing through a prism: a narrow band where R/G/B
// channels split at slightly different angles, producing a rainbow
// dispersion. Brand anchor sits as base; dispersion is the highlight.
//
// 5-pattern compliance: spatial fbm only; 26s drift loop; reduced-motion
// freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // brand anchor base, linear-RGB
uniform float uSpeed;
uniform float uDispersion;     // 0-1, chromatic spread amplitude
uniform float uBandWidth;      // 0.05-0.4, central band thickness

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

// Returns a smooth band centered at `center` with falloff over `width`.
float band(float p, float center, float width) {
  float d = abs(p - center);
  return smoothstep(width, 0.0, d);
}

void main() {
  float t = mix(uTime, 0.5, uReducedMotion) * uSpeed;
  vec2 uv = vUv;

  // Slow horizontal drift of the band center
  float bandCenter = 0.5 + driftLoop(t, 26.0, 0.08).x;

  // Spatial fbm noise for organic edge to the band
  vec2 nP = uv * 4.0 + driftLoop(t, 26.0, 0.4);
  float n = fbm3(nP) - 0.5;
  float bx = uv.x + n * 0.05;

  // Three channel offsets — prism dispersion direction
  float disp = uDispersion * 0.12;
  float redBand   = band(bx + disp,        bandCenter, uBandWidth);
  float greenBand = band(bx,               bandCenter, uBandWidth);
  float blueBand  = band(bx - disp,        bandCenter, uBandWidth);

  // Base — brand anchor at low intensity (sits below the dispersion)
  vec3 base = uColor * 0.12;

  // Rainbow dispersion layer — additive RGB bands
  vec3 dispersionCol = vec3(redBand, greenBand, blueBand) * uIntensity;

  // Brand-anchor central wash blends with the dispersion (so brand
  // identity reads through even when dispersion is dialed up)
  vec3 brandWash = uColor * greenBand * 0.45;

  vec3 col = base + dispersionCol + brandWash;

  // Subtle vignette top + bottom (focus on the band)
  col *= smoothstep(-0.10, 0.40, uv.y) * smoothstep(1.10, 0.60, uv.y);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
