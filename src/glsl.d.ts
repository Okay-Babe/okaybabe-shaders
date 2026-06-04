// Tell TypeScript that .glsl/.frag/.vert imports return string content.
// tsup `loader: { '.glsl': 'text' }` makes this true at build time.

declare module '*.glsl' {
  const content: string;
  export default content;
}
declare module '*.frag.glsl' {
  const content: string;
  export default content;
}
declare module '*.vert.glsl' {
  const content: string;
  export default content;
}
declare module '*.frag' {
  const content: string;
  export default content;
}
declare module '*.vert' {
  const content: string;
  export default content;
}
