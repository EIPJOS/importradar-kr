import React, { useEffect, useState } from "react";
import { searchFoodTypes, browseFoodTypes } from "../lib/supabase.js";
import { checkNutritionLabelRequirement, EXEMPTION_NOTES } from "../lib/nutritionLabelRules.js";

const EXAMPLES = ["과자", "커피", "우유", "한식간장"];

export default function NutritionRequirementCheck() {
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

  const verdict = selected ? checkNutritionLabelRequirement(selected) : null;

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>영양성분 입력대상 확인</h2>
        <span className="browser-count">
          식품 등의 표시ㆍ광고에 관한 법률 시행규칙 별표4 · 영양표시 대상 식품등
        </span>
      </div>
      <p className="classify-note">
        식품유형을 검색하거나 대분류에서 직접 선택하면 영양성분 표시 의무 대상인지 확인합니다. 별표4
        원문 규칙을 그대로 적용한 결과이며, 정확한 판단은 식품의약품안전처 고시 원문을 확인하세요.
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">식품유형 검색</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 과자, 커피, 우유, 한식간장"
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

      {selected && verdict && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className={`badge ${verdict.required ? "confidence-high" : "confidence-medium"}`}>
                {verdict.required ? "영양표시 의무 대상" : "의무 대상 아님"}
              </span>
              <button type="button" className="demo-link" onClick={() => setSelected(null)}>
                초기화
              </button>
            </div>
            <h3>{selected.sub_type}</h3>
            <p className="meta">
              {[selected.major_category, selected.mid_category, selected.sub_type].filter(Boolean).join(" › ")}
            </p>
            <p className="reason">
              {verdict.required
                ? `별표4 영양표시 대상 식품등 ${verdict.article}에 해당합니다. 영양성분(열량·나트륨·탄수화물·당류·지방·트랜스지방·포화지방·콜레스테롤·단백질)을 표시해야 합니다.`
                : verdict.note}
            </p>
            <p className="meta">근거: 식품 등의 표시ㆍ광고에 관한 법률 시행규칙 {verdict.article}</p>
          </article>
          <p className="classify-note">
            아래에 해당하면 위 판정과 무관하게 표시 의무가 면제될 수 있습니다(별표4 2.):
          </p>
          <ul className="empty" style={{ textAlign: "left", listStyle: "disc", paddingLeft: 20 }}>
            {EXEMPTION_NOTES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
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

      {!selected && !results && groups && (
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
