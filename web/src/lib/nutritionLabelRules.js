// 영양표시 대상 식품등 판정 로직 — 「식품 등의 표시ㆍ광고에 관한 법률 시행규칙」
// [별표 4] 영양표시 대상 식품등(제6조제1항 관련) 원문을 그대로 코드화한 것.
// (2024. 12. 30. 일부개정, 2026. 1. 1. 시행본 기준. law.go.kr에서 직접 확보한 1차 출처 —
// 경쟁사 데이터 아님.) food_types 테이블의 major_category/mid_category/sub_type을 받아
// 별표4 가목~더목에 해당하는지 규칙으로 매칭한다.
//
// 별표4 원문 요약:
//  1. 대상: 가.레토르트식품 나.과자류중 과자·캔디류, 빙과류중 빙과·아이스크림류
//     다.빵류·만두류 라.코코아가공품류·초콜릿류 마.잼류
//     바.식용유지류(동물성유지류, 식용유지가공품중 모조치즈·식물성크림·기타식용유지가공품 제외)
//     사.면류 아.음료류(다류, 커피중 볶은커피·인스턴트커피 제외) 자.특수용도식품
//     차.어육가공품류중 어육소시지 카.즉석섭취·편의식품류중 즉석섭취식품·즉석조리식품
//     타.장류(한식메주,한식된장,청국장,한식메주이용 한식간장 제외) 파.시리얼류
//     하.유가공품중 우유류·가공유류·발효유류·분유류·치즈류 거.식육가공품중 햄류·소시지류
//     너.건강기능식품(식품공전 체계 밖) 더.그 외 식품은 영업자가 스스로 표시 가능(임의)
//  2. 제외: 즉석판매제조·가공업 자가제조식품 / 식육즉석판매가공업 식육가공품 /
//     최종소비자에게 직접 제공되지 않는 원료용 / 주표시면 30㎠ 이하 포장

const MAJOR = {
  과자빵떡: "1. 과자류, 빵류 또는 떡류",
  빙과: "2. 빙과류",
  코코아초콜릿: "3. 코코아가공품류 또는 초콜릿류",
  잼: "5. 잼류",
  식용유지: "7. 식용유지류",
  면류: "8. 면류",
  음료: "9. 음료류",
  특수용도: "10. 특수용도식품",
  수산가공: "19. 수산가공식품류",
  유가공: "18. 유가공품",
  식육가공: "16. 식육가공품 및 포장육",
  즉석식품: "22. 즉석식품류",
  농산가공: "15. 농산가공식품류",
  장류: "11. 장류",
};

// 각 규칙: major(필수) + 선택적으로 mid/sub 화이트리스트 또는 제외 목록
const INCLUDE_RULES = [
  { article: "나목", major: MAJOR.과자빵떡, subIn: ["과자", "캔디류"] },
  { article: "나목", major: MAJOR.빙과, midIn: ["2-1. 아이스크림류", "2-3. 빙과"] },
  { article: "다목", major: MAJOR.과자빵떡, subIn: ["빵류"] },
  { article: "다목", major: MAJOR.즉석식품, midIn: ["22-3. 만두류"] },
  { article: "라목", major: MAJOR.코코아초콜릿 },
  { article: "마목", major: MAJOR.잼 },
  {
    article: "바목",
    major: MAJOR.식용유지,
    excludeMid: ["7-2. 동물성유지류"],
    excludeSub: ["모조치즈", "식물성크림", "기타 식용유지가공품"],
  },
  { article: "사목", major: MAJOR.면류 },
  { article: "아목", major: MAJOR.음료, excludeMid: ["9-1. 다류", "9-2. 커피"] },
  { article: "자목", major: MAJOR.특수용도 },
  { article: "차목", major: MAJOR.수산가공, midIn: ["19-1. 어육가공품류"], subIn: ["어육소시지"] },
  { article: "카목", major: MAJOR.즉석식품, midIn: ["22-2. 즉석섭취・편의식품류"], subIn: ["즉석섭취식품", "즉석조리식품"] },
  { article: "타목", major: MAJOR.장류, excludeSub: ["한식메주", "한식된장", "청국장", "한식간장"] },
  { article: "파목", major: MAJOR.농산가공, midIn: ["15-4. 시리얼류"] },
  {
    article: "하목",
    major: MAJOR.유가공,
    midIn: ["18-1. 우유류", "18-2. 가공유류", "18-4. 발효유류", "18-10. 분유류", "18-9. 치즈류"],
  },
  { article: "거목", major: MAJOR.식육가공, midIn: ["16-1. 햄류", "16-2. 소시지류"] },
];

function matches(rule, row) {
  if (rule.major !== row.major_category) return false;
  if (rule.midIn && !rule.midIn.includes(row.mid_category)) return false;
  if (rule.subIn && !rule.subIn.includes(row.sub_type)) return false;
  if (rule.excludeMid && rule.excludeMid.includes(row.mid_category)) return false;
  if (rule.excludeSub && rule.excludeSub.includes(row.sub_type)) return false;
  return true;
}

// row: { major_category, mid_category, sub_type } (food_types 테이블의 한 행)
export function checkNutritionLabelRequirement(row) {
  const hit = INCLUDE_RULES.find((rule) => matches(rule, row));
  if (hit) {
    return {
      required: true,
      article: `별표4 1. ${hit.article}`,
      note: null,
    };
  }
  return {
    required: false,
    article: "별표4 1. 더목",
    note: "별표4 가목~거목·너목에 해당하지 않아 영양표시 의무 대상은 아니지만, 영업자가 자율적으로 표시할 수 있습니다(더목).",
  };
}

// 제외 대상(별표4 2.) — 식품유형만으로는 판정 불가능해서 안내 문구로만 제공
export const EXEMPTION_NOTES = [
  "즉석판매제조·가공업 영업자가 직접 제조·가공하는 식품",
  "식육즉석판매가공업 영업자가 만들거나 다시 나누어 판매하는 식육가공품",
  "다른 식품·축산물의 원료로만 사용되어 최종 소비자에게 그 자체로 제공되지 않는 것",
  "포장·용기의 주표시면 면적이 30㎠ 이하인 식품 및 축산물",
];
