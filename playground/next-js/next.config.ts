import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    root: path.join(__dirname),
  },
  webpack: (config) => {
    config.resolve.alias["fuderu"] = path.resolve(__dirname, "../../src");
    return config;
  },
};

export default nextConfig;
