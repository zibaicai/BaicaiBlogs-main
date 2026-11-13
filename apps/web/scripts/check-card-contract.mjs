import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "..");
const css = readFileSync(resolve(web, "app/styles/06-directory.css"), "utf8");
const card = readFileSync(resolve(web, "components/ArchiveItemCard.tsx"), "utf8");
const directory = readFileSync(resolve(web, "components/articles/ArticleDirectory.tsx"), "utf8");

const failures = [];

function block(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  return match?.[1] ?? "";
}

const copy = block(css, ".archive-card--cover .directory-card-copy");
const meta = block(css, ".archive-card--cover .directory-card-meta");

if (!/height:\s*var\(--cover-copy-height\)/.test(copy)) {
  failures.push("cover copy must use a fixed height: var(--cover-copy-height)");
}
if (/height:\s*auto/.test(copy)) {
  failures.push("cover copy must not use height:auto");
}
const maxHeight = copy.match(/max-height:\s*([^;]+)/)?.[1]?.trim();
if (maxHeight && maxHeight !== "none") {
  failures.push("cover copy must not use max-height instead of fixed height");
}
if (!/flex:\s*0\s+0\s+22px/.test(meta)) {
  failures.push("cover meta must reserve a fixed 22px row");
}
if (/position:\s*absolute/.test(meta)) {
  failures.push("cover meta must stay in normal flow");
}
if (!card.includes("label || category || coverLayout")) {
  failures.push("ArchiveItemCard must render an empty meta row for cover cards");
}
if (/layout=\{manage|className=\{manage/.test(directory)) {
  failures.push("ArticleDirectory mode must not switch card layout or class");
}

if (failures.length) {
  console.error("Card contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Card contract check passed.");
