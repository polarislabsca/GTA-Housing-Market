"""Add one month of TRREB Market Watch data to the dashboard JSON and the workbook.

Usage: python scripts/add_month.py 2026 9

Extracts every property type from TRREB/mwYYMM.pdf, checks that the area totals add up,
then merges the month into public/data/market-data.json and appends the detached and
price-range rows to the workbook (renamed to the new latest month). Nothing is written
if a consistency check fails, unless --force is passed.
"""
import json
import re
import shutil
import sys
from pathlib import Path

import openpyxl
import pdfplumber

from generate_dashboard_data import OUTPUT, PDF_DIR, PROJECT, PROPERTY_PAGES, clean_number, extract_page

DATA_DIR = OUTPUT.parent
SOURCE_URL = "https://trreb.ca/wp-content/files/market-stats/market-watch/mw{yymm}.pdf"
REGION_MEMBERS = {
    "Halton Region": ["Burlington", "Halton Hills", "Milton", "Oakville"],
    "Peel Region": ["Brampton", "Caledon", "Mississauga"],
    "City of Toronto": ["Toronto West", "Toronto Central", "Toronto East"],
    "York Region": ["Aurora", "East Gwillimbury", "Georgina", "King", "Markham", "Newmarket",
                    "Richmond Hill", "Stouffville", "Vaughan"],
    "Durham Region": ["Ajax", "Brock", "Clarington", "Oshawa", "Pickering", "Scugog", "Uxbridge", "Whitby"],
    "Dufferin County": ["Orangeville"],
    "Simcoe County": ["Adjala-Tosorontio", "Bradford", "Essa", "Innisfil", "New Tecumseth"],
}
DISTRICT_PREFIX = {"Toronto West": "W", "Toronto Central": "C", "Toronto East": "E"}


def extract_month(pdf_path, year, month):
    records = []
    with pdfplumber.open(pdf_path) as pdf:
        for property_type, (all_page, toronto_page) in PROPERTY_PAGES.items():
            records.extend(extract_page(pdf.pages[all_page], year, month, property_type, "ALL TRREB"))
            records.extend(extract_page(pdf.pages[toronto_page], year, month, property_type, "City of Toronto"))
        price_ranges = extract_price_ranges(pdf.pages[1])
    return records, price_ranges


def extract_price_ranges(page):
    """Monthly (not year-to-date) detached sales by price range: the first column of the first table."""
    rows = []
    for line in (page.extract_text() or "").split("\n"):
        match = re.match(r"^(\$[\d,]+(?: to \$[\d,]+|\+))\s+([\d,]+)", line)
        if match:
            label = match.group(1)
            if any(label == existing for existing, _ in rows):
                break  # the year-to-date table repeats the same labels
            rows.append((label, clean_number(match.group(2))))
    return rows


def check(records, price_ranges):
    """Return a list of human-readable problems: totals that don't add up or missing coverage."""
    problems = []
    by_type = {}
    for record in records:
        if record["scope"] == "ALL TRREB" or record["city"] not in by_type.get(record["propertyType"], {}):
            by_type.setdefault(record["propertyType"], {})[record["city"]] = record
    for property_type in PROPERTY_PAGES:
        rows = by_type.get(property_type, {})
        sales = {city: (row["sales"] or 0) for city, row in rows.items()}
        if "All TRREB Areas" not in rows:
            problems.append(f"{property_type}: no All TRREB Areas row")
            continue
        region_total = sum(sales.get(region, 0) for region in REGION_MEMBERS)
        if region_total != sales["All TRREB Areas"]:
            problems.append(f"{property_type}: regions add up to {region_total}, All TRREB Areas says {sales['All TRREB Areas']}")
        for region, members in REGION_MEMBERS.items():
            if region in sales and sum(sales.get(m, 0) for m in members) != sales[region]:
                problems.append(f"{property_type}: {region} members add up to {sum(sales.get(m, 0) for m in members)}, region says {sales[region]}")
        for zone, prefix in DISTRICT_PREFIX.items():
            districts = sum(v for city, v in sales.items() if re.fullmatch(rf"Toronto {prefix}\d\d", city))
            if zone in sales and districts != sales[zone]:
                problems.append(f"{property_type}: {zone} districts add up to {districts}, zone says {sales[zone]}")
    detached_total = by_type.get("Detached", {}).get("All TRREB Areas", {}).get("sales")
    if len(price_ranges) != 15:
        problems.append(f"Price ranges: expected 15 rows, found {len(price_ranges)}")
    elif sum(count for _, count in price_ranges) != detached_total:
        problems.append(f"Price ranges add up to {sum(c for _, c in price_ranges)}, detached sales are {detached_total}")
    return problems


def merge_json(records, year, month):
    payload = json.loads(OUTPUT.read_text())
    date = f"{year}-{month:02d}-01"
    deduped = {}
    for record in records:
        key = (record["city"], record["propertyType"])
        if key not in deduped or record["scope"] == "ALL TRREB":
            deduped[key] = record
    keys = ("date", "city", "propertyType", "sales", "averagePrice", "medianPrice",
            "activeListings", "monthsOfInventory", "saleToList", "daysOnMarket")
    kept = [r for r in payload["records"] if r["date"] != date]
    added = [{k: r[k] for k in keys} for r in deduped.values()]
    payload["records"] = sorted(kept + added, key=lambda r: (r["date"], r["city"], r["propertyType"]))
    payload["cities"] = sorted({r["city"] for r in payload["records"]}, key=lambda c: (c != "All TRREB Areas", c))
    latest = max(r["date"] for r in payload["records"])
    payload["metadata"].update({
        "updatedThrough": latest,
        "periodEnd": latest,
        "linkedWorkbook": f"/data/TRREB_Detached_Dataset_through_{latest[:7]}.xlsx",
    })
    OUTPUT.write_text(json.dumps(payload, separators=(",", ":")))
    return len(added), latest


def extend_table(sheet, table_name, last_row):
    table = sheet.tables[table_name]
    start, end = table.ref.split(":")
    end = re.sub(r"\d+$", str(last_row), end)
    table.ref = f"{start}:{end}"


def update_workbook(records, price_ranges, year, month):
    current = sorted(DATA_DIR.glob("TRREB_Detached_Dataset_through_*.xlsx"))[-1]
    target = DATA_DIR / f"TRREB_Detached_Dataset_through_{year}-{month:02d}.xlsx"
    workbook = openpyxl.load_workbook(current)
    charts_before = sum(len(ws._charts) for ws in workbook.worksheets)
    url = SOURCE_URL.format(yymm=f"{year % 100:02d}{month:02d}")

    stats = workbook["Detached_Stats"]
    existing = {(r[0], r[1]) for r in stats.iter_rows(min_row=2, max_col=2, values_only=True)}
    if (year, month) in existing:
        raise RuntimeError(f"Workbook already has {year}-{month:02d} rows; not appending twice.")
    detached = [r for r in records if r["propertyType"] == "Detached"]
    for scope in ("ALL TRREB", "City of Toronto"):
        for r in sorted((r for r in detached if r["scope"] == scope), key=lambda r: r["city"]):
            stats.append([year, month, r["city"], scope, r["sales"], r["newListings"], r["activeListings"],
                          r["monthsOfInventory"], r["dollarVolume"] if r["sales"] else None,
                          r["averagePrice"] if r["sales"] else None, r["medianPrice"], r["saleToList"],
                          r["daysOnMarket"], url])
    extend_table(stats, "DetachedStatsTable", stats.max_row)

    ranges = workbook["Price_Range_Detached"]
    for label, count in price_ranges:
        ranges.append([year, month, label, count, url])
    extend_table(ranges, "PriceRangeDetachedTable", ranges.max_row)

    workbook.save(target)
    charts_after = sum(len(ws._charts) for ws in openpyxl.load_workbook(target).worksheets)
    if target != current:
        current.unlink()
    shutil.copyfile(target, PROJECT / "TRREB_Detached_Dataset.xlsx")
    return target, charts_before, charts_after


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    year, month = int(args[0]), int(args[1])
    pdf_path = PDF_DIR / f"mw{year % 100:02d}{month:02d}.pdf"
    records, price_ranges = extract_month(pdf_path, year, month)
    problems = check(records, price_ranges)
    print(f"Extracted {len(records)} rows and {len(price_ranges)} price ranges from {pdf_path.name}")
    for problem in problems:
        print("  CHECK FAILED:", problem)
    if problems and "--force" not in sys.argv:
        sys.exit("Nothing written. Fix the problems above or rerun with --force.")
    added, latest = merge_json(records, year, month)
    print(f"market-data.json: {added} records for {year}-{month:02d}; data now runs through {latest[:7]}")
    target, before, after = update_workbook(records, price_ranges, year, month)
    print(f"Workbook: {target.name} (charts before/after save: {before}/{after}), copied to top-level TRREB_Detached_Dataset.xlsx")


if __name__ == "__main__":
    main()
