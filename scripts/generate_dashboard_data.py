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
    row_tops = {}
    for char in page.chars:
        if 80 <= char["top"] <= 590 and char["x0"] < 120 and char["text"].strip():
            row_tops[round(char["top"], 1)] = char["top"]

    records, seen = [], set()
    for row_top in sorted(row_tops.values()):
        city = extract_cell(page, row_top, *CELL_BANDS["city"])
        sales = clean_number(extract_cell(page, row_top, *CELL_BANDS["sales"]))
        if not city or not re.search(r"[A-Za-z]", city) or sales is None or city in seen:
            continue
        seen.add(city)
        row = {
            key: extract_cell(page, row_top, *band)
            for key, band in CELL_BANDS.items()
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
    for month in range(1, 7):
        pdf_path = PDF_DIR / f"mw26{month:02d}.pdf"
        with pdfplumber.open(pdf_path) as pdf:
            for property_type, (all_page, toronto_page) in PROPERTY_PAGES.items():
                records.extend(extract_page(pdf.pages[all_page], 2026, month, property_type, "ALL TRREB"))
                records.extend(extract_page(pdf.pages[toronto_page], 2026, month, property_type, "City of Toronto"))

    # The Toronto breakdown repeats four aggregate rows. Prefer the ALL TRREB version.
    deduped = {}
    for record in records:
        key = (record["date"], record["city"], record["propertyType"])
        current = deduped.get(key)
        if current is None or (current["scope"] == "City of Toronto" and record["scope"] == "ALL TRREB"):
            deduped[key] = record

    final_records = sorted(deduped.values(), key=lambda item: (item["date"], item["city"], item["propertyType"]))
    cities = sorted({row["city"] for row in final_records}, key=lambda value: (value != "All TRREB Areas", value))
    payload = {
        "metadata": {
            "title": "TRREB Housing Market Dashboard",
            "updatedThrough": "2026-06-01",
            "periodStart": "2026-01-01",
            "periodEnd": "2026-06-01",
            "source": "Official TRREB Market Watch monthly reports",
            "sourceUrl": "https://public.trreb.ca/market-data/market-watch/",
            "linkedWorkbook": "/data/TRREB_Detached_Dataset_through_2026-06.xlsx",
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
