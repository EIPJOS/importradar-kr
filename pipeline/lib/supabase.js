import { createClient } from "@supabase/supabase-js";

export const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Actions에서만 사용, 프론트에 노출 금지
  { auth: { persistSession: false } }
);

// 대량 upsert (1000행 단위 청크)
// onConflict 컬럼 기준으로 배치 내 중복 키를 먼저 제거한다 - Postgres는 한 INSERT 문에서
// 같은 충돌 대상 행을 두 번 건드리는 걸 허용하지 않으므로(같은 키 레코드가 원천에 중복
// 존재하는 경우 필요), 같은 키는 마지막 값으로 덮어써 하나만 남긴다.
export async function upsertChunked(table, rows, onConflict) {
  const keyCols = onConflict.split(",");
  const dedupMap = new Map();
  for (const row of rows) {
    const key = keyCols.map((c) => String(row[c] ?? "")).join("\u0001");
    dedupMap.set(key, row); // 나중 값이 이전 값을 덮어씀
  }
  const deduped = [...dedupMap.values()];

  for (let i = 0; i < deduped.length; i += 1000) {
    const chunk = deduped.slice(i, i + 1000);
    const { error } = await db.from(table).upsert(chunk, { onConflict, ignoreDuplicates: false });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  console.log(`[${table}] upserted ${deduped.length} rows (${rows.length - deduped.length} duplicate keys skipped)`);
}