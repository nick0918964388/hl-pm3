import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/maximo/:endpoint',
        destination: `${process.env.REAL_API_BASE_URL || 'http://hl.webtw.xyz/maximo/oslc/script'}/:endpoint`,
      },
    ];
  },
};

export default nextConfig;
