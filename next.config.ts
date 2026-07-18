import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in production to hide original typescript/JSX logic
  productionBrowserSourceMaps: false,

  // Strip console logs in production to prevent competitors from inspecting crypto flows
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
