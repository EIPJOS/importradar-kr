// 식품공전(식약처) 식품유형 분류 -> food_types
//
// 원래는 식약처 Open API "품목유형코드"(서비스ID: I2510)가 이 데이터를 공식 정의문까지
// 포함해서 제공하지만, 이 API는 foodsafetykorea.go.kr 회원가입 후 발급받는 인증키가
// 필요하고(자동화 스크립트가 대신 가입할 수 없음), 게다가 지금('26.7.7~) Open API가
// 제한적 운영 공지 중이라 당장 연동이 불가능하다.
//
// 그래서 KC 인증 데이터와 같은 방식으로, 공개된 분류 체계(대분류>소분류 명칭)만
// 브라우저로 수집한 스냅샷을 쓴다. 정의문은 없고 카테고리 매칭만 가능.
//
// 나중에 인증키를 발급받으면 이 잡을 I2510 API를 직접 호출하는 방식으로 바꾸고,
// DFN(정의) 컬럼을 food_types 테이블에 추가하면 된다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { upsertChunked } from "../lib/supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_FILE = join(__dirname, "../data/food_types_2026.json");

async function main() {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8"));

  const rows = snapshot.flatMap((group) =>
    group.subs.length > 0
      ? group.subs.map((sub) => ({ major_category: group.major, sub_type: sub }))
      : [{ major_category: group.major, sub_type: null }]
  );

  console.log(`parsed ${rows.length} food type rows from ${SNAPSHOT_FILE}`);
  await upsertChunked("food_types", rows, "major_category,sub_type");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
