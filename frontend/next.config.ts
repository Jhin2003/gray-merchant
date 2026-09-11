import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent a lockfile elsewhere in the user profile from widening the
    // inferred workspace root beyond this application.
    root: process.cwd(),
  },
};

export default nextConfig;
