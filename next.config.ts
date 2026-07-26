import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile in the home
  // directory was otherwise being picked up).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
