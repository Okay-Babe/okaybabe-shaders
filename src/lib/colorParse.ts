/**
 * colorParse — convert hex/rgb/oklch color strings to linear-RGB vec3.
 *
 * All shader uniforms work in linear-RGB. Brand colors precomputed in
 * shared.utils.glsl, but consumer-supplied `color` props need parsing.
 *
 * Supports:
 *   - `#7C3AED` / `#7c3aed` / `#7c3aedff`
 *   - `rgb(124, 60, 237)` / `rgba(124, 60, 237, 1)`
 *   - oklch parsing deferred to v1.1 (rare use case; consumers can use hex)
 */

export type RGB = [number, number, number];

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+)?\s*\)$/i;

/** sRGB byte channel → linear-RGB float (gamma 2.2 approximation). */
function srgbToLinear(c: number): number {
  return Math.pow(c / 255, 2.2);
}

/** HSL hue (0-360) → sRGB-byte vec3, assuming S=100, L=50. Used by `brandHue` prop. */
export function hueToRgbByte(h: number): RGB {
  // Pure-hue HSL (S=1, L=0.5) → RGB
  const k = (n: number) => (n + h / 30) % 12;
  const a = 0.5; // S * Math.min(L, 1 - L) with S=1, L=0.5
  const fn = (n: number) => 0.5 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(fn(0) * 255), Math.round(fn(8) * 255), Math.round(fn(4) * 255)];
}

/** Parse a color string to linear-RGB vec3. Throws on invalid input. */
export function colorParseLinear(input: string): RGB {
  const s = input.trim();
  const hexMatch = HEX_RE.exec(s);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  }
  const rgbMatch = RGB_RE.exec(s);
  if (rgbMatch) {
    return [
      srgbToLinear(parseFloat(rgbMatch[1])),
      srgbToLinear(parseFloat(rgbMatch[2])),
      srgbToLinear(parseFloat(rgbMatch[3])),
    ];
  }
  throw new Error(`colorParse: unsupported color string "${input}" — use hex (#7C3AED) or rgb()`);
}

/** Convert hue (0-360) → linear-RGB vec3. */
export function hueToLinearRgb(hue: number): RGB {
  const [r, g, b] = hueToRgbByte(hue);
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}
