// 법제처 국가법령정보 → regulation_updates
// 최근 공포 법령 검색 (open.law.go.kr, OC 필요)
// API: http://www.law.go.kr/DRF/lawSearch.do?OC={oc}&target=eflaw&type=JSON
//   ancYd(공포일자 범위 yyyymmdd~yyyymmdd), org(소관부처코드) 필터 지원
import { fetchRaw } from "../lib/datagovkr.js";
import { upsertChunked } from "../lib/supabase.js";
import { summarizeBatch } from "../lib/summarize.js";

const OC = process.env.LAW_GO_KR_OC;
if (!OC) { console.error("LAW_GO_KR_OC 미설정"); process.exit(1); }

// 수입요건과 직접 관련된 소관부처만 우선 수집 (MVP 범위 축소)
// 관세청(1220000), 식약처(1471000), 산업부(1450000), 환경부(1480000), 농식품부(1543000)
const MINISTRIES = ["1220000", "1471000", "1450000", "1480000", "1543000"];

const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const toDate = (s) => {
  if (!s) return null;
  const t = String(s).replaceAll("-", "");
  return t.length === 8 ? `${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6)}` : null;
};

async function main() {
  const since = new Date(Date.now() - 90 * 86400e3); // 최근 90일
  const range = `${ymd(since)}~${ymd(new Date())}`;
  const rows = [];

  for (const org of MINISTRIES) {
    for (let page = 1; page <= 20; page++) {
      const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=${OC}&target=eflaw&type=JSON&org=${org}&ancYd=${range}&display=100&page=${page}`;
      const body = await fetchRaw(url);
      const laws = body?.LawSearch?.law ?? [];
      const list = Array.isArray(laws) ? laws : [laws];
      if (list.length === 0 || !list[0]) break;
      for (const l of list) {
        rows.push({
          law_id: String(l.법령ID ?? l.lawId ?? ""),
          law_name: l.법령명한글 ?? l.lawNmKo ?? "",
          ministry: l.소관부처명 ?? null,
          amendment_type: l.제개정구분명 ?? null,
          promulgated_on: toDate(l.공포일자),
          effective_on: toDate(l.시행일자),
          detail_url: l.법령상세링크 ? `http://www.law.go.kr${l.법령상세링크}` : null,
          raw: l,
        });
      }
      const total = Number(body?.LawSearch?.totalCnt ?? 0);
      if (page * 100 >= total) break;
    }
  }

  const valid = rows.filter((r) => r.law_id && r.law_name);
  const summaries = await summarizeBatch(
    valid.slice(0, 100).map((r) => `${r.law_name} — ${r.amendment_type}, 시행 ${r.effective_on}`),
    "다음 법령 개정 정보가 수출입 실무에 갖는 의미를 한국어 1문장으로 요약. 요약문만 출력."
  );
  valid.slice(0, 100).forEach((r, i) => (r.summary = summaries[i]));

  await upsertChunked("regulation_updates", valid, "law_id,promulgated_on");
}

main().catch((e) => { console.error(e); process.exit(1); });
