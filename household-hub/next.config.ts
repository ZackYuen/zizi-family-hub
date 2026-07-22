import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static export only when building for GitHub Pages
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages && basePath ? basePath : undefined,
  assetPrefix: isGithubPages && basePath ? `${basePath}/` : undefined,
  // GitHub Pages wants trailing slashes; Vercel APIs break POST with 308 if this is true
  trailingSlash: isGithubPages,
  images: { unoptimized: true },
};

export default nextConfig;
