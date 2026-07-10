// data.go.kr 공통 페치 유틸: 페이징, JSON/XML 자동 파싱, 재시도
import { XMLParser } from "fast-xml-parser";

const xml = new XMLParser({ ignoreAttributes: false });

async function fetchWithRetry(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      return text;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

function parseBody(text) {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) return JSON.parse(t);
  return xml.parse(t);
}

// data.go.kr 표준 응답에서 items 배열과 totalCount를 관대하게 추출
export function extractItems(body) {
  const response = body?.response ?? body;
  const header = response?.header ?? {};
  const code = header.resultCode ?? header.RESULT_CODE;
  if (code && !["0", "00", "INFO-000", 0].includes(code)) {
    throw new Error(`API error ${code}: ${header.resultMsg ?? ""}`);
  }
  const bodyNode = response?.body ?? response;
  let items = bodyNode?.items?.item ?? bodyNode?.items ?? bodyNode?.item ?? [];
  if (items && !Array.isArray(items)) items = [items];
  const totalCount = Number(bodyNode?.totalCount ?? bodyNode?.TOTAL_COUNT ?? items.length);
  return { items: items ?? [], totalCount };
}

// 표준 pageNo/numOfRows 페이징 전체 순회
export async function fetchAllPages(baseUrl, params, { numOfRows = 100, maxPages = 500 } = {}) {
  const all = [];
  for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
    const qs = new URLSearchParams({
      serviceKey: process.env.DATA_GO_KR_KEY,
      pageNo: String(pageNo),
      numOfRows: String(numOfRows),
      ...params,
    });
    const text = await fetchWithRetry(`${baseUrl}?${qs}`);
    const { items, totalCount } = extractItems(parseBody(text));
    all.push(...items);
    if (all.length >= totalCount || items.length === 0) break;
  }
  return all;
}

export async function fetchRaw(url) {
  return parseBody(await fetchWithRetry(url));
}
