// 관세청_품목번호별 관세율표 -> tariff_rates (기본세율/WTO협정세율/FTA국가별세율)
// 이 데이터도 sync_hs_codes.js와 마찬가지로 REST API가 아니라 연 1회 갱신되는 XLSX 파일로만
// 제공된다(data.go.kr 15051179). 인증키 없이 GET으로 바로 다운로드 가능하다.
//
// ⚠️ www.data.go.kr(포털)은 해외/클라우드 IP를 차단하므로 한국 IP 환경(로컬 PC 등)에서만 동작한다.
// ⚠️ 매년 1월에 새 연도판이 새 atchFileId로 등록되므로, 아래 URL은 매년 1회 수동으로 교체해야 한다.
//
// 원본 파일에는 관세율구분(rate_type)이 224종(FTA 협정별 세부 코드 포함)이나 있지만,
// 계산기 UI가 실제로 쓰는 것만 골라서 적재한다 — 나머지는 필요해지면 RATE_TYPES에 추가.
import * as XLSX from "xlsx";
import { upsertChunked } from "../lib/supabase.js";

const XLSX_URL =
  "https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003613916&fileDetailSn=1&dataNm=" +
  encodeURIComponent("관세청_품목번호별 관세율표_20260211");

// A=기본세율, C=WTO협정세율(양허관세), FCN1=한중FTA, FUS1=한미FTA, FEU1=한EU FTA,
// FVN1=한베트남FTA, FAS1=한아세안FTA, FRCJP1=RCEP 한일
const RATE_TYPES = new Set(["A", "C", "FCN1", "FUS1", "FEU1", "FVN1", "FAS1", "FRCJP1"]);

function toDate(s) {
  const t = String(s ?? "").replace(/\D/g, "");
  return t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6)}` : null;
}

async function main() {
  const res = await fetch(XLSX_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading tariff rate XLSX`);
  const buf = await res.arrayBuffer();

  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  console.log(`parsed ${rows.length} rows from sheet "${wb.SheetNames[0]}"`);
  if (rows[0]) console.log("DEBUG first row:", JSON.stringify(rows[0]));

  // 컬럼명 확인 완료: 품목번호/관세율구분/관세율/단위당세액/기준가격/적용국가구분/용도세율구분/적용개시일/적용만료일
  const today = new Date().toISOString().slice(0, 10);
  const tariffRows = rows
    .filter((r) => RATE_TYPES.has(r["관세율구분"]))
    .map((r) => ({
      hs_code: String(r["품목번호"] ?? "").replace(/\D/g, ""),
      rate_type: r["관세율구분"],
      rate_percent: r["관세율"] != null && r["관세율"] !== "" ? Number(r["관세율"]) : null,
      unit_amount: r["단위당세액"] != null && r["단위당세액"] !== "" ? Number(r["단위당세액"]) : null,
      reference_price: r["기준가격"] != null && r["기준가격"] !== "" ? Number(r["기준가격"]) : null,
      country_scope: r["적용국가구분"] != null ? String(r["적용국가구분"]) : null,
      usage_type: r["용도세율구분"] ?? null,
      effective_from: toDate(r["적용개시일"]),
      effective_to: toDate(r["적용만료일"]),
      raw: r,
    }))
    .filter((r) => r.hs_code.length >= 6 && r.effective_from && (!r.effective_to || r.effective_to >= today));

  console.log(`valid current tariff rows (whitelisted rate_types): ${tariffRows.length}`);
  await upsertChunked("tariff_rates", tariffRows, "hs_code,rate_type,effective_from");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
