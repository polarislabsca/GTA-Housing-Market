"""Rebuild public/data/market-data.json from every TRREB Market Watch PDF.

Usage: python scripts/generate_dashboard_data.py

Takes a few minutes for all reports. Prints every check that fails; for adding a single
new month, use add_month.py instead.
"""
import json

from trreb_extract import PDF_DIR, PROJECT, PROPERTY_PAGES, check, extract_month, unique_rows

OUTPUT = PROJECT / "dashboard/public/data/market-data.json"
RECORD_KEYS = ("date", "city", "propertyType", "sales", "averagePrice", "medianPrice",
               "activeListings", "monthsOfInventory", "saleToList", "daysOnMarket")


def report_months():
    months = []
    for path in sorted(PDF_DIR.glob("mw[0-9][0-9][0-9][0-9].pdf")):
        year, month = 2000 + int(path.stem[2:4]), int(path.stem[4:6])
        if year >= 2021:
            months.append((year, month))
    return months


def write_payload(records):
    records = sorted(records, key=lambda r: (r["date"], r["city"], r["propertyType"]))
    latest = records[-1]["date"]
    payload = {
        "metadata": {
            "title": "TRREB Housing Market Dashboard",
            "updatedThrough": latest,
            "periodStart": records[0]["date"],
            "periodEnd": latest,
            "source": "Official TRREB Market Watch monthly reports",
            "sourceUrl": "https://public.trreb.ca/market-data/market-watch/",
            "linkedWorkbook": f"/data/TRREB_Detached_Dataset_through_{latest[:7]}.xlsx",
        },
        "cities": sorted({r["city"] for r in records}, key=lambda c: (c != "All TRREB Areas", c)),
        "propertyTypes": list(PROPERTY_PAGES.keys()),
        "records": [{key: r[key] for key in RECORD_KEYS} for r in records],
    }
    OUTPUT.write_text(json.dumps(payload, separators=(",", ":")))
    return payload


def main():
    records, failures = [], 0
    for year, month in report_months():
        data = extract_month(year, month)
        problems = check(data)
        extraction = [message for kind, message in problems if kind == "extraction"]
        failures += len(extraction)
        print(f"{year}-{month:02d}: {len(data['records'])} rows, {len(extraction)} failed checks, "
              f"{len(problems) - len(extraction)} notes about the report itself", flush=True)
        for kind, message in problems:
            print(f"    [{kind}] {message}")
        records += unique_rows(data["records"]).values()
    payload = write_payload(records)
    print(f"Wrote {len(payload['records'])} records through {payload['metadata']['updatedThrough'][:7]}; "
          f"{failures} failed checks in total.")


if __name__ == "__main__":
    main()
