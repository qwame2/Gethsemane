import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

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

export default withPWA(nextConfig);
