import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "github-dist");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The Chinese dashboard is the same app at zh/ (app/page.tsx reads the address). This writes
// zh/index.html from the English page: files one folder up, and a Chinese title and description
// so a shared link previews in Chinese. The month comes from the English description, so the
// monthly update still has one place to change.
function chinesePage(): Plugin {
  return {
    name: "chinese-dashboard-page",
    closeBundle() {
      const english = readFileSync(join(OUT, "index.html"), "utf8");
      const through = english.match(/through (\w+) (\d{4})\./);
      const month = through ? MONTHS.indexOf(through[1]) + 1 : 0;
      if (!through || !month) throw new Error('github-pages/index.html: the description must end with "through <Month> <Year>."');
      const swaps: [RegExp, string][] = [
        [/<html lang="en"/, '<html lang="zh-CN"'],
        [/(<meta name="description" content=")[^"]*/, `$1基于 TRREB 官方数据的互动式房地产市场数据看板，可按城市、房型和时间段查看 2021 年至 ${through[2]} 年 ${month} 月的走势。`],
        [/(<meta property="og:title" content=")[^"]*/, "$1多伦多房地产市场数据看板"],
        [/(<meta property="og:description" content=")[^"]*/, "$1按地区和房型查看 TRREB 成交量、房价、库存，以及自动生成的市场摘要。"],
        [/<title>[^<]*<\/title>/, "<title>多伦多房地产市场数据看板</title>"],
      ];
      let chinese = english;
      for (const [from, to] of swaps) {
        if (!from.test(chinese)) throw new Error(`zh/index.html: nothing in index.html matches ${from}`);
        chinese = chinese.replace(from, to);
      }
      chinese = chinese.replaceAll('="./', '="../');
      mkdirSync(join(OUT, "zh"), { recursive: true });
      writeFileSync(join(OUT, "zh/index.html"), chinese);
    },
  };
}

export default defineConfig({
  root: "github-pages",
  publicDir: "../public",
  base: "./",
  plugins: [react(), chinesePage()],
  build: {
    outDir: "../github-dist",
    emptyOutDir: true,
  },
});
