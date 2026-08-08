// 빌드 후(postbuild) 실행되어 web/dist/sitemap-hs.xml을 생성한다.
// HS코드 12,469건 × ko/en/cn 3개 언어 = 약 37,000개 URL을 사이트맵에 담아
// api/hs-page.js가 서빙하는 /:lang/hs/:code 페이지를 검색엔진이 발견할 수 있게 한다.
//
// Vercel 빌드 환경에는 프로젝트 env var(VITE_SUPABASE_URL 등)가 이미 process.env에
// 주입돼 있다. 로컬에서 `npm run build`로 테스트할 때만 .env.local을 직접 읽어 보충한다.
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadLocalEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.VITE_SUPABASE_URL) loadLocalEnv();

const SITE = "https://customs-mate.vercel.app";
const LANGS = ["ko", "en", "cn"];

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env vars 없음 — 사이트맵 생성 건너뜀");
    return;
  }
  const supabase = createClient(url, key);

  let allRows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("hs_codes")
      .select("hs_code,updated_at")
      .eq("country_code", "KR")
      .order("hs_code", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data?.length) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE) break;
  }

  const urls = [];
  for (const row of allRows) {
    const lastmod = row.updated_at ? row.updated_at.slice(0, 10) : undefined;
    for (const lang of LANGS) {
      urls.push(
        `  <url><loc>${SITE}/${lang}/hs/${row.hs_code}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  const distDir = path.join(__dirname, "..", "dist");
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
  writeFileSync(path.join(distDir, "sitemap-hs.xml"), xml);
  console.log(`[sitemap] ${allRows.length}개 HS코드 × ${LANGS.length}개 언어 = ${urls.length}개 URL 기록 완료`);
}

main().catch((e) => {
  console.error("[sitemap] 생성 실패:", e);
  process.exit(1);
});
