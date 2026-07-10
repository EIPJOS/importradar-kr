import React, { useState } from "react";
import { searchUnified } from "./lib/supabase.js";

const fmtHS = (hs) =>
  hs && hs.length >= 6
    ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}`
    : hs;

const fmtDate = (d) => (d ? d.replaceAll("-", ".") : "—");

export default function App() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("req");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSearch(e) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await searchUnified(q));
      setTab("req");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const req = result?.requirements ?? [];
  const hist = result?.history ?? [];
  const regs = result?.regulations ?? [];

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark">▲</span> 수입레이더
          <span className="brand-sub">ImportRadar KR</span>
        </div>
        <p className="tagline">HS코드·품목명 하나로 수입요건 / 부적합 이력 / 법령 개정 통합 조회</p>
      </header>

      <form className="search" onSubmit={onSearch}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="HS코드(예: 0202) 또는 품목명(예: 냉동 쇠고기)"
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? "조회 중…" : "조회"}
        </button>
      </form>

      {error && <p className="error">조회 실패: {error}</p>}

      {result && (
        <>
          <nav className="tabs">
            <button className={tab === "req" ? "on" : ""} onClick={() => setTab("req")}>
              수입요건 <em>{req.length}</em>
            </button>
            <button className={tab === "hist" ? "on" : ""} onClick={() => setTab("hist")}>
              부적합·회수 이력 <em>{hist.length}</em>
            </button>
            <button className={tab === "reg" ? "on" : ""} onClick={() => setTab("reg")}>
              법령 업데이트 <em>{regs.length}</em>
            </button>
          </nav>

          {tab === "req" && (
            <section>
              {req.length === 0 && <p className="empty">해당 HS코드의 세관장확인 요건이 없습니다. 코드 앞자리(류/호)로 다시 검색해 보세요.</p>}
              {req.length > 0 && (
                <table>
                  <thead>
                    <tr><th>HS부호</th><th>확인법령</th><th>요건승인기관</th><th>적용시작</th></tr>
                  </thead>
                  <tbody>
                    {req.map((r) => (
                      <tr key={r.id}>
                        <td className="hs">{fmtHS(r.hs_code)}</td>
                        <td>{r.law_name}</td>
                        <td>{r.agency_name}</td>
                        <td className="num">{fmtDate(r.effective_from)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {tab === "hist" && (
            <section className="cards">
              {hist.length === 0 && <p className="empty">부적합·회수 이력이 없습니다.</p>}
              {hist.map((h) => (
                <article key={h.id} className={`card ${h.source}`}>
                  <div className="card-head">
                    <span className={`badge ${h.source}`}>
                      {h.source === "rejection" ? "통관 부적합" : `회수${h.recall_grade ? " · " + h.recall_grade : ""}`}
                    </span>
                    <time>{fmtDate(h.event_date)}</time>
                  </div>
                  <h3>{h.product_name}</h3>
                  <p className="meta">
                    {[h.origin_country, h.company_name].filter(Boolean).join(" · ")}
                  </p>
                  <p className="reason">{h.reason_summary ?? h.reason}</p>
                </article>
              ))}
            </section>
          )}

          {tab === "reg" && (
            <section className="cards">
              {regs.length === 0 && <p className="empty">관련 법령 개정 이력이 없습니다.</p>}
              {regs.map((g) => (
                <article key={g.id} className="card">
                  <div className="card-head">
                    <span className="badge law">{g.amendment_type ?? "개정"}</span>
                    <time>시행 {fmtDate(g.effective_on)}</time>
                  </div>
                  <h3>
                    {g.detail_url ? <a href={g.detail_url} target="_blank" rel="noreferrer">{g.law_name}</a> : g.law_name}
                  </h3>
                  <p className="meta">{g.ministry}</p>
                  {g.summary && <p className="reason">{g.summary}</p>}
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {!result && !loading && (
        <p className="hint">
          데이터 출처: 관세청 세관장확인대상물품 · 식약처 수입식품 부적합/회수 · 법제처 국가법령정보. 매일 자동 갱신.
        </p>
      )}

      <footer>
        <span>© {new Date().getFullYear()} ImportRadar KR</span>
        <span className="disclaimer">본 서비스는 참고용이며 법적 효력이 없습니다. 최종 확인은 유니패스·식품안전나라·국가법령정보센터 원문 기준.</span>
      </footer>
    </div>
  );
}
