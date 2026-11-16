// Builds the static GTA Housing Market site into site/dist.
//
// Usage (from dashboard/): node site/build.mjs
//
// Every page (each area and home type, each monthly letter, the tools) is written as its own
// HTML file in English and Chinese, with its content pre-rendered from the same code the
// browser runs, so it can be read and indexed without JavaScript.
//
// The dashboard (built separately into github-dist/) is the front page of the site. These pages
// are its "Advanced" mode and live under /advanced/. Addresses from before the swap (/letters/…,
// /areas/…, /legacy/) are sent to their new place by the 404 page.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { areaRoutes, letterFeedItem, renderPage, routeHelpers } from "./src/app.js";
import { siteData } from "./site-data.mjs";

const SITE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SITE, "..");
const DIST = join(SITE, "dist");
const HOME = "/GTA-Housing-Market/"; // the dashboard
const ADVANCED = "advanced/";
const BASE = HOME + ADVANCED; // these pages
const OUT = join(DIST, ADVANCED);
const ORIGIN = "https://polarislabsca.github.io";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

function pageUrl(lang, token) {
  return BASE + (lang === "zh" ? "zh/" : "") + routeHelpers.pathFor(token);
}

// Visitor counting (Cloudflare Web Analytics). Same tag as github-pages/index.html; it goes on every page.
const TRACKER = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "878ae91f6e0b4f16b86199ae7a3e1013"}'></script><!-- End Cloudflare Web Analytics -->`;

function layout({ lang, token, page, assets }) {
  const { meta, shell, brand, html } = page;
  const url = ORIGIN + pageUrl(lang, token);
  const other = lang === "zh" ? "en" : "zh";
  const feed = BASE + (lang === "zh" ? "zh/" : "") + "letters/feed.xml";
  return `<!doctype html>
<html lang="${lang === "zh" ? "zh-CN" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${ORIGIN + pageUrl("en", token)}">
<link rel="alternate" hreflang="zh-Hans" href="${ORIGIN + pageUrl("zh", token)}">
<link rel="alternate" type="application/rss+xml" title="${esc(brand.name)}" href="${feed}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN + BASE}og.png">
<meta property="og:locale" content="${lang === "zh" ? "zh_CN" : "en_CA"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${BASE}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${BASE}assets/styles.css?v=${assets.css}">
${TRACKER}
</head>
<body data-route="${esc(token)}" data-lang="${lang}" data-base="${BASE}">
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="${pageUrl(lang, "home")}" id="brandLink"><b id="brandName">${esc(brand.name)}</b><span id="brandSub">${esc(brand.sub)}</span><span class="badge" id="brandBadge">${esc(brand.badge)}</span></a>
    <nav class="main" id="nav" aria-label="Main">${shell.nav}</nav>
    <button class="lang" id="langBtn" type="button" lang="${other === "zh" ? "zh-CN" : "en"}">${shell.langLabel}</button>
  </div>
</header>
<main class="wrap" id="app">${html}</main>
<footer class="wrap" id="foot">${shell.foot}</footer>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script type="module" src="${BASE}assets/app.js?v=${assets.js}"></script>
</body>
</html>
`;
}

function writePage(path, html) {
  const file = join(OUT, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function rss(data, lang) {
  const items = [];
  for (let i = data.months.length - 1; i >= Math.max(0, data.months.length - 24); i--) {
    const item = letterFeedItem(data, i, lang);
    const link = ORIGIN + pageUrl(lang, `letter.${item.month}`);
    items.push(`<item><title>${esc(item.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${new Date(`${item.month}-15T12:00:00Z`).toUTCString()}</pubDate><description>${esc(item.summary)}</description></item>`);
  }
  const title = lang === "zh" ? "大多伦多房地产市场 · 月度市场报告" : "GTA Housing Market · Market letters";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${title}</title><link>${ORIGIN + pageUrl(lang, "letters")}</link><description>${title}</description><language>${lang === "zh" ? "zh-cn" : "en-ca"}</language>${items.join("")}</channel></rss>\n`;
}

function main() {
  const market = JSON.parse(readFileSync(join(ROOT, "public/data/market-data.json"), "utf8"));
  const data = siteData(market);
  const css = readFileSync(join(SITE, "src/styles.css"), "utf8");
  const js = readFileSync(join(SITE, "src/app.js"), "utf8");
  const assets = { css: hash(css), js: hash(js) };

  const dashboard = join(ROOT, "github-dist");
  if (!existsSync(join(dashboard, "index.html")) || !existsSync(join(dashboard, "zh/index.html"))) throw new Error("The dashboard build (github-dist/) is missing. Run npm run build:pages first, or npm run build:site to do both.");
  rmSync(DIST, { recursive: true, force: true });
  cpSync(dashboard, DIST, { recursive: true });
  if (existsSync(join(ROOT, "public/.nojekyll"))) cpSync(join(ROOT, "public/.nojekyll"), join(DIST, ".nojekyll"));
  mkdirSync(join(OUT, "assets"), { recursive: true });
  mkdirSync(join(OUT, "data"), { recursive: true });
  writeFileSync(join(OUT, "assets/styles.css"), css);
  writeFileSync(join(OUT, "assets/app.js"), js);
  writeFileSync(join(OUT, "data/site-data.json"), JSON.stringify(data));
  for (const file of ["favicon.svg", "og.png", ".nojekyll"]) if (existsSync(join(ROOT, "public", file))) cpSync(join(ROOT, "public", file), join(OUT, file));

  const tokens = ["home", "explore", "areas", "letters", "afford", "compare", ...data.months.map((m) => `letter.${m}`), ...areaRoutes(data)];
  const urls = [ORIGIN + HOME, ORIGIN + HOME + "zh/"]; // the dashboard, in English and in Chinese
  for (const lang of ["en", "zh"]) {
    for (const token of tokens) {
      const page = renderPage(data, token, lang, BASE);
      const path = (lang === "zh" ? "zh/" : "") + routeHelpers.pathFor(token);
      writePage(path, layout({ lang, token, page, assets }));
      urls.push(ORIGIN + BASE + path);
    }
    const feedDir = join(OUT, lang === "zh" ? "zh" : "", "letters");
    mkdirSync(feedDir, { recursive: true });
    writeFileSync(join(feedDir, "feed.xml"), rss(data, lang));
  }

  writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN + HOME}sitemap.xml\n`);
  // Before the swap these pages sat at the root and the dashboard at /legacy/. The 404 page sends
  // those old addresses to where the same thing is now, and shows "not found" for anything else.
  const moved = `(function(){var home=${JSON.stringify(HOME)},p=location.pathname;if(p.indexOf(home)!==0)return;var rest=p.slice(home.length);if(/^legacy(\\/|$)/.test(rest)){location.replace(home+location.search+location.hash);return}if(rest&&rest.indexOf(${JSON.stringify(ADVANCED)})!==0&&/^(zh|letters|areas|explore|tools)(\\/|$)/.test(rest))location.replace(home+${JSON.stringify(ADVANCED)}+rest+location.search+location.hash)})();`;
  writeFileSync(join(DIST, "404.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · GTA Housing Market</title><script>${moved}</script><link rel="stylesheet" href="${BASE}assets/styles.css?v=${assets.css}">${TRACKER}</head><body><main class="wrap" style="padding-block:80px;display:flex;flex-direction:column;gap:16px"><h1>Page not found</h1><p class="lede" lang="zh-CN">找不到这个页面。</p><p><a href="${HOME}">Go to the dashboard</a> · <a href="${HOME}" lang="zh-CN">返回数据看板</a></p></main></body></html>\n`);

  console.log(`Built the dashboard at ${HOME} and ${urls.length - 2} advanced pages under ${BASE}, through ${data.months.at(-1)}.`);
}

main();
