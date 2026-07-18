import React, { useEffect, useState } from "react";
import { searchFoodTypes, browseFoodTypes } from "../lib/supabase.js";
import { checkNutritionLabelRequirement, EXEMPTION_NOTES } from "../lib/nutritionLabelRules.js";
import { useT } from "../lib/i18n.jsx";

const EXAMPLES = ["과자", "커피", "우유", "한식간장"];

export default function NutritionRequirementCheck() {
  const t = useT("nutritionReq");
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
        <h2>{t.title}</h2>
        <span className="browser-count">
          {t.legalCitation}
        </span>
      </div>
      <p className="classify-note">
        {t.intro}
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">{t.searchLabel}</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder(EXAMPLES.join(", "))}
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

      {selected && verdict && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className={`badge ${verdict.required ? "confidence-high" : "confidence-medium"}`}>
                {verdict.required ? t.badgeRequired : t.badgeNotRequired}
              </span>
              <button type="button" className="demo-link" onClick={() => setSelected(null)}>
                {t.reset}
              </button>
            </div>
            <h3>{selected.sub_type}</h3>
            <p className="meta">
              {[selected.major_category, selected.mid_category, selected.sub_type].filter(Boolean).join(" › ")}
            </p>
            <p className="reason">
              {verdict.required
                ? t.reasonRequired(verdict.article)
                : verdict.note}
            </p>
            <p className="meta">{t.legalBasis(verdict.article)}</p>
          </article>
          <p className="classify-note">
            {t.exemptionIntro}
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
          <p className="classify-note">{t.resultsFound(results.length)}</p>
          {results.map((r) => (
            <article key={r.id} className="classify-card" onClick={() => pickResult(r)} style={{ cursor: "pointer" }}>
              <h3>{r.sub_type}</h3>
              <p className="meta">{[r.major_category, r.mid_category, r.sub_type].filter(Boolean).join(" › ")}</p>
            </article>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="empty">{t.noResults}</p>
      )}

      {!selected && !results && groups && (
        <div className="classify-results">
          <p className="classify-note">{t.browseByCategory}</p>
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
