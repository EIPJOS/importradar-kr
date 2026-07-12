import React, { useState } from "react";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hs-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const COUNTRIES = ["중국", "미국", "일본", "EU", "ASEAN", "기타"];
const LANGS = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
];

const CONFIDENCE_LABEL = { high: "높음", medium: "보통", low: "낮음" };

export default function QuickClassify({ onSelect }) {
  const [productName, setProductName] = useState("");
  const [country, setCountry] = useState("중국");
  const [lang, setLang] = useState("ko");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setNote(null);
    try {
      const res = await fetch(FUNCTIONS_URL, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ productName, originCountry: country, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분류 요청에 실패했습니다");
      setResults(data.results ?? []);
      setNote(data.note ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>빠른 HS CODE 분류</h2>
        <span className="browser-count">AI 참고용 · 무료 공개 중</span>
      </div>
      <p className="classify-note">
        제품명을 입력하면 AI가 우리 DB의 실제 HS코드 12,469건 중에서 후보를 찾아드립니다.
        참고용이며, 정확한 분류는 관세사 확인이 필요합니다.
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">제품명</label>
        <input
          className="browser-search"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="예: 무선 마우스, 남성용 양모 슈트, 플라스틱 장난감"
          autoFocus
        />

        <label className="classify-label">원산지 국가</label>
        <div className="chip-row">
          {COUNTRIES.map((c) => (
            <button
              type="button"
              key={c}
              className={`chip ${country === c ? "on" : ""}`}
              onClick={() => setCountry(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="classify-label">언어</label>
        <div className="chip-row">
          {LANGS.map((l) => (
            <button
              type="button"
              key={l.id}
              className={`chip ${lang === l.id ? "on" : ""}`}
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? "분류 요청 중… (최대 10초)" : "HS CODE 분류 요청"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results && results.length > 0 && (
        <div className="classify-results">
          {results.map((r) => (
            <article key={r.hs_code} className="classify-card">
              <div className="card-head">
                <span className="demo-hs">{r.hs_code}</span>
                <span className={`badge confidence-${r.confidence}`}>신뢰도 {CONFIDENCE_LABEL[r.confidence] ?? r.confidence}</span>
              </div>
              <h3>{r.name_ko}</h3>
              <p className="meta">{r.name_en}</p>
              {r.reasoning && <p className="reason">{r.reasoning}</p>}
              <button className="demo-link" onClick={() => onSelect(r.hs_code)}>
                이 코드로 수입요건 조회 →
              </button>
            </article>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="empty">{note ?? "일치하는 분류를 찾지 못했습니다."}</p>
      )}
    </section>
  );
}
