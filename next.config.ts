import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile in the home
  // directory was otherwise being picked up).
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Payment submissions post several documents (invoice, TRC, Form 10F,
      // bank proof...) in one multipart request. The default cap is 1MB,
      // which real scans blow past immediately.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
