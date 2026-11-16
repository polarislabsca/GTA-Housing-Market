// Serves the built site (site/dist) on this computer the way GitHub Pages does: under
// /GTA-Housing-Market/, with index.html for folders and 404.html for anything missing.
//
// Usage (from dashboard/): npm run build:site, then node site/preview.mjs [port]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "dist");
const HOME = "/GTA-Housing-Market/";
const PORT = Number(process.argv[2]) || 4319;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (path === "/" || path === HOME.slice(0, -1)) { response.writeHead(302, { Location: HOME }).end(); return; }
  let file = path.startsWith(HOME) ? join(DIST, normalize(path.slice(HOME.length))) : null;
  if (file && !file.startsWith(DIST)) file = null;
  if (file && existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) { response.writeHead(301, { Location: path + "/" }).end(); return; }
    file = join(file, "index.html");
  }
  const found = file && existsSync(file);
  if (!found) file = join(DIST, "404.html");
  response.writeHead(found ? 200 : 404, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(response);
}).listen(PORT, () => console.log(`Site preview: http://localhost:${PORT}${HOME}`));
