// 식품공전(식약처) 식품유형 분류 -> food_types
//
// 식약처가 배포하는 공식 "식품유형 분류표" PDF(mfds.go.kr 자료실, 식품공전 부속자료)를
// 직접 확보해서 대분류>중분류>식품유형 3단계 구조 그대로 옮겨 담았다. 정의문(DFN)까지
// 원하면 식약처 Open API "품목유형코드"(서비스ID: I2510)를 신청해야 하는데, 이 API는
// foodsafetykorea.go.kr 회원가입 후 발급받는 인증키가 필요하고(자동화 스크립트가 대신
// 가입할 수 없음) 지금('26.7.7~) 제한적 운영 공지 중이라 당장은 연동이 불가능하다.
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
    group.subs.map((sub) => ({
      major_category: group.major,
      mid_category: group.mid,
      sub_type: sub,
    }))
  );

  console.log(`parsed ${rows.length} food type rows from ${SNAPSHOT_FILE}`);
  await upsertChunked("food_types", rows, "major_category,mid_category,sub_type");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
