import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/requirements-lookup`;

// 검색어가 HS코드처럼 보이면(숫자 4자리 이상) 세관장확인요건을 실시간 조회+캐시하는
// Edge Function을 먼저 호출한다. 실패해도 검색 자체는 계속 진행(요건 데이터만 비어있게 됨).
async function primeRequirementsCache(q) {
  const digits = q.replace(/\D/g, "");
  if (digits.length < 4) return;
  try {
    await fetch(`${FUNCTIONS_URL}?hsSgn=${digits}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    });
  } catch {
    // 네트워크 문제 등은 무시 - 이미 캐시된 데이터로 계속 진행
  }
}

export async function searchUnified(q) {
  const query = q.trim();
  await primeRequirementsCache(query);
  const { data, error } = await supabase.rpc("search_unified", { q: query, cc: "KR" });
  if (error) throw error;
  return data;
}