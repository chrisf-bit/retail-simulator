/** @type {import('next').NextConfig} */

// Build the connect-src allowlist from the configured socket server so the client
// can only open sockets/XHR to itself and the Render backend. Vercel injects
// NEXT_PUBLIC_SERVER_URL at build time; locally we fall back to the dev backend.
const isDev = process.env.NODE_ENV !== "production";
const connectSrc = new Set(["'self'"]);
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
if (serverUrl) {
  try {
    const u = new URL(serverUrl);
    connectSrc.add(u.origin);
    connectSrc.add(`wss://${u.host}`);
    connectSrc.add(`ws://${u.host}`);
  } catch {
    // ignore a malformed URL; connect-src just stays tighter
  }
}
if (isDev) {
  connectSrc.add("http://localhost:3001");
  connectSrc.add("ws://localhost:3001");
}

// script-src needs 'unsafe-inline' for Next's inline bootstrap; dev additionally
// needs 'unsafe-eval' for React Fast Refresh. Prod stays without eval.
const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src ${[...connectSrc].join(" ")}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sim/shared"],
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
