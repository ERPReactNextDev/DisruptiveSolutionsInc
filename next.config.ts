import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

/**
 * Hosts allowed to be optimized by next/image.
 */
const imageRemotePatterns: RemotePattern[] = [
  { protocol: "https" as const, hostname: "res.cloudinary.com" },
  { protocol: "https" as const, hostname: "api.cloudinary.com" },
  { protocol: "https" as const, hostname: "firebasestorage.googleapis.com" },
  { protocol: "https" as const, hostname: "taskflow-4605f.firebasestorage.app" },
  { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
  { protocol: "https" as const, hostname: "images.unsplash.com" },
  { protocol: "https" as const, hostname: "disruptivesolutionsinc.com" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: imageRemotePatterns,
    formats: ["image/avif", "image/webp"],
    // Product photos come from Firestore at unknown dimensions; we cap the
    // optimizer so a single 6000px upload cannot blow up build memory.
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;