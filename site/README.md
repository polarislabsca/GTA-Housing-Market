# GTA Housing Market site

The public site at https://polarislabsca.github.io/GTA-Housing-Market/ — a page for every
area and home type, every monthly market letter, and the buyer tools, in English and
Chinese. The original single-page dashboard is still built from `app/page.tsx` and served
unchanged at `/legacy/`.

- `src/app.js` renders every page. The build runs it in Node to pre-render each page's
  content into static HTML; the browser runs the same file to add charts, calculators,
  posters, and the first-visit tour.
- `src/styles.css` holds the site's styles.
- `build.mjs` reads `../public/data/market-data.json`, writes `dist/` (pages, sitemap,
  RSS feeds per language, 404 page, compact `data/site-data.json`), and copies the legacy
  dashboard from `../github-dist/`.

Build locally from `dashboard/`: `npm run build:site` (builds the legacy dashboard first).
GitHub Actions runs the same command and publishes `site/dist`.

After adding a month of data (`scripts/add_month.py`), rebuild; every page, letter, and
poster picks up the new month automatically.
