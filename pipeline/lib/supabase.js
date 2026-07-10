import { createClient } from "@supabase/supabase-js";

export const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Actions에서만 사용, 프론트에 노출 금지
  { auth: { persistSession: false } }
);

// 대량 upsert (1000행 단위 청크)
export async function upsertChunked(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000);
    const { error } = await db.from(table).upsert(chunk, { onConflict, ignoreDuplicates: false });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  console.log(`[${table}] upserted ${rows.length} rows`);
}
