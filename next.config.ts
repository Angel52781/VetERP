import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;
