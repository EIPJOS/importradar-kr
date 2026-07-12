// ì‹ì•½ì²˜_ìˆ˜ìž…ì‹í’ˆ ë¶€ì í•© ì •ë³´ â†’ rejection_history (source='rejection')
// Endpoint (í™•ì¸ë¨): https://apis.data.go.kr/1471000/PrsecImproptFoodInfoService03/getPrsecImproptFoodList01
import { fetchAllPages } from "../lib/datagovkr.js";
import { upsertChunked, db } from "../lib/supabase.js";
import { summarizeBatch } from "../lib/summarize.js";

const ENDPOINT =
  process.env.MFDS_REJECTION_ENDPOINT ??
  "https://apis.data.go.kr/1471000/PrsecImproptFoodInfoService03/getPrsecImproptFoodList01";

const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v != null) ?? null;
const toDate = (s) => {
  if (!s) return null;
  const t = String(s).replaceAll("-", "").slice(0, 8);
  return t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6)}` : null;
};

function normalize(item) {
  const product = pick(item, "PRDT_NM", "prdtNm", "PRDLST_NM", "itemName");
  const date = toDate(pick(item, "PROCS_DT", "procsDt", "INCGRTY_DT", "crtYmd"));
  const company = pick(item, "BSSH_NM", "bsshNm", "OVSMNFST_NM", "importer");
  const reason = pick(item, "INCGRTY_CN", "incgrtyCn", "UNSUIT_RSN", "rejectReason");
  return {
    country_code: "KR",
    source: "rejection",
    external_key: [product, company, date, reason?.slice(0, 40)].filter(Boolean).join("|"),
    product_name: product,
    hs_code: String(pick(item, "HS_NO", "hsNo", "HS_CD") ?? "").replaceAll(".", "") || null,
    origin_country: pick(item, "MNF_CNTY_NM", "XPORT_NTNNM", "originCountry"),
    company_name: company,
    reason,
    event_date: date,
    raw: item,
  };
}

async function main() {
  const items = await fetchAllPages(ENDPOINT, { type: "json" });
  console.log(`fetched ${items.length} rejection records`);
  const rows = items.map(normalize).filter((r) => r.external_key);

  // ì´ë¯¸ ìš”ì•½ëœ í‚¤ëŠ” ì œì™¸í•˜ê³  ì‹ ê·œë¶„ë§Œ ìš”ì•½ (ë¹„ìš© ì ˆê°)
  const { data: existing } = await db
    .from("rejection_history")
    .select("external_key")
    .eq("country_code", "KR")
    .eq("source", "rejection")
    .not("reason_summary", "is", null);
  const done = new Set((existing ?? []).map((r) => r.external_key));
  const fresh = rows.filter((r) => !done.has(r.external_key) && r.reason);

  const summaries = await summarizeBatch(
    fresh.slice(0, 200).map((r) => `í’ˆëª©: ${r.product_name}\nì‚¬ìœ : ${r.reason}`),
    "ë‹¤ìŒ ìˆ˜ìž…ì‹í’ˆ í†µê´€ ë¶€ì í•© ì‚¬ìœ ë¥¼ ê´€ì„¸ì‚¬ê°€ í•œëˆˆì— íŒŒì•…í•  ìˆ˜ ìžˆê²Œ í•œêµ­ì–´ 1ë¬¸ìž¥ìœ¼ë¡œ ìš”ì•½. ìš”ì•½ë¬¸ë§Œ ì¶œë ¥."
  );
  fresh.slice(0, 200).forEach((r, i) => (r.reason_summary = summaries[i]));

  await upsertChunked("rejection_history", rows, "country_code,source,external_key");
}

main().catch((e) => { console.error(e); process.exit(1); });
