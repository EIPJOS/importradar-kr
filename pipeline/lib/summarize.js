// 신규 레코드의 사유/개정내용을 평문 한국어로 요약 (Claude API)
// 요약은 "있으면 좋은" 필드 — 실패해도 파이프라인은 계속 진행
const MODEL = "claude-haiku-4-5-20251001"; // 요약용은 Haiku로 비용 최소화

export async function summarizeBatch(texts, instruction) {
  if (!process.env.ANTHROPIC_API_KEY || texts.length === 0) return texts.map(() => null);
  const out = [];
  for (const text of texts) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 200,
          messages: [{ role: "user", content: `${instruction}\n\n---\n${text}` }],
        }),
      });
      const data = await res.json();
      out.push(data?.content?.[0]?.text?.trim() ?? null);
    } catch {
      out.push(null);
    }
  }
  return out;
}
