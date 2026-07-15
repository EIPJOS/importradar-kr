import React, { useEffect, useState } from "react";
import { browseInspectionItems, searchInspectionItems } from "../lib/supabase.js";

const CATEGORY_LABEL = { food: "가공식품", container: "기구·용기등" };
const CATEGORY_RANGE = {
  food: "통상 30만원~150만원 수준 (검사항목이 많은 특수영양식품·다류 등은 더 높을 수 있음)",
  container: "통상 10만원~60만원 수준 (재질·부품 수에 따라 달라짐)",
};

export default function InspectionCostCheck() {
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
        <h2>정밀검사비용 확인</h2>
        <span className="browser-count">식품유형·재질별 정밀검사 대상 안내 · 224개 품목</span>
      </div>
      <p className="classify-note">
        정밀검사 수수료는 관세청·식약처가 고시하는 법정 금액이 아니라 지정시험검사기관이 개별
        산정하는 값입니다. 아래에서 식품유형 또는 기구·용기 재질을 확인하고, 일반적인 비용 범위를
        참고한 뒤 정확한 견적은 지정시험검사기관에 직접 문의하세요.
      </p>

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
        <label className="classify-label">품목명 검색</label>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={category === "food" ? "예: 커피, 김치, 콩기름" : "예: PET, 유리제"}
        />
        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? "검색 중…" : "검색"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {searchResults && (
        <div className="classify-results">
          <p className="classify-note">검색 결과 {searchResults.length}건</p>
          {searchResults.map((r) => (
            <article key={r.id} className="classify-card" onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
              <h3>{r.item_name}</h3>
              <p className="meta">
                {r.major_category}
                {r.mid_category !== r.major_category ? ` › ${r.mid_category}` : ""}
              </p>
            </article>
          ))}
        </div>
      )}

      {!searchResults && groups && (
        <div className="classify-results">
          <p className="classify-note">또는 대분류에서 직접 선택하세요</p>
          <div className="chip-row">
            {groups.map((g) => (
              <button
                type="button"
                key={g.major + g.mid}
                className={`chip ${openKey === g.major + g.mid ? "on" : ""}`}
                onClick={() => setOpenKey(openKey === g.major + g.mid ? null : g.major + g.mid)}
              >
                {g.major}
                {g.mid !== g.major ? ` · ${g.mid}` : ""}
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
                  <h3>{item.item_name}</h3>
                </article>
              ))}
            </div>
          ))}

      {selected && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="badge confidence-medium">정밀검사 대상</span>
            </div>
            <h3>{selected.item_name}</h3>
            <p className="meta">
              {selected.major_category}
              {selected.mid_category !== selected.major_category ? ` › ${selected.mid_category}` : ""}
            </p>
            <p className="reason">일반적인 비용 범위: {CATEGORY_RANGE[category]}</p>
            <p className="meta">
              정확한 검사항목과 견적은 아래 식품안전나라 검사기관별 시험항목 검색에서 확인하세요.
            </p>
            <a
              className="demo-link"
              href="https://www.foodsafetykorea.go.kr/portal/specialinfo/examFeeList.do"
              target="_blank"
              rel="noreferrer"
            >
              지정시험검사기관 검색 →
            </a>
          </article>
        </div>
      )}
    </section>
  );
}
