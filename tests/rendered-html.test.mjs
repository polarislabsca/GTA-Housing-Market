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
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("dashboard data includes complete monthly city and property-type coverage", async () => {
  const text = await readFile(new URL("../public/data/market-data.json", import.meta.url), "utf8");
  const data = JSON.parse(text);
  assert.equal(data.cities.length, 76);
  assert.equal(data.propertyTypes.length, 9);
  assert.equal(data.records.length, 76 * 9 * 6);
  assert.equal(data.metadata.periodStart, "2026-01-01");
  assert.equal(data.metadata.periodEnd, "2026-06-01");

  const juneDetached = data.records.find(
    (row) => row.date === "2026-06-01" && row.city === "All TRREB Areas" && row.propertyType === "Detached",
  );
  assert.deepEqual(
    { sales: juneDetached.sales, averagePrice: juneDetached.averagePrice, activeListings: juneDetached.activeListings },
    { sales: 3256, averagePrice: 1364204, activeListings: 12635 },
  );
});
