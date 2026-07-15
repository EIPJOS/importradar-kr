import React, { useState } from "react";
import { searchKcItems } from "../lib/supabase.js";

const EXAMPLES = ["전기주전자", "가습기", "완구", "보조배터리"];

const badgeClass = (certTypeName) =>
  certTypeName.includes("안전인증") ? "confidence-high" : "confidence-medium";

export default function KcCertCheck() {
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
    setQ(ex);
    runSearch(ex);
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>KC 인증대상 확인</h2>
        <span className="browser-count">국가기술표준원 KC 품목 데이터 · 534개 카테고리</span>
      </div>
      <p className="classify-note">
        제품명 또는 품목명 단서를 입력하면 KC 인증대상 품목 후보와 인증유형(안전인증/안전확인)을 확인합니다.
        정확한 대상 여부는 시험·인증기관 확인이 필요합니다.
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">제품명</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 전기주전자, 가습기, 완구"
          autoFocus
        />
        <div className="chip-row">
          {EXAMPLES.map((ex) => (
            <button type="button" key={ex} className="chip" onClick={() => tryExample(ex)}>
              {ex}
            </button>
          ))}
        </div>
        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? "검색 중…" : "검색"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results && results.length > 0 && (
        <div className="classify-results">
          <p className="classify-note">
            동일하거나 가까운 KC 인증대상 품목 {results.length}건을 찾았습니다.
          </p>
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
        <p className="empty">
          일치하는 KC 인증대상 품목을 찾지 못했습니다. 인증대상이 아니거나, 다른 품목명으로 등록되어 있을 수 있습니다.
        </p>
      )}
    </section>
  );
}
