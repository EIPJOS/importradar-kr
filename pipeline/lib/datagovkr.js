// data.go.kr 공통 페치 유틸: 페이징, JSON/XML 자동 파싱, 재시도
import { XMLParser } from "fast-xml-parser";

const xml = new XMLParser({ ignoreAttributes: false });

// res.text()는 서버가 실제로 어떤 인코딩을 쓰든 무조건 UTF-8로 해석한다.
// 일부 정부 API(식약처 부적합 정보 등)는 실제로 EUC-KR로 응답을 주기 때문에
// 그대로 쓰면 한글이 깨진다. UTF-8로 엄격 디코딩을 시도해서 실패하면
// (유효하지 않은 바이트 시퀀스) EUC-KR로 재시도한다.
function decodeBuffer(buf) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

async function fetchWithRetry(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const text = decodeBuffer(buf);
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
  // 일부 API는 <items><item><item>...</item></item></items>처럼 item이 한 겹 더 감싸져 있다.
  items = items.map((it) => (it && typeof it === "object" && "item" in it ? it.item : it));
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