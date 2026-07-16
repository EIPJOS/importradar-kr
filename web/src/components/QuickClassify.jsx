import React, { useState } from "react";
import { getTariffRates, fetchLiveRequirements } from "../lib/supabase.js";
import { ORIGINS, selectApplicableRate } from "../lib/tariffRateSelect.js";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hs-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const LANGS = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
];

const CONFIDENCE_LABEL = { high: "높음", medium: "보통", low: "낮음" };
const won = (n) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

// HS코드 하나를 받아 관세율(원산지 기준)과 수입요건을 함께 불러온다.
// 실패해도 분류 결과 자체는 이미 있으니 조용히 비워둔다.
async function loadExtras(hsCode, origin) {
  const [rates, requirements] = await Promise.all([
    getTariffRates(hsCode).catch(() => []),
    fetchLiveRequirements(hsCode).catch(() => null),
  ]);
  const applied = rates.length ? selectApplicableRate(rates, origin) : null;
  return { rate: applied, requirements: requirements?.requirements ?? [] };
}

export default function QuickClassify({ onSelect }) {
  const [productName, setProductName] = useState("");
  const [country, setCountry] = useState("중국");
  const [lang, setLang] = useState("ko");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);
  const [extras, setExtras] = useState({}); // hs_code -> { rate, requirements, loading }

  async function onSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setNote(null);
    setExtras({});
    try {
      const res = await fetch(FUNCTIONS_URL, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ productName, originCountry: country, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분류 요청에 실패했습니다");
      const list = data.results ?? [];
      setResults(list);
      setNote(data.note ?? null);

      // 상위 3건까지만 관세율·수입요건을 함께 불러온다 (API 호출 절약)
      for (const r of list.slice(0, 3)) {
        setExtras((prev) => ({ ...prev, [r.hs_code]: { loading: true } }));
        loadExtras(r.hs_code, country).then((extra) => {
          setExtras((prev) => ({ ...prev, [r.hs_code]: { ...extra, loading: false } }));
        });
      }
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
        <span className="browser-count">AI 참고용 · 관세율·수입요건 통합 · 무료 공개 중</span>
      </div>
      <p className="classify-note">
        제품명을 입력하면 AI가 우리 DB의 실제 HS코드 12,469건 중에서 후보를 찾고, 원산지 기준 관세율과
        수입요건까지 한 화면에서 보여드립니다. 참고용이며, 정확한 분류는 관세사 확인이 필요합니다.
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
          {ORIGINS.map((c) => (
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
          {results.map((r) => {
            const extra = extras[r.hs_code];
            return (
              <article key={r.hs_code} className="classify-card">
                <div className="card-head">
                  <span className="demo-hs">{r.hs_code}</span>
                  <span className={`badge confidence-${r.confidence}`}>
                    신뢰도 {CONFIDENCE_LABEL[r.confidence] ?? r.confidence}
                  </span>
                </div>
                <h3>{r.name_ko}</h3>
                <p className="meta">{r.name_en}</p>
                {r.reasoning && <p className="reason">{r.reasoning}</p>}

                {extra?.loading && <p className="meta">관세율·수입요건 조회 중…</p>}

                {extra && !extra.loading && (
                  <div className="chip-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6, marginTop: 8 }}>
                    {extra.rate ? (
                      <p className="reason">
                        관세율({extra.rate.source}): <strong>{extra.rate.rate_percent}%</strong>
                      </p>
                    ) : (
                      <p className="meta">등록된 관세율 정보 없음</p>
                    )}
                    {extra.requirements.length > 0 ? (
                      <p className="reason">
                        수입요건 {extra.requirements.length}건:{" "}
                        {extra.requirements.map((req) => req.law_name).filter(Boolean).join(", ")}
                      </p>
                    ) : (
                      <p className="meta">등록된 세관장확인 요건 없음</p>
                    )}
                  </div>
                )}

                <button className="demo-link" onClick={() => onSelect(r.hs_code)}>
                  이 코드로 수입요건 전체보기 →
                </button>
              </article>
            );
          })}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="empty">{note ?? "일치하는 분류를 찾지 못했습니다."}</p>
      )}
    </section>
  );
}
