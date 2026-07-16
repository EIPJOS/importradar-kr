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
const fmtDate = (d) => (d ? d.replaceAll("-", ".") : "미상");

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
  const [openReqKey, setOpenReqKey] = useState(null); // "hsCode-idx"

  async function onSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setNote(null);
    setExtras({});
    setOpenReqKey(null);
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
        <span className="browser-count">AI 참고용 · 관세율·수입요건 통합 · 무료 공개 중 · 횟수 제한 없음</span>
      </div>
      <p className="classify-note">
        제품명을 입력하면 AI가 우리 DB의 실제 HS코드 12,469건 중에서 후보를 찾고, 원산지 기준 관세율과
        수입요건까지 한 화면에서 보여드립니다. 참고용이며, 정확한 분류는 관세사 확인이 필요합니다.
      </p>

      <div className="classify-split">
        <div className="classify-col-form">
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
        </div>

        <div className="classify-col-results">
          {!results && !loading && (
            <div className="classify-empty-panel">
              <span className="icon">📄</span>
              <span>제품명을 입력하고 분류 요청을 해주세요</span>
            </div>
          )}

          {loading && (
            <div className="classify-empty-panel">
              <span className="icon">⏳</span>
              <span>분류 결과와 관세율, 수입요건을 불러오는 중…</span>
            </div>
          )}

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
                      <>
                        {extra.rate ? (
                          <p className="reason">
                            관세율({extra.rate.source}): <strong>{extra.rate.rate_percent}%</strong>
                          </p>
                        ) : (
                          <p className="meta">등록된 관세율 정보 없음</p>
                        )}

                        {extra.requirements.length > 0 ? (
                          <>
                            <p className="classify-label" style={{ marginTop: 10 }}>
                              수입요건 {extra.requirements.length}건 (클릭하면 상세 표시)
                            </p>
                            <div className="req-chip-row">
                              {extra.requirements.map((req, i) => {
                                const key = `${r.hs_code}-${i}`;
                                return (
                                  <button
                                    type="button"
                                    key={key}
                                    className={`req-chip ${openReqKey === key ? "on" : ""}`}
                                    onClick={() => setOpenReqKey(openReqKey === key ? null : key)}
                                  >
                                    {req.law_name ?? "요건"}
                                  </button>
                                );
                              })}
                            </div>
                            {extra.requirements.map((req, i) => {
                              const key = `${r.hs_code}-${i}`;
                              if (openReqKey !== key) return null;
                              return (
                                <div className="req-detail" key={key}>
                                  <p>
                                    <strong>확인법령</strong> {req.law_name ?? "미상"}
                                  </p>
                                  <p>
                                    <strong>요건승인기관</strong> {req.agency_name ?? "미상"}
                                  </p>
                                  <p>
                                    <strong>적용시작</strong> {fmtDate(req.effective_from)}
                                  </p>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <p className="meta">등록된 세관장확인 요건 없음</p>
                        )}
                      </>
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
            <div className="classify-empty-panel">
              <span className="icon">🔍</span>
              <span>{note ?? "일치하는 분류를 찾지 못했습니다."}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
