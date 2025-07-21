import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fal.media',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'v3.fal.media',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
