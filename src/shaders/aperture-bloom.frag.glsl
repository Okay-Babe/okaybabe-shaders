// Aperture Bloom — brand-canonical 5-blade aperture echoing the okaybabe mark.
//
// PER the okaybabe aperture-mark guidelines + canonical SVG at
// the canonical okaybabe aperture mark (Path γ compound-
// mark lock 2026-05-09):
//
// The canonical aperture has 5 ASYMMETRIC CURVED LEAF blades at 72°
// intervals — NOT 5 radial rays. Each blade is a curved petal that:
//   - Roots near center (y ≈ +15 in canonical, just past origin)
//   - Tips outward (y ≈ -58 in canonical, far from center)
//   - Has a wider bulge on one side (right-heavy: x_max≈40 vs x_min≈-30)
//   - Overlaps with neighbor blades near the center → forms the flower-iris
//
// 4 brand gradient stops (translated sRGB → linear via gamma 2.2):
//   blade1: #A5B4FC → #6366F1   indigo light → indigo            opacity 0.85
//   blade2: #C4B5FD → #7C3AED   violet light → violet ANCHOR     opacity 0.80
//   blade3: #818CF8 → #5B21B6   indigo mid   → violet deep       opacity 0.80
//   blade4: #DDD6FE → #A78BFA   violet pale  → violet soft       opacity 0.75
//   blade5 (reuses blade1)                                        opacity 0.70
//   shadow: #4C1D95 deep violet drop-shadow tint                  opacity 0.35
//   center: #EDE9FE white-violet hot spot                         opacity 0.5
//   inner: white pinprick                                         opacity 0.35
//
// 5-pattern compliance: spatial geometry + slow temporal driftLoop only;
// 24s loop; reduced-motion freezes at uTime=0.5s.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uReducedMotion;
uniform float uIntensity;
uniform vec3  uColor;          // brand violet anchor (default #7C3AED linear)
uniform float uSpeed;
uniform float uBloomRadius;    // 0.3-0.8, how far the petal tips reach
uniform float uShadowAmount;   // 0-1, drop-shadow halo density

const float TAU = 6.28318530718;
const float PI = 3.14159265359;
const float HALF_PI = 1.5707963268;

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

// petalMask — distance field for an asymmetric curved leaf in local frame.
// Local frame: petal root at origin (0,0), tip points in +y direction.
// Returns 0-1 with smooth edges (1 inside, 0 outside).
//
// `length` is petal tip reach (y at tip).
// Width profile: bell curve along petal axis, asymmetric (right wider than left)
// to match the canonical asymmetric SVG path.
float petalMask(vec2 p, float length, float maxWidthRight, float maxWidthLeft) {
  // Petal extends from y = -0.10*length (slightly past root, into center) to y = length (tip).
  // This overlap near center is what gives the canonical flower-iris look.
  float rootOverlap = -0.10 * length;
  if (p.y < rootOverlap || p.y > length) return 0.0;

  // t goes 0 at root-overlap → 1 at tip
  float t = (p.y - rootOverlap) / (length - rootOverlap);

  // Bell-shaped width profile: zero at t=0 (root) and t=1 (tip), peaks at t≈0.40
  // sin(PI * t) gives smooth bell with peak at t=0.5
  // We bias the peak slightly toward root (t=0.40) by warping t before sin
  float warped = pow(t, 0.85);
  float widthCurve = sin(PI * warped);
  // Sharpen tip (taper aggressively in last 15%)
  widthCurve *= smoothstep(1.02, 0.78, t);

  // Asymmetric width — right side wider than left (matches SVG x_max +40 vs x_min -30)
  float halfWidth = (p.x > 0.0)
    ? widthCurve * maxWidthRight
    : widthCurve * maxWidthLeft;

  // Distance from petal axis
  float distFromAxis = abs(p.x);

  // Smooth mask with soft edge
  return smoothstep(halfWidth, halfWidth * 0.55, distFromAxis);
}

// Rotate a 2D vector by angle (radians) — used to transform uv into each blade's local frame
vec2 rot2(vec2 v, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

void main() {
  float t = mix(uTime, 0.5, uReducedMotion) * uSpeed;

  // Aspect-correct centered coords (uv in [-0.5, 0.5])
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  float r = length(uv);

  // Slow rotation of the entire aperture (subtle brand-bloom breath)
  float slowSpin = sin(t * TAU / 24.0) * 0.06;

  // Canonical brand gradients (precomputed linear-RGB from sRGB hex via gamma 2.2)
  // blade1: indigo light → indigo
  vec3 g1_outer = vec3(0.395, 0.461, 0.964);   // #A5B4FC linear
  vec3 g1_inner = vec3(0.124, 0.132, 0.886);   // #6366F1 linear
  // blade2: violet light → violet ANCHOR
  vec3 g2_outer = vec3(0.560, 0.479, 0.985);   // #C4B5FD linear
  vec3 g2_inner = vec3(0.207, 0.038, 0.851);   // #7C3AED linear (the anchor)
  // blade3: indigo mid → violet deep
  vec3 g3_outer = vec3(0.220, 0.262, 0.939);   // #818CF8 linear
  vec3 g3_inner = vec3(0.097, 0.013, 0.420);   // #5B21B6 linear
  // blade4: violet pale → violet soft
  vec3 g4_outer = vec3(0.733, 0.681, 0.992);   // #DDD6FE linear
  vec3 g4_inner = vec3(0.395, 0.273, 0.957);   // #A78BFA linear

  // Deep void background
  vec3 dark = vec3(0.02, 0.01, 0.05);

  // Drop-shadow halo just outside the bloom (deep violet) — gives the petal cluster depth
  vec3 shadow_color = vec3(0.080, 0.025, 0.310);   // #4C1D95 linear
  float shadowRing = smoothstep(uBloomRadius * 1.50, uBloomRadius * 0.90, r) *
                     (1.0 - smoothstep(uBloomRadius * 0.85, 0.0, r));
  vec3 base = mix(dark, shadow_color, shadowRing * uShadowAmount * 0.40);

  // Petal geometry: scaled to the canonical SVG proportions
  // SVG canonical: tip at y=-58, root at y=15 → tip extent 58, root overlap 15 from origin
  // Width: right max 40, left max 30 (asymmetric ~4:3)
  // For shader uv in [-0.5, 0.5]: scale length to uBloomRadius (default 0.55)
  // Width scale: maintain ~4:3 asymmetry ratio
  float petalLen = uBloomRadius;
  float petalWR  = uBloomRadius * 0.32;   // right side wider
  float petalWL  = uBloomRadius * 0.24;   // left side narrower

  // Per-blade composition — max-blend defines clean petal SHAPE
  // (proven from pre-polish render; center bloom is a SEPARATE additive layer below)
  vec3 petalAccum = vec3(0.0);
  float maskAccum = 0.0;

  for (int i = 0; i < 5; i++) {
    float bladeAngle = -HALF_PI + TAU * float(i) / 5.0 + slowSpin;
    vec2 localP = rot2(uv, -(bladeAngle + HALF_PI));

    float mask = petalMask(localP, petalLen, petalWR, petalWL);

    vec3 outer, inner;
    float opacity_i;
    if (i == 0)      { outer = g1_outer; inner = g1_inner; opacity_i = 0.85; }
    else if (i == 1) { outer = g2_outer; inner = g2_inner; opacity_i = 0.80; }
    else if (i == 2) { outer = g3_outer; inner = g3_inner; opacity_i = 0.80; }
    else if (i == 3) { outer = g4_outer; inner = g4_inner; opacity_i = 0.75; }
    else             { outer = g1_outer; inner = g1_inner; opacity_i = 0.70; }

    float radialT = clamp(localP.y / petalLen, 0.0, 1.0);
    vec3 petalColor = mix(inner, outer, radialT);
    petalColor = mix(petalColor, uColor, 0.10);

    float weighted = mask * opacity_i;
    if (weighted > maskAccum) {
      petalAccum = petalColor;
      maskAccum = weighted;
    } else if (weighted > 0.0) {
      // Soft blend at petal-overlap zones for the flower-heart color mixing
      petalAccum = mix(petalAccum, petalColor, weighted * 0.4);
    }
  }

  // Composite petals over base — preserves clean petal SHAPE
  vec3 col = mix(base, petalAccum, maskAccum * uIntensity);

  // CENTER BLOOM — separate additive layer that bridges petal roots → hot spot.
  // Brand-violet glow that radiates outward, peaking at r=0, fully faded by
  // r=petalLen*0.22 (just past where petal roots converge).
  // ADDITIVE over the petal layer so it BRIGHTENS the iris-heart without
  // washing out the petal definition elsewhere.
  vec3 heartViolet = vec3(0.207, 0.038, 0.851);  // #7C3AED linear
  float heartGlow = smoothstep(petalLen * 0.22, 0.0, r);
  col += heartViolet * heartGlow * 0.40 * uIntensity;

  // Center hot spot — LARGER + SOFTER than v1 (canonical r=8 = 4% of viewBox)
  // 0.075 reads cleanly at hero scale vs the pinpoint 0.040 of v1
  vec3 hotspot_color = vec3(0.825, 0.776, 0.992);  // #EDE9FE linear
  float hotspot = smoothstep(0.075, 0.0, r);
  col = mix(col, hotspot_color, hotspot * 0.70);

  // Inner white pinprick — canonical r=4 (2% of viewBox), softer 0.030 radius
  float pinprick = smoothstep(0.030, 0.0, r);
  col = mix(col, vec3(1.0), pinprick * 0.50);

  // Subtle atmospheric fbm haze — adds organic life without breaking symmetry
  vec2 hP = uv * 3.0 + driftLoop(t, 24.0, 0.20);
  float haze = (fbm3(hP) - 0.5) * 0.06;
  col += uColor * haze * maskAccum;

  // Outer fade
  col *= smoothstep(1.4, 0.05, r * 1.25);

  // sRGB out
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
