import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./prisma/dev.db"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default config;
