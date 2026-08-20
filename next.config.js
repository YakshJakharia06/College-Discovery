/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // next.config.js
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      // Allow external images (e.g. from Unsplash, GitHub, or your CDN)
      "img-src 'self' data: https:",
      "font-src 'self'",
      // Allow network connections to external APIs (e.g. https://api.example.com)
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  // HSTS only makes sense once you're actually served over HTTPS (i.e. in production/Vercel)
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;