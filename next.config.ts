import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ersuemtbcjynjmmmamwa.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
