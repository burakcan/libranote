import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ['libranote.relaymate.com'],
  }
};

const withNextIntl = createNextIntlPlugin(
  "./src/lib/i18n/request.ts"
);

export default withNextIntl(nextConfig);
