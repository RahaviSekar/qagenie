/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["playwright", "@playwright/test", "playwright-core", "@google/generative-ai"],
};

export default nextConfig;
