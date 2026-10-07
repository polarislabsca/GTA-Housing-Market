"""Read one TRREB Market Watch report and check that its numbers agree with each other.

Every report since January 2021 is read the same way: hidden decoy text is removed first
(see visible_pdf.py), then each table row is parsed from its text line. The checks compare
figures TRREB prints in more than one place, so an extraction mistake shows up as a total
that doesn't add up.
"""
import re
from pathlib import Path

import pdfplumber

from visible_pdf import visible_pdf

PROJECT = Path("/Users/leoma/Claude/Projects/Toronto Housing Market")
PDF_DIR = PROJECT / "TRREB"

PROPERTY_PAGES = {
    "Detached": (6, 7),
    "Semi-Detached": (8, 9),
    "Townhouse": (10, 11),
    "Condo Townhouse": (12, 13),
    "Condo Apartment": (14, 15),
    "Link": (16, 17),
    "Co-Op Apartment": (18, 19),
    "Detached Condo": (20, 21),
    "Co-Ownership Apartment": (22, 23),
}
PRICE_RANGE_PAGE = 1
ALL_TYPES_PAGES = (2, 3)
PAGES_USED = [PRICE_RANGE_PAGE, *ALL_TYPES_PAGES] + [p for pair in PROPERTY_PAGES.values() for p in pair]

# Older reports use "Whitchurch-Stouffville" and "Bradford West Gwillimbury"; newer ones the short names.
REGION_MEMBERS = {
    "Halton Region": ["Burlington", "Halton Hills", "Milton", "Oakville"],
    "Peel Region": ["Brampton", "Caledon", "Mississauga"],
    "City of Toronto": ["Toronto West", "Toronto Central", "Toronto East"],
    "York Region": ["Aurora", "East Gwillimbury", "Georgina", "King", "Markham", "Newmarket",
                    "Richmond Hill", "Stouffville", "Whitchurch-Stouffville", "Vaughan"],
    "Durham Region": ["Ajax", "Brock", "Clarington", "Oshawa", "Pickering", "Scugog", "Uxbridge", "Whitby"],
    "Dufferin County": ["Orangeville"],
    "Simcoe County": ["Adjala-Tosorontio", "Bradford", "Bradford West Gwillimbury", "Essa", "Innisfil",
                      "New Tecumseth"],
}
DISTRICT_PREFIX = {"Toronto West": "W", "Toronto Central": "C", "Toronto East": "E"}

# One row of a home-type table. The sale-to-list ratio can contain commas (a TRREB typo once
# printed 113,500,000%) and days on market is occasionally left blank.
TYPE_ROW = re.compile(
    r"^(?P<city>.+?)\s+(?P<sales>-|[\d,]+)\s+(?P<dollarVolume>-|\$[\d,]+)\s+(?P<averagePrice>-|\$[\d,]+)"
    r"\s+(?P<medianPrice>-|\$[\d,]+)\s+(?P<newListings>-|[\d,]+)\s+(?P<activeListings>-|[\d,]+)"
    r"\s+(?P<saleToList>-|[\d,]+%)(?:\s+(?P<daysOnMarket>-|[\d,]+))?$"
)
# From September 2026, areas with no sales list only sales (0), new listings, and active listings.
ZERO_ROW = re.compile(r"^(?P<city>.+?)\s+0\s+(?P<newListings>[\d,]+)\s+(?P<activeListings>[\d,]+)$")
# The all-home-types summary has extra columns; only the leading ones are needed for checks.
ALL_TYPES_ROW = re.compile(
    r"^(?P<city>.+?)\s+(?P<sales>[\d,]+)\s+(?P<dollarVolume>\$[\d,]+)\s+(?P<averagePrice>\$[\d,]+)"
    r"\s+(?P<medianPrice>-|\$[\d,]+)\s+(?P<newListings>[\d,]+)\s+(?:-|[\d.]+%)\s+(?P<activeListings>[\d,]+)\s"
)
PRICE_RANGE_ROW = re.compile(r"^(\$[\d,]+(?: to \$[\d,]+|\+))\s+([\d,]+)")


def clean_number(value):
    cleaned = re.sub(r"[^0-9.\-]", "", value or "")
    if not cleaned or cleaned == "-":
        return None
    number = float(cleaned)
    return int(number) if number.is_integer() else round(number, 2)


def page_lines(page):
    # The 2026 report font drops the "ti" ligature (e.g. "Adjala-Tosoron\x00o"); restore it.
    return (page.extract_text() or "").replace("\x00", "ti").split("\n")


def area_name(name):
    return "All TRREB Areas" if name in {"TREB Total", "TRREB Total"} else name


def extract_type_page(page, year, month, property_type, scope):
    records, seen = [], set()
    for line in page_lines(page):
        match = TYPE_ROW.match(line) or ZERO_ROW.match(line)
        if not match:
            continue
        row = match.groupdict()
        city = area_name(row["city"])
        if city in seen:
            continue
        seen.add(city)
        sales = clean_number(row.get("sales") or "0")
        active = clean_number(row["activeListings"])
        sale_to_list = clean_number(row.get("saleToList"))
        notes = []
        if sale_to_list is not None and not 50 <= sale_to_list <= 200:
            notes.append(f"sale-to-list printed as {row['saleToList']}; left blank")
            sale_to_list = None
        if sales and row.get("daysOnMarket") is None:
            notes.append("days on market left blank in the report")
        records.append({
            "date": f"{year}-{month:02d}-01",
            "city": city,
            "scope": scope,
            "propertyType": property_type,
            "sales": sales,
            "dollarVolume": clean_number(row.get("dollarVolume")) if sales else None,
            "averagePrice": clean_number(row.get("averagePrice")) if sales else None,
            "medianPrice": clean_number(row.get("medianPrice")) if sales else None,
            "newListings": clean_number(row["newListings"]),
            "activeListings": active,
            "monthsOfInventory": round(active / sales, 2) if active is not None and sales else None,
            "saleToList": sale_to_list,
            "daysOnMarket": clean_number(row.get("daysOnMarket")),
            "notes": notes,
        })
    return records


def extract_price_ranges(page):
    """Monthly (not year-to-date) detached sales by price range: the first column of the first table."""
    rows = []
    for line in page_lines(page):
        match = PRICE_RANGE_ROW.match(line)
        if match:
            if any(match.group(1) == label for label, _ in rows):
                break  # the year-to-date table repeats the same labels
            rows.append((match.group(1), clean_number(match.group(2))))
    return rows


def extract_all_types(pages):
    totals = {}
    for page in pages:
        for line in page_lines(page):
            match = ALL_TYPES_ROW.match(line)
            if match:
                totals.setdefault(area_name(match["city"]), {
                    key: clean_number(match[key])
                    for key in ("sales", "dollarVolume", "averagePrice", "medianPrice", "newListings", "activeListings")
                })
    return totals


def extract_month(year, month):
    """Return the report's home-type rows, detached price ranges, and all-home-types totals."""
    pdf_path = PDF_DIR / f"mw{year % 100:02d}{month:02d}.pdf"
    records = []
    with pdfplumber.open(visible_pdf(pdf_path, pages=PAGES_USED)[0]) as pdf:
        for property_type, (all_page, toronto_page) in PROPERTY_PAGES.items():
            records += extract_type_page(pdf.pages[all_page], year, month, property_type, "ALL TRREB")
            records += extract_type_page(pdf.pages[toronto_page], year, month, property_type, "City of Toronto")
        price_ranges = extract_price_ranges(pdf.pages[PRICE_RANGE_PAGE])
        all_types = extract_all_types([pdf.pages[i] for i in ALL_TYPES_PAGES])
    return {"records": records, "priceRanges": price_ranges, "allTypes": all_types}


def unique_rows(records):
    """One row per (area, home type), preferring the ALL TRREB page over the Toronto breakdown."""
    rows = {}
    for record in records:
        key = (record["city"], record["propertyType"])
        if key not in rows or record["scope"] == "ALL TRREB":
            rows[key] = record
    return rows


def check(month_data):
    """Return problems as (kind, message). kind is 'source' when TRREB's own report disagrees with itself."""
    records, price_ranges, all_types = month_data["records"], month_data["priceRanges"], month_data["allTypes"]
    rows = unique_rows(records)
    problems = []
    for property_type in PROPERTY_PAGES:
        sales = {city: (row["sales"] or 0) for (city, pt), row in rows.items() if pt == property_type}
        if "All TRREB Areas" not in sales:
            problems.append(("extraction", f"{property_type}: no All TRREB Areas row"))
            continue
        region_total = sum(sales.get(region, 0) for region in REGION_MEMBERS)
        if region_total != sales["All TRREB Areas"]:
            problems.append(("extraction", f"{property_type}: regions add up to {region_total}, All TRREB Areas says {sales['All TRREB Areas']}"))
        for region, members in REGION_MEMBERS.items():
            member_total = sum(sales.get(m, 0) for m in members)
            if region in sales and member_total != sales[region]:
                # Some reports count sales in a region total without assigning them to a town. When
                # the all-home-types table shows the same shortfall, the gap is TRREB's, not ours.
                region_gap = (all_types.get(region, {}).get("sales") or 0) - sum(
                    (all_types.get(m, {}).get("sales") or 0) for m in members)
                kind = "source" if 0 < sales[region] - member_total <= region_gap else "extraction"
                problems.append((kind, f"{property_type}: {region} members add up to {member_total}, region says {sales[region]}"
                                       + (f" (TRREB's region total includes {region_gap} sales not assigned to a town)" if kind == "source" else "")))
        for zone, prefix in DISTRICT_PREFIX.items():
            districts = sum(v for city, v in sales.items() if re.fullmatch(rf"Toronto {prefix}\d\d", city))
            if zone in sales and districts != sales[zone]:
                problems.append(("extraction", f"{property_type}: {zone} districts add up to {districts}, zone says {sales[zone]}"))
    for record in records:
        sales, volume, average = record["sales"], record["dollarVolume"], record["averagePrice"]
        if sales and volume and average and abs(sales * average - volume) > max(sales, volume * 0.001):
            problems.append(("extraction", f"{record['propertyType']}: {record['city']} sales x average price is "
                                           f"{sales * average:,.0f}, dollar volume says {volume:,.0f}"))
        for note in record["notes"]:
            problems.append(("source", f"{record['propertyType']}: {record['city']} {note}"))
    detached_total = rows.get(("All TRREB Areas", "Detached"), {}).get("sales")
    if len(price_ranges) != 15:
        problems.append(("extraction", f"Price ranges: expected 15 rows, found {len(price_ranges)}"))
    elif sum(count for _, count in price_ranges) != detached_total:
        problems.append(("source", f"Detached price ranges add up to {sum(c for _, c in price_ranges)}, detached sales are {detached_total}"))
    for city, totals in all_types.items():
        summed = {key: sum((row[key] or 0) for (c, _), row in rows.items() if c == city)
                  for key in ("sales", "dollarVolume", "newListings", "activeListings")}
        if not summed["sales"] and city not in {c for c, _ in rows}:
            continue
        for key, value in summed.items():
            tolerance = len(PROPERTY_PAGES) if key == "dollarVolume" else 0  # TRREB rounds each type's volume
            if totals[key] is not None and abs(value - totals[key]) > tolerance:
                problems.append(("extraction", f"All home types: {city} {key}: the 9 types add up to {value:,}, "
                                               f"the all-types table says {totals[key]:,}"))
    return problems
