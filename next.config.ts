import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page here is per-user and auth-gated, so we run fully dynamic and skip Cache Components.
  cacheComponents: false,
  // PGlite loads its WASM via import.meta.url, which breaks when bundled. Load it from node_modules.
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
