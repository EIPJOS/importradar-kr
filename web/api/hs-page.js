// Vercel Node Serverless Function — HS코드별 SEO 랜딩페이지.
// customs-mate 프론트(web/src)는 순수 클라이언트 렌더링 SPA라 검색엔진이 개별 HS코드를
// 크롤링할 방법이 없었다. 이 함수는 vercel.json의 rewrite(/:lang/hs/:code)를 통해서만
// 호출되며, 요청 시점에 가벼운 정적 HTML을 서버에서 렌더링해 크롤러/최초 진입 트래픽에
// 응답한다 — 12,469개 코드를 빌드타임에 전부 프리렌더링하는 대신, 응답에 캐시 헤더를 걸어
// Vercel 엣지 캐시로 사실상 ISR처럼 동작하게 한다.
//
// web/src/lib/supabase.js는 import.meta.env(Vite 빌드타임 치환)를 쓰기 때문에 이 함수(Vite를
// 안 거치는 Node 런타임)에서는 그대로 재사용할 수 없다 — 동일한 프로젝트 env var를
// process.env로 읽어 별도 클라이언트를 만든다. 쿼리 로직 자체는 lib/supabase.js의
// getHsCodeDetail/getTariffRates와 동일한 컬럼을 그대로 따른다.
import { createClient } from "@supabase/supabase-js";
import { findChapterName, HS_SECTIONS } from "../src/lib/hsSections.js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const LANGS = ["ko", "en", "cn"];
const SITE = "https://customs-mate.vercel.app";

const L = {
  ko: {
    siteName: "통관메이트",
    titleSuffix: "HS코드 조회 | 통관메이트",
    breadcrumbHs: "HS코드",
    tariffHeading: "관세율",
    tariffEmpty: "등록된 관세율 정보가 없습니다.",
    reqHeading: "수입요건 (세관장확인대상)",
    reqEmpty: "등록된 수입요건이 없습니다. 실시간 조회에서 다시 확인해보세요.",
    ctaTitle: "이 코드로 실시간 조회하기",
    ctaBody: "부적합·회수 이력, 최신 법령 개정까지 한 화면에서 확인하세요.",
    ctaButton: "통관메이트에서 실시간 조회하기 →",
    notFoundTitle: "HS코드를 찾을 수 없습니다",
    notFoundBody: "요청하신 HS코드 정보가 없습니다. 통관메이트에서 직접 검색해보세요.",
    home: "홈",
    rateType: { basic: "기본세율", wto: "WTO협정세율", fta: "FTA협정세율" },
    imexType: { import: "수입", export: "수출" },
    disclaimer: "본 정보는 참고용이며 법적 효력이 없습니다. 최종 확인은 관세청 유니패스 원문을 기준으로 하시기 바랍니다.",
  },
  en: {
    siteName: "Customs Mate",
    titleSuffix: "HS Code Lookup | Customs Mate",
    breadcrumbHs: "HS Code",
    tariffHeading: "Tariff Rates",
    tariffEmpty: "No tariff rate data registered.",
    reqHeading: "Import Requirements (Customs-Officer-Confirmation)",
    reqEmpty: "No import requirements registered. Check the live lookup for the latest.",
    ctaTitle: "Look up this code live",
    ctaBody: "See rejection/recall history and the latest regulation updates, all on one screen.",
    ctaButton: "Search live on Customs Mate →",
    notFoundTitle: "HS code not found",
    notFoundBody: "We don't have data for the requested HS code. Try searching directly on Customs Mate.",
    home: "Home",
    rateType: { basic: "Basic Rate", wto: "WTO Agreement Rate", fta: "FTA Agreement Rate" },
    imexType: { import: "Import", export: "Export" },
    disclaimer: "This information is for reference only and has no legal effect. For final confirmation, please refer to the original Korea Customs Service UNI-PASS data.",
  },
  cn: {
    siteName: "通关伙伴",
    titleSuffix: "HS编码查询 | 通关伙伴",
    breadcrumbHs: "HS编码",
    tariffHeading: "关税税率",
    tariffEmpty: "暂无关税税率信息。",
    reqHeading: "进口要件（海关确认对象）",
    reqEmpty: "暂无进口要件信息。请通过实时查询确认最新情况。",
    ctaTitle: "实时查询该编码",
    ctaBody: "在同一画面查看不合格·召回记录及最新法规修订。",
    ctaButton: "在通关伙伴实时查询 →",
    notFoundTitle: "未找到该HS编码",
    notFoundBody: "暂无该HS编码的相关信息。请直接在通关伙伴中查询。",
    home: "首页",
    rateType: { basic: "基本税率", wto: "WTO协定税率", fta: "FTA协定税率" },
    imexType: { import: "进口", export: "出口" },
    disclaimer: "本信息仅供参考，不具有法律效力。最终确认请以韩国关税厅UNI-PASS原文为准。",
  },
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtHS = (hs) =>
  hs && hs.length >= 6 ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}` : hs;

function nameFor(row, lang) {
  if (lang === "ko") return row.name_ko;
  // hs_codes에는 name_cn 컬럼이 없다 — cn 요청도 name_en, 그마저 없으면 name_ko로 폴백
  // (web/src/lib/i18n.jsx의 pick() 폴백 컨벤션과 동일한 원칙).
  return row.name_en || row.name_ko;
}

function baseStyle() {
  return `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; color:#1a1a1a; background:#fff; line-height:1.6; }
    header { padding:16px 24px; border-bottom:1px solid rgba(26,26,26,.08); }
    header a { color:#A4342A; font-weight:700; text-decoration:none; font-size:15px; }
    main { max-width:720px; margin:0 auto; padding:32px 24px 64px; }
    .breadcrumb { font-size:13px; color:#8a8a8a; margin-bottom:8px; }
    h1 { font-size:26px; font-weight:800; letter-spacing:-.02em; margin:0 0 6px; }
    .hs-code { color:#A4342A; }
    .name { font-size:16px; color:#4a4a4a; margin:0 0 28px; }
    h2 { font-size:16px; font-weight:700; margin:32px 0 12px; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th, td { text-align:left; padding:9px 10px; border-bottom:1px solid rgba(26,26,26,.08); }
    th { color:#8a8a8a; font-weight:600; font-size:12.5px; }
    .empty { color:#8a8a8a; font-size:14px; }
    .req-item { padding:10px 0; border-bottom:1px solid rgba(26,26,26,.08); font-size:14px; }
    .req-item .law { font-weight:600; }
    .req-item .meta { color:#8a8a8a; font-size:12.5px; margin-top:2px; }
    .cta { margin-top:36px; padding:22px; border-radius:14px; background:#FAF4F2; border:1px solid rgba(164,52,42,.15); }
    .cta h2 { margin-top:0; }
    .cta p { font-size:14px; color:#4a4a4a; margin:0 0 16px; }
    .cta a { display:inline-flex; align-items:center; gap:8px; background:#A4342A; color:#fff; font-weight:600; font-size:15px; padding:13px 22px; border-radius:10px; text-decoration:none; }
    footer { max-width:720px; margin:0 auto; padding:0 24px 40px; font-size:12px; color:#a0a0a0; }
  `;
}

function renderHead({ lang, code, title, description, noindex }) {
  const linkTags = code
    ? [
        `<link rel="canonical" href="${SITE}/${lang}/hs/${code}" />`,
        ...LANGS.map(
          (l) => `<link rel="alternate" hreflang="${l === "cn" ? "zh" : l}" href="${SITE}/${l}/hs/${code}" />`
        ),
      ].join("\n  ")
    : "";
  return `<!doctype html>
<html lang="${lang === "cn" ? "zh" : lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  ${noindex ? '<meta name="robots" content="noindex" />' : ""}
  ${linkTags}
  <style>${baseStyle()}</style>
</head>`;
}

function renderNotFound(lang, code = "") {
  const t = L[lang];
  return `${renderHead({ lang, code, title: `${t.notFoundTitle} | ${t.siteName}`, description: t.notFoundBody, noindex: true })}
<body>
  <header><a href="/${lang}">${esc(t.siteName)}</a></header>
  <main>
    <h1>${esc(t.notFoundTitle)}</h1>
    <p class="name">${esc(t.notFoundBody)}</p>
    <div class="cta"><a href="/${lang}">${esc(t.ctaButton)}</a></div>
  </main>
</body>
</html>`;
}

function renderPage({ lang, code, hsRow, tariffRows, reqRows }) {
  const t = L[lang];
  const name = nameFor(hsRow, lang);
  const chapterName = findChapterName(hsRow.chapter, lang) || "";
  const title = `${fmtHS(code)} — ${name || code} | ${t.titleSuffix}`;
  const description = name
    ? `${fmtHS(code)} (${name})${t.tariffHeading}·${t.reqHeading} — ${t.siteName}`
    : `${fmtHS(code)} — ${t.titleSuffix}`;

  const tariffTable = tariffRows.length
    ? `<table>
        <thead><tr><th>${esc(t.tariffHeading)}</th><th>%</th><th></th></tr></thead>
        <tbody>${tariffRows
          .map(
            (r) =>
              `<tr><td>${esc(t.rateType[r.rate_type] ?? r.rate_type)}${r.country_scope ? ` (${esc(r.country_scope)})` : ""}</td><td>${r.rate_percent != null ? esc(r.rate_percent) + "%" : "—"}</td><td>${r.unit_amount ? esc(r.unit_amount) : ""}</td></tr>`
          )
          .join("")}</tbody>
      </table>`
    : `<p class="empty">${esc(t.tariffEmpty)}</p>`;

  const reqList = reqRows.length
    ? reqRows
        .map(
          (r) =>
            `<div class="req-item"><div class="law">${esc(r.law_name ?? "—")}</div><div class="meta">${esc(r.agency_name ?? "")}${r.imex_type ? " · " + esc(t.imexType[r.imex_type] ?? r.imex_type) : ""}${r.effective_from ? " · " + esc(r.effective_from) : ""}</div></div>`
        )
        .join("")
    : `<p class="empty">${esc(t.reqEmpty)}</p>`;

  return `${renderHead({ lang, code, title, description })}
<body>
  <header><a href="/${lang}">${esc(t.siteName)}</a></header>
  <main>
    <div class="breadcrumb">${esc(t.breadcrumbHs)}${chapterName ? " · " + esc(chapterName) : ""}</div>
    <h1><span class="hs-code">${esc(fmtHS(code))}</span></h1>
    ${name ? `<p class="name">${esc(name)}</p>` : ""}

    <h2>${esc(t.tariffHeading)}</h2>
    ${tariffTable}

    <h2>${esc(t.reqHeading)}</h2>
    ${reqList}

    <div class="cta">
      <h2>${esc(t.ctaTitle)}</h2>
      <p>${esc(t.ctaBody)}</p>
      <a href="/${lang}?q=${encodeURIComponent(code)}">${esc(t.ctaButton)}</a>
    </div>
  </main>
  <footer>${esc(t.disclaimer)}</footer>
</body>
</html>`;
}

export default async function handler(req, res) {
  const rawLang = String(req.query.lang || "ko");
  const lang = LANGS.includes(rawLang) ? rawLang : "ko";
  const code = String(req.query.code || "").replace(/\D/g, "");

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (code.length < 4) {
    res.status(404).send(renderNotFound(lang));
    return;
  }

  try {
    const [{ data: hsRow }, { data: tariffRows }, { data: reqRows }] = await Promise.all([
      supabase
        .from("hs_codes")
        .select("hs_code,name_ko,name_en,chapter,heading")
        .eq("country_code", "KR")
        .eq("hs_code", code)
        .maybeSingle(),
      supabase
        .from("tariff_rates")
        .select("rate_type,rate_percent,unit_amount,country_scope,effective_from,effective_to")
        .eq("hs_code", code),
      supabase
        .from("import_requirements")
        .select("law_name,agency_name,imex_type,effective_from")
        .eq("country_code", "KR")
        .eq("hs_code", code)
        .order("synced_at", { ascending: false })
        .limit(20),
    ]);

    if (!hsRow) {
      res.status(404).send(renderNotFound(lang, code));
      return;
    }

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(renderPage({ lang, code, hsRow, tariffRows: tariffRows ?? [], reqRows: reqRows ?? [] }));
  } catch (err) {
    console.error("hs-page error", err);
    res.status(500).send(renderNotFound(lang, code));
  }
}
