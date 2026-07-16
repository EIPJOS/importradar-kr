// 1일 영양성분 기준치 — 「식품 등의 표시ㆍ광고에 관한 법률 시행규칙」
// [별표 5] 1일 영양성분 기준치(제6조제2항 및 제3항 관련) 원문을 그대로 옮긴 것.
// (law.go.kr에서 직접 확보한 1차 출처, 2022. 11. 28. 개정본 기준.)
//
// 영유아(만 1~2세) 기준치는 비고 2.에 따라 탄수화물·당류·단백질·지방 4개 성분만 별도로
// 정해져 있고, 나머지 성분은 국민영양관리법 제14조제1항 영양소 섭취기준을 따르도록
// 되어 있어(이 앱에는 해당 데이터가 없음) 영유아 모드에서는 그 4개만 계산한다.

// key: 표시 라벨, unit, 성인 기준치. required=true면 "필수 영양성분 9종"에 포함.
export const NUTRIENTS = [
  { key: "탄수화물", unit: "g", adult: 324, infant: 150, required: true },
  { key: "당류", unit: "g", adult: 100, infant: 50, required: true },
  { key: "식이섬유", unit: "g", adult: 25, infant: null, required: false },
  { key: "단백질", unit: "g", adult: 55, infant: 35, required: true },
  { key: "지방", unit: "g", adult: 54, infant: 30, required: true },
  { key: "리놀레산", unit: "g", adult: 10, infant: null, required: false },
  { key: "알파-리놀렌산", unit: "g", adult: 1.3, infant: null, required: false },
  { key: "EPA와 DHA의 합", unit: "mg", adult: 330, infant: null, required: false },
  { key: "포화지방", unit: "g", adult: 15, infant: null, required: true },
  { key: "트랜스지방", unit: "g", adult: null, infant: null, required: true }, // 1일기준치 없음(표시만)
  { key: "콜레스테롤", unit: "mg", adult: 300, infant: null, required: true },
  { key: "비타민A", unit: "㎍ RAE", adult: 700, infant: null, required: false },
  { key: "비타민D", unit: "㎍", adult: 10, infant: null, required: false },
  { key: "비타민E", unit: "㎎α-TE", adult: 11, infant: null, required: false },
  { key: "비타민K", unit: "㎍", adult: 70, infant: null, required: false },
  { key: "비타민C", unit: "㎎", adult: 100, infant: null, required: false },
  { key: "비타민B1", unit: "㎎", adult: 1.2, infant: null, required: false },
  { key: "비타민B2", unit: "㎎", adult: 1.4, infant: null, required: false },
  { key: "나이아신", unit: "㎎ NE", adult: 15, infant: null, required: false },
  { key: "비타민B6", unit: "㎎", adult: 1.5, infant: null, required: false },
  { key: "엽산", unit: "㎍ DFE", adult: 400, infant: null, required: false },
  { key: "비타민B12", unit: "㎍", adult: 2.4, infant: null, required: false },
  { key: "판토텐산", unit: "㎎", adult: 5, infant: null, required: false },
  { key: "바이오틴", unit: "㎍", adult: 30, infant: null, required: false },
  { key: "칼슘", unit: "㎎", adult: 700, infant: null, required: false },
  { key: "인", unit: "㎎", adult: 700, infant: null, required: false },
  { key: "나트륨", unit: "㎎", adult: 2000, infant: null, required: true },
  { key: "칼륨", unit: "㎎", adult: 3500, infant: null, required: false },
  { key: "마그네슘", unit: "㎎", adult: 315, infant: null, required: false },
  { key: "철분", unit: "㎎", adult: 12, infant: null, required: false },
  { key: "아연", unit: "㎎", adult: 8.5, infant: null, required: false },
  { key: "구리", unit: "㎎", adult: 0.8, infant: null, required: false },
  { key: "망간", unit: "㎎", adult: 3.0, infant: null, required: false },
  { key: "요오드", unit: "㎍", adult: 150, infant: null, required: false },
  { key: "셀레늄", unit: "㎍", adult: 55, infant: null, required: false },
  { key: "몰리브덴", unit: "㎍", adult: 25, infant: null, required: false },
  { key: "크롬", unit: "㎍", adult: 30, infant: null, required: false },
];

export const REQUIRED_NUTRIENTS = NUTRIENTS.filter((n) => n.required);
export const OPTIONAL_NUTRIENTS = NUTRIENTS.filter((n) => !n.required);

// amount: 사용자가 입력한 함량(같은 단위), group: "adult" | "infant"
export function calcPercent(nutrient, amount, group) {
  const ref = group === "infant" ? nutrient.infant : nutrient.adult;
  if (ref == null || amount == null || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round((n / ref) * 100);
}
