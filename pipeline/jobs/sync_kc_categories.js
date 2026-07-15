// SafetyKorea(제품안전정보센터) KC 인증대상 품목 카테고리 -> kc_certification_items
//
// ⚠️ 이 데이터는 다른 sync 잡들과 달리 서버에서 자동으로 재수집할 수 없다.
// safetykorea.kr의 WAF가 서버측 스크립트 호출(Node fetch, curl 등)은 전부 차단하고
// 페이지 안에서 실행되는 jQuery의 XHR 호출만 통과시킨다(둘 다 같은 URL·같은 헤더로
// 시도해도 fetch만 "경로를 확인 하시기 바랍니다" 에러로 막힘 — 브라우저 지문 기반 차단으로 추정).
//
// 따라서 재수집 절차는 수동이다:
//   1. 브라우저로 https://www.safetykorea.kr/release/itemSearch 접속
//   2. 개발자도구 콘솔에서 아래 스니펫 실행 (인증유형 코드 1,2,4,5,7,8 전체 순회):
//        const types = [1,2,4,5,7,8];
//        Promise.all(types.map(code => new Promise(resolve => {
//          $.ajax({ url: "/release/ajax/itemSearch", data: { itemSearch: code },
//            method: "post", dataType: "json",
//            success: (r) => resolve({code, name: ..., list: r.list}) });
//        }))).then(all => copy(JSON.stringify(all))); // 결과를 클립보드로 복사
//   3. 결과를 pipeline/data/kc_categories_YYYY.json으로 저장
//   4. 아래 SNAPSHOT_FILE 경로를 갱신하고 이 스크립트 실행
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { upsertChunked } from "../lib/supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_FILE = join(__dirname, "../data/kc_categories_2026.json");

const CERT_TYPE_NAMES = {
  1: "전기용품 안전인증",
  2: "전기용품 안전확인",
  4: "생활용품 안전인증",
  5: "생활용품 안전확인",
  7: "어린이제품 안전인증",
  8: "어린이제품 안전확인",
};

async function main() {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8"));

  const rows = snapshot.flatMap((group) =>
    group.list.map((item) => ({
      total_code: item.totalCode,
      cert_type_code: group.code,
      cert_type_name: CERT_TYPE_NAMES[group.code] ?? group.name,
      category_path: item.fullName,
    }))
  );

  console.log(`parsed ${rows.length} KC category rows from ${SNAPSHOT_FILE}`);
  await upsertChunked("kc_certification_items", rows, "total_code");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
