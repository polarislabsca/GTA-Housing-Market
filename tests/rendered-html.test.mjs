import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the housing dashboard shell and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Toronto Housing Market Dashboard<\/title>/i);
  assert.match(html, /See where sales and prices are moving\./);
  assert.match(html, /Download linked Excel data/);
  assert.match(html, /City or area/);
  assert.match(html, /Property type/);
  assert.match(html, /All property types/);
  assert.match(html, /From year/);
  assert.match(html, /From month/);
  assert.match(html, /To year/);
  assert.match(html, /To month/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("dashboard data includes complete monthly city and property-type coverage", async () => {
  const text = await readFile(new URL("../public/data/market-data.json", import.meta.url), "utf8");
  const data = JSON.parse(text);
  assert.ok(data.cities.length >= 76);
  assert.equal(data.propertyTypes.length, 9);
  assert.equal(new Set(data.records.map((row) => row.date)).size, 66);
  assert.equal(data.metadata.periodStart, "2021-01-01");
  assert.equal(data.metadata.periodEnd, "2026-06-01");

  const allTrrebCoverage = new Set(
    data.records
      .filter((row) => row.city === "All TRREB Areas")
      .map((row) => `${row.date}:${row.propertyType}`),
  );
  assert.equal(allTrrebCoverage.size, 66 * 9);

  const january2021Detached = data.records.find(
    (row) => row.date === "2021-01-01" && row.city === "All TRREB Areas" && row.propertyType === "Detached",
  );
  assert.deepEqual(
    { sales: january2021Detached.sales, averagePrice: january2021Detached.averagePrice },
    { sales: 2766, averagePrice: 1359915 },
  );

  const juneDetached = data.records.find(
    (row) => row.date === "2026-06-01" && row.city === "All TRREB Areas" && row.propertyType === "Detached",
  );
  assert.deepEqual(
    { sales: juneDetached.sales, averagePrice: juneDetached.averagePrice, activeListings: juneDetached.activeListings },
    { sales: 3256, averagePrice: 1364204, activeListings: 12635 },
  );
});

test("dashboard source includes the responsive automatic market summary", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Automatic analysis/);
  assert.match(source, /Recent sales momentum/);
  assert.match(source, /highest sales month/i);
  assert.match(source, /raw months of inventory/);
});

test("dashboard includes a persistent light and dark theme switch and hides downloads on GitHub Pages", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /housing-dashboard-theme/);
  assert.match(source, /hostname\.endsWith\("github\.io"\)/);
  assert.match(source, /className="theme-toggle"/);
  assert.match(source, /!isGitHubPages/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /color-scheme: dark/);
});
