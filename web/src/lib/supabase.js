import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function searchUnified(q) {
  const { data, error } = await supabase.rpc("search_unified", { q: q.trim(), cc: "KR" });
  if (error) throw error;
  return data;
}
