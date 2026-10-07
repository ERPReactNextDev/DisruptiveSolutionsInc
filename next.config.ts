import type { NextConfig } from "next";

/**
 * Hosts allowed to be optimized by next/image.
 * Every remote image in the app comes from one of these:
 *  - Cloudinary (product/lifestyle media uploaded from the admin panel)
 *  - Firebase Storage (legacy uploads, project `taskflow-4605f`)
 *  - Unsplash (editorial imagery used on marketing pages)
 *  - Google Lighthouse / PageSpeed images
 *  - Disruptive Solutions Inc WordPress (legacy hero/marketing images)
 */
const imageRemotePatterns = [
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "api.cloudinary.com" },
  { protocol: "https", hostname: "firebasestorage.googleapis.com" },
  { protocol: "https", hostname: "taskflow-4605f.firebasestorage.app" },
  { protocol: "https", hostname: "lh3.googleusercontent.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "disruptivesolutionsinc.com" },
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