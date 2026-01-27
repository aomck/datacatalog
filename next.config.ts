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
    // Disable all static optimization
    isrMemoryCacheSize: 0,
  },
  // Disable route caching
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
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
