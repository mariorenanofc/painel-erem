import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.1.108:3000", "localhost:3000"],
  reactStrictMode: true,
};

export default nextConfig;
