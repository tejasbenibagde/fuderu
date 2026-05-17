import type { NextConfig } from "next";
import path from 'path'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/fuderu/playground/next-js' : '',
  turbopack: {
    root: path.join(__dirname)
  }
};

export default nextConfig;
