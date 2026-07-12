// [사용 안 함] 관세청_세관장확인대상물품(GW) -> import_requirements
// 이 API는 HS코드 단건 조회 방식이라(전체 목록 조회 불가) 주간 배치에 맞지 않는다.
// 실제 연동은 Supabase Edge Function "requirements-lookup"으로 이전됨
// (검색 시점 실시간 조회 + import_requirements 캐싱). 이 파일은 참고용으로만 남겨둔다.
//
// 확정된 엔드포인트: https://apis.data.go.kr/1220000/retrieveCcctLworCd/getRetrieveCcctLworCd
// 요청변수: hsSgn(HS부호, 10자리), imexTpcd(수출:1, 수입:2)
import { fetchAllPages } from "../lib/datagovkr.js";
import { upsertChunked, db } from "../lib/supabase.js";

const ENDPOINT = process.env.CUSTOMS_REQ_ENDPOINT;
if (!ENDPOINT) {
  console.error("사용 중단됨 - Edge Function requirements-lookup 참고");
  process.exit(1);
}

const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v != null) ?? null;

const toDate = (s) => {
  if (!s) return null;
  const t = String(s).replaceAll("-", "");
  return t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6)}` : null;
};

function normalize(item, imexType) {
  return {
    country_code: "KR",
    hs_code: String(pick(item, "hsSgn") ?? "").replaceAll(".", ""),
    imex_type: imexType,
    law_code: pick(item, "dcerCfrmLworCd"),
    law_name: pick(item, "dcerCfrmLworNm"),
    agency_code: pick(item, "reqApreIttCd"),
    agency_name: pick(item, "reqApreIttNm"),
    effective_from: toDate(pick(item, "aplyStrtDt")),
    effective_to: null,
    raw: item,
  };
}

async function main() {
  const rows = [];
  for (const [param, type] of [["1", "export"], ["2", "import"]]) {
    const items = await fetchAllPages(ENDPOINT, { imexTpcd: param });
    rows.push(...items.map((it) => normalize(it, type)).filter((r) => r.hs_code));
  }
  await upsertChunked("import_requirements", rows, "country_code,hs_code,imex_type,law_code,agency_code,effective_from");

  const codes = [...new Set(rows.map((r) => r.hs_code))].map((hs_code) => ({ hs_code, country_code: "KR" }));
  await upsertChunked("hs_codes", codes, "country_code,hs_code");
}

main().catch((e) => { console.error(e); process.exit(1); });