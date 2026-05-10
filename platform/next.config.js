import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default config;
