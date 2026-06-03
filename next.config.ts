import type { NextConfig } from "next";

/** LAN IPs for HMR when opening the app via http://<ip>:3000 (not only localhost). */
const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  "192.168.23.148",
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ??
    []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
