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

const DATE_PRESETS = [
  { label: "1Y", years: 1 },
  { label: "2Y", years: 2 },
  { label: "3Y", years: 3 },
  { label: "5Y", years: 5 },
  { label: "All", years: "all" as const },
] as const;

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

function changePhrase(change: number | null, subject: string) {
  if (change == null) return `${subject} could not be compared across the selected period.`;
  if (Math.abs(change) < 1) return `${subject} was broadly unchanged between the first and last selected month.`;
  return `${subject} ${change > 0 ? "increased" : "decreased"} ${Math.abs(change).toFixed(1)}% between the first and last selected month.`;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

// Aggregate a slice of MarketRecord rows into a single synthetic record (used for "All property types")
function aggregateMonth(records: MarketRecord[], date: string, city: string): MarketRecord {
  const sales = records.reduce((sum, r) => sum + r.sales, 0);
  const weighted = (field: "averagePrice" | "saleToList" | "daysOnMarket"): number | null => {
    const reported = records.filter((r) => r[field] != null && r.sales > 0);
    const weight = reported.reduce((sum, r) => sum + r.sales, 0);
    return weight ? Math.round(reported.reduce((sum, r) => sum + ((r[field] as number) ?? 0) * r.sales, 0) / weight) : null;
  };
  const activeValues = records.map((r) => r.activeListings).filter((v): v is number => v != null);
  const activeListings = activeValues.length ? activeValues.reduce((s, v) => s + v, 0) : null;
  return {
    date, city, propertyType: "All property types", sales,
    averagePrice: weighted("averagePrice"), medianPrice: null, activeListings,
    monthsOfInventory: activeListings != null && sales > 0 ? Math.round((activeListings / sales) * 100) / 100 : null,
    saleToList: weighted("saleToList"), daysOnMarket: weighted("daysOnMarket"),
  };
}

function Delta({ value, suffix = "vs. period start" }: { value: number | null; suffix?: string }) {
  if (value == null) return <span className="delta neutral">Not available</span>;
  const direction = value > 0.05 ? "up" : value < -0.05 ? "down" : "neutral";
  return <span className={`delta ${direction}`}>{value >= 0 ? "+" : ""}{value.toFixed(1)}% {suffix}</span>;
}

// Year-over-year comparison shown below the period-change delta
function YoyDelta({ current, prior }: { current: number | null; prior: number | null }) {
  const change = percentChange(current, prior);
  if (change == null) return null;
  const direction = change > 0.05 ? "up" : change < -0.05 ? "down" : "neutral";
  return (
    <span className={`yoy-delta delta ${direction}`}>
      {change >= 0 ? "+" : ""}{change.toFixed(1)}% year-over-year
    </span>
  );
}

type PriceMode = "average" | "median" | "both";
type VolumeMode = "sales" | "inventory";

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

function CombinedMarketChart({
  records,
  priceMode,
  volumeMode,
  onPriceModeChange,
  onVolumeModeChange,
  medianAvailable,
}: {
  records: MarketRecord[];
  priceMode: PriceMode;
  volumeMode: VolumeMode;
  onPriceModeChange: (mode: PriceMode) => void;
  onVolumeModeChange: (mode: VolumeMode) => void;
  medianAvailable: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(Math.max(records.length - 1, 0));
  const width = 1180;
  const height = 390;
  const margin = { top: 28, right: 88, bottom: 48, left: 72 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const volumeValue = (record: MarketRecord) => volumeMode === "sales" ? record.sales : record.activeListings;
  const volumeValues = records.map(volumeValue).filter((value): value is number => value != null);
  const priceValues = records.flatMap((record) => {
    if (priceMode === "average") return [record.averagePrice];
    if (priceMode === "median") return [record.medianPrice];
    return [record.averagePrice, record.medianPrice];
  }).filter((value): value is number => value != null);
  const volumeMax = Math.max(...volumeValues, 1) * 1.12;
  const priceMinRaw = priceValues.length ? Math.min(...priceValues) : 0;
  const priceMaxRaw = priceValues.length ? Math.max(...priceValues) : 1;
  const priceSpread = Math.max(priceMaxRaw - priceMinRaw, priceMaxRaw * 0.08, 1);
  const priceMin = Math.max(0, priceMinRaw - priceSpread * 0.18);
  const priceMax = priceMaxRaw + priceSpread * 0.18;
  const x = (index: number) => margin.left + (records.length === 1 ? plotWidth / 2 : (index / (records.length - 1)) * plotWidth);
  const volumeY = (value: number) => margin.top + (1 - value / volumeMax) * plotHeight;
  const priceY = (value: number) => margin.top + ((priceMax - value) / (priceMax - priceMin)) * plotHeight;
  const barWidth = Math.max(5, Math.min(30, (plotWidth / Math.max(records.length, 1)) * 0.58));
  const linePath = (key: "averagePrice" | "medianPrice") => {
    const segments: { x: number; y: number }[][] = [];
    records.forEach((record, index) => {
      const value = record[key];
      if (value == null) return;
      if (index === 0 || records[index - 1][key] == null) segments.push([]);
      segments[segments.length - 1].push({ x: x(index), y: priceY(value) });
    });
    return segments.map(smoothPath).join(" ");
  };
  const ticks = Array.from({ length: 5 }, (_, index) => index / 4);
  const active = records[Math.min(activeIndex, Math.max(records.length - 1, 0))];
  const volumeLabel = volumeMode === "sales" ? "Units sold" : "Active listings";
  const showAverage = priceMode === "average" || priceMode === "both";
  const showMedian = priceMode === "median" || priceMode === "both";
  const showMonthTick = (record: MarketRecord, index: number) =>
    records.length <= 12 || index === 0 || index === records.length - 1 || record.date.slice(5, 7) === "01";

  useEffect(() => setActiveIndex(Math.max(records.length - 1, 0)), [records.length, priceMode, volumeMode]);

  return (
    <section className="combined-chart" aria-labelledby="market-performance-title">
      <div className="combined-chart-heading">
        <div>
          <p className="eyebrow">Selected period</p>
          <h2 id="market-performance-title">Market performance</h2>
          <p className="chart-description">Switch the volume bars and price lines without changing your market filters.</p>
        </div>
        {active && (
          <div className="combined-focus" aria-live="polite">
            <span>{monthLabel(active.date)}</span>
            <strong>{volumeLabel}: {volumeValue(active) == null ? "—" : integerFormatter.format(volumeValue(active) ?? 0)}</strong>
            {showAverage && <em>Average: {active.averagePrice == null ? "—" : compactCurrency(active.averagePrice)}</em>}
            {showMedian && <em>Median: {active.medianPrice == null ? "—" : compactCurrency(active.medianPrice)}</em>}
          </div>
        )}
      </div>

      <div className="metric-switches" aria-label="Chart measures">
        <fieldset>
          <legend>Volume bars</legend>
          <div className="segmented-control">
            <button type="button" className={volumeMode === "sales" ? "active" : ""} aria-pressed={volumeMode === "sales"} onClick={() => onVolumeModeChange("sales")}>Units sold</button>
            <button type="button" className={volumeMode === "inventory" ? "active" : ""} aria-pressed={volumeMode === "inventory"} onClick={() => onVolumeModeChange("inventory")}>Active listings</button>
          </div>
        </fieldset>
        <fieldset>
          <legend>Price lines</legend>
          <div className="segmented-control">
            <button type="button" className={priceMode === "average" ? "active" : ""} aria-pressed={priceMode === "average"} onClick={() => onPriceModeChange("average")}>Average</button>
            <button type="button" disabled={!medianAvailable} className={priceMode === "median" ? "active" : ""} aria-pressed={priceMode === "median"} onClick={() => onPriceModeChange("median")}>Median</button>
            <button type="button" disabled={!medianAvailable} className={priceMode === "both" ? "active" : ""} aria-pressed={priceMode === "both"} onClick={() => onPriceModeChange("both")}>Both</button>
          </div>
          {!medianAvailable && <small>Combined median is not published for all property types.</small>}
        </fieldset>
      </div>

      <div className="combined-chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${volumeLabel} with ${priceMode === "both" ? "average and median prices" : `${priceMode} price`} by month.`}>
          <title>Market performance</title>
          <desc>Monthly volume bars use the left axis. Price lines use the right axis.</desc>
          {ticks.map((tick) => {
            const lineY = margin.top + (1 - tick) * plotHeight;
            return (
              <g key={tick}>
                <line className="grid-line" x1={margin.left} x2={width - margin.right} y1={lineY} y2={lineY} />
                <text className="axis-label" x={margin.left - 12} y={lineY + 4} textAnchor="end">{integerFormatter.format(volumeMax * tick)}</text>
                <text className="axis-label" x={width - margin.right + 12} y={lineY + 4}>{compactCurrency(priceMin + (priceMax - priceMin) * tick)}</text>
              </g>
            );
          })}
          {records.map((record, index) => {
            const value = volumeValue(record);
            return value == null ? null : <rect key={`bar-${record.date}`} className="volume-bar" x={x(index) - barWidth / 2} y={volumeY(value)} width={barWidth} height={margin.top + plotHeight - volumeY(value)} rx="3" />;
          })}
          {showAverage && <path className="price-series average-series" d={linePath("averagePrice")} />}
          {showMedian && <path className="price-series median-series" d={linePath("medianPrice")} />}
          {records.map((record, index) => (
            <g key={record.date}>
              <line className={`hover-line ${activeIndex === index ? "active" : ""}`} x1={x(index)} x2={x(index)} y1={margin.top} y2={margin.top + plotHeight} />
              <rect className="hit-area" x={x(index) - Math.max(5, plotWidth / Math.max(records.length, 1) / 2)} y={margin.top} width={Math.max(10, plotWidth / Math.max(records.length, 1))} height={plotHeight} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0} aria-label={`${monthLabel(record.date)}. ${volumeLabel}: ${volumeValue(record) == null ? "not available" : integerFormatter.format(volumeValue(record) ?? 0)}. Average price: ${record.averagePrice == null ? "not available" : currencyFormatter.format(record.averagePrice)}. Median price: ${record.medianPrice == null ? "not available" : currencyFormatter.format(record.medianPrice)}.`} />
              {showMonthTick(record, index) && <text className="axis-label month-label" x={x(index)} y={height - 14} textAnchor="middle">{index === 0 || index === records.length - 1 ? monthLabel(record.date) : record.date.slice(0, 4)}</text>}
            </g>
          ))}
          <text className="axis-title" x={margin.left} y={14}>{volumeLabel}</text>
          <text className="axis-title" x={width - margin.right} y={14} textAnchor="end">Price (CAD)</text>
        </svg>
      </div>
      <div className="combined-legend" aria-hidden="true">
        <span><i className="bar-swatch" />{volumeLabel}</span>
        {showAverage && <span><i className="average-swatch" />Average price</span>}
        {showMedian && <span><i className="median-swatch" />Median price</span>}
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceMode>("average");
  const [volumeMode, setVolumeMode] = useState<VolumeMode>("sales");
  const [city, setCity] = useState("All TRREB Areas");
  const [propertyType, setPropertyType] = useState("Detached");
  const [startDate, setStartDate] = useState("2021-01-01");
  const [endDate, setEndDate] = useState("2026-06-01");
  const isGitHubPages = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");

  // Restore saved theme preference
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("housing-dashboard-theme");
    const preferredTheme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(preferredTheme);
    document.documentElement.dataset.theme = preferredTheme;
  }, []);

  // Read URL params on mount so filter state can be shared via link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCity = params.get("city");
    const urlType = params.get("type");
    const urlFrom = params.get("from");
    const urlTo = params.get("to");
    const urlPrice = params.get("price");
    const urlVol = params.get("vol");
    if (urlCity) setCity(urlCity);
    if (urlType) setPropertyType(urlType);
    if (urlFrom && /^\d{4}-\d{2}-01$/.test(urlFrom)) setStartDate(urlFrom);
    if (urlTo && /^\d{4}-\d{2}-01$/.test(urlTo)) setEndDate(urlTo);
    if (urlPrice === "average" || urlPrice === "median" || urlPrice === "both") setPriceMode(urlPrice);
    if (urlVol === "sales" || urlVol === "inventory") setVolumeMode(urlVol);
  }, []);

  // Keep URL in sync with filter state so the current view is always shareable
  useEffect(() => {
    const params = new URLSearchParams();
    if (city !== "All TRREB Areas") params.set("city", city);
    if (propertyType !== "Detached") params.set("type", propertyType);
    if (startDate !== "2021-01-01") params.set("from", startDate);
    if (endDate !== "2026-06-01") params.set("to", endDate);
    if (priceMode !== "average") params.set("price", priceMode);
    if (volumeMode !== "sales") params.set("vol", volumeMode);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [city, propertyType, startDate, endDate, priceMode, volumeMode]);

  // Fetch market data
  useEffect(() => {
    fetch("./data/market-data.json")
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
    return [...byMonth.entries()]
      .map(([date, monthly]) => aggregateMonth(monthly, date, city))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, city, propertyType, startDate, endDate]);

  const first = selected[0];
  const latest = selected[selected.length - 1];
  const salesChange = percentChange(latest?.sales ?? null, first?.sales ?? null);
  const inventoryChange = percentChange(latest?.activeListings ?? null, first?.activeListings ?? null);
  const priceChange = percentChange(latest?.averagePrice ?? null, first?.averagePrice ?? null);
  const medianChange = percentChange(latest?.medianPrice ?? null, first?.medianPrice ?? null);
  const volumeChange = volumeMode === "sales" ? salesChange : inventoryChange;
  const volumeLabel = volumeMode === "sales" ? "Units sold" : "Active listings";
  const latestVolume = volumeMode === "sales" ? latest?.sales ?? null : latest?.activeListings ?? null;
  const medianAvailable = propertyType !== "All property types" && selected.some((record) => record.medianPrice != null);

  useEffect(() => {
    if (!medianAvailable && priceMode !== "average") setPriceMode("average");
  }, [medianAvailable, priceMode]);

  // Look up the same month from one year prior (from the full dataset, not the date-filtered selection)
  const yearAgo = useMemo(() => {
    if (!data || !latest) return null;
    const latestYear = parseInt(latest.date.slice(0, 4));
    const yearAgoDate = `${latestYear - 1}-${latest.date.slice(5)}`;
    if (propertyType !== "All property types") {
      return data.records.find((r) => r.city === city && r.propertyType === propertyType && r.date === yearAgoDate) ?? null;
    }
    const monthly = data.records.filter((r) => r.city === city && r.date === yearAgoDate);
    return monthly.length ? aggregateMonth(monthly, yearAgoDate, city) : null;
  }, [data, city, propertyType, latest]);

  // Classify the market based on months of inventory thresholds
  const marketCondition = useMemo(() => {
    if (latest?.monthsOfInventory == null) return null;
    const m = latest.monthsOfInventory;
    if (m < 3) return { label: "Seller's market", cls: "condition-seller" };
    if (m < 4) return { label: "Balanced market", cls: "condition-balanced" };
    return { label: "Buyer's market", cls: "condition-buyer" };
  }, [latest?.monthsOfInventory]);

  // Which quick-range preset (if any) matches the current date range
  const activePreset = useMemo(() => {
    if (!months.length) return null;
    const last = months[months.length - 1];
    if (startDate === months[0] && endDate === last) return "All";
    for (const preset of DATE_PRESETS) {
      if (preset.years === "all") continue;
      const lastYear = parseInt(last.slice(0, 4));
      const targetStart = `${lastYear - preset.years}-${last.slice(5)}`;
      const from = months.find((m) => m >= targetStart) ?? months[0];
      if (startDate === from && endDate === last) return preset.label;
    }
    return null;
  }, [months, startDate, endDate]);

  const marketSummary = useMemo(() => {
    if (!first || !latest) return [];
    const summary: string[] = [];

    // Period label
    const periodMonths = selected.length;
    const periodLabel = periodMonths === 1 ? "one month"
      : periodMonths < 13 ? `${periodMonths} months`
      : periodMonths < 24 ? "one year"
      : `${(periodMonths / 12).toFixed(1)} years`;

    // 1. Volume trend — absolute numbers from first to latest
    const firstVol = volumeMode === "sales" ? first.sales : first.activeListings;
    const latestVol = volumeMode === "sales" ? latest.sales : latest.activeListings;
    const volTrend = volumeChange == null ? "could not be compared due to missing data"
      : Math.abs(volumeChange) < 1 ? "was broadly unchanged"
      : `${volumeChange > 0 ? "rose" : "fell"} ${Math.abs(volumeChange).toFixed(1)}%`;
    const volAbsolute = firstVol != null && latestVol != null
      ? `, moving from ${integerFormatter.format(firstVol)} in ${monthLabel(first.date)} to ${integerFormatter.format(latestVol)} in ${monthLabel(latest.date)}`
      : "";
    summary.push(`Over ${periodLabel}, ${volumeLabel.toLowerCase()} ${volTrend}${volAbsolute}.`);

    // 2. Price trend — absolute numbers + year-over-year comparison
    if (priceMode === "average" || priceMode === "both") {
      const priceYoY = percentChange(latest.averagePrice, yearAgo?.averagePrice ?? null);
      const priceLabel = propertyType === "All property types" ? "The sales-weighted average price" : "The average price";
      const priceTrend = priceChange == null ? "could not be compared"
        : Math.abs(priceChange) < 1 ? "held flat"
        : `${priceChange > 0 ? "gained" : "declined"} ${Math.abs(priceChange).toFixed(1)}%`;
      const priceAbsolute = first.averagePrice != null && latest.averagePrice != null
        ? `, from ${currencyFormatter.format(first.averagePrice)} to ${currencyFormatter.format(latest.averagePrice)}`
        : "";
      const yoyClause = priceYoY == null ? ""
        : Math.abs(priceYoY) < 1 ? " The latest reading was little changed from the same month a year earlier."
        : ` Year-over-year, the latest reading was ${Math.abs(priceYoY).toFixed(1)}% ${priceYoY > 0 ? "above" : "below"} ${monthLabel(yearAgo?.date ?? "")} — ${Math.abs(priceYoY) > 5 ? (priceYoY > 0 ? "a meaningful annual gain" : "a meaningful annual decline") : (priceYoY > 0 ? "a modest annual gain" : "a modest annual pullback")}.`;
      summary.push(`${priceLabel} ${priceTrend}${priceAbsolute}.${yoyClause}`);
    }
    if (priceMode === "median" || priceMode === "both") {
      const medianTrend = medianChange == null ? "could not be compared"
        : Math.abs(medianChange) < 1 ? "held flat"
        : `${medianChange > 0 ? "gained" : "declined"} ${Math.abs(medianChange).toFixed(1)}%`;
      const medianAbsolute = first.medianPrice != null && latest.medianPrice != null
        ? `, from ${currencyFormatter.format(first.medianPrice)} to ${currencyFormatter.format(latest.medianPrice)}`
        : "";
      summary.push(`The median price ${medianTrend}${medianAbsolute}.`);
    }

    // 3. Sale-to-list interpretation — what the ratio means in practical terms
    if (latest.saleToList != null) {
      const stl = latest.saleToList;
      const stlYoY = yearAgo?.saleToList ?? null;
      const stlMeaning = stl >= 102
        ? "competition is pushing homes to sell above asking — characteristic of a heated seller's market"
        : stl >= 100
          ? "homes are selling at or above their listed price, reflecting firm buyer demand"
          : stl >= 97
            ? "homes are selling close to but slightly below asking price — balanced negotiating conditions"
            : "buyers hold meaningful negotiating leverage below the listed price";
      const stlYoYClause = stlYoY != null && Math.abs(stl - stlYoY) >= 1
        ? ` This is ${stl > stlYoY ? `${(stl - stlYoY).toFixed(1)} pp above` : `${(stlYoY - stl).toFixed(1)} pp below`} the same month a year earlier.`
        : "";
      summary.push(`The sale-to-list ratio stands at ${stl}%, indicating ${stlMeaning}.${stlYoYClause}`);
    }

    // 4. Short-term momentum — recent 3 months vs prior 3 months
    if (selected.length >= 6) {
      const values = selected.map((r) => volumeMode === "sales" ? r.sales : r.activeListings).filter((v): v is number => v != null);
      const recent = average(values.slice(-3));
      const previous = average(values.slice(-6, -3));
      const momentum = percentChange(recent, previous);
      if (momentum != null) {
        const dirLabel = Math.abs(momentum) < 1 ? "stable"
          : momentum > 0 ? "positive" : "negative";
        const implication = Math.abs(momentum) < 1
          ? "suggesting the market has reached a near-term equilibrium"
          : momentum > 5 ? "pointing to an acceleration in market activity"
          : momentum > 0 ? "suggesting a modest pick-up in near-term demand"
          : momentum < -5 ? "pointing to a softening in market conditions"
          : "suggesting a modest easing in near-term activity";
        summary.push(`Short-term momentum in ${volumeLabel.toLowerCase()} is ${dirLabel}: the latest three-month average was ${Math.abs(momentum).toFixed(1)}% ${momentum >= 0 ? "above" : "below"} the preceding three months, ${implication}.`);
      }
    }

    // 5. Supply and liquidity — inventory context with practical interpretation
    if (latest.activeListings != null || latest.monthsOfInventory != null) {
      const supplyText = latest.activeListings != null
        ? `There were ${integerFormatter.format(latest.activeListings)} active listings in ${monthLabel(latest.date)}`
        : "Active listing counts were not reported";
      const inventoryText = latest.monthsOfInventory == null ? ""
        : latest.monthsOfInventory < 2 ? `, representing ${latest.monthsOfInventory.toFixed(2)} months of inventory — well inside seller's territory`
        : latest.monthsOfInventory < 3 ? `, representing ${latest.monthsOfInventory.toFixed(2)} months of inventory — a seller's market`
        : latest.monthsOfInventory < 4 ? `, representing ${latest.monthsOfInventory.toFixed(2)} months of inventory — a balanced market`
        : latest.monthsOfInventory < 6 ? `, representing ${latest.monthsOfInventory.toFixed(2)} months of inventory — a buyer's market`
        : `, representing ${latest.monthsOfInventory.toFixed(2)} months of inventory — deeply in buyer's market territory`;
      const domText = latest.daysOnMarket == null ? ""
        : latest.daysOnMarket < 15 ? ` Homes are moving quickly, averaging ${integerFormatter.format(latest.daysOnMarket)} days to sell.`
        : latest.daysOnMarket < 30 ? ` The average listing sold in ${integerFormatter.format(latest.daysOnMarket)} days — an active pace.`
        : latest.daysOnMarket < 50 ? ` At ${integerFormatter.format(latest.daysOnMarket)} average days on market, buyers have reasonable time to conduct due diligence.`
        : ` The ${integerFormatter.format(latest.daysOnMarket)}-day average on market suggests homes are taking considerably longer to sell.`;
      summary.push(`${supplyText}${inventoryText}.${domText}`);
    }

    // 6. Peak context — where was the high-water mark and how far off is it now
    const reportedVolume = selected.filter((r) => (volumeMode === "sales" ? r.sales : r.activeListings) != null);
    if (reportedVolume.length > 1) {
      const peakRecord = reportedVolume.reduce((peak, r) => {
        const val = volumeMode === "sales" ? r.sales : (r.activeListings ?? 0);
        const peakVal = volumeMode === "sales" ? peak.sales : (peak.activeListings ?? 0);
        return val > peakVal ? r : peak;
      }, reportedVolume[0]);
      const peakVal = volumeMode === "sales" ? peakRecord.sales : peakRecord.activeListings;
      const latestValForPeak = volumeMode === "sales" ? latest.sales : latest.activeListings;
      const gapClause = peakVal != null && latestValForPeak != null && latestValForPeak > 0 && peakRecord.date !== latest.date
        ? `, ${((peakVal / latestValForPeak - 1) * 100).toFixed(0)}% above the most recent month`
        : "";
      if (peakVal != null && peakRecord.date !== latest.date) {
        summary.push(`The highest ${volumeLabel.toLowerCase()} in the selected period was ${monthLabel(peakRecord.date)} at ${integerFormatter.format(peakVal)}${gapClause}.`);
      }
    }

    return summary;
  }, [first, latest, medianChange, priceChange, priceMode, propertyType, selected, volumeChange, volumeLabel, volumeMode, yearAgo]);

  const marketHeadline = !latest
    ? "Read demand, supply and price together."
    : (() => {
        const headlinePriceChange = priceChange ?? medianChange;
        const demandPart = salesChange == null ? "Demand"
          : Math.abs(salesChange) < 1 ? "Demand held steady"
          : salesChange > 0 ? `Sales rose ${Math.abs(salesChange).toFixed(0)}%`
          : `Sales fell ${Math.abs(salesChange).toFixed(0)}%`;
        const pricePart = headlinePriceChange == null ? ""
          : Math.abs(headlinePriceChange) < 1 ? ", prices unchanged"
          : headlinePriceChange > 0 ? `, prices up ${Math.abs(headlinePriceChange).toFixed(0)}%`
          : `, prices down ${Math.abs(headlinePriceChange).toFixed(0)}%`;
        const conditionPart = marketCondition ? ` — ${marketCondition.label.toLowerCase()}` : "";
        return `${demandPart}${pricePart}${conditionPart}.`;
      })();
  const inventoryScaleWidth = latest?.monthsOfInventory == null ? "0%" : `${Math.min((latest.monthsOfInventory / 6) * 100, 100)}%`;

  function applyPreset(years: number | "all") {
    if (!months.length) return;
    const last = months[months.length - 1];
    if (years === "all") {
      updateStart(months[0]);
      updateEnd(last);
      return;
    }
    const lastYear = parseInt(last.slice(0, 4));
    const targetStart = `${lastYear - years}-${last.slice(5)}`;
    const from = months.find((m) => m >= targetStart) ?? months[0];
    updateStart(from);
    updateEnd(last);
  }

  function exportCSV() {
    if (!selected.length) return;
    const headers = ["Month", "Units Sold", "Average Price (CAD)", "Median Price (CAD)", "Active Listings", "Months of Inventory", "Avg. Days on Market"];
    const rows = selected.map((r) => [
      monthLabel(r.date),
      r.sales,
      r.averagePrice ?? "",
      r.medianPrice ?? "",
      r.activeListings ?? "",
      r.monthsOfInventory ?? "",
      r.daysOnMarket ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gta-housing-${city.replace(/\s+/g, "-").toLowerCase()}-${propertyType.replace(/\s+/g, "-").toLowerCase()}-${startDate.slice(0, 7)}-to-${endDate.slice(0, 7)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("housing-dashboard-theme", nextTheme);
  }

  // Pull display labels from data metadata so they stay accurate as the dataset grows
  const updatedLabel = data ? monthLabel(data.metadata.updatedThrough) : "—";
  const coveragePeriod = data ? `${monthLabel(data.metadata.periodStart)}–${monthLabel(data.metadata.periodEnd)}` : "";

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
        <div className="header-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} background`}>
            <span className="toggle-track" aria-hidden="true"><span /></span>
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          {!isGitHubPages && (
            <a className="dataset-link" href={data?.metadata.linkedWorkbook ?? "./data/TRREB_Detached_Dataset_through_2026-06.xlsx"} download>
              Download linked Excel data
            </a>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Monthly market briefing</p>
          <h1>{marketHeadline}</h1>
          <p className="hero-copy">A diagnostic view of how sales, listings, and prices are moving together across the selected market and period.</p>
        </div>
        <div className="coverage-note">
          <span>Updated through</span>
          <strong>{updatedLabel}</strong>
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
        <div className="preset-group" role="group" aria-label="Date range presets">
          <span className="preset-label">Quick range</span>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`preset-btn${activePreset === preset.label ? " active" : ""}`}
              onClick={() => applyPreset(preset.years)}
              disabled={!data}
              aria-pressed={activePreset === preset.label}
            >
              {preset.label}
            </button>
          ))}
        </div>
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
              <span>{volumeLabel}</span>
              <strong>{latestVolume == null ? "—" : integerFormatter.format(latestVolume)}</strong>
              <Delta value={volumeChange} />
              <YoyDelta current={latestVolume} prior={volumeMode === "sales" ? yearAgo?.sales ?? null : yearAgo?.activeListings ?? null} />
            </article>
            <article className="kpi">
              <span>{priceMode === "average" ? "Average price" : priceMode === "median" ? "Median price" : "Average and median price"}</span>
              {priceMode === "both" ? (
                <div className="dual-price-value">
                  <strong>{latest.averagePrice == null ? "—" : currencyFormatter.format(latest.averagePrice)}</strong>
                  <strong>{latest.medianPrice == null ? "—" : currencyFormatter.format(latest.medianPrice)}</strong>
                  <small>Average · Median</small>
                </div>
              ) : (
                <strong>{priceMode === "average" ? (latest.averagePrice == null ? "—" : currencyFormatter.format(latest.averagePrice)) : (latest.medianPrice == null ? "—" : currencyFormatter.format(latest.medianPrice))}</strong>
              )}
              {priceMode !== "both" && <Delta value={priceMode === "average" ? priceChange : medianChange} />}
              <YoyDelta
                current={priceMode === "median" ? latest.medianPrice : latest.averagePrice}
                prior={priceMode === "median" ? (yearAgo?.medianPrice ?? null) : (yearAgo?.averagePrice ?? null)}
              />
            </article>
            <article className="kpi">
              <span>Sale-to-list ratio</span>
              <strong>{latest.saleToList == null ? "—" : `${latest.saleToList}%`}</strong>
              <span className="delta neutral">{propertyType === "All property types" ? "Sales-weighted across property types" : "Latest reported month"}</span>
              <YoyDelta current={latest.saleToList} prior={yearAgo?.saleToList ?? null} />
            </article>
            <article className="kpi">
              <span>Months of inventory</span>
              <strong>{latest.monthsOfInventory == null ? "—" : latest.monthsOfInventory.toFixed(2)}</strong>
              <span className="delta neutral">Active listings ÷ monthly sales</span>
              {marketCondition && (
                <span className={`market-condition-badge ${marketCondition.cls}`}>{marketCondition.label}</span>
              )}
            </article>
            <article className="kpi">
              <span>Days on market</span>
              <strong>{latest.daysOnMarket == null ? "—" : integerFormatter.format(latest.daysOnMarket)}</strong>
              <span className="delta neutral">Avg. listing to sale days</span>
              <YoyDelta current={latest.daysOnMarket} prior={yearAgo?.daysOnMarket ?? null} />
            </article>
          </section>

          <div className="market-workspace">
            <CombinedMarketChart
              records={selected}
              priceMode={priceMode}
              volumeMode={volumeMode}
              onPriceModeChange={setPriceMode}
              onVolumeModeChange={setVolumeMode}
              medianAvailable={medianAvailable}
            />

            <aside className="diagnostic-column" aria-label="Market balance and automatic analysis">
              <section className="market-balance-card" aria-labelledby="market-balance-title">
                <p className="eyebrow">Supply vs. demand</p>
                <h2 id="market-balance-title">Market balance</h2>
                {marketCondition && (
                  <div className={`market-condition-label ${marketCondition.cls}`}>{marketCondition.label}</div>
                )}
                <div className="inventory-meter" aria-label={latest.monthsOfInventory == null ? "Months of inventory unavailable" : `${latest.monthsOfInventory.toFixed(2)} months of inventory on a display scale from zero to six or more months`}>
                  <span style={{ width: inventoryScaleWidth }} />
                </div>
                <div className="inventory-scale-labels"><span>0 months</span><span>3</span><span>6+</span></div>
                <div className="inventory-zone-labels"><span>Seller's</span><span>Balanced</span><span>Buyer's</span></div>
                <dl>
                  <div><dt>Active listings</dt><dd>{latest.activeListings == null ? "—" : integerFormatter.format(latest.activeListings)}</dd></div>
                  <div><dt>Months of inventory</dt><dd>{latest.monthsOfInventory == null ? "—" : latest.monthsOfInventory.toFixed(2)}</dd></div>
                  <div><dt>Days on market</dt><dd>{latest.daysOnMarket == null ? "—" : integerFormatter.format(latest.daysOnMarket)}</dd></div>
                  <div><dt>Sale-to-list ratio</dt><dd>{latest.saleToList == null ? "—" : `${latest.saleToList}%`}</dd></div>
                </dl>
              </section>

              <section className="market-briefing-card" aria-labelledby="market-briefing-title">
                <p className="eyebrow">Automatic analysis</p>
                <h2 id="market-briefing-title">Signals to watch</h2>
                {marketSummary.map((statement) => <p key={statement}>{statement}</p>)}
              </section>
            </aside>
          </div>

          <section className="table-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Monthly detail</p>
                <h2>Selected period data</h2>
                <p className="table-summary">{selected.length} monthly records available</p>
              </div>
              <div className="table-actions">
                {!isGitHubPages && (
                  <button
                    className="export-btn"
                    type="button"
                    onClick={exportCSV}
                    title={`Export ${selected.length} months as CSV`}
                  >
                    Export CSV
                  </button>
                )}
                <button
                  className="detail-toggle"
                  type="button"
                  aria-expanded={showMonthlyDetail}
                  aria-controls="monthly-detail-table"
                  onClick={() => setShowMonthlyDetail((visible) => !visible)}
                >
                  {showMonthlyDetail ? "Hide monthly detail" : "Show monthly detail"}
                  <span aria-hidden="true">{showMonthlyDetail ? "−" : "+"}</span>
                </button>
              </div>
            </div>
            {showMonthlyDetail && (
              <div id="monthly-detail-table" className="monthly-detail-content">
                <p className="table-note">{propertyType === "All property types" ? "Combined average price is weighted by units sold; an exact combined median is not published." : "Raw months of inventory = active listings ÷ monthly sales"}</p>
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
              </div>
            )}
          </section>
        </>
      )}

      {data && selected.length === 0 && <div className="status-message">No reported transactions match this selection.</div>}

      <footer>
        <p>{data?.metadata.source ?? "TRREB Market Watch monthly reports"}{coveragePeriod ? ` · ${coveragePeriod}` : ""}.</p>
        <a href={data?.metadata.sourceUrl ?? "https://public.trreb.ca/market-data/market-watch/"} target="_blank" rel="noreferrer">View official TRREB Market Watch source</a>
      </footer>
    </main>
  );
}
