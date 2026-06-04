// Chroma Bleed — discrete chromatic fringing around bright peaks (sparkle field).
//
// REDESIGN 2026-05-22: previous implementation produced flowing fbm
// textures with color swirls — read as "purple plasma sliding around"
// rather than chromatic aberration. Design review: "should actually be
// fringing ... right now it looks like the texture is sliding around
// rather than feeling alive."
//
// New approach: sharpened fbm → discrete bright PEAKS (high-contrast,
// nearly binary). Each color channel samples the SAME peak field at a
// different angular offset, producing ghost-copies of every peak in
// each channel's color. Result: bright sparkles with rainbow halos
// dispersing around them — like point lights through a prism, or CRT
// channel misregistration on bright highlights.
//
// 5-pattern compliance: spatial fbm + spatial sampling only; 18s loop;
// reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // brand anchor base — default #7C3AED linear
uniform float uSpeed;
uniform float uBleedAmount;    // 0-1, channel-offset distance (spectral width)
uniform float uEdgeStrength;   // 0-1, peak sharpness / threshold tightness

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

// Sample the SHARP peak field — fbm raised to a moderate power, threshold
// tuned to keep ~30-40% of the field active (vs <10% in v2 attempt which
// made the canvas nearly empty). Each channel's sample is offset angularly
// to create chromatic ghost copies of the same peak structure.
float sharpPeak(vec2 p, float sharpness) {
  float raw = fbm3(p);
  // Gentle sharpening — exponent 2.0-3.0 keeps the field populated while
  // pushing mid-values down so peaks visually pop
  float sharpened = pow(raw, mix(2.0, 3.0, sharpness));
  // Threshold catches peaks but allows brighter mid-tones through too
  return smoothstep(0.06, 0.30, sharpened);
}

float sampleAngular(vec2 p, float theta, float amount, float sharpness) {
  vec2 offset = vec2(cos(theta), sin(theta)) * amount;
  return sharpPeak(p + offset, sharpness);
}

void main() {
  float t = mix(uTime, 0.5, uReducedMotion) * uSpeed;

  // Faster, more irregular drift — gives the intended "alive" feel.
  // 18s primary loop with secondary smaller orbit gives non-uniform motion
  // (peaks appear to twinkle rather than uniformly slide).
  vec2 drift = driftLoop(t, 18.0, 0.45) + driftLoop(t, 7.5, 0.12);
  vec2 uv = vUv;
  uv.x *= uResolution.x / uResolution.y;

  // Coord scale ×5.5 — peaks are visible but not too tiny
  vec2 p = uv * 5.5 + drift;

  // Sharpness driven by uEdgeStrength — higher = harder, more discrete peaks
  float sharpness = uEdgeStrength;

  // Bleed offset — sized so channel ghosts are visibly separated but stay
  // in the same neighborhood (channels see the SAME peaks shifted, not
  // wildly different regions of the field).
  float bleed = uBleedAmount * 0.55;

  // 5-channel angular sampling: R / Y / G / C / B at evenly distributed
  // angles around a circle. Each samples a sharp peak field at its angular
  // offset → each channel sees the same peaks but DISPLACED.
  float fr = sampleAngular(p, 0.0,           bleed,         sharpness);  // 0°    (R)
  float fy = sampleAngular(p, TAU * 0.125,   bleed * 0.80,  sharpness);  // 45°   (Y)
  float fg = sampleAngular(p, TAU * 0.25,    bleed * 0.55,  sharpness);  // 90°   (G base — closest to center)
  float fc = sampleAngular(p, TAU * 0.375,   bleed * 0.80,  sharpness);  // 135°  (C)
  float fb = sampleAngular(p, TAU * 0.50,    bleed,         sharpness);  // 180°  (B)

  // Spectral color contributions — saturated primaries so each channel
  // shows its own color clearly where it fires alone, and natural
  // secondaries form at 2-channel overlap zones.
  vec3 spectral = vec3(0.0);
  spectral += vec3(1.00, 0.10, 0.20) * fr;                  // saturated red
  spectral += vec3(1.00, 0.85, 0.10) * fy * 0.90;
  spectral += vec3(0.20, 1.00, 0.40) * fg * 0.95;
  spectral += vec3(0.10, 0.95, 1.00) * fc * 0.90;
  spectral += vec3(0.25, 0.30, 1.00) * fb;

  // Normalize so 5-channel overlap doesn't blow out
  spectral /= 2.8;

  // Brand-anchored DARK base — keeps brand identity, gives peaks somewhere
  // to pop against. Dark violet, NOT bright magenta wash like v1.
  vec3 brandBase = uColor * 0.12 + vec3(0.02, 0.01, 0.04);

  // ADDITIVE composite — peaks add brightness to the dark base, like
  // sparkles on a violet velvet background. This is the "alive" feel.
  vec3 col = brandBase + spectral * uIntensity * 1.3;

  // Bright peak cores — where multiple channels stack, push toward white
  // for the "spark center" effect (like a real CRT bright pixel)
  float coreBrightness = (fr + fy + fg + fc + fb) / 5.0;
  vec3 sparkCore = vec3(1.0, 0.95, 1.0);
  col = mix(col, sparkCore, smoothstep(0.55, 0.85, coreBrightness) * 0.35);

  // Mild vignette
  vec2 c = vUv - 0.5;
  col *= smoothstep(1.30, 0.30, length(c) * 1.4);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
