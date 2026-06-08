/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ["@ui/components"],
  },
  typescript: {
    tsconfigPath: '../../tsconfig.json',
  },
};

module.exports = nextConfig;
