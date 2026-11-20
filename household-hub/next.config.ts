import type { NextConfig } from "next";

// Never static-export on Vercel: API routes (reminders, Ask, Admin save) need
// a Node server. GitHub Pages is the only output:"export" target, and that
// workflow sets GITHUB_PAGES=true without VERCEL=1.
const isGithubPages =
  process.env.GITHUB_PAGES === "true" && process.env.VERCEL !== "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

if (isGithubPages) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  if (basePath) {
    nextConfig.basePath = basePath;
    nextConfig.assetPrefix = `${basePath}/`;
  }
}

export default nextConfig;
