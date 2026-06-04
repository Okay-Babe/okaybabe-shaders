// Twilight Run — horizontal streak gradient with warm-top / deep-bottom horizon.
//
// "Twilight" = warm anchor (orange/magenta/coral) bleeds into deep
// blue-violet horizon at the bottom. "Run" = horizontal directional
// streaks via stretched fbm. Slow horizontal drift evokes wind motion.
//
// 5-pattern compliance: spatial fbm only; 18s drift loop; reduced-motion
// freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // warm anchor (orange/magenta), linear-RGB
uniform float uSpeed;
uniform float uStreakAmp;      // 0-1, horizontal streak amplitude
uniform float uHorizon;        // 0-1, where the horizon sits (default 0.55)

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

  // Vertical gradient (warm above horizon, deep below)
  float vGrad = smoothstep(uHorizon - 0.45, uHorizon + 0.30, uv.y);

  vec3 deep = vec3(0.04, 0.02, 0.20);   // deep blue-violet horizon
  vec3 warm = uColor;                     // brand-driven warm anchor
  vec3 base = mix(deep, warm, vGrad);

  // Horizontal streaks — fbm stretched 4x horizontally, drifting on x
  vec2 sP = vec2(uv.x * 3.0 + driftLoop(t, 18.0, 1.0).x, uv.y * 16.0);
  float streak = fbm3(sP) - 0.5;

  // Chromatic separation in streaks (red flares hotter, blue cooler)
  float ab = 0.006;
  float sR = fbm3(sP + vec2(ab, 0.0)) - 0.5;
  float sB = fbm3(sP - vec2(ab, 0.0)) - 0.5;

  vec3 streakCol = vec3(sR, streak, sB) * uStreakAmp * uIntensity * 0.6;
  vec3 col = base + streakCol;

  // Top-of-frame hot bloom (sun-just-set energy)
  float topBloom = smoothstep(0.78, 1.0, uv.y);
  col += topBloom * uColor * 0.35 * uIntensity;

  // Bottom-of-frame deeper vignette
  col *= smoothstep(-0.15, 0.55, uv.y);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
