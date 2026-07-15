// 정밀검사 대상 품목 분류 -> inspection_costs (식품유형/기구용기 재질별 검사대상 안내용)
//
// 이전에는 경쟁사(포켓커스텀) 화면의 계산된 예상비용(KRW)까지 함께 수집했었는데,
// 확인해보니 정밀검사 수수료는 법정 고시가 아니라 개별 지정시험검사기관이 각자
// 산정하는 값이라(식약처 "검사수수료정보" 페이지 참고) 애초에 "공식 재계산"이
// 불가능하고, 경쟁사 산출값을 그대로 복제하는 것은 데이터베이스제작자의 권리
// 침해 소지가 있었다. 그래서 비용 수치는 전부 제거했다.
//
// 남긴 major/mid/item 분류명은 식품공전(식품유형) 및 기구 및 용기·포장의 기준 및
// 규격(재질 분류, PE/PP/PET 등 국제 표준 약어)이라는 공식 고시에 근거한 명칭이라
// 저작권 문제가 없다. 이 표는 "이 식품유형/재질은 정밀검사 대상"이라는 안내용으로만
// 쓰고, 실제 비용은 UI에서 일반적인 시장 범위 + 지정시험검사기관 안내로 대체한다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { upsertChunked } from "../lib/supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_FILE = join(__dirname, "../data/inspection_items_2026.json");

async function main() {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8"));

  const rows = snapshot.map((row) => ({
    category: row.category,
    major_category: row.major,
    mid_category: row.mid,
    item_name: row.item,
  }));

  console.log(`parsed ${rows.length} inspection item rows from ${SNAPSHOT_FILE}`);
  await upsertChunked("inspection_costs", rows, "category,major_category,mid_category,item_name");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
