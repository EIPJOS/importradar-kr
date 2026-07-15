import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/requirements-lookup`;

// 검색어가 HS코드처럼 보이면(숫자 4자리 이상) 세관장확인요건을 실시간 조회+캐시하는
// Edge Function을 호출한다. 실패해도 검색 자체는 계속 진행(요건 데이터만 비어있게 됨).
async function fetchLiveRequirements(q) {
  const digits = q.replace(/\D/g, "");
  if (digits.length < 4) return null;
  try {
    const res = await fetch(`${FUNCTIONS_URL}?hsSgn=${digits}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // 네트워크 문제 등은 무시 — RPC 결과(캐시)만으로 계속 진행
  }
}

// RPC(캐시 기반 통합검색)와 Edge Function(실시간 요건 조회)을 동시에 실행해
// 전체 대기시간을 "둘 중 오래 걸리는 쪽" 하나로 줄인다(직렬 대기 대비 최대 절반).
export async function searchUnified(q) {
  const query = q.trim();
  const [rpcRes, live] = await Promise.all([
    supabase.rpc("search_unified", { q: query, cc: "KR" }),
    fetchLiveRequirements(query),
  ]);
  const { data, error } = rpcRes;
  if (error) throw error;

  // 실시간 조회 결과가 있으면 더 최신이므로 requirements를 교체
  if (live?.requirements?.length) {
    data.requirements = live.requirements;
  }
  data.requirementsSource = live?.source ?? null; // "live" | "cache" | null — UI에서 조회 도장 표시용
  return data;
}

// 자주 조회되는 품목 (기본 목록) — 해외직구/개인통관 관련 FAQ·관세청 상담사례에서
// 실제로 자주 언급되는 카테고리를 조사해서, 우리 DB에 실존하는 코드만 골랐다(임의 생성 아님).
const POPULAR_HS_CODES = [
  "8517130000", "8471300000", "3303001000", "3307904000", "6307904020",
  "2101111000", "1806201000", "0902200000", "0902400000", "0813500000",
  "9503003300", "9503001", "8715000000", "9619001010", "6109101000",
  "6202301000", "6404110000", "6403400000", "9004901000", "9005100000",
  "2203000000", "2204291000", "2204292000", "2204100000", "2208301000",
  "2208302000", "2309101000", "2309102000", "3004501000", "3004503000",
  "3003903000", "2404121000", "7104210000", "4203109010", "6912001010",
];

// HS코드 분류표 탐색: 숫자면 코드 앞자리 일치, 아니면 한글/영문 품목명 부분일치.
// 검색어가 비어 있으면(초기 화면) 자주 조회되는 품목을 보여준다 — DB 순서(0101부터 시작하는
// 축산물류) 그대로 노출하면 실사용자가 궁금해할 만한 품목과 무관해서 체감 유용성이 떨어진다.
export async function browseHsCodes(q) {
  const query = q.trim();

  if (!query) {
    const { data, error } = await supabase
      .from("hs_codes")
      .select("hs_code,name_ko,name_en")
      .in("hs_code", POPULAR_HS_CODES);
    if (error) throw error;
    const order = new Map(POPULAR_HS_CODES.map((c, i) => [c, i]));
    return (data ?? []).sort((a, b) => (order.get(a.hs_code) ?? 999) - (order.get(b.hs_code) ?? 999));
  }

  let builder = supabase.from("hs_codes").select("hs_code,name_ko,name_en").eq("country_code", "KR");
  const digits = query.replace(/\D/g, "");
  if (digits && digits === query) {
    builder = builder.like("hs_code", `${digits}%`);
  } else {
    builder = builder.or(`name_ko.ilike.%${query}%,name_en.ilike.%${query}%`);
  }

  const { data, error } = await builder.order("hs_code", { ascending: true }).limit(60);
  if (error) throw error;
  return data ?? [];
}

// HS코드의 관세율 후보 전체(기본세율/WTO협정세율/FTA국가별세율)를 가져온다.
// 관세청_품목번호별 관세율표(data.go.kr 15051179, 연 1회 갱신 XLSX)를
// pipeline/jobs/sync_tariff_rates.js로 적재한 tariff_rates 테이블에서 조회.
// KC 인증대상 품목 카테고리 검색 (제품안전정보센터 SafetyKorea 스냅샷,
// pipeline/jobs/sync_kc_categories.js로 적재한 kc_certification_items 테이블에서 조회).
// category_path는 "대분류>중분류>소분류" 형태라, 마지막 소분류가 검색어와 정확히 일치하는
// 행을 우선순위로 올린다(품목명 자체가 정확히 맞는 게 상위 카테고리 부분일치보다 유용함).
export async function searchKcItems(query) {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("kc_certification_items")
    .select("total_code,cert_type_code,cert_type_name,category_path")
    .ilike("category_path", `%${q}%`)
    .limit(50);
  if (error) throw error;
  const rows = data ?? [];
  const exact = (r) => r.category_path.split(">").pop() === q;
  return rows.sort((a, b) => Number(exact(b)) - Number(exact(a)));
}

// 식품유형 분류 검색 (식약처 식품공전 분류체계 스냅샷, pipeline/jobs/sync_food_types.js로
// 적재한 food_types 테이블에서 조회). 대분류 또는 소분류명 부분일치로 검색하고,
// 소분류가 정확히 일치하는 행을 우선순위로 올린다.
export async function searchFoodTypes(query) {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("food_types")
    .select("id,major_category,sub_type")
    .or(`sub_type.ilike.%${q}%,major_category.ilike.%${q}%`)
    .limit(50);
  if (error) throw error;
  const rows = data ?? [];
  const exact = (r) => (r.sub_type ?? r.major_category) === q;
  return rows.sort((a, b) => Number(exact(b)) - Number(exact(a)));
}

// 대분류별로 그룹핑된 전체 식품유형 목록 (직접 선택 UI용)
export async function browseFoodTypes() {
  const { data, error } = await supabase
    .from("food_types")
    .select("id,major_category,sub_type")
    .order("major_category", { ascending: true })
    .order("sub_type", { ascending: true, nullsFirst: true });
  if (error) throw error;
  const groups = new Map();
  for (const row of data ?? []) {
    if (!groups.has(row.major_category)) groups.set(row.major_category, []);
    groups.get(row.major_category).push(row);
  }
  return [...groups.entries()].map(([major, items]) => ({ major, items }));
}

export async function getTariffRates(hsCode) {
  const hs = hsCode.replace(/\D/g, "");
  const { data, error } = await supabase
    .from("tariff_rates")
    .select("rate_type,rate_percent,unit_amount,country_scope,effective_from,effective_to")
    .eq("hs_code", hs);
  if (error) throw error;
  return data ?? [];
}
