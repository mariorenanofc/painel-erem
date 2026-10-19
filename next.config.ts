import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      // Adicionei este caso você queira usar o Imgur no futuro (altamente recomendado!)
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  /* config options here */
  allowedDevOrigins: ["localhost:3000", "192.168.1.106"],
  reactStrictMode: true,
};

export default nextConfig;
