// 관심 HS코드 알림 — 이번 주 새로 들어온 법령 개정(regulation_updates)을 확인된
// 구독(hs_alert_subscriptions, confirmed_at not null)과 매칭해 구독자별 다이제스트 메일을
// 보낸다. .github/workflows/sync.yml의 "weekly law updates"(sync:laws) 스텝 바로 다음에
// 실행되도록 이어붙인다 — 별도 cron 신설 없이 기존 주간 스케줄에 편승.
//
// 매칭 규칙: regulation_updates.law_name -> import_requirements.law_name으로 관련 HS코드
// 후보를 얻고, hs_alert_subscriptions.hs_code가 그 HS코드의 접두어면 매칭으로 본다
// (search_unified RPC의 "ir.hs_code like q||'%'"와 동일한 규칙).
import { db } from "../lib/supabase.js";

async function main() {
  const since = new Date(Date.now() - 8 * 86400e3).toISOString();
  const { data: regs, error: regErr } = await db
    .from("regulation_updates")
    .select("id,law_name,ministry,amendment_type,effective_on,summary,detail_url,synced_at")
    .eq("country_code", "KR")
    .gt("synced_at", since);
  if (regErr) throw regErr;
  if (!regs?.length) {
    console.log("[hs-alerts] 최근 신규 법령 개정 없음 — 종료");
    return;
  }

  const lawNames = [...new Set(regs.map((r) => r.law_name))];
  const { data: reqs, error: reqErr } = await db
    .from("import_requirements")
    .select("hs_code,law_name")
    .eq("country_code", "KR")
    .in("law_name", lawNames);
  if (reqErr) throw reqErr;

  const hsByLaw = new Map(); // law_name -> Set(hs_code)
  for (const r of reqs ?? []) {
    if (!hsByLaw.has(r.law_name)) hsByLaw.set(r.law_name, new Set());
    hsByLaw.get(r.law_name).add(r.hs_code);
  }

  const { data: subs, error: subErr } = await db
    .from("hs_alert_subscriptions")
    .select("email,hs_code,lang")
    .not("confirmed_at", "is", null);
  if (subErr) throw subErr;
  if (!subs?.length) {
    console.log("[hs-alerts] 확인된 구독 없음 — 종료");
    return;
  }

  // 구독자 이메일별로 매칭된 개정 항목을 모은다 (같은 개정 건이 여러 코드에 걸려도 1건만 담음)
  const digestByEmail = new Map(); // email -> { lang, items: [], seen: Set }
  for (const reg of regs) {
    const hsSet = hsByLaw.get(reg.law_name);
    if (!hsSet?.size) continue;
    for (const sub of subs) {
      const matched = [...hsSet].some((hs) => hs.startsWith(sub.hs_code));
      if (!matched) continue;
      if (!digestByEmail.has(sub.email)) digestByEmail.set(sub.email, { lang: sub.lang, items: [], seen: new Set() });
      const entry = digestByEmail.get(sub.email);
      if (entry.seen.has(reg.id)) continue;
      entry.seen.add(reg.id);
      entry.items.push({
        hs_code: sub.hs_code,
        law_name: reg.law_name,
        ministry: reg.ministry,
        amendment_type: reg.amendment_type,
        effective_on: reg.effective_on,
        summary: reg.summary,
        detail_url: reg.detail_url,
      });
    }
  }

  if (digestByEmail.size === 0) {
    console.log("[hs-alerts] 매칭되는 구독 없음 — 종료");
    return;
  }

  const SECRET = process.env.INTERNAL_JOB_SECRET;
  if (!SECRET) {
    console.error("[hs-alerts] INTERNAL_JOB_SECRET 미설정 — 발송 생략");
    return;
  }

  const url = `${process.env.SUPABASE_URL}/functions/v1/send-hs-alert-digest-email`;
  let sent = 0;
  for (const [email, { lang, items }] of digestByEmail) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": SECRET },
      body: JSON.stringify({ email, lang, items }),
    });
    if (!res.ok) {
      console.error(`[hs-alerts] ${email} 발송 실패:`, await res.text());
      continue;
    }
    sent++;
  }
  console.log(`[hs-alerts] ${sent}/${digestByEmail.size}명에게 다이제스트 발송 완료`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
