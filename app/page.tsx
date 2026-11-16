"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";

import { AffordFinder } from "./afford-finder";

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

const monthFormatterEn = new Intl.DateTimeFormat("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });
const monthFormatterZh = new Intl.DateTimeFormat("zh-CN", { month: "short", year: "numeric", timeZone: "UTC" });
const monthOnlyFormatterEn = new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" });
const monthOnlyFormatterZh = new Intl.DateTimeFormat("zh-CN", { month: "long", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const integerFormatter = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });

// Tally.so feedback form: https://tally.so/r/EkGWX2
const TALLY_FORM_ID = "EkGWX2";

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: Record<string, unknown>) => void;
      closePopup: (formId: string) => void;
    };
  }
}

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

type Locale = "en" | "zh";

// Headline and link of the newest monthly market letter (written by site/latest-letter.mjs).
type LatestLetter = { month: string; en: { title: string; summary?: string; path: string }; zh: { title: string; summary?: string; path: string } };

// The Advanced pages (area pages, market letters, comparisons) live in a folder beside the dashboard.
// On the site itself and on this computer the link is relative; anywhere else (a shared test copy)
// it points at the public site.
const LIVE_SITE = "https://polarislabsca.github.io/GTA-Housing-Market/";

// Addresses: the English dashboard is the site's front page and the Chinese one is the same page
// at zh/ (github-pages/index.html switches this on; the build writes zh/index.html). SITE_BASE is
// the front page's folder, worked out once when the page loads, so data files and links resolve
// the same way from either address and after the language is switched.
const LANG_PATHS = typeof document !== "undefined" && document.documentElement.dataset.langPaths === "on";
const OPENED_IN_CHINESE = LANG_PATHS && /\/zh\/(index\.html)?$/.test(window.location.pathname);
const SITE_BASE = typeof document === "undefined" ? "./" : new URL(OPENED_IN_CHINESE ? "../" : "./", document.baseURI).href;
function siteHref(path: string) {
  if (typeof window === "undefined") return `./${path}`;
  const host = window.location.hostname;
  return host.endsWith("github.io") || host === "localhost" || host === "127.0.0.1" ? SITE_BASE + path : LIVE_SITE + path;
}

// Browser storage and the address bar can be unavailable (private windows, embedded previews).
function readStored(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writeStored(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* the choice just isn't remembered */ }
}

// Chinese (Simplified) names for every city/area in the dataset, plus "All TRREB Areas".
// City and region names are always shown bilingually — English name first, Chinese second —
// regardless of the selected UI language, since this is useful to both audiences at once.
const CITY_ZH: Record<string, string> = {
  "All TRREB Areas": "大多伦多地区全域",
  "Adjala-Tosorontio": "阿德加拉-托索龙蒂奥",
  "Ajax": "阿贾克斯",
  "Aurora": "奥罗拉",
  "Bradford": "布拉德福德",
  "Bradford West Gwillimbury": "布拉德福德西格威利姆伯里",
  "Brampton": "布兰普顿",
  "Brock": "布洛克",
  "Burlington": "伯灵顿",
  "Caledon": "卡里登",
  "City of Toronto": "多伦多市",
  "Clarington": "克拉灵顿",
  "Dufferin County": "达弗林县",
  "Durham Region": "杜伦区",
  "East Gwillimbury": "东格威利姆伯里",
  "Essa": "埃萨",
  "Georgina": "乔治娜",
  "Halton Hills": "荷顿山",
  "Halton Region": "荷顿区",
  "Innisfil": "因尼斯菲尔",
  "King": "国王镇",
  "Markham": "万锦",
  "Milton": "米尔顿",
  "Mississauga": "密西沙加",
  "New Tecumseth": "新蒂康赛",
  "Newmarket": "新市镇",
  "Oakville": "奥克维尔",
  "Orangeville": "奥兰治维尔",
  "Oshawa": "奥沙瓦",
  "Peel Region": "皮尔区",
  "Pickering": "皮克灵",
  "Richmond Hill": "烈治文山",
  "Scugog": "斯库格",
  "Simcoe County": "西姆科县",
  "Stouffville": "斯托夫维尔",
  "Toronto C01": "多伦多 C01",
  "Toronto C02": "多伦多 C02",
  "Toronto C03": "多伦多 C03",
  "Toronto C04": "多伦多 C04",
  "Toronto C06": "多伦多 C06",
  "Toronto C07": "多伦多 C07",
  "Toronto C08": "多伦多 C08",
  "Toronto C09": "多伦多 C09",
  "Toronto C10": "多伦多 C10",
  "Toronto C11": "多伦多 C11",
  "Toronto C12": "多伦多 C12",
  "Toronto C13": "多伦多 C13",
  "Toronto C14": "多伦多 C14",
  "Toronto C15": "多伦多 C15",
  "Toronto Central": "多伦多中区",
  "Toronto E01": "多伦多 E01",
  "Toronto E02": "多伦多 E02",
  "Toronto E03": "多伦多 E03",
  "Toronto E04": "多伦多 E04",
  "Toronto E05": "多伦多 E05",
  "Toronto E06": "多伦多 E06",
  "Toronto E07": "多伦多 E07",
  "Toronto E08": "多伦多 E08",
  "Toronto E09": "多伦多 E09",
  "Toronto E10": "多伦多 E10",
  "Toronto E11": "多伦多 E11",
  "Toronto East": "多伦多东区",
  "Toronto W01": "多伦多 W01",
  "Toronto W02": "多伦多 W02",
  "Toronto W03": "多伦多 W03",
  "Toronto W04": "多伦多 W04",
  "Toronto W05": "多伦多 W05",
  "Toronto W06": "多伦多 W06",
  "Toronto W07": "多伦多 W07",
  "Toronto W08": "多伦多 W08",
  "Toronto W09": "多伦多 W09",
  "Toronto W10": "多伦多 W10",
  "Toronto West": "多伦多西区",
  "Uxbridge": "阿克斯桥",
  "Vaughan": "旺市",
  "Whitby": "惠特比",
  "Whitchurch-Stouffville": "惠洽-斯托夫维尔",
  "York Region": "约克区",
};

// Region/group labels used for the <optgroup> headers in the city selector.
const REGION_LABEL_ZH: Record<string, string> = {
  "Toronto": "多伦多",
  "York Region": "约克区",
  "Peel Region": "皮尔区",
  "Durham Region": "杜伦区",
  "Halton Region": "荷顿区",
  "Simcoe County": "西姆科县",
  "Dufferin County": "达弗林县",
  "Other TRREB areas": "其他大多伦多地区",
};

const PROPERTY_TYPE_ZH: Record<string, string> = {
  "All property types": "所有物业类型",
  "Detached": "独立屋",
  "Semi-Detached": "半独立屋",
  "Townhouse": "镇屋",
  "Condo Townhouse": "共管镇屋",
  "Condo Apartment": "共管公寓",
  "Link": "连体屋",
  "Co-Op Apartment": "合作公寓",
  "Detached Condo": "独立式共管物业",
  "Co-Ownership Apartment": "共有产权公寓",
};

// In Chinese mode, city/region names are bilingual: "Markham 万锦", "York Region 约克区".
// In English mode, only the English name is shown.
function cityLabel(name: string, locale: Locale) {
  if (locale !== "zh") return name;
  const zh = CITY_ZH[name];
  return zh ? `${name} ${zh}` : name;
}

function regionLabel(label: string, locale: Locale) {
  if (locale !== "zh") return label;
  const zh = REGION_LABEL_ZH[label];
  return zh ? `${label} ${zh}` : label;
}

// Property type names switch fully to Chinese in zh mode (not bilingual — this is generic
// vocabulary, not a proper place name).
function propertyTypeLabel(name: string, locale: Locale) {
  if (locale !== "zh") return name;
  return PROPERTY_TYPE_ZH[name] ?? name;
}

// Fixed UI copy, keyed for both languages. Dynamic sentences (the headline and the
// automatic-analysis paragraphs) are built separately in buildHeadline/buildSummary below,
// since their wording branches on the underlying numbers.
const STRINGS = {
  en: {
    brandName: "Toronto Housing Market",
    brandSubtitle: "TRREB monthly market intelligence",
    updatedThrough: "Updated through",
    officialReports: "from official TRREB Market Watch reports",
    builtBy: "Built by",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    downloadExcel: "Download linked Excel data",
    feedback: "Feedback",
    advanced: "Advanced",
    advancedHint: "Area pages, market letters, comparisons and more",
    letterLabel: "Market letter",
    letterScope: "all home types",
    colMeasure: "Latest month",
    colChange: "Change",
    yearEarlier: "A year earlier",
    unchanged: "unchanged",
    sourceLine: "Source: TRREB Market Watch monthly reports. Bars use the left axis; price lines use the right axis.",
    scaleLabel: "months of inventory, on a scale from 0 to 6 or more",
    readLetter: "Read the letter",
    cityOrArea: "City or area",
    propertyType: "Property type",
    fromYear: "From year",
    fromMonth: "From month",
    toYear: "To year",
    toMonth: "To month",
    quickRange: "Quick range",
    loading: "Loading market data…",
    noData: "No reported transactions match this selection.",
    selectedView: "Selected view",
    latestMonthInRange: "Latest month in range:",
    unitsSold: "Units sold",
    activeListings: "Active listings",
    averagePrice: "Average price",
    medianPrice: "Median price",
    averageAndMedianPrice: "Average and median price",
    averageMedianSmall: "Average · Median",
    saleToListRatio: "Sale-to-list ratio",
    weightedAcrossTypes: "Sales-weighted across property types",
    latestReportedMonth: "Latest reported month",
    monthsOfInventory: "Months of inventory",
    inventoryFormula: "Active listings ÷ monthly sales",
    daysOnMarket: "Days on market",
    avgListingToSale: "Avg. listing to sale days",
    sellersMarket: "Seller's market",
    balancedMarket: "Balanced market",
    buyersMarket: "Buyer's market",
    notAvailable: "Not available",
    selectedPeriod: "Selected period",
    marketPerformance: "Market performance",
    chartDescription: "Switch the volume bars and price lines without changing your market filters.",
    volumeBars: "Volume bars",
    priceLines: "Price lines",
    both: "Both",
    medianNotPublished: "Pick a property type to see the median price. TRREB doesn't publish one median for all types combined.",
    supplyVsDemand: "Supply vs. demand",
    marketBalance: "Market balance",
    sellersShort: "Seller's",
    balancedShort: "Balanced",
    buyersShort: "Buyer's",
    monthsOfInventoryUnit: "months of inventory",
    supplyVsYearAgo: "Supply vs. year ago",
    broadlyStable: "Broadly stable",
    expanding: "Expanding",
    tightening: "Tightening",
    automaticAnalysis: "Automatic analysis",
    signalsToWatch: "Summary",
    monthlyDetail: "Monthly detail",
    selectedPeriodData: "Selected period data",
    monthlyRecordsAvailable: "monthly records available",
    exportCsv: "Export CSV",
    showMonthlyDetail: "Show monthly detail",
    hideMonthlyDetail: "Hide monthly detail",
    tableNoteAllTypes: "Combined average price is weighted by units sold; an exact combined median is not published.",
    tableNoteDefault: "Raw months of inventory = active listings ÷ monthly sales",
    colMonth: "Month",
    colUnitsSold: "Units sold",
    colAveragePrice: "Average price",
    colMedianPrice: "Median price",
    colActiveListings: "Active listings",
    colRawMos: "Raw MOS",
    colAvgLdom: "Avg. LDOM",
    viewSource: "View official TRREB Market Watch source",
    loadError: "The market data could not be loaded.",
    avgButton: "Average",
    medianButton: "Median",
    priceCad: "Price (CAD)",
    avgShort: "Avg",
    medShort: "Med",
  },
  zh: {
    brandName: "多伦多房地产市场",
    brandSubtitle: "TRREB 每月市场情报",
    updatedThrough: "数据更新至",
    officialReports: "来自 TRREB 官方 Market Watch 月度报告",
    builtBy: "开发者：",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    downloadExcel: "下载关联的 Excel 数据",
    feedback: "反馈",
    advanced: "高级版",
    advancedHint: "地区页面、市场月报、地区对比等更多内容",
    letterLabel: "市场月报",
    letterScope: "所有房屋类型",
    colMeasure: "最新月份",
    colChange: "变化",
    yearEarlier: "去年同月",
    unchanged: "持平",
    sourceLine: "数据来源：TRREB Market Watch 月度报告。柱状图对应左轴，价格线对应右轴。",
    scaleLabel: "个月存销比（刻度范围 0 至 6 个月以上）",
    readLetter: "阅读全文",
    cityOrArea: "城市/地区",
    propertyType: "物业类型",
    fromYear: "起始年份",
    fromMonth: "起始月份",
    toYear: "截止年份",
    toMonth: "截止月份",
    quickRange: "快速选择",
    loading: "正在加载市场数据…",
    noData: "所选条件下没有符合的成交记录。",
    selectedView: "当前选择",
    latestMonthInRange: "所选期间最新月份：",
    unitsSold: "成交套数",
    activeListings: "在售房源",
    averagePrice: "平均价格",
    medianPrice: "中位价格",
    averageAndMedianPrice: "平均价与中位价",
    averageMedianSmall: "平均 · 中位数",
    saleToListRatio: "成交价/挂牌价比率",
    weightedAcrossTypes: "按物业类型成交量加权",
    latestReportedMonth: "最新报告月份",
    monthsOfInventory: "存销比（月）",
    inventoryFormula: "在售房源 ÷ 月成交量",
    daysOnMarket: "平均上市天数",
    avgListingToSale: "平均挂牌至成交天数",
    sellersMarket: "卖方市场",
    balancedMarket: "平衡市场",
    buyersMarket: "买方市场",
    notAvailable: "暂无数据",
    selectedPeriod: "所选期间",
    marketPerformance: "市场表现",
    chartDescription: "切换成交量柱状图与价格曲线，不影响当前筛选条件。",
    volumeBars: "成交量柱状图",
    priceLines: "价格曲线",
    both: "两者",
    medianNotPublished: "请选择具体的物业类型查看中位价。TRREB 不公布所有类型合并的中位价。",
    supplyVsDemand: "供需关系",
    marketBalance: "市场平衡度",
    sellersShort: "卖方",
    balancedShort: "平衡",
    buyersShort: "买方",
    monthsOfInventoryUnit: "个月存销比",
    supplyVsYearAgo: "供应量同比",
    broadlyStable: "基本持平",
    expanding: "扩大",
    tightening: "收紧",
    automaticAnalysis: "自动分析",
    signalsToWatch: "摘要",
    monthlyDetail: "月度明细",
    selectedPeriodData: "所选期间数据",
    monthlyRecordsAvailable: "条月度记录",
    exportCsv: "导出 CSV",
    showMonthlyDetail: "显示月度明细",
    hideMonthlyDetail: "隐藏月度明细",
    tableNoteAllTypes: "综合平均价格按成交套数加权；暂不公布精确的综合中位价格。",
    tableNoteDefault: "原始存销比 = 在售房源 ÷ 月成交量",
    colMonth: "月份",
    colUnitsSold: "成交套数",
    colAveragePrice: "平均价格",
    colMedianPrice: "中位价格",
    colActiveListings: "在售房源",
    colRawMos: "原始存销比",
    colAvgLdom: "平均上市天数",
    viewSource: "查看 TRREB 官方市场观察数据来源",
    loadError: "市场数据加载失败。",
    avgButton: "平均",
    medianButton: "中位数",
    priceCad: "价格（加元）",
    avgShort: "均",
    medShort: "中",
  },
} as const;

function monthLabel(date: string, locale: Locale = "en") {
  return (locale === "zh" ? monthFormatterZh : monthFormatterEn).format(new Date(`${date}T00:00:00Z`));
}

function monthOnlyLabel(date: string, locale: Locale = "en") {
  return (locale === "zh" ? monthOnlyFormatterZh : monthOnlyFormatterEn).format(new Date(`${date}T00:00:00Z`));
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

function Delta({ value, suffix, locale = "en" }: { value: number | null; suffix?: string; locale?: Locale }) {
  const resolvedSuffix = suffix ?? (locale === "zh" ? "较期初" : "vs. period start");
  if (value == null) return <span className="delta neutral">{locale === "zh" ? "暂无数据" : "Not available"}</span>;
  const direction = value > 0.05 ? "up" : value < -0.05 ? "down" : "neutral";
  return <span className={`delta ${direction}`}>{value >= 0 ? "+" : ""}{value.toFixed(1)}% {resolvedSuffix}</span>;
}

// Year-over-year comparison shown below the period-change delta
function YoyDelta({ current, prior, locale = "en" }: { current: number | null; prior: number | null; locale?: Locale }) {
  const change = percentChange(current, prior);
  if (change == null) return null;
  const direction = change > 0.05 ? "up" : change < -0.05 ? "down" : "neutral";
  return (
    <span className={`yoy-delta delta ${direction}`}>
      {change >= 0 ? "+" : ""}{change.toFixed(1)}% {locale === "zh" ? "同比" : "year-over-year"}
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
  locale,
}: {
  records: MarketRecord[];
  priceMode: PriceMode;
  volumeMode: VolumeMode;
  onPriceModeChange: (mode: PriceMode) => void;
  onVolumeModeChange: (mode: VolumeMode) => void;
  medianAvailable: boolean;
  locale: Locale;
}) {
  const s = STRINGS[locale];
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
  const volumeMin = volumeValues.length > 0 ? Math.max(0, Math.min(...volumeValues) * 0.72) : 0;
  const volumeMax = Math.max(...volumeValues, 1) * 1.08;
  const priceMinRaw = priceValues.length ? Math.min(...priceValues) : 0;
  const priceMaxRaw = priceValues.length ? Math.max(...priceValues) : 1;
  const priceSpread = Math.max(priceMaxRaw - priceMinRaw, priceMaxRaw * 0.06, 1);
  const priceMin = Math.max(0, priceMinRaw - priceSpread * 0.08);
  const priceMax = priceMaxRaw + priceSpread * 0.08;
  const x = (index: number) => margin.left + (records.length === 1 ? plotWidth / 2 : (index / (records.length - 1)) * plotWidth);
  const volumeY = (value: number) => margin.top + ((volumeMax - value) / (volumeMax - volumeMin)) * plotHeight;
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
  const volumeLabel = volumeMode === "sales" ? s.unitsSold : s.activeListings;
  const showAverage = priceMode === "average" || priceMode === "both";
  const showMedian = priceMode === "median" || priceMode === "both";
  const showMonthTick = (record: MarketRecord, index: number) =>
    records.length <= 12 || index === 0 || index === records.length - 1 || record.date.slice(5, 7) === "01";

  useEffect(() => setActiveIndex(Math.max(records.length - 1, 0)), [records.length, priceMode, volumeMode]);

  const lastAvgY = showAverage ? (() => { for (let i = records.length - 1; i >= 0; i--) { if (records[i].averagePrice != null) return priceY(records[i].averagePrice!); } return null; })() : null;
  const lastMedianY = showMedian ? (() => { for (let i = records.length - 1; i >= 0; i--) { if (records[i].medianPrice != null) return priceY(records[i].medianPrice!); } return null; })() : null;

  return (
    <section className="combined-chart" aria-labelledby="market-performance-title">
      <div className="combined-chart-heading">
        <div>
          <p className="eyebrow">{s.selectedPeriod}</p>
          <h2 id="market-performance-title">{s.marketPerformance}</h2>
          <p className="chart-description">{s.chartDescription}</p>
        </div>
        {active && (
          <div className="combined-focus" aria-live="polite">
            <span>{monthLabel(active.date, locale)}</span>
            <strong>{volumeLabel}: {volumeValue(active) == null ? "—" : integerFormatter.format(volumeValue(active) ?? 0)}</strong>
            {showAverage && <em style={{color: "var(--teal)"}}>{s.avgButton}: {active.averagePrice == null ? "—" : compactCurrency(active.averagePrice)}</em>}
            {showMedian && <em style={{color: "var(--coral)"}}>{s.medianButton}: {active.medianPrice == null ? "—" : compactCurrency(active.medianPrice)}</em>}
          </div>
        )}
      </div>

      <div className="metric-switches" aria-label="Chart measures">
        <fieldset>
          <legend>{s.volumeBars}</legend>
          <div className="segmented-control">
            <button type="button" className={volumeMode === "sales" ? "active" : ""} aria-pressed={volumeMode === "sales"} onClick={() => onVolumeModeChange("sales")}>{s.unitsSold}</button>
            <button type="button" className={volumeMode === "inventory" ? "active" : ""} aria-pressed={volumeMode === "inventory"} onClick={() => onVolumeModeChange("inventory")}>{s.activeListings}</button>
          </div>
        </fieldset>
        <fieldset>
          <legend>{s.priceLines}</legend>
          <div className="segmented-control">
            <button type="button" className={priceMode === "average" ? "active" : ""} aria-pressed={priceMode === "average"} onClick={() => onPriceModeChange("average")}>{s.avgButton}</button>
            <button type="button" disabled={!medianAvailable} className={priceMode === "median" ? "active" : ""} aria-pressed={priceMode === "median"} onClick={() => onPriceModeChange("median")}>{s.medianButton}</button>
            <button type="button" disabled={!medianAvailable} className={priceMode === "both" ? "active" : ""} aria-pressed={priceMode === "both"} onClick={() => onPriceModeChange("both")}>{s.both}</button>
          </div>
          {!medianAvailable && <small>{s.medianNotPublished}</small>}
        </fieldset>
      </div>

      <div className="combined-chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${volumeLabel} with ${priceMode === "both" ? "average and median prices" : `${priceMode} price`} by month.`}>
          <title>{s.marketPerformance}</title>
          <desc>Monthly volume bars use the left axis. Price lines use the right axis.</desc>
          {ticks.map((tick) => {
            const lineY = margin.top + (1 - tick) * plotHeight;
            return (
              <g key={tick}>
                <line className="grid-line" x1={margin.left} x2={width - margin.right} y1={lineY} y2={lineY} />
                <text className="axis-label" x={margin.left - 12} y={lineY + 4} textAnchor="end">{integerFormatter.format(Math.round(volumeMin + (volumeMax - volumeMin) * tick))}</text>
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
          {showAverage && lastAvgY != null && <text className="axis-label line-tag" x={width - margin.right - 6} y={lastAvgY - 6} textAnchor="end" fill="var(--teal)" fontWeight="700">{s.avgShort}</text>}
          {showMedian && lastMedianY != null && <text className="axis-label line-tag" x={width - margin.right - 6} y={lastMedianY - 6} textAnchor="end" fill="var(--coral)" fontWeight="700">{s.medShort}</text>}
          {records.map((record, index) => (
            <g key={record.date}>
              <line className={`hover-line ${activeIndex === index ? "active" : ""}`} x1={x(index)} x2={x(index)} y1={margin.top} y2={margin.top + plotHeight} />
              <rect className="hit-area" x={x(index) - Math.max(5, plotWidth / Math.max(records.length, 1) / 2)} y={margin.top} width={Math.max(10, plotWidth / Math.max(records.length, 1))} height={plotHeight} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0} aria-label={`${monthLabel(record.date, locale)}. ${volumeLabel}: ${volumeValue(record) == null ? "not available" : integerFormatter.format(volumeValue(record) ?? 0)}. Average price: ${record.averagePrice == null ? "not available" : currencyFormatter.format(record.averagePrice)}. Median price: ${record.medianPrice == null ? "not available" : currencyFormatter.format(record.medianPrice)}.`} />
              {showMonthTick(record, index) && <text className="axis-label month-label" x={x(index)} y={height - 14} textAnchor="middle">{index === 0 || index === records.length - 1 ? monthLabel(record.date, locale) : record.date.slice(0, 4)}</text>}
            </g>
          ))}
          <text className="axis-title" x={margin.left} y={14}>{volumeLabel}</text>
          <text className="axis-title" x={width - margin.right} y={14} textAnchor="end">{s.priceCad}</text>
        </svg>
      </div>
      <div className="combined-legend" aria-hidden="true">
        <span><i className="bar-swatch" />{volumeLabel}</span>
        {showAverage && <span><i className="average-swatch" />{s.averagePrice}</span>}
        {showMedian && <span><i className="median-swatch" />{s.medianPrice}</span>}
      </div>
      <p className="chart-source">{s.sourceLine}</p>
    </section>
  );
}

function polarPoint(cx: number, cy: number, r: number, fraction: number) {
  const angle = Math.PI * (1 - fraction);
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
}

function gaugeArcPath(cx: number, cy: number, r: number, f1: number, f2: number) {
  const p1 = polarPoint(cx, cy, r, f1);
  const p2 = polarPoint(cx, cy, r, f2);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
}

function InventoryGauge({ value, conditionCls, locale = "en" }: { value: number | null; conditionCls: string | null; locale?: Locale }) {
  const s = STRINGS[locale];
  const mo = (n: string) => (locale === "zh" ? `${n}个月` : `${n} mo`);
  const cx = 140, cy = 122, r = 92, strokeW = 20;
  const clamped = value == null ? null : Math.min(Math.max(value, 0), 6);
  const fraction = clamped == null ? null : clamped / 6;
  const sellerEnd = 3 / 6;
  const balancedEnd = 4 / 6;
  const fillClass = conditionCls === "condition-seller" ? "gauge-fill-seller" : conditionCls === "condition-buyer" ? "gauge-fill-buyer" : "gauge-fill-balanced";
  const tip = fraction == null ? null : polarPoint(cx, cy, r, fraction);
  const boundaryTick = (f: number) => ({
    inner: polarPoint(cx, cy, r - strokeW / 2 - 3, f),
    outer: polarPoint(cx, cy, r + strokeW / 2 + 3, f),
  });
  const boundaryLabel = (f: number) => polarPoint(cx, cy, r + strokeW / 2 + 15, f);
  const t1 = boundaryTick(sellerEnd);
  const t2 = boundaryTick(balancedEnd);
  const l1 = boundaryLabel(sellerEnd);
  const l2 = boundaryLabel(balancedEnd);
  const labelAnchor = (x: number) => (x < cx - 3 ? "end" : x > cx + 3 ? "start" : "middle");
  return (
    <div className="inventory-gauge">
      <svg viewBox="0 0 280 148" role="img" aria-label={value == null ? "Months of inventory unavailable" : `${value.toFixed(2)} months of inventory, on a scale from zero to six or more`}>
        <path d={gaugeArcPath(cx, cy, r, 0, 1)} className="gauge-track" strokeWidth={strokeW} fill="none" />
        {fraction != null && <path d={gaugeArcPath(cx, cy, r, 0, fraction)} className={`gauge-fill ${fillClass}`} strokeWidth={strokeW} fill="none" />}
        <line x1={t1.inner.x} y1={t1.inner.y} x2={t1.outer.x} y2={t1.outer.y} className="gauge-boundary-tick" />
        <line x1={t2.inner.x} y1={t2.inner.y} x2={t2.outer.x} y2={t2.outer.y} className="gauge-boundary-tick" />
        <text x={l1.x} y={l1.y + 3} className="gauge-boundary-label" textAnchor={labelAnchor(l1.x)}>{mo("3")}</text>
        <text x={l2.x} y={l2.y + 3} className="gauge-boundary-label" textAnchor={labelAnchor(l2.x)}>{mo("4")}</text>
        {tip && <circle cx={tip.x} cy={tip.y} r="7" className="gauge-tip-dot" />}
        <text x={cx - r - 2} y={cy + 22} className="gauge-end-label" textAnchor="start">{mo("0")}</text>
        <text x={cx + r + 2} y={cy + 22} className="gauge-end-label" textAnchor="end">{mo("6+")}</text>
      </svg>
      <div className="gauge-readout">
        <strong>{value == null ? "—" : value.toFixed(2)}</strong>
        <span>{s.monthsOfInventoryUnit}</span>
      </div>
    </div>
  );
}

function InventorySparkline({ records, locale = "en" }: { records: MarketRecord[]; locale?: Locale }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const points = records.filter((record): record is MarketRecord & { monthsOfInventory: number } => record.monthsOfInventory != null);
  if (points.length < 2) return null;
  const width = 280, height = 64, pad = 6;
  const values = points.map((record) => record.monthsOfInventory);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.3);
  const x = (index: number) => pad + (index / (points.length - 1)) * (width - pad * 2);
  const y = (value: number) => pad + (1 - (value - min) / span) * (height - pad * 2);
  const path = points.map((record, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(record.monthsOfInventory)}`).join(" ");
  const segWidth = (width - pad * 2) / Math.max(points.length - 1, 1);
  const shownIndex = activeIndex ?? points.length - 1;
  const shown = points[shownIndex];
  const captionText = activeIndex == null
    ? (locale === "zh" ? `存销比 · 近 ${points.length} 个月趋势` : `Months of inventory · ${points.length}-month trend`)
    : (locale === "zh" ? `${monthLabel(shown.date, locale)} — 存销比 ${shown.monthsOfInventory.toFixed(2)} 个月` : `${monthLabel(shown.date, locale)} — ${shown.monthsOfInventory.toFixed(2)} months of inventory`);
  return (
    <div className="inventory-sparkline">
      <p className="sparkline-caption">{captionText}</p>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Months of inventory across the selected period, hoverable, from ${points[0].monthsOfInventory.toFixed(1)} to ${points[points.length - 1].monthsOfInventory.toFixed(1)}`} onMouseLeave={() => setActiveIndex(null)}>
        <path d={path} className="sparkline-path" fill="none" />
        {activeIndex != null && <line x1={x(activeIndex)} x2={x(activeIndex)} y1="0" y2={height} className="sparkline-hover-line" />}
        <circle cx={x(shownIndex)} cy={y(shown.monthsOfInventory)} r="3.5" className="sparkline-dot" />
        {points.map((record, index) => (
          <rect
            key={record.date}
            x={x(index) - segWidth / 2}
            y={0}
            width={segWidth}
            height={height}
            className="sparkline-hit"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            tabIndex={0}
            aria-label={`${monthLabel(record.date, locale)}: ${record.monthsOfInventory.toFixed(2)} months of inventory`}
          />
        ))}
      </svg>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<Locale>(OPENED_IN_CHINESE ? "zh" : "en");
  const s = STRINGS[locale];
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceMode>("average");
  const [volumeMode, setVolumeMode] = useState<VolumeMode>("sales");
  const [city, setCity] = useState("All TRREB Areas");
  const [propertyType, setPropertyType] = useState("Detached");
  const [startDate, setStartDate] = useState("2021-01-01");
  const [endDate, setEndDate] = useState("2026-10-01");
  const [letter, setLetter] = useState<LatestLetter | null>(null);
  // Downloads are offered only when the dashboard runs on this computer, not on the public site.
  const allowDownloads = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  // Load the Tally widget script once, so the feedback button can open a popup form
  useEffect(() => {
    if (document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Opens the Tally form as a popup when its script has loaded. Where the script is blocked
  // (an ad blocker, or a page viewer that only allows certain scripts), the button is a plain
  // link and opens the same form in a new tab instead.
  function openFeedbackForm(event: MouseEvent<HTMLAnchorElement>) {
    if (!window.Tally) return;
    event.preventDefault();
    window.Tally.openPopup(TALLY_FORM_ID, { layout: "modal", hideTitle: true });
  }

  // Restore saved theme preference
  useEffect(() => {
    const savedTheme = readStored("housing-dashboard-theme");
    const preferredTheme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(preferredTheme);
    document.documentElement.dataset.theme = preferredTheme;
  }, []);

  // Language: the zh/ address is always Chinese. The front page is English unless the visitor
  // chose Chinese before, in which case it moves to the zh/ address (the Advanced home does the same).
  useEffect(() => {
    if (!OPENED_IN_CHINESE && readStored("housing-dashboard-locale") === "zh") setLocale("zh");
  }, []);

  // Switching language moves between the two addresses without a reload, so the tab title and
  // the page's language tag follow along (they match what index.html and zh/index.html say).
  useEffect(() => {
    if (!LANG_PATHS) return;
    document.title = locale === "zh" ? "多伦多房地产市场数据看板" : "Toronto Housing Market Dashboard";
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

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
    if (endDate !== "2026-10-01") params.set("to", endDate);
    if (priceMode !== "average") params.set("price", priceMode);
    if (volumeMode !== "sales") params.set("vol", volumeMode);
    const qs = params.toString();
    const path = LANG_PATHS ? new URL(locale === "zh" ? "zh/" : "", SITE_BASE).pathname : window.location.pathname;
    try { window.history.replaceState(null, "", qs ? `${path}?${qs}` : path); } catch { /* the link just isn't updated */ }
  }, [city, propertyType, startDate, endDate, priceMode, volumeMode, locale]);

  // The newest market letter's headline, for the line above the briefing
  useEffect(() => {
    fetch(SITE_BASE + "data/latest-letter.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: LatestLetter | null) => setLetter(payload))
      .catch(() => setLetter(null));
  }, []);

  // Load an area and home type chosen in the "What can I afford?" panel
  function openInDashboard(nextCity: string, nextType: string) {
    setCity(nextCity);
    setPropertyType(nextType);
    window.requestAnimationFrame(() => document.getElementById("selected-view")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // Fetch market data
  useEffect(() => {
    fetch(SITE_BASE + "data/market-data.json")
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
      // The whole-region rollup (e.g. "Durham Region", "City of Toronto") is always the
      // first entry in a group's member list. Move it to the end of the dropdown list
      // instead of leaving it wherever it falls alphabetically among the municipalities.
      const wholeRegion = group.cities[0];
      const ordered = cities.includes(wholeRegion)
        ? [...cities.filter((candidate) => candidate !== wholeRegion), wholeRegion]
        : cities;
      return { ...group, cities: ordered };
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
  const latestVolume = volumeMode === "sales" ? latest?.sales ?? null : latest?.activeListings ?? null;
  const volumeLabel = volumeMode === "sales" ? "Units sold" : "Active listings";
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
    if (m < 3) return { key: "sellersMarket" as const, label: "Seller's market", cls: "condition-seller" };
    if (m < 4) return { key: "balancedMarket" as const, label: "Balanced market", cls: "condition-balanced" };
    return { key: "buyersMarket" as const, label: "Buyer's market", cls: "condition-buyer" };
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
    const zh = locale === "zh";
    const volumeWordZh = volumeMode === "sales" ? "成交量" : "在售房源数量";

    // Period label
    const periodMonths = selected.length;
    const periodLabel = zh
      ? (periodMonths === 1 ? "一个月"
        : periodMonths < 13 ? `${periodMonths} 个月`
        : periodMonths < 24 ? "一年"
        : `${(periodMonths / 12).toFixed(1)} 年`)
      : (periodMonths === 1 ? "one month"
        : periodMonths < 13 ? `${periodMonths} months`
        : periodMonths < 24 ? "one year"
        : `${(periodMonths / 12).toFixed(1)} years`);

    // 1. Volume trend — absolute numbers from first to latest
    const firstVol = volumeMode === "sales" ? first.sales : first.activeListings;
    const latestVol = volumeMode === "sales" ? latest.sales : latest.activeListings;
    if (zh) {
      const volTrend = volumeChange == null ? "因数据缺失无法比较"
        : Math.abs(volumeChange) < 1 ? "基本没有变化"
        : `${volumeChange > 0 ? "上升了" : "下降了"} ${Math.abs(volumeChange).toFixed(1)}%`;
      const volAbsolute = firstVol != null && latestVol != null
        ? `，从 ${monthLabel(first.date, locale)} 的 ${integerFormatter.format(firstVol)} 变为 ${monthLabel(latest.date, locale)} 的 ${integerFormatter.format(latestVol)}`
        : "";
      summary.push(`过去 ${periodLabel}，${volumeWordZh}${volTrend}${volAbsolute}。`);
    } else {
      const volTrend = volumeChange == null ? "could not be compared due to missing data"
        : Math.abs(volumeChange) < 1 ? "was broadly unchanged"
        : `${volumeChange > 0 ? "rose" : "fell"} ${Math.abs(volumeChange).toFixed(1)}%`;
      const volAbsolute = firstVol != null && latestVol != null
        ? `, moving from ${integerFormatter.format(firstVol)} in ${monthLabel(first.date, locale)} to ${integerFormatter.format(latestVol)} in ${monthLabel(latest.date, locale)}`
        : "";
      summary.push(`Over ${periodLabel}, ${volumeLabel.toLowerCase()} ${volTrend}${volAbsolute}.`);
    }

    // 2. Price trend — absolute numbers + year-over-year comparison
    if (priceMode === "average" || priceMode === "both") {
      const priceYoY = percentChange(latest.averagePrice, yearAgo?.averagePrice ?? null);
      if (zh) {
        const priceLabel = propertyType === "All property types" ? "按成交量加权的平均价格" : "平均价格";
        const priceTrend = priceChange == null ? "无法比较"
          : Math.abs(priceChange) < 1 ? "基本持平"
          : `${priceChange > 0 ? "上涨了" : "下跌了"} ${Math.abs(priceChange).toFixed(1)}%`;
        const priceAbsolute = first.averagePrice != null && latest.averagePrice != null
          ? `，从 ${currencyFormatter.format(first.averagePrice)} 变为 ${currencyFormatter.format(latest.averagePrice)}`
          : "";
        const yoyClause = priceYoY == null ? ""
          : Math.abs(priceYoY) < 1 ? " 与去年同月相比基本没有变化。"
          : ` 同比来看，最新数据比 ${monthLabel(yearAgo?.date ?? "", locale)} ${priceYoY > 0 ? "高" : "低"} ${Math.abs(priceYoY).toFixed(1)}% — ${Math.abs(priceYoY) > 5 ? (priceYoY > 0 ? "涨幅明显" : "跌幅明显") : (priceYoY > 0 ? "小幅上涨" : "小幅回落")}。`;
        summary.push(`${priceLabel}${priceTrend}${priceAbsolute}。${yoyClause}`);
      } else {
        const priceLabel = propertyType === "All property types" ? "The sales-weighted average price" : "The average price";
        const priceTrend = priceChange == null ? "could not be compared"
          : Math.abs(priceChange) < 1 ? "held flat"
          : `${priceChange > 0 ? "gained" : "declined"} ${Math.abs(priceChange).toFixed(1)}%`;
        const priceAbsolute = first.averagePrice != null && latest.averagePrice != null
          ? `, from ${currencyFormatter.format(first.averagePrice)} to ${currencyFormatter.format(latest.averagePrice)}`
          : "";
        const yoyClause = priceYoY == null ? ""
          : Math.abs(priceYoY) < 1 ? " The latest reading was little changed from the same month a year earlier."
          : ` Year-over-year, the latest reading was ${Math.abs(priceYoY).toFixed(1)}% ${priceYoY > 0 ? "above" : "below"} ${monthLabel(yearAgo?.date ?? "", locale)} — ${Math.abs(priceYoY) > 5 ? (priceYoY > 0 ? "a meaningful annual gain" : "a meaningful annual decline") : (priceYoY > 0 ? "a modest annual gain" : "a modest annual pullback")}.`;
        summary.push(`${priceLabel} ${priceTrend}${priceAbsolute}.${yoyClause}`);
      }
    }
    if (priceMode === "median" || priceMode === "both") {
      if (zh) {
        const medianTrend = medianChange == null ? "无法比较"
          : Math.abs(medianChange) < 1 ? "基本持平"
          : `${medianChange > 0 ? "上涨了" : "下跌了"} ${Math.abs(medianChange).toFixed(1)}%`;
        const medianAbsolute = first.medianPrice != null && latest.medianPrice != null
          ? `，从 ${currencyFormatter.format(first.medianPrice)} 变为 ${currencyFormatter.format(latest.medianPrice)}`
          : "";
        summary.push(`中位价格${medianTrend}${medianAbsolute}。`);
      } else {
        const medianTrend = medianChange == null ? "could not be compared"
          : Math.abs(medianChange) < 1 ? "held flat"
          : `${medianChange > 0 ? "gained" : "declined"} ${Math.abs(medianChange).toFixed(1)}%`;
        const medianAbsolute = first.medianPrice != null && latest.medianPrice != null
          ? `, from ${currencyFormatter.format(first.medianPrice)} to ${currencyFormatter.format(latest.medianPrice)}`
          : "";
        summary.push(`The median price ${medianTrend}${medianAbsolute}.`);
      }
    }

    // 3. Sale-to-list interpretation — what the ratio means in practical terms
    if (latest.saleToList != null) {
      const stl = latest.saleToList;
      const stlYoY = yearAgo?.saleToList ?? null;
      if (zh) {
        const stlMeaning = stl >= 102
          ? "竞价推高了成交价，属于火热的卖方市场特征"
          : stl >= 100
            ? "房屋普遍以挂牌价或更高价格成交，买家需求旺盛"
            : stl >= 97
              ? "房屋成交价略低于挂牌价，属于相对平衡的议价环境"
              : "买家在议价上握有较大主动权，成交价明显低于挂牌价";
        const stlYoYClause = stlYoY != null && Math.abs(stl - stlYoY) >= 1
          ? ` 这比去年同月${stl > stlYoY ? `高 ${(stl - stlYoY).toFixed(1)} 个百分点` : `低 ${(stlYoY - stl).toFixed(1)} 个百分点`}。`
          : "";
        summary.push(`成交价/挂牌价比率为 ${stl}%，说明${stlMeaning}。${stlYoYClause}`);
      } else {
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
    }

    // 4. Short-term momentum — recent 3 months vs prior 3 months
    if (selected.length >= 6) {
      const values = selected.map((r) => volumeMode === "sales" ? r.sales : r.activeListings).filter((v): v is number => v != null);
      const recent = average(values.slice(-3));
      const previous = average(values.slice(-6, -3));
      const momentum = percentChange(recent, previous);
      if (momentum != null) {
        if (zh) {
          const dirLabel = Math.abs(momentum) < 1 ? "持稳" : momentum > 0 ? "正向" : "负向";
          const implication = Math.abs(momentum) < 1
            ? "显示市场已接近短期平衡"
            : momentum > 5 ? "预示市场活动正在加速"
            : momentum > 0 ? "显示短期需求略有回升"
            : momentum < -5 ? "预示市场状况正在走软"
            : "显示短期活动略有降温";
          summary.push(`${volumeWordZh}的短期动能为${dirLabel}：最近三个月平均值比前三个月${momentum >= 0 ? "高" : "低"} ${Math.abs(momentum).toFixed(1)}%，${implication}。`);
        } else {
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
    }

    // 5. Supply and liquidity — inventory context with practical interpretation
    if (latest.activeListings != null || latest.monthsOfInventory != null) {
      if (zh) {
        const supplyText = latest.activeListings != null
          ? `${monthLabel(latest.date, locale)}共有 ${integerFormatter.format(latest.activeListings)} 套在售房源`
          : "未报告在售房源数量";
        const inventoryText = latest.monthsOfInventory == null ? ""
          : latest.monthsOfInventory < 2 ? `，存销比为 ${latest.monthsOfInventory.toFixed(2)} 个月 — 明显处于卖方市场区间`
          : latest.monthsOfInventory < 3 ? `，存销比为 ${latest.monthsOfInventory.toFixed(2)} 个月 — 卖方市场`
          : latest.monthsOfInventory < 4 ? `，存销比为 ${latest.monthsOfInventory.toFixed(2)} 个月 — 平衡市场`
          : latest.monthsOfInventory < 6 ? `，存销比为 ${latest.monthsOfInventory.toFixed(2)} 个月 — 买方市场`
          : `，存销比为 ${latest.monthsOfInventory.toFixed(2)} 个月 — 深度买方市场`;
        const domText = latest.daysOnMarket == null ? ""
          : latest.daysOnMarket < 15 ? ` 房屋成交速度很快，平均 ${integerFormatter.format(latest.daysOnMarket)} 天售出。`
          : latest.daysOnMarket < 30 ? ` 平均挂牌 ${integerFormatter.format(latest.daysOnMarket)} 天成交 — 市场活跃。`
          : latest.daysOnMarket < 50 ? ` 平均上市天数为 ${integerFormatter.format(latest.daysOnMarket)} 天，买家有较充裕的时间考察。`
          : ` 平均上市天数长达 ${integerFormatter.format(latest.daysOnMarket)} 天，显示房屋成交明显变慢。`;
        summary.push(`${supplyText}${inventoryText}。${domText}`);
      } else {
        const supplyText = latest.activeListings != null
          ? `There were ${integerFormatter.format(latest.activeListings)} active listings in ${monthLabel(latest.date, locale)}`
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
      if (peakVal != null && peakRecord.date !== latest.date) {
        if (zh) {
          const gapClause = latestValForPeak != null && latestValForPeak > 0
            ? `，比最近一个月高 ${((peakVal / latestValForPeak - 1) * 100).toFixed(0)}%`
            : "";
          summary.push(`所选期间内${volumeWordZh}的最高点出现在 ${monthLabel(peakRecord.date, locale)}，为 ${integerFormatter.format(peakVal)}${gapClause}。`);
        } else {
          const gapClause = latestValForPeak != null && latestValForPeak > 0
            ? `, ${((peakVal / latestValForPeak - 1) * 100).toFixed(0)}% above the most recent month`
            : "";
          summary.push(`The highest ${volumeLabel.toLowerCase()} in the selected period was ${monthLabel(peakRecord.date, locale)} at ${integerFormatter.format(peakVal)}${gapClause}.`);
        }
      }
    }

    return summary;
  }, [first, latest, locale, medianChange, priceChange, priceMode, propertyType, s, selected, volumeChange, volumeLabel, volumeMode, yearAgo]);

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
    const headers = locale === "zh"
      ? ["月份", "成交套数", "平均价格（加元）", "中位价格（加元）", "在售房源", "存销比（月）", "平均上市天数"]
      : ["Month", "Units Sold", "Average Price (CAD)", "Median Price (CAD)", "Active Listings", "Months of Inventory", "Avg. Days on Market"];
    const rows = selected.map((r) => [
      monthLabel(r.date, locale),
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
    writeStored("housing-dashboard-theme", nextTheme);
  }

  function toggleLocale() {
    const nextLocale: Locale = locale === "en" ? "zh" : "en";
    setLocale(nextLocale);
    writeStored("housing-dashboard-locale", nextLocale);
    writeStored("gta-lang", nextLocale); // the Advanced pages open in the same language
  }

  // Pull display labels from data metadata so they stay accurate as the dataset grows
  const coveragePeriod = data ? `${monthLabel(data.metadata.periodStart, locale)}–${monthLabel(data.metadata.periodEnd, locale)}` : "";

  return (
    <main>
      <a className="feedback-fab" href={`https://tally.so/r/${TALLY_FORM_ID}`} target="_blank" rel="noreferrer" onClick={openFeedbackForm}>
        {s.feedback}
      </a>
      <header className="site-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <h1 className="brand-name">{s.brandName}</h1>
            <p className="brand-subtitle">{s.brandSubtitle}</p>
            <a className="brand-credit" href="https://polarislabsca.github.io/" target="_blank" rel="noreferrer">
              {s.builtBy} <strong>Polaris Labs</strong>
            </a>
          </div>
        </div>
        <div className="header-actions">
          <button className="theme-toggle lang-toggle" type="button" onClick={toggleLocale} aria-pressed={locale === "zh"} aria-label={locale === "en" ? "Switch to Chinese" : "切换为英文"}>
            <span>{locale === "en" ? "中文" : "English"}</span>
          </button>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} background`}>
            <span className="toggle-track" aria-hidden="true"><span /></span>
            <span>{theme === "dark" ? s.lightMode : s.darkMode}</span>
          </button>
          <a className="advanced-link" href={siteHref(locale === "zh" ? "advanced/zh/" : "advanced/")} title={s.advancedHint}>
            {s.advanced} <span aria-hidden="true">→</span>
          </a>
          {allowDownloads && (
            <a className="dataset-link" href={data?.metadata.linkedWorkbook ?? "./data/TRREB_Detached_Dataset_through_2026-10.xlsx"} download>
              {s.downloadExcel}
            </a>
          )}
        </div>
      </header>

      {data && (
        <p className="updated-line">
          {s.updatedThrough} <strong>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-CA", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${data.metadata.updatedThrough}T00:00:00Z`))}</strong>
          {locale === "zh" ? "，" : ", "}{s.officialReports}
        </p>
      )}

      {letter && (
        <a className="letter-strip" href={siteHref(letter[locale].path)}>
          <span className="letter-strip-label">{s.letterLabel} · {monthLabel(`${letter.month}-01`, locale)} · {s.letterScope}</span>
          <span className="letter-strip-title">{letter[locale].title}</span>
          {letter[locale].summary && <span className="letter-strip-summary">{letter[locale].summary}</span>}
          <span className="letter-strip-go">{s.readLetter} <span aria-hidden="true">→</span></span>
        </a>
      )}

      {data && (
        <AffordFinder
          records={data.records}
          months={months}
          cityGroups={cityGroups}
          locale={locale}
          cityLabel={(name) => cityLabel(name, locale)}
          regionLabel={(label) => regionLabel(label, locale)}
          typeLabel={(name) => propertyTypeLabel(name, locale)}
          monthLabel={(date) => monthLabel(date, locale)}
          onPick={openInDashboard}
        />
      )}

      <section className="controls" aria-label="Dashboard filters">
        <label>
          <span>{s.cityOrArea}</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} disabled={!data}>
            <option value="All TRREB Areas">{cityLabel("All TRREB Areas", locale)}</option>
            {cityGroups.map((group) => (
              <optgroup key={group.label} label={regionLabel(group.label, locale)}>
                {group.cities.map((option) => <option key={option} value={option}>{cityLabel(option, locale)}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span>{s.propertyType}</span>
          <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} disabled={!data}>
            <option value="All property types">{propertyTypeLabel("All property types", locale)}</option>
            {data?.propertyTypes.map((option) => <option key={option} value={option}>{propertyTypeLabel(option, locale)}</option>)}
          </select>
        </label>
        <label>
          <span>{s.fromYear}</span>
          <select value={startDate.slice(0, 4)} onChange={(event) => updateDatePart("start", event.target.value, startDate.slice(5, 7))} disabled={!data}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>{s.fromMonth}</span>
          <select value={startDate.slice(5, 7)} onChange={(event) => updateDatePart("start", startDate.slice(0, 4), event.target.value)} disabled={!data}>
            {months.filter((month) => month.startsWith(`${startDate.slice(0, 4)}-`)).map((month) => <option key={month} value={month.slice(5, 7)}>{monthOnlyLabel(month, locale)}</option>)}
          </select>
        </label>
        <label>
          <span>{s.toYear}</span>
          <select value={endDate.slice(0, 4)} onChange={(event) => updateDatePart("end", event.target.value, endDate.slice(5, 7))} disabled={!data}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>{s.toMonth}</span>
          <select value={endDate.slice(5, 7)} onChange={(event) => updateDatePart("end", endDate.slice(0, 4), event.target.value)} disabled={!data}>
            {months.filter((month) => month.startsWith(`${endDate.slice(0, 4)}-`)).map((month) => <option key={month} value={month.slice(5, 7)}>{monthOnlyLabel(month, locale)}</option>)}
          </select>
        </label>
        <div className="preset-group" role="group" aria-label="Date range presets">
          <span className="preset-label">{s.quickRange}</span>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`preset-btn${activePreset === preset.label ? " active" : ""}`}
              onClick={() => applyPreset(preset.years)}
              disabled={!data}
              aria-pressed={activePreset === preset.label}
            >
              {locale === "zh" ? (preset.label === "All" ? "全部" : preset.label.replace("Y", "年")) : preset.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="status-message error">{locale === "zh" ? s.loadError : error}</div>}
      {!data && !error && <div className="status-message">{s.loading}</div>}

      {data && selected.length > 0 && latest && (
        <>
          <section className="selection-summary" id="selected-view">
            <div>
              <p className="eyebrow">{s.selectedView}</p>
              <h2>{cityLabel(city, locale)} · {propertyTypeLabel(propertyType, locale)}</h2>
              <p>{monthLabel(startDate, locale)} {locale === "zh" ? "至" : "to"} {monthLabel(endDate, locale)}</p>
            </div>
            <p className="summary-context">{s.latestMonthInRange} <strong>{monthLabel(latest.date, locale)}</strong></p>
          </section>

          <section className="kpi-grid" aria-label="Latest selected metrics">
            <article className="kpi">
              <span>{volumeMode === "sales" ? s.unitsSold : s.activeListings}</span>
              <strong>{latestVolume == null ? "—" : integerFormatter.format(latestVolume)}</strong>
              <Delta value={volumeChange} locale={locale} />
              <YoyDelta current={latestVolume} prior={volumeMode === "sales" ? yearAgo?.sales ?? null : yearAgo?.activeListings ?? null} locale={locale} />
            </article>
            <article className="kpi">
              <span>{priceMode === "average" ? s.averagePrice : priceMode === "median" ? s.medianPrice : s.averageAndMedianPrice}</span>
              {priceMode === "both" ? (
                <div className="dual-price-value">
                  <strong>{latest.averagePrice == null ? "—" : compactCurrency(latest.averagePrice)}</strong>
                  <strong>{latest.medianPrice == null ? "—" : compactCurrency(latest.medianPrice)}</strong>
                  <small>{s.averageMedianSmall}</small>
                </div>
              ) : (
                <strong>{priceMode === "average" ? (latest.averagePrice == null ? "—" : compactCurrency(latest.averagePrice)) : (latest.medianPrice == null ? "—" : compactCurrency(latest.medianPrice))}</strong>
              )}
              {priceMode !== "both" && <Delta value={priceMode === "average" ? priceChange : medianChange} locale={locale} />}
              <YoyDelta
                current={priceMode === "median" ? latest.medianPrice : latest.averagePrice}
                prior={priceMode === "median" ? (yearAgo?.medianPrice ?? null) : (yearAgo?.averagePrice ?? null)}
                locale={locale}
              />
            </article>
            <article className="kpi">
              <span>{s.saleToListRatio}</span>
              <strong>{latest.saleToList == null ? "—" : `${latest.saleToList}%`}</strong>
              <span className="delta neutral">{propertyType === "All property types" ? s.weightedAcrossTypes : s.latestReportedMonth}</span>
              <YoyDelta current={latest.saleToList} prior={yearAgo?.saleToList ?? null} locale={locale} />
            </article>
            <article className="kpi">
              <span>{s.monthsOfInventory}</span>
              <strong>{latest.monthsOfInventory == null ? "—" : latest.monthsOfInventory.toFixed(2)}</strong>
              <span className="delta neutral">{s.inventoryFormula}</span>
              {marketCondition && (
                <span className={`market-condition-badge ${marketCondition.cls}`}>{s[marketCondition.key]}</span>
              )}
            </article>
            <article className="kpi">
              <span>{s.daysOnMarket}</span>
              <strong>{latest.daysOnMarket == null ? "—" : integerFormatter.format(latest.daysOnMarket)}</strong>
              <span className="delta neutral">{s.avgListingToSale}</span>
              <YoyDelta current={latest.daysOnMarket} prior={yearAgo?.daysOnMarket ?? null} locale={locale} />
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
              locale={locale}
            />

            <section className="market-balance-card" aria-labelledby="market-balance-title">
              <p className="eyebrow">{s.supplyVsDemand}</p>
              <h2 id="market-balance-title">{s.marketBalance}</h2>
              {marketCondition && (
                <div className={`market-condition-label ${marketCondition.cls}`}>{s[marketCondition.key]}</div>
              )}
              <InventoryGauge value={latest.monthsOfInventory} conditionCls={marketCondition?.cls ?? null} locale={locale} />
              <div className="inventory-zone-labels"><span>{s.sellersShort}</span><span>{s.balancedShort}</span><span>{s.buyersShort}</span></div>
              <InventorySparkline records={selected} locale={locale} />
              <dl>
                <div><dt>{s.activeListings}</dt><dd>{latest.activeListings == null ? "—" : integerFormatter.format(latest.activeListings)}</dd></div>
                <div><dt>{s.monthsOfInventory}</dt><dd>{latest.monthsOfInventory == null ? "—" : latest.monthsOfInventory.toFixed(2)}</dd></div>
                <div>
                  <dt>{s.supplyVsYearAgo}</dt>
                  <dd>{(() => {
                    const invChange = percentChange(latest.monthsOfInventory, yearAgo?.monthsOfInventory ?? null);
                    const listChange = percentChange(latest.activeListings, yearAgo?.activeListings ?? null);
                    const change = invChange ?? listChange;
                    if (change == null) return "—";
                    if (Math.abs(change) < 5) return s.broadlyStable;
                    return change > 0 ? `${s.expanding} (+${change.toFixed(0)}%)` : `${s.tightening} (${change.toFixed(0)}%)`;
                  })()}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="market-briefing-card" aria-labelledby="market-briefing-title">
            <p className="eyebrow">{s.automaticAnalysis}</p>
            <h2 id="market-briefing-title">{s.signalsToWatch}</h2>
            <div className="briefing-grid">
              {marketSummary.map((statement) => <p key={statement}>{statement}</p>)}
            </div>
          </section>

          <section className="table-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{s.monthlyDetail}</p>
                <h2>{s.selectedPeriodData}</h2>
                <p className="table-summary">{selected.length} {s.monthlyRecordsAvailable}</p>
              </div>
              <div className="table-actions">
                {allowDownloads && (
                  <button
                    className="export-btn"
                    type="button"
                    onClick={exportCSV}
                    title={locale === "zh" ? `导出 ${selected.length} 个月的数据为 CSV` : `Export ${selected.length} months as CSV`}
                  >
                    {s.exportCsv}
                  </button>
                )}
                <button
                  className="detail-toggle"
                  type="button"
                  aria-expanded={showMonthlyDetail}
                  aria-controls="monthly-detail-table"
                  onClick={() => setShowMonthlyDetail((visible) => !visible)}
                >
                  {showMonthlyDetail ? s.hideMonthlyDetail : s.showMonthlyDetail}
                  <span aria-hidden="true">{showMonthlyDetail ? "−" : "+"}</span>
                </button>
              </div>
            </div>
            {showMonthlyDetail && (
              <div id="monthly-detail-table" className="monthly-detail-content">
                <p className="table-note">{propertyType === "All property types" ? s.tableNoteAllTypes : s.tableNoteDefault}</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{s.colMonth}</th><th>{s.colUnitsSold}</th><th>{s.colAveragePrice}</th><th>{s.colMedianPrice}</th><th>{s.colActiveListings}</th><th>{s.colRawMos}</th><th>{s.colAvgLdom}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.map((record) => (
                        <tr key={record.date}>
                          <td>{monthLabel(record.date, locale)}</td>
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

      {data && selected.length === 0 && <div className="status-message">{s.noData}</div>}

      <footer>
        <div>
          <p>{data?.metadata.source ?? "TRREB Market Watch monthly reports"}{coveragePeriod ? ` · ${coveragePeriod}` : ""}.</p>
        </div>
        <a href={data?.metadata.sourceUrl ?? "https://public.trreb.ca/market-data/market-watch/"} target="_blank" rel="noreferrer">{s.viewSource}</a>
      </footer>
    </main>
  );
}
