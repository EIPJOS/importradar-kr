// 관세청_세관장확인대상물품(GW) → import_requirements
//
// ⚠️ GW 계열 API는 요청주소(오퍼레이션 경로)가 data.go.kr 활용신청 승인 후
//    상세페이지의 Swagger(활용 명세)에서만 확인 가능하다.
//    승인 후 확인한 전체 URL을 CUSTOMS_REQ_ENDPOINT 에 넣을 것.
//    예상 형태: https://apis.data.go.kr/1220000/<serviceName>/<operationName>
//    응답 포맷: XML (데이터포맷 명세 기준)
//
// 요청변수(명세 기준): 품목코드(HS), 수출입구분코드
// 응답필드(명세 기준): HS부호, 신고인확인법령코드/명, 요건승인기관코드/명, 적용시작일자
import { fetchAllPages } from "../lib/datagovkr.js";
import { upsertChunked, db } from "../lib/supabase.js";

const ENDPOINT = process.env.CUSTOMS_REQ_ENDPOINT;
if (!ENDPOINT) {
  console.error("CUSTOMS_REQ_ENDPOINT 미설정 — 활용신청 승인 후 Swagger에서 요청주소 확인해 secrets에 추가");
  process.exit(1);
}

// 필드명은 승인 후 실제 응답 기준으로 확정할 것. 아래는 관대한 매핑.
const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v != null) ?? null;

function normalize(item, imexType) {
  return {
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
    // 수출입구분코드 파라미터명도 명세 확인 후 확정 (imexTp 가정)
    const items = await fetchAllPages(ENDPOINT, { imexTp: param });
    rows.push(...items.map((it) => normalize(it, type)).filter((r) => r.hs_code));
  }
  await upsertChunked("import_requirements", rows, "hs_code,imex_type,law_code,agency_code,effective_from");

  // hs_codes 마스터에도 코드 축적
  const codes = [...new Set(rows.map((r) => r.hs_code))].map((hs_code) => ({ hs_code }));
  await upsertChunked("hs_codes", codes, "hs_code");
}

main().catch((e) => { console.error(e); process.exit(1); });
