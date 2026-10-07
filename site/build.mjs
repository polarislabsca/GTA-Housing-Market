// Builds the static GTA Housing Market site into site/dist.
//
// Usage (from dashboard/): node site/build.mjs
//
// Every page (each area and home type, each monthly letter, the tools) is written as its own
// HTML file in English and Chinese, with its content pre-rendered from the same code the
// browser runs, so it can be read and indexed without JavaScript. The original dashboard,
// built separately into github-dist/, is copied in at /legacy/.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { areaRoutes, letterFeedItem, renderPage, routeHelpers } from "./src/app.js";

const SITE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SITE, "..");
const OUT = join(SITE, "dist");
const BASE = "/GTA-Housing-Market/";
const ORIGIN = "https://polarislabsca.github.io";
const HOME_TYPES = ["Detached", "Semi-Detached", "Townhouse", "Condo Townhouse", "Condo Apartment"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

// Compact per-area, per-home-type monthly series for the site, plus an "All" series that
// combines all nine TRREB property types (sales-weighted average price, since medians
// can't be combined across types).
function siteData(market) {
  const months = [...new Set(market.records.map((r) => r.date))].sort();
  const index = new Map(months.map((m, i) => [m, i]));
  const n = months.length;
  const blank = () => ({ m: Array(n).fill(null), s: Array(n).fill(null), a: Array(n).fill(null), r: Array(n).fill(null), d: Array(n).fill(null), i: Array(n).fill(null), v: Array(n).fill(null) });
  const series = {};
  const totals = {};
  for (const r of market.records) {
    const i = index.get(r.date);
    const sales = r.sales || 0;
    const t = (totals[r.city] ??= Array.from({ length: n }, () => ({ sales: 0, active: 0, priceSum: 0, slrSum: 0, domSum: 0, weight: 0 })))[i];
    t.sales += sales;
    t.active += r.activeListings || 0;
    if (sales && r.averagePrice) t.priceSum += r.averagePrice * sales;
    if (sales && r.saleToList && r.daysOnMarket) { t.slrSum += r.saleToList * sales; t.domSum += r.daysOnMarket * sales; t.weight += sales; }
    if (!HOME_TYPES.includes(r.propertyType)) continue;
    const s = (series[`${r.city}|${r.propertyType}`] ??= blank());
    s.m[i] = r.medianPrice ? Math.round(r.medianPrice / 1000) : null;
    s.v[i] = r.averagePrice ? Math.round(r.averagePrice / 1000) : null;
    s.s[i] = r.sales;
    s.a[i] = r.activeListings;
    s.r[i] = r.saleToList || null;
    s.d[i] = r.daysOnMarket || null;
    s.i[i] = r.monthsOfInventory ? Math.round(r.monthsOfInventory * 10) / 10 : null;
  }
  for (const [city, rows] of Object.entries(totals)) {
    const s = blank();
    rows.forEach((t, i) => {
      s.s[i] = t.sales;
      s.a[i] = t.active;
      if (t.sales) { s.m[i] = s.v[i] = Math.round(t.priceSum / t.sales / 1000); s.i[i] = Math.round((t.active / t.sales) * 10) / 10; }
      if (t.weight) { s.r[i] = Math.round(t.slrSum / t.weight); s.d[i] = Math.round(t.domSum / t.weight); }
    });
    series[`${city}|All`] = s;
  }
  for (const key of Object.keys(series)) if (!series[key].s.some((v) => v)) delete series[key];
  return { months: months.map((m) => m.slice(0, 7)), types: ["All", ...HOME_TYPES], cities: market.cities, d: series };
}

function pageUrl(lang, token) {
  return BASE + (lang === "zh" ? "zh/" : "") + routeHelpers.pathFor(token);
}

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
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "878ae91f6e0b4f16b86199ae7a3e1013"}'></script><!-- End Cloudflare Web Analytics -->
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

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "assets"), { recursive: true });
  mkdirSync(join(OUT, "data"), { recursive: true });
  writeFileSync(join(OUT, "assets/styles.css"), css);
  writeFileSync(join(OUT, "assets/app.js"), js);
  writeFileSync(join(OUT, "data/site-data.json"), JSON.stringify(data));
  for (const file of ["favicon.svg", "og.png", ".nojekyll"]) if (existsSync(join(ROOT, "public", file))) cpSync(join(ROOT, "public", file), join(OUT, file));

  const tokens = ["home", "explore", "areas", "letters", "afford", "compare", ...data.months.map((m) => `letter.${m}`), ...areaRoutes(data)];
  const urls = [];
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

  writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN + BASE}sitemap.xml\n`);
  writeFileSync(join(OUT, "404.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · GTA Housing Market</title><link rel="stylesheet" href="${BASE}assets/styles.css?v=${assets.css}"></head><body><main class="wrap" style="padding-block:80px;display:flex;flex-direction:column;gap:16px"><h1>Page not found</h1><p class="lede" lang="zh-CN">找不到这个页面。</p><p><a href="${BASE}">Go to the home page</a> · <a href="${BASE}zh/" lang="zh-CN">返回首页</a></p></main></body></html>\n`);

  const legacy = join(ROOT, "github-dist");
  if (existsSync(legacy)) cpSync(legacy, join(OUT, "legacy"), { recursive: true });
  console.log(`Built ${urls.length} pages through ${data.months.at(-1)}${existsSync(legacy) ? ", with the legacy dashboard at /legacy/" : " (legacy dashboard not found; run npm run build:pages first)"}.`);
}

main();
