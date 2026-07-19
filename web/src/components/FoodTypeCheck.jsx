import React, { useEffect, useState } from "react";
import { searchFoodTypes, browseFoodTypes } from "../lib/supabase.js";
import { useT, useLang } from "../lib/i18n.jsx";

const EXAMPLES = ["과자", "라면", "커피", "김치"];

// DB name_ko/name_en/name_cn 패턴과 동일: 현재 언어 컬럼이 있으면 쓰고, 없으면(ko 등) 원본 한글로 폴백.
function pick(row, field, lang) {
  if (lang === "ko") return row[field];
  return row[`${field}_${lang}`] ?? row[field];
}

export default function FoodTypeCheck() {
  const t = useT("foodType");
  const lang = useLang();
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
        <h2>{t.heading}</h2>
        <span className="browser-count">{t.subtitle}</span>
      </div>
      <p className="classify-note">
        {t.note}
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">{t.searchLabel}</label>
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
          {loading ? t.searching : t.searchButton}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {selected && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="badge confidence-high">{t.selectedBadge}</span>
              <button type="button" className="demo-link" onClick={() => setSelected(null)}>
                {t.resetButton}
              </button>
            </div>
            <h3>{pick(selected, "sub_type", lang)}</h3>
            <p className="meta">
              {[pick(selected, "major_category", lang), pick(selected, "mid_category", lang), pick(selected, "sub_type", lang)]
                .filter(Boolean)
                .join(" › ")}
            </p>
          </article>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="classify-results">
          <p className="classify-note">{t.matchCount(results.length)}</p>
          {results.map((r) => (
            <article key={r.id} className="classify-card" onClick={() => pickResult(r)} style={{ cursor: "pointer" }}>
              <h3>{pick(r, "sub_type", lang)}</h3>
              <p className="meta">
                {[pick(r, "major_category", lang), pick(r, "mid_category", lang), pick(r, "sub_type", lang)]
                  .filter(Boolean)
                  .join(" › ")}
              </p>
            </article>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="empty">{t.noMatch}</p>
      )}

      {!selected && groups && (
        <div className="classify-results">
          <p className="classify-note">{t.orBrowse}</p>
          <div className="chip-row">
            {groups.map((g) => (
              <button
                type="button"
                key={g.major}
                className={`chip ${openMajor === g.major ? "on" : ""}`}
                onClick={() => setOpenMajor(openMajor === g.major ? null : g.major)}
              >
                {pick(g.items[0], "major_category", lang)}
              </button>
            ))}
          </div>
          {openMajor && (
            <div className="chip-row">
              {groups
                .find((g) => g.major === openMajor)
                .items.map((item) => (
                  <button type="button" key={item.id} className="chip" onClick={() => pickResult(item)}>
                    {item.mid_category
                      ? `${pick(item, "mid_category", lang).replace(/^[\d.\-]+\s*/, "")} · `
                      : ""}
                    {pick(item, "sub_type", lang)}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
