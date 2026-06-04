/**
 * createShaderProgram — minimal WebGL program compile + link helper.
 *
 * Returns the linked program + a map of uniform locations for the names
 * declared by the caller. Throws on compile/link errors with line-numbered
 * source for easier debugging during shader authoring.
 */

export interface CompiledProgram {
  program: WebGLProgram;
  uniformLocs: Record<string, WebGLUniformLocation | null>;
  attribLocs: Record<string, number>;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  label: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error(`createShader returned null for ${label}`);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown error';
    const numbered = source
      .split('\n')
      .map((line, i) => `${(i + 1).toString().padStart(3, ' ')}  ${line}`)
      .join('\n');
    gl.deleteShader(shader);
    throw new Error(`${label} compile failed:\n${info}\n\n${numbered}`);
  }
  return shader;
}

export function createShaderProgram(
  gl: WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
  uniformNames: string[],
  attribNames: string[]
): CompiledProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSource, 'vertex');
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSource, 'fragment');

  const program = gl.createProgram();
  if (!program) throw new Error('createProgram returned null');
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'unknown error';
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }

  // Shaders are kept attached (typical), but flagged for deletion when program is freed
  gl.detachShader(program, vert);
  gl.detachShader(program, frag);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  const uniformLocs: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniformLocs[name] = gl.getUniformLocation(program, name);
  }
  const attribLocs: Record<string, number> = {};
  for (const name of attribNames) {
    attribLocs[name] = gl.getAttribLocation(program, name);
  }

  return { program, uniformLocs, attribLocs };
}
