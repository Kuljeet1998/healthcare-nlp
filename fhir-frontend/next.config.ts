import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  // Environment variables for Docker
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  },
};

export default nextConfig;
