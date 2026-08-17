import { cpSync, mkdirSync } from "fs";
import { join } from "path";

const root = join(process.cwd());
const publicData = join(root, "public", "data");
mkdirSync(publicData, { recursive: true });
cpSync(join(root, "data", "content.json"), join(publicData, "content.json"));
cpSync(join(root, "data", "dinner-recipes.json"), join(publicData, "dinner-recipes.json"));
try {
  cpSync(
    join(root, "data", "dinner-overrides.json"),
    join(publicData, "dinner-overrides.json")
  );
} catch {
  /* optional */
}
console.log("Synced data/*.json → public/data/");
