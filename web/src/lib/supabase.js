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
