// 원산지 → 적용 관세율 선택 로직. DutyCalculator와 QuickClassify(통합 결과)에서 함께 쓴다.
// 원산지 선택 -> FTA 협정세율구분 코드 매핑 (관세청_품목번호별 관세율표 rate_type)
// FCN1=한중FTA, FUS1=한미FTA, FEU1=한EU FTA, FVN1=한베트남FTA, FAS1=한아세안FTA, FRCJP1=RCEP 한일
export const ORIGIN_RATE_TYPE = {
  중국: "FCN1",
  미국: "FUS1",
  일본: "FRCJP1",
  EU: "FEU1",
  베트남: "FVN1",
  아세안: "FAS1",
  기타: null,
};
export const ORIGINS = Object.keys(ORIGIN_RATE_TYPE);

// rates: getTariffRates()가 반환하는 행 배열. origin: ORIGINS 중 하나.
// 실제 적용세율: FTA 원산지증명이 있다는 전제로 협정세율을 우선하되,
// WTO/기본세율보다 협정세율이 오히려 높으면(드물게 존재) 더 낮은 쪽을 채택한다.
export function selectApplicableRate(rates, origin) {
  const ftaType = ORIGIN_RATE_TYPE[origin];
  const ftaRow = ftaType ? rates.find((r) => r.rate_type === ftaType) : null;
  const basicRow = rates.find((r) => r.rate_type === "A");
  const wtoRow = rates.find((r) => r.rate_type === "C");

  const candidates = [ftaRow, wtoRow, basicRow].filter((r) => r && r.rate_percent != null);
  if (candidates.length === 0) return null;
  const applied = candidates.reduce((min, r) => (r.rate_percent < min.rate_percent ? r : min));
  return {
    ...applied,
    source: applied === ftaRow ? `FTA(${origin})` : applied === wtoRow ? "WTO협정세율" : "기본세율",
  };
}
