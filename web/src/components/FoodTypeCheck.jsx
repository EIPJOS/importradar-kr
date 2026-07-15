import React, { useEffect, useState } from "react";
import { searchFoodTypes, browseFoodTypes } from "../lib/supabase.js";

const EXAMPLES = ["과자", "라면", "커피", "김치"];

export default function FoodTypeCheck() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const [groups, setGroups] = useState(null);
  const [openMajor, setOpenMajor] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    browseFoodTypes()
      .then(setGroups)
      .catch((err) => setError(err.message));
  }, []);

  async function runSearch(value) {
    const query = value.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(null);
    try {
      setResults(await searchFoodTypes(query));
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

  function pickResult(row) {
    setSelected(row);
    setResults(null);
    setQ("");
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>식품유형 확인</h2>
        <span className="browser-count">식품공전(식약처) 식품유형 분류표 · 272개 유형</span>
      </div>
      <p className="classify-note">
        가공식품의 식품유형을 검색하거나 대분류에서 직접 선택해 확인하세요. 정확한 표시기준·규격은
        식품의약품안전처 식품공전 원문 확인이 필요합니다.
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">식품유형 검색</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 과자, 라면, 커피, 김치"
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

      {selected && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="badge confidence-high">선택한 식품유형</span>
              <button type="button" className="demo-link" onClick={() => setSelected(null)}>
                초기화
              </button>
            </div>
            <h3>{selected.sub_type}</h3>
            <p className="meta">
              {[selected.major_category, selected.mid_category, selected.sub_type].filter(Boolean).join(" › ")}
            </p>
          </article>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="classify-results">
          <p className="classify-note">일치하는 식품유형 {results.length}건을 찾았습니다.</p>
          {results.map((r) => (
            <article key={r.id} className="classify-card" onClick={() => pickResult(r)} style={{ cursor: "pointer" }}>
              <h3>{r.sub_type}</h3>
              <p className="meta">{[r.major_category, r.mid_category, r.sub_type].filter(Boolean).join(" › ")}</p>
            </article>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="empty">일치하는 식품유형을 찾지 못했습니다. 아래에서 대분류를 직접 선택해 보세요.</p>
      )}

      {!selected && groups && (
        <div className="classify-results">
          <p className="classify-note">또는 대분류에서 직접 선택하세요</p>
          <div className="chip-row">
            {groups.map((g) => (
              <button
                type="button"
                key={g.major}
                className={`chip ${openMajor === g.major ? "on" : ""}`}
                onClick={() => setOpenMajor(openMajor === g.major ? null : g.major)}
              >
                {g.major}
              </button>
            ))}
          </div>
          {openMajor && (
            <div className="chip-row">
              {groups
                .find((g) => g.major === openMajor)
                .items.map((item) => (
                  <button type="button" key={item.id} className="chip" onClick={() => pickResult(item)}>
                    {item.mid_category ? `${item.mid_category.replace(/^[\d.\-]+\s*/, "")} · ` : ""}
                    {item.sub_type}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
