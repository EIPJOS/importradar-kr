import React, { useEffect, useState } from "react";
import { browseInspectionCosts, searchInspectionCosts } from "../lib/supabase.js";

const CATEGORY_LABEL = { food: "가공식품", container: "기구·용기등" };
const won = (n) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

export default function InspectionCostCheck() {
  const [category, setCategory] = useState("food");
  const [groups, setGroups] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setGroups(null);
    setOpenKey(null);
    setSearchResults(null);
    setQ("");
    browseInspectionCosts(category)
      .then(setGroups)
      .catch((err) => setError(err.message));
  }, [category]);

  async function onSubmit(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      setSearchResults(await searchInspectionCosts(query, category));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function addItem(row) {
    setSelected((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
  }

  function removeItem(id) {
    setSelected((prev) => prev.filter((r) => r.id !== id));
  }

  const total = selected.reduce((sum, r) => sum + r.cost_krw, 0);

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>정밀검사비용 확인</h2>
        <span className="browser-count">식품유형·재질별 정밀검사 예상비용 · 224개 항목</span>
      </div>
      <p className="classify-note">
        식품유형 또는 기구·용기 재질을 선택하면 정밀검사 예상비용을 확인할 수 있습니다. 여러 항목을
        추가하면 합산 비용이 계산됩니다. 실제 검사비용은 검사기관에 따라 달라질 수 있으니
        참고용으로만 사용하세요.
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
            <article key={r.id} className="classify-card" onClick={() => addItem(r)} style={{ cursor: "pointer" }}>
              <div className="card-head">
                <span className="badge confidence-high">{won(r.cost_krw)}</span>
              </div>
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
                  onClick={() => addItem(item)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-head">
                    <span className="badge confidence-high">{won(item.cost_krw)}</span>
                  </div>
                  <h3>{item.item_name}</h3>
                </article>
              ))}
            </div>
          ))}

      {selected.length > 0 && (
        <div className="classify-results">
          <p className="classify-note">선택한 항목 ({selected.length}건)</p>
          <table>
            <tbody>
              {selected.map((r) => (
                <tr key={r.id}>
                  <td>{r.item_name}</td>
                  <td className="num">{won(r.cost_krw)}</td>
                  <td>
                    <button type="button" className="demo-link" onClick={() => removeItem(r.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>총 예상 비용</strong>
                </td>
                <td className="num">
                  <strong>{won(total)}</strong>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
          <p className="meta">
            포함된 원재료 또는 제조공정에 따라 검사항목이 추가되거나 삭제될 수 있습니다. 실제 검사비용은
            검사기관에 따라 달라질 수 있으니 예상 비용으로만 참고하시기 바랍니다.
          </p>
        </div>
      )}
    </section>
  );
}
