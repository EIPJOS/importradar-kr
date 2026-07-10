// 식약처_수입식품 회수판매중지 정보 → rejection_history (source='recall')
// Endpoint (확인됨, data.go.kr 15095378):
// http://apis.data.go.kr/1471000/IprtFoodReclSaleStopPrdtStusService/getIprtFoodReclSaleStopPrdtStusInq
import { fetchAllPages } from "../lib/datagovkr.js";
import { upsertChunked, db } from "../lib/supabase.js";
import { summarizeBatch } from "../lib/summarize.js";

const ENDPOINT =
  process.env.MFDS_RECALL_ENDPOINT ??
  "http://apis.data.go.kr/1471000/IprtFoodReclSaleStopPrdtStusService/getIprtFoodReclSaleStopPrdtStusInq";

const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v != null) ?? null;
const toDate = (s) => {
  if (!s) return null;
  const t = String(s).replaceAll("-", "").slice(0, 8);
  return t.length === 8 ? `${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6)}` : null;
};

function normalize(item) {
  const product = pick(item, "PRDT_NM", "prdtNm", "PRDLST_NM");
  const date = toDate(pick(item, "RECL_BGN_DT", "reclBgnDt", "CRET_DTM", "FRST_REG_DT"));
  const company = pick(item, "BSSH_NM", "bsshNm", "MUFC_NM");
  const reason = pick(item, "RECL_RSN_CN", "reclRsnCn", "RTRVL_RSN", "STOP_SALE_RSN");
  return {
    source: "recall",
    external_key: [product, company, date].filter(Boolean).join("|"),
    product_name: product,
    hs_code: null, // 원천에 HS 없음 — 2단계 품목명 매핑 대상
    origin_country: pick(item, "MNF_CNTY_NM", "MUFC_NTN_NM"),
    company_name: company,
    reason,
    recall_grade: pick(item, "RECL_GRAD_NM", "reclGradNm", "RTRVL_GRDCD_NM"),
    event_date: date,
    raw: item,
  };
}

async function main() {
  const items = await fetchAllPages(ENDPOINT, { type: "json" });
  console.log(`fetched ${items.length} recall records`);
  const rows = items.map(normalize).filter((r) => r.external_key);

  const { data: existing } = await db
    .from("rejection_history").select("external_key")
    .eq("source", "recall").not("reason_summary", "is", null);
  const done = new Set((existing ?? []).map((r) => r.external_key));
  const fresh = rows.filter((r) => !done.has(r.external_key) && r.reason);

  const summaries = await summarizeBatch(
    fresh.slice(0, 200).map((r) => `품목: ${r.product_name}\n회수사유: ${r.reason}`),
    "다음 수입식품 회수 사유를 관세사가 한눈에 파악할 수 있게 한국어 1문장으로 요약. 요약문만 출력."
  );
  fresh.slice(0, 200).forEach((r, i) => (r.reason_summary = summaries[i]));

  await upsertChunked("rejection_history", rows, "source,external_key");
}

main().catch((e) => { console.error(e); process.exit(1); });
