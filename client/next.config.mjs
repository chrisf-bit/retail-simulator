/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sim/shared"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
