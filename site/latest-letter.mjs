// Writes public/data/latest-letter.json: the newest market letter's headline, opening paragraph and
// link in English and Chinese, shown in the box at the top of the dashboard.
//
// Usage (from dashboard/): node site/latest-letter.mjs   (runs before the dashboard build)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { letterFeedItem, routeHelpers } from "./src/app.js";
import { siteData } from "./site-data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Letters are part of the Advanced pages. The dashboard turns this path into a link.
const ADVANCED = "advanced/";

const data = siteData(JSON.parse(readFileSync(join(ROOT, "public/data/market-data.json"), "utf8")));
const latest = data.months.length - 1;
const entry = (lang) => {
  const item = letterFeedItem(data, latest, lang);
  return { title: item.title, summary: item.summary, path: ADVANCED + (lang === "zh" ? "zh/" : "") + routeHelpers.pathFor(`letter.${item.month}`) };
};
const payload = { month: data.months[latest], en: entry("en"), zh: entry("zh") };
writeFileSync(join(ROOT, "public/data/latest-letter.json"), JSON.stringify(payload, null, 2) + "\n");
console.log(`Latest letter (${payload.month}): ${payload.en.title}`);
