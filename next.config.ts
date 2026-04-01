import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "vm-qnmzryg3zqpa39rhvt67ql.vusercontent.net",
        "sb-4w84yle411jm.vercel.run",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
