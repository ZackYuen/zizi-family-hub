/** Base path when hosted on GitHub Pages (e.g. /zizi-family-hub) */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${basePath}${path}`;
}
