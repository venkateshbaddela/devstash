import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
      allowedOrigins: [
        "*.app.github.dev",
        "fuzzy-journey-6pjppq4w6742rvpw-3000.app.github.dev",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
