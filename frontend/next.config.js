/** @type {import('next').NextConfig} */
const rawInternalApi = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const internalBase = rawInternalApi.endsWith('/api/v1')
  ? rawInternalApi
  : `${rawInternalApi.replace(/\/$/, '')}/api/v1`;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('/')
      ? process.env.NEXT_PUBLIC_API_URL
      : '/api/v1',
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${internalBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
