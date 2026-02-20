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
      bodySizeLimit: '100mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
