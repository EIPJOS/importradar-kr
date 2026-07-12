// ê´€ì„¸ì²­_ì„¸ê´€ìž¥í™•ì¸ëŒ€ìƒë¬¼í’ˆ(GW) â†’ import_requirements
//
// âš ï¸ GW ê³„ì—´ APIëŠ” ìš”ì²­ì£¼ì†Œ(ì˜¤í¼ë ˆì´ì…˜ ê²½ë¡œ)ê°€ data.go.kr í™œìš©ì‹ ì²­ ìŠ¹ì¸ í›„
//    ìƒì„¸íŽ˜ì´ì§€ì˜ Swagger(í™œìš© ëª…ì„¸)ì—ì„œë§Œ í™•ì¸ ê°€ëŠ¥í•˜ë‹¤.
//    ìŠ¹ì¸ í›„ í™•ì¸í•œ ì „ì²´ URLì„ CUSTOMS_REQ_ENDPOINT ì— ë„£ì„ ê²ƒ.
//    ì˜ˆìƒ í˜•íƒœ: https://apis.data.go.kr/1220000/<serviceName>/<operationName>
//    ì‘ë‹µ í¬ë§·: XML (ë°ì´í„°í¬ë§· ëª…ì„¸ ê¸°ì¤€)
//
// ìš”ì²­ë³€ìˆ˜(ëª…ì„¸ ê¸°ì¤€): í’ˆëª©ì½”ë“œ(HS), ìˆ˜ì¶œìž…êµ¬ë¶„ì½”ë“œ
// ì‘ë‹µí•„ë“œ(ëª…ì„¸ ê¸°ì¤€): HSë¶€í˜¸, ì‹ ê³ ì¸í™•ì¸ë²•ë ¹ì½”ë“œ/ëª…, ìš”ê±´ìŠ¹ì¸ê¸°ê´€ì½”ë“œ/ëª…, ì ìš©ì‹œìž‘ì¼ìž
import { fetchAllPages } from "../lib/datagovkr.js";
import { upsertChunked, db } from "../lib/supabase.js";

const ENDPOINT = process.env.CUSTOMS_REQ_ENDPOINT;
if (!ENDPOINT) {
  console.error("CUSTOMS_REQ_ENDPOINT ë¯¸ì„¤ì • â€” í™œìš©ì‹ ì²­ ìŠ¹ì¸ í›„ Swaggerì—ì„œ ìš”ì²­ì£¼ì†Œ í™•ì¸í•´ secretsì— ì¶”ê°€");
  process.exit(1);
}

// í•„ë“œëª…ì€ ìŠ¹ì¸ í›„ ì‹¤ì œ ì‘ë‹µ ê¸°ì¤€ìœ¼ë¡œ í™•ì •í•  ê²ƒ. ì•„ëž˜ëŠ” ê´€ëŒ€í•œ ë§¤í•‘.
const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v != null) ?? null;

function normalize(item, imexType) {
  return {
    country_code: "KR",
    hs_code: String(pick(item, "hsSgn", "hs", "hsCode", "prnm") ?? "").replaceAll(".", ""),
    imex_type: imexType,
    law_code: pick(item, "dclrLworCd", "lworCd", "lawCd"),
    law_name: pick(item, "dclrLworNm", "lworNm", "lawNm"),
    agency_code: pick(item, "reqApreIttCd", "aprIttCd"),
    agency_name: pick(item, "reqApreIttNm", "aprIttNm"),
    effective_from: toDate(pick(item, "aplyStrtDt", "aplyBgnDt")),
    effective_to: toDate(pick(item, "aplyEndDt")),
    raw: item,
  };
}

const toDate = (s) => {
  if (!s) return null;
  const t = String(s).replaceAll("-", "");
  return t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6)}` : null;
};

async function main() {
  const rows = [];
  for (const [param, type] of [["I", "import"], ["E", "export"]]) {
    // ìˆ˜ì¶œìž…êµ¬ë¶„ì½”ë“œ íŒŒë¼ë¯¸í„°ëª…ë„ ëª…ì„¸ í™•ì¸ í›„ í™•ì • (imexTp ê°€ì •)
    const items = await fetchAllPages(ENDPOINT, { imexTp: param });
    rows.push(...items.map((it) => normalize(it, type)).filter((r) => r.hs_code));
  }
  await upsertChunked("import_requirements", rows, "country_code,hs_code,imex_type,law_code,agency_code,effective_from");

  // hs_codes ë§ˆìŠ¤í„°ì—ë„ ì½”ë“œ ì¶•ì 
  const codes = [...new Set(rows.map((r) => r.hs_code))].map((hs_code) => ({ hs_code, country_code: "KR" }));
  await upsertChunked("hs_codes", codes, "country_code,hs_code");
}

main().catch((e) => { console.error(e); process.exit(1); });
