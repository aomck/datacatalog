import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/datacatalog',
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
