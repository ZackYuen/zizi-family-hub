import fs from "fs/promises";
import path from "path";
import type { AppContent } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "content.json");

export async function getContent(): Promise<AppContent> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as AppContent;
}

export async function saveContent(content: AppContent): Promise<void> {
  const updated = { ...content, lastUpdated: new Date().toISOString() };
  await fs.writeFile(DATA_PATH, JSON.stringify(updated, null, 2), "utf-8");
}
