// Shared by site/build.mjs and site/latest-letter.mjs.
const HOME_TYPES = ["Detached", "Semi-Detached", "Townhouse", "Condo Townhouse", "Condo Apartment"];

// Compact per-area, per-home-type monthly series for the site, plus an "All" series that
// combines all nine TRREB property types (sales-weighted average price, since medians
// can't be combined across types).
export function siteData(market) {
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
