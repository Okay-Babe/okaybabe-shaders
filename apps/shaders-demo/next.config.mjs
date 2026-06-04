/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @okaybabe/shaders ships pre-built dist/ with GLSL already string-inlined,
  // so we don't need transpilePackages — Next consumes the built JS directly.
};

export default nextConfig;
