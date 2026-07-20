import { withBasePath } from "./base-path";
import type { AppContent } from "./types";

export async function fetchContent(): Promise<AppContent> {
  const res = await fetch(withBasePath("/data/content.json"));
  if (!res.ok) throw new Error("Failed to load content");
  return res.json() as Promise<AppContent>;
}

export function downloadContent(content: AppContent): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "content.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function getAdminPassword(): string {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "charlene2026";
}
