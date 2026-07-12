// ë²•ì œì²˜ êµ­ê°€ë²•ë ¹ì •ë³´ â†’ regulation_updates
// ìµœê·¼ ê³µí¬ ë²•ë ¹ ê²€ìƒ‰ (open.law.go.kr, OC í•„ìš”)
// API: http://www.law.go.kr/DRF/lawSearch.do?OC={oc}&target=eflaw&type=JSON
//   ancYd(ê³µí¬ì¼ìž ë²”ìœ„ yyyymmdd~yyyymmdd), org(ì†Œê´€ë¶€ì²˜ì½”ë“œ) í•„í„° ì§€ì›
import { fetchRaw } from "../lib/datagovkr.js";
import { upsertChunked } from "../lib/supabase.js";
import { summarizeBatch } from "../lib/summarize.js";

const OC = process.env.LAW_GO_KR_OC;
if (!OC) { console.error("LAW_GO_KR_OC ë¯¸ì„¤ì •"); process.exit(1); }

// ìˆ˜ìž…ìš”ê±´ê³¼ ì§ì ‘ ê´€ë ¨ëœ ì†Œê´€ë¶€ì²˜ë§Œ ìš°ì„  ìˆ˜ì§‘ (MVP ë²”ìœ„ ì¶•ì†Œ)
// ê´€ì„¸ì²­(1220000), ì‹ì•½ì²˜(1471000), ì‚°ì—…ë¶€(1450000), í™˜ê²½ë¶€(1480000), ë†ì‹í’ˆë¶€(1543000)
const MINISTRIES = ["1220000", "1471000", "1450000", "1480000", "1543000"];

const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const toDate = (s) => {
  if (!s) return null;
  const t = String(s).replaceAll("-", "");
  return t.length === 8 ? `${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6)}` : null;
};

async function main() {
  const since = new Date(Date.now() - 90 * 86400e3); // ìµœê·¼ 90ì¼
  const range = `${ymd(since)}~${ymd(new Date())}`;
  const rows = [];

  for (const org of MINISTRIES) {
    for (let page = 1; page <= 20; page++) {
      const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=${OC}&target=eflaw&type=JSON&org=${org}&ancYd=${range}&display=100&page=${page}`;
      const body = await fetchRaw(url);
      const laws = body?.LawSearch?.law ?? [];
      const list = Array.isArray(laws) ? laws : [laws];
      if (list.length === 0 || !list[0]) break;
      for (const l of list) {
        rows.push({
          country_code: "KR",
          law_id: String(l.ë²•ë ¹ID ?? l.lawId ?? ""),
          law_name: l.ë²•ë ¹ëª…í•œê¸€ ?? l.lawNmKo ?? "",
          ministry: l.ì†Œê´€ë¶€ì²˜ëª… ?? null,
          amendment_type: l.ì œê°œì •êµ¬ë¶„ëª… ?? null,
          promulgated_on: toDate(l.ê³µí¬ì¼ìž),
          effective_on: toDate(l.ì‹œí–‰ì¼ìž),
          detail_url: l.ë²•ë ¹ìƒì„¸ë§í¬ ? `http://www.law.go.kr${l.ë²•ë ¹ìƒì„¸ë§í¬}` : null,
          raw: l,
        });
      }
      const total = Number(body?.LawSearch?.totalCnt ?? 0);
      if (page * 100 >= total) break;
    }
  }

  const valid = rows.filter((r) => r.law_id && r.law_name);
  const summaries = await summarizeBatch(
    valid.slice(0, 100).map((r) => `${r.law_name} â€” ${r.amendment_type}, ì‹œí–‰ ${r.effective_on}`),
    "ë‹¤ìŒ ë²•ë ¹ ê°œì • ì •ë³´ê°€ ìˆ˜ì¶œìž… ì‹¤ë¬´ì— ê°–ëŠ” ì˜ë¯¸ë¥¼ í•œêµ­ì–´ 1ë¬¸ìž¥ìœ¼ë¡œ ìš”ì•½. ìš”ì•½ë¬¸ë§Œ ì¶œë ¥."
  );
  valid.slice(0, 100).forEach((r, i) => (r.summary = summaries[i]));

  await upsertChunked("regulation_updates", valid, "country_code,law_id,promulgated_on");
}

main().catch((e) => { console.error(e); process.exit(1); });
