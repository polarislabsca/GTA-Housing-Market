// Builds a self-contained, relative-URL test bundle of the whole site into site/test-bundle/.
//
// Usage (from dashboard/): node site/test-bundle.mjs
//
// Uses the existing builds (github-dist/ for the dashboard, site/src/ for the Advanced pages).
// The Advanced pages become one shell, advanced.html, that picks its page from the URL hash
// (advanced.html#/areas/markham/, advanced.html#/zh/letters/2026-10/), so the bundle works from
// any folder on a static host.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { areaRoutes, routeHelpers } from "./src/app.js";
import { siteData } from "./site-data.mjs";

const SITE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SITE, "..");
const OUT = join(SITE, "test-bundle");
const DASH = join(ROOT, "github-dist");

const read = (p) => readFileSync(p, "utf8");
const write = (rel, text) => {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};

// Replaces every occurrence of `from` in `text`, failing unless it occurs exactly `count` times.
function patch(text, from, to, count, label) {
  const found = text.split(from).length - 1;
  console.log(`patch ${label}: found ${found}, expected ${count}`);
  if (found !== count) throw new Error(`Patch "${label}" found ${found} matches, expected ${count}.`);
  return text.split(from).join(to);
}

// --- dashboard ---------------------------------------------------------------------------
const jsName = readdirSync(join(DASH, "assets")).find((f) => /^index-.*\.js$/.test(f));
const cssName = readdirSync(join(DASH, "assets")).find((f) => /^index-.*\.css$/.test(f));
if (!jsName || !cssName) throw new Error("The dashboard build (github-dist/assets) is missing.");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

write(
  "index.html",
  `<title>GTA Dashboard Test Site</title>\n<style>${read(join(DASH, "assets", cssName))}</style>\n<div id="root"></div>\n<script type="module" src="assets/app.js"></script>\n`,
);

let dashJs = read(join(DASH, "assets", jsName));
dashJs = patch(dashJs, "advanced/zh/", "advanced.html#/zh/", 1, "dashboard advanced/zh/");
dashJs = patch(dashJs, "`advanced/`", "`advanced.html#/`", 1, "dashboard `advanced/`");
dashJs = patch(dashJs, "https://polarislabsca.github.io/GTA-Housing-Market/", "./", 1, "dashboard site origin");
write("assets/app.js", dashJs);

write("data/market-data.json", read(join(DASH, "data/market-data.json")));
const letter = JSON.parse(read(join(DASH, "data/latest-letter.json")));
for (const l of ["en", "zh"]) {
  const before = letter[l].path;
  if (!before.startsWith("advanced/")) throw new Error(`Unexpected letter path: ${before}`);
  letter[l].path = "advanced.html#/" + before.slice("advanced/".length);
  console.log(`letter ${l}: ${before} -> ${letter[l].path}`);
}
write("data/latest-letter.json", JSON.stringify(letter, null, 2) + "\n");

// --- advanced ----------------------------------------------------------------------------
const market = JSON.parse(read(join(ROOT, "public/data/market-data.json")));
const data = siteData(market);
write("advanced/data/site-data.json", JSON.stringify(data));
write("advanced/assets/styles.css", read(join(SITE, "src/styles.css")));

let app = read(join(SITE, "src/app.js"));
app = patch(app, 'location.href=BASE+(want==="zh"?"zh/":"");', 'window.__go(BASE+(want==="zh"?"zh/":""));', 1, "tour start");
app = patch(app, "location.href=h(`area.${slug(c)}.${ti}`)}", "window.__go(h(`area.${slug(c)}.${ti}`))}", 1, "pick-an-area form");
app = patch(app, 'location.replace(BASE+"zh/");return', 'window.__go(BASE+"zh/");return', 1, "saved-language redirect");
app = patch(app, 'location.href=langHref()}', 'window.__go(langHref())}', 1, "language button");
app = patch(app, 'SITE_ORIGIN+BASE+(lang==="zh"?"zh/":"")', 'SITE_ORIGIN+"/GTA-Housing-Market/"+BASE+(lang==="zh"?"zh/":"")', 1, "share URL");
const left = app.match(/location\.(href|replace)\s*[=(]/g);
if (left) throw new Error(`Unpatched navigation left in advanced app.js: ${left.join(", ")}`);
write("advanced/assets/app.js", app);

// Route map: path (relative to the advanced base) -> token.
const tokens = ["home", "explore", "areas", "letters", "afford", "compare", ...data.months.map((m) => `letter.${m}`), ...areaRoutes(data)];
const routes = {};
for (const t of tokens) routes[routeHelpers.pathFor(t)] = t;
console.log(`route map: ${Object.keys(routes).length} paths`);

const router = `(function(){
var BASE="advanced/",ROUTES=${JSON.stringify(routes)};
try{history.scrollRestoration="manual"}catch(e){}
function parse(){
  var h=location.hash.replace(/^#\\/?/,""),zh=false;
  if(h==="zh"||h.indexOf("zh/")===0){zh=true;h=h.slice(2).replace(/^\\//,"")}
  h=h.split("?")[0];if(h&&h.slice(-1)!=="/")h+="/";
  var token=Object.prototype.hasOwnProperty.call(ROUTES,h)?ROUTES[h]:"home";
  return {token:token,lang:zh?"zh":"en"};
}
var r=parse();
document.body.dataset.route=r.token;document.body.dataset.lang=r.lang;
document.documentElement.lang=r.lang==="zh"?"zh-CN":"en";
window.__go=function(url){
  url=String(url==null?"":url);
  if(url.indexOf(BASE)===0){
    location.hash="#/"+url.slice(BASE.length);
    window.scrollTo(0,0);location.reload();
  }else{
    window.scrollTo(0,0);location.href="index.html";
  }
};
function dash(href){return href===""||href==="./"||href==="index.html"}
document.addEventListener("click",function(e){
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var a=e.target.closest&&e.target.closest("a");if(!a||(a.target&&a.target!=="_self"))return;
  var href=a.getAttribute("href");if(href==null)return;
  if(href.indexOf(BASE)===0||dash(href)){e.preventDefault();e.stopPropagation();window.__go(href)}
},true);
window.addEventListener("hashchange",function(){
  var n=parse();if(n.token!==document.body.dataset.route||n.lang!==document.body.dataset.lang)location.reload();
});
})();`;

write(
  "advanced.html",
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>GTA Housing Market</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="advanced/assets/styles.css">
</head>
<body data-route="home" data-lang="en" data-base="advanced/">
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="advanced/" id="brandLink"><b id="brandName"></b><span id="brandSub"></span><span class="badge" id="brandBadge"></span></a>
    <nav class="main" id="nav" aria-label="Main"></nav>
    <button class="lang" id="langBtn" type="button"></button>
  </div>
</header>
<main class="wrap" id="app"></main>
<footer class="wrap" id="foot"></footer>
<script>${router}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script type="module" src="advanced/assets/app.js"></script>
</body>
</html>
`,
);

// --- summary -----------------------------------------------------------------------------
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(OUT);
for (const f of files) console.log(`${String(statSync(f).size).padStart(10)}  ${relative(OUT, f)}`);
console.log(`${files.length} files`);
