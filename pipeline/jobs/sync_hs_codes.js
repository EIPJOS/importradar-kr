// 관세청_HS부호 전체 목록 -> hs_codes (name_ko, name_en 최초로 실제 채움)
// 이 데이터는 REST API가 아니라 연 1회 갱신되는 XLSX 파일로 제공된다(data.go.kr 15049722).
// 인증키 없이 GET으로 바로 다운로드 가능한 공개 엔드포인트를 사용한다.
//
// ⚠️ 매년 1월에 새 연도판이 새 atchFileId로 등록되므로, 아래 URL은 매년 1회 수동으로
//    최신 연도 링크로 교체해야 한다. data.go.kr에서 "관세청_HS부호_{연도}0101" 검색 →
//    다운로드 버튼 클릭 시 네트워크 요청에서 cmm/cmm/fileDownload.do?atchFileId=... 확인.
//    (주의: 페이지의 selectFileDataDownload.do 요청은 메타데이터만 반환함 — 실제 파일 아님)
import * as XLSX from "xlsx";
import { upsertChunked } from "../lib/supabase.js";

const XLSX_URL =
  "https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003576119&fileDetailSn=1&dataNm=" +
  encodeURIComponent("관세청_HS부호_20260101");

const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v != null && v !== "") ?? null;

async function main() {
  const res = await fetch(XLSX_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading HS code XLSX`);
  const buf = await res.arrayBuffer();

  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  console.log(`parsed ${rows.length} rows from sheet "${wb.SheetNames[0]}"`);
  if (rows[0]) console.log("DEBUG first row:", JSON.stringify(rows[0]));

  // 컬럼명 확인 완료: HS부호 / 한글품목명 / 영문품목명 (브라우저에서 실제 파일 파싱해 검증함)
  const hsRows = rows
    .map((r) => ({
      country_code: "KR",
      hs_code: String(pick(r, "HS부호") ?? "").replace(/\D/g, ""),
      name_ko: pick(r, "한글품목명"),
      name_en: pick(r, "영문품목명"),
    }))
    .filter((r) => r.hs_code.length >= 6);

  console.log(`valid HS code rows: ${hsRows.length}`);
  await upsertChunked("hs_codes", hsRows, "country_code,hs_code");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
