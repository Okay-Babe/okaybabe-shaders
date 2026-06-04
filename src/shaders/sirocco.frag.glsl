// Sirocco — warm desert wind with horizontal streaks and dust drift.
//
// Desert orange/sand base with strongly horizontal fbm streaks evoking
// hot wind motion. Dust-particle layer (high-frequency fbm) drifts
// across at a different rate.
//
// 5-pattern compliance: spatial fbm only with horizontal drift; 22s loop;
// reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // warm orange/sand anchor, linear-RGB
uniform float uSpeed;
uniform float uWindStrength;   // 0-1, horizontal streak amplitude
uniform float uDustAmount;     // 0-1, dust-particle amplitude

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

  // Strongly horizontal-stretched fbm for wind streaks
  vec2 windP = vec2(uv.x * 2.5 + driftLoop(t, 22.0, 1.4).x, uv.y * 18.0);
  float wind = fbm3(windP);

  // Dust-particle layer — finer, faster x drift
  vec2 dustP = vec2(uv.x * 5.0 + driftLoop(t, 14.0, 2.2).x, uv.y * 28.0);
  float dust = fbm3(dustP);

  // Vertical gradient — warmest at horizon (y=0.4), cooler above + below
  float horizonFalloff = smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.4, uv.y);

  // Sand base — warm desert tone
  vec3 sandDark = vec3(0.18, 0.09, 0.04);   // deep desert shadow
  vec3 sandWarm = uColor;                     // brand warm-anchor
  vec3 base = mix(sandDark, sandWarm, horizonFalloff);

  // Wind streak overlay — modulates brightness along streaks
  base += sandWarm * (wind - 0.5) * uWindStrength * 0.55;

  // Dust shimmer — chromatic
  float ab = 0.004;
  float dR = fbm3(dustP + vec2(ab, 0.0));
  float dB = fbm3(dustP - vec2(ab, 0.0));
  vec3 dustCol = (vec3(dR, dust, dB) - 0.5) * uDustAmount * uIntensity * 0.45;

  vec3 col = base + dustCol;

  // Hot sky-band near top
  col += smoothstep(0.78, 1.0, uv.y) * uColor * 0.28;

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
