# GTA Housing Market site

The public site at https://polarislabsca.github.io/GTA-Housing-Market/ has two parts:

- The **dashboard** (`app/page.tsx`) is the front page.
- The **Advanced** pages (this folder) sit under `/advanced/` and open from the dashboard's
  Advanced button: a page for every area and home type, every monthly market letter, and the
  buyer tools, in English and Chinese. Their "← Dashboard" link goes back.

Addresses follow one rule: English has no language folder and Chinese adds `zh/`. So the
dashboard is `/` and `/zh/` (the same app; `vite.github.config.ts` writes `zh/index.html` and
`app/page.tsx` reads the address), and an Advanced page is `/advanced/<page>/` and
`/advanced/zh/<page>/`. Language is never a `?lang=` query.

Until November 2026 it was the other way round (these pages at the root, the dashboard at
`/legacy/`). The 404 page sends those old addresses to their new place.

- `src/app.js` renders every page. The build runs it in Node to pre-render each page's
  content into static HTML; the browser runs the same file to add charts, calculators,
  posters, and the first-visit tour.
- `src/styles.css` holds the site's styles.
- `build.mjs` reads `../public/data/market-data.json`, writes `dist/` (pages, sitemap,
  RSS feeds per language, 404 page, compact `data/site-data.json`): the dashboard build from
  `../github-dist/` goes in at the root and these pages under `advanced/`.
- `preview.mjs` serves `dist/` on this computer the way GitHub Pages does
  (`npm run preview:site`, then open http://localhost:4319/GTA-Housing-Market/).

Build locally from `dashboard/`: `npm run build:site` (builds the dashboard first).
GitHub Actions runs the same command and publishes `site/dist`.

After adding a month of data (`scripts/add_month.py`), rebuild; every page, letter, and
poster picks up the new month automatically.
