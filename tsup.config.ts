import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    r3f: 'src/r3f.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@react-three/fiber', 'three'],
  loader: {
    '.glsl': 'text',
    '.frag': 'text',
    '.vert': 'text',
  },
  // The .glsl loader gives us GLSL-as-string at build time — keeps the API simple
  // (consumer doesn't need a bundler plugin) and tree-shakeable per shader.
  esbuildOptions(options) {
    options.banner = {
      js: '/* @okaybabe/shaders v1.0.0 — MIT — https://okaybabe.com/gradients */',
    };
  },
});
