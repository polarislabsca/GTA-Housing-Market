"use client";

// "What can I afford?" — an optional panel above the dashboard filters. The visitor fills in
// any of budget, location and home type, selects Show results, and picks a result to load it
// into the dashboard. Nothing is calculated until Show results is selected.
import { useMemo, useState } from "react";

type Locale = "en" | "zh";

type FinderRecord = {
  date: string;
  city: string;
  propertyType: string;
  sales: number;
  medianPrice: number | null;
};

type Row = { city: string; type: string; price: number; sales: number };
type Query = { budget: number | null; loc: string; type: string };

const HOME_TYPES = ["Detached", "Semi-Detached", "Townhouse", "Condo Townhouse", "Condo Apartment"];
const REGION_TOTALS = ["City of Toronto", "York Region", "Peel Region", "Durham Region", "Halton Region", "Simcoe County", "Dufferin County"];
const TORONTO_ZONES: Record<string, RegExp> = { "Toronto Central": /^Toronto C\d/, "Toronto East": /^Toronto E\d/, "Toronto West": /^Toronto W\d/ };
const FEW_SALES = 10; // sales over the three months below which a price is flagged
const PAGE = 10;

const TYPE_NOUN: Record<string, [string, string]> = {
  "Detached": ["detached home", "Detached homes"],
  "Semi-Detached": ["semi-detached home", "Semi-detached homes"],
  "Townhouse": ["townhouse", "Townhouses"],
  "Condo Townhouse": ["condo townhouse", "Condo townhouses"],
  "Condo Apartment": ["condo apartment", "Condo apartments"],
};

const inToronto = (city: string) => city === "City of Toronto" || /^Toronto /.test(city);
const money = (value: number) => (value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(2)}M` : `$${Math.round(value / 1_000)}K`);
const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-CA")}`;

// Accepts 1.5M, 800k, 1,500,000, 150万, or a bare number (under 100 is read as millions).
function parseBudget(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, "").replace(/，/g, "");
  if (!cleaned) return null;
  const match = /^(\d+(?:\.\d+)?)(m|k|万)?$/i.exec(cleaned);
  if (!match) return NaN;
  const value = parseFloat(match[1]);
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "m") return value * 1_000_000;
  if (unit === "k") return value * 1_000;
  if (unit === "万") return value * 10_000;
  return value < 100 ? value * 1_000_000 : value;
}

/* ---------- cost to buy (same rules as the calculator checked in October 2026) ---------- */
type Bracket = [number, number][];
const ONTARIO_LTT: Bracket = [[55000, 0.005], [250000, 0.01], [400000, 0.015], [2000000, 0.02], [Infinity, 0.025]];
// City of Toronto MLTT for one or two single-family residences, effective April 1, 2026.
const TORONTO_LTT: Bracket = [[55000, 0.005], [250000, 0.01], [400000, 0.015], [2000000, 0.02], [3000000, 0.025], [4000000, 0.044], [5000000, 0.0545], [10000000, 0.065], [20000000, 0.0755], [Infinity, 0.086]];
function bracketTax(price: number, brackets: Bracket) {
  let tax = 0, previous = 0;
  for (const [cap, rate] of brackets) {
    if (price <= previous) break;
    tax += (Math.min(price, cap) - previous) * rate;
    previous = cap;
  }
  return tax;
}
// Canadian mortgages compound semi-annually.
function payment(principal: number, rate: number, years: number) {
  const i = Math.pow(1 + rate / 200, 1 / 6) - 1, n = years * 12;
  return i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
}
const minimumDown = (price: number) => (price <= 500000 ? price * 0.05 : price < 1500000 ? 25000 + (price - 500000) * 0.1 : price * 0.2);
const insuranceRate = (downPercent: number) => (downPercent >= 20 ? 0 : downPercent >= 15 ? 0.028 : downPercent >= 10 ? 0.031 : 0.04);

const COPY = {
  en: {
    open: "What can I afford?",
    openHint: "Start from a budget, a location or a home type",
    intro: "Fill in any one, two or all three, then select Show results.",
    budget: "Budget", budgetHint: "e.g. 1.5M",
    location: "Location", anywhere: "Anywhere in the GTA",
    homeType: "Home type", anyType: "Any home type",
    show: "Show results", clear: "Clear",
    errEmpty: "Enter a budget, a location or a home type first.",
    errBudget: "Enter a budget from $100K to $20M, for example 1.5M.",
    under: "under budget", over: "over budget", few: "Few sales",
    salesIn3: (n: number) => `${n.toLocaleString("en-CA")} ${n === 1 ? "sale" : "sales"} in 3 months`,
    more: "Show more",
    thinTitle: "Few recent sales, so treat these prices with caution",
    thinVerdict: (n: number) => ` Only ${n} sold in the last three months, so treat this price with caution.`,
    openRow: "Open in the dashboard",
    note: (period: string) => `Typical price is the median sale price over the last three months (${period}), weighted by sales. "Few sales" marks fewer than ${FEW_SALES} sales in that time, where one unusual sale can move the price. Select a result to open it in the dashboard below.`,
    costsShow: "Show my costs", costsHide: "Hide my costs",
    price: "Purchase price", downPay: "Down payment", rate: "Mortgage rate", amort: "Amortization", years: "years",
    ftb: "First-time buyer", inToronto: "Buying in the City of Toronto",
    monthly: "Monthly payment", stress: "Stress-test payment", cash: "Cash needed to close",
    cDown: "Down payment", cOnt: "Ontario land transfer tax", cTor: "Toronto land transfer tax", cReb: "First-time buyer rebates",
    cPst: "PST on mortgage insurance", cLegal: "Legal and closing costs (estimate)", cIns: "Mortgage insurance (added to the mortgage)", cTotal: "Total cash needed",
    belowMin: "This down payment is below the legal minimum for this price",
    costNote: "Estimate only, not financial advice. Uses Ontario and City of Toronto land transfer tax brackets and first-time buyer rebates, CMHC premiums, and semi-annual compounding. Confirm with your lawyer and lender.",
  },
  zh: {
    open: "我能买得起什么？",
    openHint: "从预算、地区或房屋类型开始",
    intro: "任填一项、两项或三项，然后点击“查看结果”。",
    budget: "预算", budgetHint: "例如 150万",
    location: "地区", anywhere: "大多伦多任意地区",
    homeType: "房屋类型", anyType: "任意类型",
    show: "查看结果", clear: "清空",
    errEmpty: "请先填写预算、地区或房屋类型。",
    errBudget: "请输入 10万 至 2000万 之间的预算，例如 150万。",
    under: "低于预算", over: "超出预算", few: "成交较少",
    salesIn3: (n: number) => `近三个月成交 ${n.toLocaleString("en-CA")} 套`,
    more: "显示更多",
    thinTitle: "近期成交较少，以下价格仅供参考",
    thinVerdict: (n: number) => `最近三个月仅成交 ${n} 套，此价格仅供参考。`,
    openRow: "在下方看板中打开",
    note: (period: string) => `典型价格为最近三个月（${period}）的成交中位价，按成交量加权。“成交较少”表示这段时间成交不足 ${FEW_SALES} 套，个别成交就可能明显拉动价格。点击任一结果，即可在下方看板中查看。`,
    costsShow: "查看购房成本", costsHide: "收起购房成本",
    price: "购房价格", downPay: "首付", rate: "贷款利率", amort: "还款年限", years: "年",
    ftb: "首次购房", inToronto: "在多伦多市购房",
    monthly: "每月还款", stress: "压力测试还款额", cash: "交房所需现金",
    cDown: "首付", cOnt: "安省土地转让税", cTor: "多伦多市土地转让税", cReb: "首次购房退税",
    cPst: "房贷保险的省销售税", cLegal: "律师及其他交割费用（估算）", cIns: "房贷保险（计入贷款）", cTotal: "所需现金合计",
    belowMin: "该首付低于此房价的法定最低首付",
    costNote: "仅为估算，不构成财务建议。按安省及多伦多市土地转让税税率与首次购房退税、CMHC 保险费率，以及每半年复利计算。请向律师和贷款机构确认。",
  },
};

function CostEstimate({ locale, startPrice, startInToronto }: { locale: Locale; startPrice: number; startInToronto: boolean }) {
  const c = COPY[locale];
  const [priceText, setPriceText] = useState(Math.round(startPrice).toLocaleString("en-CA"));
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(25);
  const [firstTime, setFirstTime] = useState(false);
  const [toronto, setToronto] = useState(startInToronto);

  const parsed = parseBudget(priceText);
  const price = parsed != null && !Number.isNaN(parsed) && parsed >= 50000 && parsed <= 20000000 ? parsed : null;
  const downOk = down >= 5 && down <= 100;
  const rateOk = rate >= 0.5 && rate <= 15;

  let result = null;
  if (price != null && downOk && rateOk) {
    const downAmount = (price * down) / 100;
    const insurable = price < 1500000 && down < 20;
    const premium = insurable ? (price - downAmount) * (insuranceRate(down) + (years > 25 ? 0.002 : 0)) : 0;
    const loan = price - downAmount + premium;
    const pst = premium * 0.08;
    const ontario = bracketTax(price, ONTARIO_LTT);
    const city = toronto ? bracketTax(price, TORONTO_LTT) : 0;
    const rebate = firstTime ? Math.min(ontario, 4000) + (toronto ? Math.min(city, 4475) : 0) : 0;
    const legal = 2500;
    const total = downAmount + ontario + city - rebate + pst + legal;
    const stressRate = Math.max(rate + 2, 5.25);
    const lines: [string, number][] = [[c.cDown, downAmount], [c.cOnt, ontario]];
    if (toronto) lines.push([c.cTor, city]);
    if (firstTime) lines.push([c.cReb, -rebate]);
    if (pst) lines.push([c.cPst, pst]);
    lines.push([c.cLegal, legal]);
    result = { loan, premium, total, stressRate, lines, belowMinimum: downAmount < minimumDown(price) - 1, minimum: minimumDown(price) };
  }

  return (
    <div className="finder-costs">
      <div className="finder-cost-form">
        <label>
          <span>{c.price}</span>
          <input id="finder-cost-price" type="text" inputMode="decimal" autoComplete="off" value={priceText} aria-invalid={price == null}
            onChange={(event) => setPriceText(event.target.value)}
            onBlur={() => { if (price != null) setPriceText(Math.round(price).toLocaleString("en-CA")); }} />
        </label>
        <label>
          <span>{c.downPay} (%)</span>
          <input id="finder-cost-down" type="number" min={5} max={100} step={0.5} value={down} aria-invalid={!downOk} onChange={(event) => setDown(parseFloat(event.target.value))} />
        </label>
        <label>
          <span>{c.rate} (%)</span>
          <input id="finder-cost-rate" type="number" min={0.5} max={15} step={0.01} value={rate} aria-invalid={!rateOk} onChange={(event) => setRate(parseFloat(event.target.value))} />
        </label>
        <label>
          <span>{c.amort}</span>
          <select id="finder-cost-years" value={years} onChange={(event) => setYears(parseInt(event.target.value))}>
            {[5, 10, 15, 20, 25, 30].map((y) => <option key={y} value={y}>{y} {c.years}</option>)}
          </select>
        </label>
        <label className="finder-check"><input id="finder-cost-ftb" type="checkbox" checked={firstTime} onChange={(event) => setFirstTime(event.target.checked)} /> {c.ftb}</label>
        <label className="finder-check"><input id="finder-cost-toronto" type="checkbox" checked={toronto} onChange={(event) => setToronto(event.target.checked)} /> {c.inToronto}</label>
      </div>
      {result && (
        <>
          <div className="finder-cost-figures">
            <div><span>{c.monthly}</span><strong>{dollars(payment(result.loan, rate, years))}</strong><small>{rate.toFixed(2)}% · {years} {c.years}</small></div>
            <div><span>{c.stress}</span><strong>{dollars(payment(result.loan, result.stressRate, years))}</strong><small>{result.stressRate.toFixed(2)}%</small></div>
            <div><span>{c.cash}</span><strong>{dollars(result.total)}</strong></div>
          </div>
          {result.belowMinimum && <p className="finder-error">{c.belowMin} ({dollars(result.minimum)}).</p>}
          <table className="finder-cost-table">
            <tbody>
              {result.lines.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value < 0 ? `−${dollars(-value)}` : dollars(value)}</td></tr>)}
              <tr className="total"><td>{c.cTotal}</td><td>{dollars(result.total)}</td></tr>
              {result.premium > 0 && <tr className="aside"><td>{c.cIns}</td><td>{dollars(result.premium)}</td></tr>}
            </tbody>
          </table>
        </>
      )}
      <p className="finder-note">{c.costNote}</p>
    </div>
  );
}

export function AffordFinder({
  records, months, cityGroups, locale, cityLabel, regionLabel, typeLabel, monthLabel, onPick,
}: {
  records: FinderRecord[];
  months: string[];
  cityGroups: { label: string; cities: string[] }[];
  locale: Locale;
  cityLabel: (name: string) => string;
  regionLabel: (label: string) => string;
  typeLabel: (name: string) => string;
  monthLabel: (date: string) => string;
  onPick: (city: string, propertyType: string) => void;
}) {
  const c = COPY[locale];
  const zh = locale === "zh";
  const [open, setOpen] = useState(false);
  const [budgetText, setBudgetText] = useState("");
  const [loc, setLoc] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState<Query | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [showCosts, setShowCosts] = useState(false);

  const recent = useMemo(() => months.slice(-3), [months]);

  // Typical price for every area and home type: sales-weighted median over the last three months.
  const typical = useMemo(() => {
    const window = new Set(recent);
    const sums = new Map<string, { city: string; type: string; weighted: number; sales: number }>();
    for (const record of records) {
      if (!window.has(record.date) || !HOME_TYPES.includes(record.propertyType)) continue;
      if (!record.sales || record.medianPrice == null) continue;
      const key = `${record.city}|${record.propertyType}`;
      const entry = sums.get(key) ?? { city: record.city, type: record.propertyType, weighted: 0, sales: 0 };
      entry.weighted += record.medianPrice * record.sales;
      entry.sales += record.sales;
      sums.set(key, entry);
    }
    const rows = new Map<string, Row>();
    sums.forEach((entry, key) => rows.set(key, { city: entry.city, type: entry.type, price: Math.round(entry.weighted / entry.sales / 1000) * 1000, sales: entry.sales }));
    return rows;
  }, [records, recent]);

  const activeCities = useMemo(() => new Set([...typical.values()].map((row) => row.city)), [typical]);
  const isTotal = (city: string) => city === "All TRREB Areas" || REGION_TOTALS.includes(city) || city in TORONTO_ZONES;
  const leaves = useMemo(() => [...activeCities].filter((city) => !isTotal(city)), [activeCities]);

  // The single areas that make up a region or Toronto zone (or the area itself).
  function membersOf(place: string): string[] {
    if (place in TORONTO_ZONES) return leaves.filter((city) => TORONTO_ZONES[place].test(city));
    if (REGION_TOTALS.includes(place)) {
      const group = cityGroups.find((candidate) => candidate.cities.includes(place));
      return (group?.cities ?? []).filter((city) => leaves.includes(city));
    }
    return [place];
  }
  function neighboursOf(place: string): string[] {
    const group = cityGroups.find((candidate) => candidate.cities.includes(place));
    return (group?.cities ?? []).filter((city) => city !== place && leaves.includes(city));
  }
  const rowsFor = (cities: string[], types: string[]) =>
    cities.flatMap((city) => types.map((homeType) => typical.get(`${city}|${homeType}`)).filter((row): row is Row => row != null));

  function submit() {
    const budget = parseBudget(budgetText);
    if (budget != null && (Number.isNaN(budget) || budget < 100000 || budget > 20000000)) { setError(c.errBudget); setQuery(null); return; }
    if (budget == null && !loc && !type) { setError(c.errEmpty); setQuery(null); return; }
    setError("");
    if (budget != null) setBudgetText(dollars(budget));
    setQuery({ budget, loc, type });
    setShown(PAGE);
    setShowCosts(false);
  }

  function clear() {
    setBudgetText(""); setLoc(""); setType(""); setError(""); setQuery(null); setShowCosts(false);
  }

  const noun = (homeType: string) => (zh ? typeLabel(homeType) : TYPE_NOUN[homeType]?.[0] ?? homeType.toLowerCase());
  const plural = (homeType: string) => (zh ? typeLabel(homeType) : TYPE_NOUN[homeType]?.[1] ?? homeType);

  const results = useMemo(() => {
    if (!query) return null;
    const { budget, loc: place, type: homeType } = query;
    const types = homeType ? [homeType] : HOME_TYPES;
    const B = budget != null ? money(budget) : "";
    const placeName = place ? (!zh && place === "City of Toronto" ? "the City of Toronto" : cityLabel(place)) : "";
    const solid = (rows: Row[]) => rows.filter((row) => row.sales >= FEW_SALES);
    const thinRows = (rows: Row[]) => rows.filter((row) => row.sales < FEW_SALES);
    const single = place !== "" && !isTotal(place);
    const byPriceUp = (a: Row, b: Row) => a.price - b.price;
    const byPriceDown = (a: Row, b: Row) => b.price - a.price;
    let headline = "";
    let main: Row[] = [];
    let extraTitle = "";
    let extra: Row[] = [];
    let thin: Row[] = [];

    if (budget != null && single) {
      const rows = rowsFor([place], types);
      const fits = rows.filter((row) => row.price <= budget).sort(byPriceDown);
      const overs = rows.filter((row) => row.price > budget).sort(byPriceUp);
      main = [...fits, ...overs];
      if (homeType) {
        const row = rows[0];
        if (!row) headline = zh ? `${placeName}最近三个月没有${noun(homeType)}成交记录。` : `No ${noun(homeType)} sales were reported in ${placeName} in the last three months.`;
        else if (row.price <= budget) headline = zh ? `可以。${placeName}的${noun(homeType)}典型价格为 ${money(row.price)}，比您的预算低 ${money(budget - row.price)}。` : `Yes. A typical ${noun(homeType)} in ${placeName} is ${money(row.price)}, which is ${money(budget - row.price)} under your ${B} budget.`;
        else headline = zh ? `还差一点。${placeName}的${noun(homeType)}典型价格为 ${money(row.price)}，比您的预算高 ${money(row.price - budget)}。` : `Not quite. A typical ${noun(homeType)} in ${placeName} is ${money(row.price)}, which is ${money(row.price - budget)} over your ${B} budget.`;
        if (row && row.sales < FEW_SALES) headline += c.thinVerdict(row.sales);
      } else {
        headline = zh ? `${placeName}的 ${rows.length} 种房屋类型中，有 ${fits.length} 种的典型价格在 ${B} 以内` : `${fits.length} of ${rows.length} home types in ${placeName} are typically within ${B}`;
      }
      if (!fits.length) {
        const otherTypes = homeType ? rowsFor([place], HOME_TYPES.filter((candidate) => candidate !== homeType)) : [];
        const nearby = rowsFor(neighboursOf(place), types);
        extra = solid([...otherTypes, ...nearby]).filter((row) => row.price <= budget).sort(byPriceDown).slice(0, 8);
        extraTitle = zh ? `${B} 以内的其他选择` : `Other options within ${B}`;
      }
    } else if (budget != null) {
      const rows = rowsFor(place ? membersOf(place) : leaves, types);
      const fits = solid(rows).filter((row) => row.price <= budget).sort(byPriceDown);
      thin = thinRows(rows).filter((row) => row.price <= budget).sort(byPriceDown);
      if (fits.length) {
        main = fits;
        const where = place ? (zh ? `${placeName}内` : ` in ${placeName}`) : "";
        headline = homeType
          ? (zh ? `${place ? placeName : ""}有 ${fits.length} 个地区的${noun(homeType)}典型价格在 ${B} 以内` : `${fits.length} ${fits.length === 1 ? "area" : "areas"}${where} where a typical ${noun(homeType)} is within ${B}`)
          : (zh ? `${where}${B} 以内共有 ${fits.length} 个选择` : `${fits.length} ${fits.length === 1 ? "option" : "options"} within ${B}${where}`);
      } else {
        main = solid(rows).sort(byPriceUp).slice(0, 5);
        headline = zh ? `没有典型价格在 ${B} 以内的选择，以下是最接近的` : `Nothing is typically within ${B}. These are the closest.`;
      }
    } else if (place && homeType) {
      if (single) {
        main = rowsFor([place], types);
        headline = main[0]
          ? (zh ? `${placeName}的${noun(homeType)}典型价格为 ${money(main[0].price)}` : `A typical ${noun(homeType)} in ${placeName} is ${money(main[0].price)}`)
          : (zh ? `${placeName}最近三个月没有${noun(homeType)}成交记录。` : `No ${noun(homeType)} sales were reported in ${placeName} in the last three months.`);
        if (main[0] && main[0].sales < FEW_SALES) headline += (zh ? "。" : ".") + c.thinVerdict(main[0].sales);
        extra = solid(rowsFor(neighboursOf(place), types)).sort(byPriceUp).slice(0, 8);
        extraTitle = zh ? `附近地区的${noun(homeType)}价格` : `${plural(homeType)} nearby`;
      } else {
        const rows = rowsFor(membersOf(place), types);
        main = solid(rows).sort(byPriceUp);
        thin = thinRows(rows).sort(byPriceUp);
        headline = zh ? `${placeName}各地区${noun(homeType)}价格（由低到高）` : `${plural(homeType)} in ${placeName}, lowest price first`;
      }
    } else if (place) {
      main = rowsFor([place], types).sort(byPriceUp);
      headline = zh ? `${placeName}的房价` : `What homes cost in ${placeName}`;
    } else {
      const rows = rowsFor(leaves, types);
      main = solid(rows).sort(byPriceUp);
      thin = thinRows(rows).sort(byPriceUp);
      headline = zh ? `各地区${noun(homeType)}价格（由低到高）` : `${plural(homeType)} by area, lowest price first`;
    }
    const costPrice = budget ?? main[0]?.price ?? 1000000;
    return { headline, main, extraTitle, extra, thin, budget, costPrice, costToronto: place ? inToronto(place) : false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, typical, leaves, locale]);

  const period = recent.length ? `${monthLabel(recent[0])}–${monthLabel(recent[recent.length - 1])}` : "";

  const renderRow = (row: Row, budget: number | null) => (
    <li key={`${row.city}|${row.type}`}>
      <button type="button" className="finder-row" onClick={() => onPick(row.city, row.type)} title={c.openRow}>
        <span className="finder-row-place"><strong>{cityLabel(row.city)}</strong><em>{typeLabel(row.type)}</em></span>
        <span className="finder-row-meta">
          {row.sales < FEW_SALES ? <i className="finder-tag">{c.few}</i> : null}
          <small>{c.salesIn3(row.sales)}</small>
        </span>
        <span className="finder-row-price">
          <strong>{money(row.price)}</strong>
          {budget != null && <small className={row.price <= budget ? "fit" : "over"}>{money(Math.abs(budget - row.price))} {row.price <= budget ? c.under : c.over}</small>}
        </span>
        <span className="finder-row-go" aria-hidden="true">→</span>
      </button>
    </li>
  );

  return (
    <section className="finder" aria-label={c.open}>
      <button type="button" className="finder-open" aria-expanded={open} aria-controls="finder-panel" onClick={() => setOpen((value) => !value)}>
        <span><strong>{c.open}</strong><small>{c.openHint}</small></span>
        <span className="finder-open-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div id="finder-panel" className="finder-panel">
          <p className="finder-intro">{c.intro}</p>
          <form className="finder-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <label>
              <span>{c.budget}</span>
              <input id="finder-budget" type="text" inputMode="decimal" autoComplete="off" placeholder={c.budgetHint} value={budgetText} onChange={(event) => setBudgetText(event.target.value)} />
            </label>
            <label>
              <span>{c.location}</span>
              <select id="finder-location" value={loc} onChange={(event) => setLoc(event.target.value)}>
                <option value="">{c.anywhere}</option>
                {cityGroups.map((group) => {
                  const options = group.cities.filter((city) => activeCities.has(city));
                  return options.length ? (
                    <optgroup key={group.label} label={regionLabel(group.label)}>
                      {options.map((city) => <option key={city} value={city}>{cityLabel(city)}</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </label>
            <label>
              <span>{c.homeType}</span>
              <select id="finder-type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="">{c.anyType}</option>
                {HOME_TYPES.map((homeType) => <option key={homeType} value={homeType}>{typeLabel(homeType)}</option>)}
              </select>
            </label>
            <div className="finder-actions">
              <button type="submit" className="finder-submit">{c.show}</button>
              <button type="button" className="finder-clear" onClick={clear}>{c.clear}</button>
            </div>
          </form>
          {error && <p className="finder-error" role="alert">{error}</p>}

          {results && (
            <div className="finder-results" aria-live="polite">
              <h3>{results.headline}</h3>
              {results.main.length > 0 && <ul className="finder-list">{results.main.slice(0, shown).map((row) => renderRow(row, results.budget))}</ul>}
              {results.main.length > shown && (
                <button type="button" className="finder-more" onClick={() => setShown((value) => value + PAGE)}>{c.more} ({results.main.length - shown})</button>
              )}
              {results.extra.length > 0 && (
                <>
                  <h4>{results.extraTitle}</h4>
                  <ul className="finder-list">{results.extra.map((row) => renderRow(row, results.budget))}</ul>
                </>
              )}
              {results.thin.length > 0 && results.main.length <= shown && (
                <>
                  <h4>{c.thinTitle}</h4>
                  <ul className="finder-list">{results.thin.map((row) => renderRow(row, results.budget))}</ul>
                </>
              )}
              <p className="finder-note">{c.note(period)}</p>
              <button type="button" className="finder-more" aria-expanded={showCosts} onClick={() => setShowCosts((value) => !value)}>
                {showCosts ? c.costsHide : c.costsShow} <span aria-hidden="true">{showCosts ? "−" : "+"}</span>
              </button>
              {showCosts && <CostEstimate key={JSON.stringify(query)} locale={locale} startPrice={results.costPrice} startInToronto={results.costToronto} />}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
