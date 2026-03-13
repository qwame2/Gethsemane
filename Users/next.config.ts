import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAInit({
  dest: "public",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

const sentryConfig = withSentryConfig(withPWA(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: "gethsemane",
  project: "users-app",
});

export default sentryConfig;
