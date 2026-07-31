import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "github-dist");
const output = resolve(root, "github-upload");
let html = await readFile(resolve(dist, "index.html"), "utf8");

const scriptPath = html.match(/src="\.\/(assets\/[^"]+\.js)"/)?.[1];
const stylePath = html.match(/href="\.\/(assets\/[^"]+\.css)"/)?.[1];
if (!scriptPath || !stylePath) throw new Error("Could not locate the GitHub Pages assets.");

const [script, style] = await Promise.all([
  readFile(resolve(dist, scriptPath), "utf8"),
  readFile(resolve(dist, stylePath), "utf8"),
]);

html = html
  .replace(/\s*<script type="module"[^>]+><\/script>/, "")
  .replace(/\s*<link rel="stylesheet"[^>]+>/, "")
  .replace("</head>", () => `<style>${style}</style></head>`)
  .replace("</body>", () => `<script type="module">${script
    .replaceAll("./data/market-data.json", "./market-data.json")
    .replaceAll("./data/TRREB_Detached_Dataset_through_2026-06.xlsx", "./TRREB_Detached_Dataset_through_2026-06.xlsx")}</script></body>`);

await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(resolve(output, "index.html"), html),
  copyFile(resolve(root, "public/data/market-data.json"), resolve(output, "market-data.json")),
  copyFile(resolve(root, "public/data/TRREB_Detached_Dataset_through_2026-06.xlsx"), resolve(output, "TRREB_Detached_Dataset_through_2026-06.xlsx")),
  copyFile(resolve(root, "public/og.png"), resolve(output, "og.png")),
]);
