// 수입식품 정밀검사 예상비용 -> inspection_costs
//
// 공식 근거는 수입식품안전관리 특별법 시행규칙 별표의 "검사항목별 수수료" ×
// 식품유형/재질별 필요 검사항목 조합인데, 이를 한 번에 조회할 수 있는 공식 API가 없다
// (검사항목별 수수료표와 품목별 필요항목표를 따로 구해 직접 계산해야 함).
//
// 그래서 KC·식품유형 데이터와 마찬가지로, 경쟁사(포켓커스텀) 화면에 노출된 계산
// 결과값을 브라우저로 224건(가공식품 171 + 기구·용기등 53) 수집한 스냅샷을 쓴다.
// 참고용 추정치이며, 실제 비용은 검사기관마다 다를 수 있다는 점을 UI에 반드시 표기.
//
// 나중에 공식 수수료 고시 원문을 확보하면 이 스냅샷을 직접 계산 로직으로 교체할 것.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { upsertChunked } from "../lib/supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_FILE = join(__dirname, "../data/inspection_costs_2026.json");

async function main() {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8"));

  const rows = snapshot.map((row) => ({
    category: row.category,
    major_category: row.major,
    mid_category: row.mid,
    item_name: row.item,
    cost_krw: row.cost_krw,
  }));

  console.log(`parsed ${rows.length} inspection cost rows from ${SNAPSHOT_FILE}`);
  await upsertChunked("inspection_costs", rows, "category,major_category,mid_category,item_name");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
