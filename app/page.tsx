"use client";

import { useEffect, useMemo, useState } from "react";

type MarketRecord = {
  date: string;
  city: string;
  propertyType: string;
  sales: number;
  averagePrice: number | null;
  medianPrice: number | null;
  activeListings: number | null;
  monthsOfInventory: number | null;
  saleToList: number | null;
  daysOnMarket: number | null;
};

type DashboardData = {
  metadata: {
    updatedThrough: string;
    periodStart: string;
    periodEnd: string;
    source: string;
    sourceUrl: string;
    linkedWorkbook: string;
  };
  cities: string[];
  propertyTypes: string[];
  records: MarketRecord[];
};

const monthFormatter = new Intl.DateTimeFormat("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });
const monthOnlyFormatter = new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const integerFormatter = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });

const REGION_MEMBERS: { label: string; cities: string[] }[] = [
  { label: "Toronto", cities: ["City of Toronto", "Toronto Central", "Toronto East", "Toronto West"] },
  { label: "York Region", cities: ["York Region", "Aurora", "East Gwillimbury", "Georgina", "King", "Markham", "Newmarket", "Richmond Hill", "Stouffville", "Vaughan", "Whitchurch-Stouffville"] },
  { label: "Peel Region", cities: ["Peel Region", "Brampton", "Caledon", "Mississauga"] },
  { label: "Durham Region", cities: ["Durham Region", "Ajax", "Brock", "Clarington", "Oshawa", "Pickering", "Scugog", "Uxbridge", "Whitby"] },
  { label: "Halton Region", cities: ["Halton Region", "Burlington", "Halton Hills", "Milton", "Oakville"] },
  { label: "Simcoe County", cities: ["Simcoe County", "Adjala-Tosorontio", "Bradford", "Bradford West Gwillimbury", "Essa", "Innisfil", "New Tecumseth"] },
  { label: "Dufferin County", cities: ["Dufferin County", "Orangeville"] },
];

function monthLabel(date: string) {
  return monthFormatter.format(new Date(`${date}T00:00:00Z`));
}

function monthOnlyLabel(date: string) {
  return monthOnlyFormatter.format(new Date(`${date}T00:00:00Z`));
}

function compactCurrency(value: number) {
  return value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(2)}M` : `$${Math.round(value / 1_000)}K`;
}

function percentChange(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return (current / previous - 1) * 100;
}

function Delta({ value, suffix = "vs. period start" }: { value: number | null; suffix?: string }) {
  if (value == null) return <span className="delta neutral">Not available</span>;
  const direction = value > 0.05 ? "up" : value < -0.05 ? "down" : "neutral";
  return <span className={`delta ${direction}`}>{value >= 0 ? "+" : ""}{value.toFixed(1)}% {suffix}</span>;
}

type Point = { date: string; value: number | null; secondary?: number | null };

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const previous = points[index - 1];
    const beforePrevious = points[index - 2] ?? previous;
    const next = points[index + 1] ?? point;
    const control1X = previous.x + (point.x - beforePrevious.x) / 6;
    const control1Y = previous.y + (point.y - beforePrevious.y) / 6;
    const control2X = point.x - (next.x - previous.x) / 6;
    const control2Y = point.y - (next.y - previous.y) / 6;
    return `${path} C${control1X.toFixed(1)},${control1Y.toFixed(1)} ${control2X.toFixed(1)},${control2Y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, "");
}

function TrendChart({
  points,
  title,
  valueLabel,
  secondaryLabel,
  formatValue,
}: {
  points: Point[];
  title: string;
  valueLabel: string;
  secondaryLabel?: string;
  formatValue: (value: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState(points.length - 1);
  const width = 760;
  const height = 310;
  const margin = { top: 24, right: 26, bottom: 42, left: 74 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const allValues = points.flatMap((point) => [point.value, point.secondary]).filter((value): value is number => value != null);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const spread = Math.max(maxValue - minValue, maxValue * 0.1, 1);
  const yMin = Math.max(0, minValue - spread * 0.15);
  const yMax = maxValue + spread * 0.15;
  const x = (index: number) => margin.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => margin.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const pathFor = (key: "value" | "secondary") => {
    const segments: { x: number; y: number }[][] = [];
    points.forEach((point, index) => {
      const value = point[key];
      if (value == null) return;
      const previousMissing = index === 0 || points[index - 1][key] == null;
      if (previousMissing) segments.push([]);
      segments[segments.length - 1].push({ x: x(index), y: y(value) });
    });
    return segments.map(smoothPath).join(" ");
  };
  const active = points[Math.min(activeIndex, points.length - 1)];
  const ticks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);
  const showMonthTick = (point: Point, index: number) =>
    points.length <= 12 || index === 0 || index === points.length - 1 || point.date.slice(5, 7) === "01";
  const tickLabel = (point: Point, index: number) =>
    index === 0 || index === points.length - 1 ? monthLabel(point.date) : point.date.slice(0, 4);

  useEffect(() => setActiveIndex(Math.max(points.length - 1, 0)), [points.length, title]);

  return (
    <section className="chart-panel" aria-labelledby={`${title.replaceAll(" ", "-")}-title`}>
      <div className="chart-heading">
        <div>
          <p className="eyebrow">Monthly movement</p>
          <h2 id={`${title.replaceAll(" ", "-")}-title`}>{title}</h2>
        </div>
        {active && (
          <div className="chart-focus" aria-live="polite">
            <span>{monthLabel(active.date)}</span>
            <strong>{active.value == null ? "—" : formatValue(active.value)}</strong>
            {secondaryLabel && active.secondary != null && <em>{secondaryLabel}: {formatValue(active.secondary)}</em>}
          </div>
        )}
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${valueLabel}${secondaryLabel ? ` and ${secondaryLabel}` : ""} by month.`}>
          <title>{title}</title>
          <desc>Interactive monthly trend for the selected city, property type, and date range.</desc>
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="grid-line" x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} />
              <text className="axis-label" x={margin.left - 12} y={y(tick) + 4} textAnchor="end">{formatValue(tick)}</text>
            </g>
          ))}
          <path className="trend-line primary-line" d={pathFor("value")} />
          {secondaryLabel && <path className="trend-line secondary-line" d={pathFor("secondary")} />}
          {points.map((point, index) => (
            <g key={point.date}>
              <line
                className={`hover-line ${activeIndex === index ? "active" : ""}`}
                x1={x(index)} x2={x(index)} y1={margin.top} y2={margin.top + plotHeight}
              />
              {point.value != null && <circle className="chart-point primary-point" cx={x(index)} cy={y(point.value)} r={activeIndex === index ? 6 : points.length > 24 ? 2 : 4} />}
              {secondaryLabel && point.secondary != null && <circle className="chart-point secondary-point" cx={x(index)} cy={y(point.secondary)} r={activeIndex === index ? 6 : points.length > 24 ? 2 : 4} />}
              <rect
                className="hit-area"
                x={x(index) - Math.max(4, plotWidth / Math.max(points.length, 1) / 2)}
                y={margin.top}
                width={Math.max(8, plotWidth / Math.max(points.length, 1))}
                height={plotHeight}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                tabIndex={0}
                aria-label={`${monthLabel(point.date)}: ${valueLabel} ${point.value == null ? "not available" : formatValue(point.value)}${secondaryLabel && point.secondary != null ? `, ${secondaryLabel} ${formatValue(point.secondary)}` : ""}`}
              />
              {showMonthTick(point, index) && <text className="axis-label month-label" x={x(index)} y={height - 14} textAnchor="middle">{tickLabel(point, index)}</text>}
            </g>
          ))}
        </svg>
      </div>
      <div className="legend" aria-hidden="true">
        <span><i className="legend-line primary" />{valueLabel}</span>
        {secondaryLabel && <span><i className="legend-line secondary" />{secondaryLabel}</span>}
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [city, setCity] = useState("All TRREB Areas");
  const [propertyType, setPropertyType] = useState("Detached");
  const [startDate, setStartDate] = useState("2021-01-01");
  const [endDate, setEndDate] = useState("2026-06-01");

  useEffect(() => {
    fetch("/data/market-data.json")
      .then((response) => {
        if (!response.ok) throw new Error("The market data could not be loaded.");
        return response.json();
      })
      .then((payload: DashboardData) => setData(payload))
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const months = useMemo(() => data ? [...new Set(data.records.map((record) => record.date))].sort() : [], [data]);
  const years = useMemo(() => [...new Set(months.map((month) => month.slice(0, 4)))], [months]);
  const cityGroups = useMemo(() => {
    if (!data) return [];
    const available = new Set(data.cities);
    const assigned = new Set(["All TRREB Areas"]);
    const groups = REGION_MEMBERS.map((group) => {
      const cities = data.cities.filter((candidate) => {
        const isTorontoDistrict = group.label === "Toronto" && candidate.startsWith("Toronto ");
        const included = group.cities.includes(candidate) || isTorontoDistrict;
        if (included) assigned.add(candidate);
        return included;
      });
      return { ...group, cities };
    }).filter((group) => group.cities.length > 0);
    const other = [...available].filter((candidate) => !assigned.has(candidate));
    if (other.length) groups.push({ label: "Other TRREB areas", cities: other });
    return groups;
  }, [data]);
  const selected = useMemo(() => {
    if (!data) return [];
    const records = data.records.filter((record) => record.city === city && record.date >= startDate && record.date <= endDate);
    if (propertyType !== "All property types") {
      return records.filter((record) => record.propertyType === propertyType).sort((a, b) => a.date.localeCompare(b.date));
    }
    const byMonth = new Map<string, MarketRecord[]>();
    records.forEach((record) => byMonth.set(record.date, [...(byMonth.get(record.date) ?? []), record]));
    return [...byMonth.entries()].map(([date, monthly]) => {
      const sales = monthly.reduce((sum, record) => sum + record.sales, 0);
      const weighted = (field: "averagePrice" | "saleToList" | "daysOnMarket") => {
        const reported = monthly.filter((record) => record[field] != null && record.sales > 0);
        const weight = reported.reduce((sum, record) => sum + record.sales, 0);
        return weight ? Math.round(reported.reduce((sum, record) => sum + (record[field] ?? 0) * record.sales, 0) / weight) : null;
      };
      const activeValues = monthly.map((record) => record.activeListings).filter((value): value is number => value != null);
      const activeListings = activeValues.length ? activeValues.reduce((sum, value) => sum + value, 0) : null;
      return {
        date, city, propertyType: "All property types", sales,
        averagePrice: weighted("averagePrice"), medianPrice: null, activeListings,
        monthsOfInventory: activeListings != null && sales > 0 ? Math.round((activeListings / sales) * 100) / 100 : null,
        saleToList: weighted("saleToList"), daysOnMarket: weighted("daysOnMarket"),
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, city, propertyType, startDate, endDate]);

  const first = selected[0];
  const latest = selected[selected.length - 1];
  const salesChange = percentChange(latest?.sales ?? null, first?.sales ?? null);
  const priceChange = percentChange(latest?.averagePrice ?? null, first?.averagePrice ?? null);
  const salesPoints = selected.map((record) => ({ date: record.date, value: record.sales }));
  const pricePoints = selected.map((record) => ({ date: record.date, value: record.averagePrice, secondary: record.medianPrice }));

  function updateStart(value: string) {
    setStartDate(value);
    if (value > endDate) setEndDate(value);
  }

  function updateEnd(value: string) {
    setEndDate(value);
    if (value < startDate) setStartDate(value);
  }

  function updateDatePart(boundary: "start" | "end", year: string, month: string) {
    const valid = months.filter((date) => date.startsWith(`${year}-`));
    const requested = `${year}-${month}-01`;
    const value = valid.includes(requested) ? requested : boundary === "start" ? valid[0] : valid[valid.length - 1];
    if (value) boundary === "start" ? updateStart(value) : updateEnd(value);
  }

  return (
    <main>
      <header className="site-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p className="brand-name">Toronto Housing Market</p>
            <p className="brand-subtitle">TRREB monthly market intelligence</p>
          </div>
        </div>
        <a className="dataset-link" href="/data/TRREB_Detached_Dataset_through_2026-06.xlsx" download>
          Download linked Excel data
        </a>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Interactive market dashboard</p>
          <h1>See where sales and prices are moving.</h1>
          <p className="hero-copy">Compare monthly units sold and home prices across TRREB geographies and nine property types from 2021 onward.</p>
        </div>
        <div className="coverage-note">
          <span>Updated through</span>
          <strong>June 2026</strong>
          <small>Official monthly Market Watch reports</small>
        </div>
      </section>

      <section className="controls" aria-label="Dashboard filters">
        <label>
          <span>City or area</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} disabled={!data}>
            <option value="All TRREB Areas">All TRREB Areas</option>
            {cityGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.cities.map((option) => <option key={option} value={option}>{option}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span>Property type</span>
          <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} disabled={!data}>
            <option value="All property types">All property types</option>
            {data?.propertyTypes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>From year</span>
          <select value={startDate.slice(0, 4)} onChange={(event) => updateDatePart("start", event.target.value, startDate.slice(5, 7))} disabled={!data}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>From month</span>
          <select value={startDate.slice(5, 7)} onChange={(event) => updateDatePart("start", startDate.slice(0, 4), event.target.value)} disabled={!data}>
            {months.filter((month) => month.startsWith(`${startDate.slice(0, 4)}-`)).map((month) => <option key={month} value={month.slice(5, 7)}>{monthOnlyLabel(month)}</option>)}
          </select>
        </label>
        <label>
          <span>To year</span>
          <select value={endDate.slice(0, 4)} onChange={(event) => updateDatePart("end", event.target.value, endDate.slice(5, 7))} disabled={!data}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>To month</span>
          <select value={endDate.slice(5, 7)} onChange={(event) => updateDatePart("end", endDate.slice(0, 4), event.target.value)} disabled={!data}>
            {months.filter((month) => month.startsWith(`${endDate.slice(0, 4)}-`)).map((month) => <option key={month} value={month.slice(5, 7)}>{monthOnlyLabel(month)}</option>)}
          </select>
        </label>
      </section>

      {error && <div className="status-message error">{error}</div>}
      {!data && !error && <div className="status-message">Loading market data…</div>}

      {data && selected.length > 0 && latest && (
        <>
          <section className="selection-summary">
            <div>
              <p className="eyebrow">Selected view</p>
              <h2>{city} · {propertyType}</h2>
              <p>{monthLabel(startDate)} to {monthLabel(endDate)}</p>
            </div>
            <p className="summary-context">Latest month in range: <strong>{monthLabel(latest.date)}</strong></p>
          </section>

          <section className="kpi-grid" aria-label="Latest selected metrics">
            <article className="kpi">
              <span>Units sold</span>
              <strong>{integerFormatter.format(latest.sales)}</strong>
              <Delta value={salesChange} />
            </article>
            <article className="kpi">
              <span>Average price</span>
              <strong>{latest.averagePrice == null ? "—" : currencyFormatter.format(latest.averagePrice)}</strong>
              <Delta value={priceChange} />
            </article>
            <article className="kpi">
              <span>{propertyType === "All property types" ? "Sale-to-list ratio" : "Median price"}</span>
              {propertyType === "All property types" ? (
                <strong>{latest.saleToList == null ? "—" : `${latest.saleToList}%`}</strong>
              ) : (
              <strong>{latest.medianPrice == null ? "—" : currencyFormatter.format(latest.medianPrice)}</strong>
              )}
              <span className="delta neutral">{propertyType === "All property types" ? "Sales-weighted across property types" : latest.saleToList == null ? "Sale-to-list unavailable" : `${latest.saleToList}% sale-to-list`}</span>
            </article>
            <article className="kpi">
              <span>Active listings</span>
              <strong>{latest.activeListings == null ? "—" : integerFormatter.format(latest.activeListings)}</strong>
              <span className="delta neutral">{latest.monthsOfInventory == null ? "Inventory ratio unavailable" : `${latest.monthsOfInventory.toFixed(2)} raw months of inventory`}</span>
            </article>
          </section>

          <section className="charts-grid">
            <TrendChart points={salesPoints} title="Units sold" valueLabel="Units sold" formatValue={(value) => integerFormatter.format(value)} />
            <TrendChart points={pricePoints} title="Home price trend" valueLabel="Average price" secondaryLabel={propertyType === "All property types" ? undefined : "Median price"} formatValue={compactCurrency} />
          </section>

          <section className="table-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Monthly detail</p>
                <h2>Selected period data</h2>
              </div>
              <p>{propertyType === "All property types" ? "Combined average price is weighted by units sold; an exact combined median is not published." : "Raw months of inventory = active listings ÷ monthly sales"}</p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th><th>Units sold</th><th>Average price</th><th>Median price</th><th>Active listings</th><th>Raw MOS</th><th>Avg. LDOM</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((record) => (
                    <tr key={record.date}>
                      <td>{monthLabel(record.date)}</td>
                      <td>{integerFormatter.format(record.sales)}</td>
                      <td>{record.averagePrice == null ? "—" : currencyFormatter.format(record.averagePrice)}</td>
                      <td>{record.medianPrice == null ? "—" : currencyFormatter.format(record.medianPrice)}</td>
                      <td>{record.activeListings == null ? "—" : integerFormatter.format(record.activeListings)}</td>
                      <td>{record.monthsOfInventory == null ? "—" : record.monthsOfInventory.toFixed(2)}</td>
                      <td>{record.daysOnMarket == null ? "—" : integerFormatter.format(record.daysOnMarket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {data && selected.length === 0 && <div className="status-message">No reported transactions match this selection.</div>}

      <footer>
        <p>Property-type dashboard coverage: January 2021–June 2026, compiled from official monthly TRREB Market Watch reports.</p>
        <a href="https://public.trreb.ca/market-data/market-watch/" target="_blank" rel="noreferrer">View official TRREB Market Watch source</a>
      </footer>
    </main>
  );
}
