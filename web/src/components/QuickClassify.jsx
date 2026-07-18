import React, { useState } from "react";
import { getTariffRates, fetchLiveRequirements } from "../lib/supabase.js";
import { ORIGINS, selectApplicableRate } from "../lib/tariffRateSelect.js";
import { useT } from "../lib/i18n.jsx";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hs-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const LANGS = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
];

const fmtDate = (d, unknownLabel) => (d ? d.replaceAll("-", ".") : unknownLabel);

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
  const t = useT("quickClassify");
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
      if (!res.ok) throw new Error(data.error || t.errorDefault);
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
        <h2>{t.heading}</h2>
        <span className="browser-count">{t.subtitle}</span>
      </div>
      <p className="classify-note">{t.note}</p>

      <div className="classify-split">
        <div className="classify-col-form">
          <form className="classify-form" onSubmit={onSubmit}>
            <label className="classify-label">{t.productNameLabel}</label>
            <input
              className="browser-search"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t.productNamePlaceholder}
              autoFocus
            />

            <label className="classify-label">{t.originLabel}</label>
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

            <label className="classify-label">{t.langLabel}</label>
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
              {loading ? t.submitLoading : t.submitButton}
            </button>
          </form>

          {error && <p className="error">{error}</p>}
        </div>

        <div className="classify-col-results">
          {!results && !loading && (
            <div className="classify-empty-panel">
              <span className="icon">📄</span>
              <span>{t.emptyPrompt}</span>
            </div>
          )}

          {loading && (
            <div className="classify-empty-panel">
              <span className="icon">⏳</span>
              <span>{t.loadingResults}</span>
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
                        {t.confidencePrefix} {t.confidenceLabel[r.confidence] ?? r.confidence}
                      </span>
                    </div>
                    <h3>{r.name_ko}</h3>
                    <p className="meta">{r.name_en}</p>
                    {r.reasoning && <p className="reason">{r.reasoning}</p>}

                    {extra?.loading && <p className="meta">{t.extraLoading}</p>}

                    {extra && !extra.loading && (
                      <>
                        {extra.rate ? (
                          <p className="reason">
                            {t.tariffRateLabel(extra.rate.source)} <strong>{extra.rate.rate_percent}%</strong>
                          </p>
                        ) : (
                          <p className="meta">{t.noTariffRate}</p>
                        )}

                        {extra.requirements.length > 0 ? (
                          <>
                            <p className="classify-label" style={{ marginTop: 10 }}>
                              {t.requirementsCount(extra.requirements.length)}
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
                                    {req.law_name ?? t.requirementFallback}
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
                                    <strong>{t.lawNameLabel}</strong> {req.law_name ?? t.unknown}
                                  </p>
                                  <p>
                                    <strong>{t.agencyNameLabel}</strong> {req.agency_name ?? t.unknown}
                                  </p>
                                  <p>
                                    <strong>{t.effectiveFromLabel}</strong> {fmtDate(req.effective_from, t.unknown)}
                                  </p>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <p className="meta">{t.noRequirements}</p>
                        )}
                      </>
                    )}

                    <button className="demo-link" onClick={() => onSelect(r.hs_code)}>
                      {t.viewFullLink}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {results && results.length === 0 && (
            <div className="classify-empty-panel">
              <span className="icon">🔍</span>
              <span>{note ?? t.noMatch}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
