import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Adicionei este caso você queira usar o Imgur no futuro (altamente recomendado!)
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      }
    ],
  },
  /* config options here */
  allowedDevOrigins: ["192.168.1.108:3000", "localhost:3000"],
  reactStrictMode: true,
};

export default nextConfig;
