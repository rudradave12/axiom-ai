import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@axiom/core', '@axiom/ui'],
  devIndicators: false,
};

export default nextConfig;
