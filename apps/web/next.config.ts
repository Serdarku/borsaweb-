import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@borsa/types", "@borsa/data", "@borsa/ui"],
  reactStrictMode: true,
};

export default nextConfig;