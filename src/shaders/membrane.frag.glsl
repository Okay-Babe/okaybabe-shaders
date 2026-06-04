// Membrane — organic cellular outlines on warm substrate, like microscope-view tissue.
//
// Two-pass fbm domain warping produces irregular cell-like shapes; sharp
// smoothstep contrast + bright edge-detection fringe creates the cellular
// "membrane" outline character. Reads as biological / microscopic.
//
// Forked from the original Ink Run draft after a design
// review noted it "looks like DNA under a microscope" — leaned into the
// cellular character as its own shader rather than fighting it.
//
// 5-pattern compliance: spatial fbm + spatial warping only; 28s loop;
// reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;            // cell-body anchor — brand violet default
uniform float uSpeed;
uniform float uDensity;          // 0-1, cell-packing density (= warp strength)
uniform float uMembraneStrength; // 0-1, membrane outline brightness

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

  // Slow drift seeds the warp positions
  vec2 drift = driftLoop(t, 28.0, 0.6);

  // Pass 1: warp uv by fbm of (uv + drift)
  vec2 q = uv * 2.0 + drift;
  vec2 warp1 = vec2(
    fbm3(q + vec2(0.0, 0.0)),
    fbm3(q + vec2(5.2, 1.3))
  );
  warp1 += vec2(0.15, -0.20);

  // Pass 2: warp again — produces the cellular shapes
  vec2 r2 = uv * 3.0 + warp1 * uDensity + drift * 0.5;
  vec2 warp2 = vec2(
    fbm3(r2 + vec2(1.7, 9.2)),
    fbm3(r2 + vec2(8.3, 2.8))
  );

  // Final cell field
  vec2 finalP = uv * 4.0 + warp2 * uDensity * 1.3;
  float cell = fbm3(finalP);

  // Sharp smoothstep contrast — this is what gives the discrete "cell body" look
  cell = smoothstep(0.38, 0.78, cell);

  // Membrane edge detection — finite-difference gradient of the cell field
  float eps = 0.012;
  float cell_x = fbm3(finalP + vec2(eps, 0.0));
  float cell_y = fbm3(finalP + vec2(0.0, eps));
  float grad = length(vec2(cell_x - cell, cell_y - cell)) / eps;
  float edge = smoothstep(0.0, 2.5, grad);

  // Substrate base — warm vellum cream (microscope slide / petri base)
  vec3 substrate = vec3(0.78, 0.62, 0.45);

  // Cell body color — saturated brand violet
  vec3 cell_body = uColor * 0.55;
  cell_body = mix(cell_body, uColor * 0.25, cell);

  // Mix substrate and cell body by the cell density
  vec3 col = mix(substrate, cell_body, cell * uIntensity);

  // MEMBRANE outline — bright fringe at cell boundaries (the load-bearing visual)
  vec3 membrane_color = uColor * 0.18;
  col = mix(col, membrane_color, edge * uMembraneStrength * 0.55);

  // Subtle substrate grain
  vec2 grainP = uv * 60.0;
  float grain = (fbm3(grainP) - 0.5) * 0.04;
  col += vec3(grain);

  // Soft vignette
  vec2 c = vUv - 0.5;
  col *= smoothstep(1.3, 0.3, length(c) * 1.4);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
