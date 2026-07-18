import React, { useState } from "react";
import { searchKcItems } from "../lib/supabase.js";
import { useT } from "../lib/i18n.jsx";

const badgeClass = (certTypeName) =>
  certTypeName.includes("안전인증") ? "confidence-high" : "confidence-medium";

export default function KcCertCheck() {
  const t = useT("kc");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  async function runSearch(value) {
    const query = value.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      setResults(await searchKcItems(query));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    runSearch(q);
  }

  function tryExample(ex) {
    setQ(ex.query);
    runSearch(ex.query);
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>{t.heading}</h2>
        <span className="browser-count">{t.countLabel}</span>
      </div>
      <p className="classify-note">{t.note}</p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">{t.labelProduct}</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          autoFocus
        />
        <div className="chip-row">
          {t.examples.map((ex) => (
            <button type="button" key={ex.query} className="chip" onClick={() => tryExample(ex)}>
              {ex.label}
            </button>
          ))}
        </div>
        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? t.searchBtnLoading : t.searchBtn}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results && results.length > 0 && (
        <div className="classify-results">
          <p className="classify-note">{t.resultsCount(results.length)}</p>
          {results.map((r) => (
            <article key={r.total_code} className="classify-card">
              <div className="card-head">
                <span className="demo-hs">{r.total_code}</span>
                <span className={`badge ${badgeClass(r.cert_type_name)}`}>{r.cert_type_name}</span>
              </div>
              <h3>{r.category_path.split(">").pop()}</h3>
              <p className="meta">{r.category_path.split(">").join(" › ")}</p>
            </article>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="empty">{t.emptyResults}</p>
      )}
    </section>
  );
}
