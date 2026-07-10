// 식약처_수입식품 부적합 정보 → rejection_history (source='rejection')
// Endpoint (확인됨): https://apis.data.go.kr/1471000/PrsecImproptFoodInfoService03/getPrsecImproptFoodList01
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

  // 이미 요약된 키는 제외하고 신규분만 요약 (비용 절감)
  const { data: existing } = await db
    .from("rejection_history")
    .select("external_key")
    .eq("source", "rejection")
    .not("reason_summary", "is", null);
  const done = new Set((existing ?? []).map((r) => r.external_key));
  const fresh = rows.filter((r) => !done.has(r.external_key) && r.reason);

  const summaries = await summarizeBatch(
    fresh.slice(0, 200).map((r) => `품목: ${r.product_name}\n사유: ${r.reason}`),
    "다음 수입식품 통관 부적합 사유를 관세사가 한눈에 파악할 수 있게 한국어 1문장으로 요약. 요약문만 출력."
  );
  fresh.slice(0, 200).forEach((r, i) => (r.reason_summary = summaries[i]));

  await upsertChunked("rejection_history", rows, "source,external_key");
}

main().catch((e) => { console.error(e); process.exit(1); });
