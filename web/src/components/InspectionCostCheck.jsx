import React, { useEffect, useState } from "react";
import { browseInspectionItems, searchInspectionItems } from "../lib/supabase.js";
import { useT, useLang, pick } from "../lib/i18n.jsx";

export default function InspectionCostCheck() {
  const t = useT("inspectionCost");
  const lang = useLang();
  const CATEGORY_LABEL = t.categoryLabel;
  const CATEGORY_RANGE = t.categoryRange;
  const [category, setCategory] = useState("food");
  const [groups, setGroups] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setGroups(null);
    setOpenKey(null);
    setSearchResults(null);
    setSelected(null);
    setQ("");
    browseInspectionItems(category)
      .then(setGroups)
      .catch((err) => setError(err.message));
  }, [category]);

  async function onSubmit(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      setSearchResults(await searchInspectionItems(query, category));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>{t.pageTitle}</h2>
        <span className="browser-count">{t.itemCount}</span>
      </div>
      <p className="classify-note">{t.introNote}</p>

      <div className="chip-row">
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={`chip ${category === key ? "on" : ""}`}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">{t.searchLabel}</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder[category]}
        />
        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? t.searching : t.searchButton}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {searchResults && (
        <div className="classify-results">
          <p className="classify-note">{t.resultCount(searchResults.length)}</p>
          {searchResults.map((r) => (
            <article key={r.id} className="classify-card" onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
              <h3>{pick(r, "item_name", lang)}</h3>
              <p className="meta">
                {pick(r, "major_category", lang)}
                {r.mid_category !== r.major_category ? ` › ${pick(r, "mid_category", lang)}` : ""}
              </p>
            </article>
          ))}
        </div>
      )}

      {!searchResults && groups && (
        <div className="classify-results">
          <p className="classify-note">{t.selectCategoryNote}</p>
          <div className="chip-row">
            {groups.map((g) => (
              <button
                type="button"
                key={g.major + g.mid}
                className={`chip ${openKey === g.major + g.mid ? "on" : ""}`}
                onClick={() => setOpenKey(openKey === g.major + g.mid ? null : g.major + g.mid)}
              >
                {pick(g.majorRow, "major_category", lang)}
                {g.mid !== g.major ? ` · ${pick(g.midRow, "mid_category", lang)}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {!searchResults &&
        groups &&
        groups
          .filter((g) => openKey === g.major + g.mid)
          .map((g) => (
            <div className="classify-results" key={g.major + g.mid}>
              {g.items.map((item) => (
                <article
                  key={item.id}
                  className="classify-card"
                  onClick={() => setSelected(item)}
                  style={{ cursor: "pointer" }}
                >
                  <h3>{pick(item, "item_name", lang)}</h3>
                </article>
              ))}
            </div>
          ))}

      {selected && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="badge confidence-medium">{t.inspectionBadge}</span>
            </div>
            <h3>{pick(selected, "item_name", lang)}</h3>
            <p className="meta">
              {pick(selected, "major_category", lang)}
              {selected.mid_category !== selected.major_category ? ` › ${pick(selected, "mid_category", lang)}` : ""}
            </p>
            <p className="reason">{t.costRangePrefix}{CATEGORY_RANGE[category]}</p>
            <p className="meta">{t.checkExactNote}</p>
            <a
              className="demo-link"
              href="https://www.foodsafetykorea.go.kr/portal/specialinfo/examFeeList.do"
              target="_blank"
              rel="noreferrer"
            >
              {t.searchLinkText}
            </a>
          </article>
        </div>
      )}
    </section>
  );
}
