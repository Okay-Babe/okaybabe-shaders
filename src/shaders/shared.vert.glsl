// okaybabe canonical fullscreen-quad vertex shader.
// Used by all 12 fragment shaders. Passes UV in [0,1] range.
// WebGL 1.0 compatible — works as WebGL 2.0 fallback.

attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
