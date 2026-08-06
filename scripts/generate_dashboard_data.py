import json
import re
from pathlib import Path

import pdfplumber


PROJECT = Path("/Users/leoma/Claude/Projects/Toronto Housing Market")
PDF_DIR = PROJECT / "TRREB"
OUTPUT = PROJECT / "dashboard/public/data/market-data.json"

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

CELL_BANDS = {
    "city": (0, 120),
    "sales": (120, 180),
    "dollarVolume": (180, 280),
    "averagePrice": (280, 370),
    "medianPrice": (370, 460),
    "newListings": (460, 540),
    "activeListings": (540, 630),
    "saleToList": (630, 700),
    "daysOnMarket": (700, 780),
}

# Reports through April 2022 used a wider table with different column positions.
LEGACY_CELL_BANDS = {
    "city": (0, 130),
    "sales": (130, 210),
    "dollarVolume": (210, 310),
    "averagePrice": (310, 390),
    "medianPrice": (390, 480),
    "newListings": (480, 550),
    "activeListings": (550, 630),
    "saleToList": (630, 720),
    "daysOnMarket": (720, 810),
}


def visible_run(chars):
    runs, current, previous_x = [], [], None
    for char in chars:
        x0 = char["x0"]
        if previous_x is not None and x0 < previous_x - 0.5:
            if current:
                runs.append(current)
            current = []
        current.append(char.get("text", ""))
        previous_x = x0
    if current:
        runs.append(current)
    values = [re.sub(r"\s+", " ", "".join(run).replace("\t", " ")).strip() for run in runs]
    values = [value for value in values if value]
    return values[-1] if values else ""


def clean_number(value):
    cleaned = re.sub(r"[^0-9.\-]", "", value or "")
    if not cleaned or cleaned == "-":
        return None
    number = float(cleaned)
    return int(number) if number.is_integer() else round(number, 2)


def extract_cell(page, row_top, x0, x1):
    chars = [
        char for char in page.chars
        if x0 <= char["x0"] < x1 and abs(char["top"] - row_top) <= 2.0
    ]
    return visible_run(chars)


def extract_page(page, year, month, property_type, scope):
    cell_bands = LEGACY_CELL_BANDS if year < 2022 or (year == 2022 and month <= 4) else CELL_BANDS
    row_tops = {}
    for char in page.chars:
        if 80 <= char["top"] <= 590 and char["x0"] < cell_bands["city"][1] and char["text"].strip():
            row_tops[round(char["top"], 1)] = char["top"]

    records, seen = [], set()
    for row_top in sorted(row_tops.values()):
        city = extract_cell(page, row_top, *cell_bands["city"])
        city = "All TRREB Areas" if city in {"TREB Total", "TRREB Total"} else city
        sales = clean_number(extract_cell(page, row_top, *cell_bands["sales"]))
        if not city or not re.search(r"[A-Za-z]", city) or sales is None or city in seen:
            continue
        seen.add(city)
        row = {
            key: extract_cell(page, row_top, *band)
            for key, band in cell_bands.items()
            if key != "city"
        }
        active = clean_number(row["activeListings"])
        records.append({
            "date": f"{year}-{month:02d}-01",
            "year": year,
            "month": month,
            "city": city,
            "scope": scope,
            "propertyType": property_type,
            "sales": sales,
            "averagePrice": clean_number(row["averagePrice"]),
            "medianPrice": clean_number(row["medianPrice"]),
            "newListings": clean_number(row["newListings"]),
            "activeListings": active,
            "monthsOfInventory": round(active / sales, 2) if active is not None and sales else None,
            "saleToList": clean_number(row["saleToList"]),
            "daysOnMarket": clean_number(row["daysOnMarket"]),
        })
    return records


def main():
    records = []
    report_months = [
        (year, month)
        for year in range(2021, 2027)
        for month in range(1, 13)
        if year < 2026 or month <= 7
    ]
    for year, month in report_months:
        pdf_path = PDF_DIR / f"mw{year % 100:02d}{month:02d}.pdf"
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for property_type, (all_page, toronto_page) in PROPERTY_PAGES.items():
                    records.extend(extract_page(pdf.pages[all_page], year, month, property_type, "ALL TRREB"))
                    records.extend(extract_page(pdf.pages[toronto_page], year, month, property_type, "City of Toronto"))
        except Exception as error:
            raise RuntimeError(f"Could not process {pdf_path.name}") from error

    # The Toronto breakdown repeats four aggregate rows. Prefer the ALL TRREB version.
    deduped = {}
    for record in records:
        key = (record["date"], record["city"], record["propertyType"])
        current = deduped.get(key)
        if current is None or (current["scope"] == "City of Toronto" and record["scope"] == "ALL TRREB"):
            deduped[key] = record

    required = {
        (f"{year}-{month:02d}-01", property_type)
        for year, month in report_months
        for property_type in PROPERTY_PAGES
    }
    available = {
        (record["date"], record["propertyType"])
        for record in deduped.values()
        if record["city"] == "All TRREB Areas"
    }
    missing = sorted(required - available)
    if missing:
        raise RuntimeError(f"Missing All TRREB coverage: {missing[:10]}")

    final_records = []
    for item in sorted(deduped.values(), key=lambda value: (value["date"], value["city"], value["propertyType"])):
        final_records.append({
            key: item[key]
            for key in (
                "date", "city", "propertyType", "sales", "averagePrice", "medianPrice",
                "activeListings", "monthsOfInventory", "saleToList", "daysOnMarket",
            )
        })
    cities = sorted({row["city"] for row in final_records}, key=lambda value: (value != "All TRREB Areas", value))
    payload = {
        "metadata": {
            "title": "TRREB Housing Market Dashboard",
            "updatedThrough": "2026-07-01",
            "periodStart": "2021-01-01",
            "periodEnd": "2026-07-01",
            "source": "Official TRREB Market Watch monthly reports",
            "sourceUrl": "https://public.trreb.ca/market-data/market-watch/",
            "linkedWorkbook": "/data/TRREB_Detached_Dataset_through_2026-07.xlsx",
        },
        "cities": cities,
        "propertyTypes": list(PROPERTY_PAGES.keys()),
        "records": final_records,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, separators=(",", ":")))
    print(json.dumps({
        "records": len(final_records),
        "cities": len(cities),
        "propertyTypes": len(PROPERTY_PAGES),
        "first": final_records[0],
        "last": final_records[-1],
    }, indent=2))


if __name__ == "__main__":
    main()
