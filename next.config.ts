import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/datacatalog',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
