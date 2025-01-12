import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  webpack: (config, {}) => {
    // Use filesystem cache with compression
    config.cache = {
      type: "filesystem",
      cacheDirectory: path.resolve(".next/cache/webpack"), // Explicit cache directory
      compression: "gzip", // Compress cache files to reduce size
      buildDependencies: {
        config: [__filename], // Invalidate cache when config changes
      },
    };

    return config;
  },
};

export default nextConfig;
