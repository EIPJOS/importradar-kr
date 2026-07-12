import React, { useState } from "react";
import { searchUnified } from "./lib/supabase.js";
import Seal from "./components/Seal.jsx";

const fmtHS = (hs) =>
  hs && hs.length >= 6
    ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}`
    : hs;

const fmtDate = (d) => (d ? d.replaceAll("-", ".") : "미상");

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
  const isLiveVerified = result?.requirementsSource === "live";

  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead-inner">
          <Seal size={104} className="masthead-seal" />
          <div className="partner-credit">
            <img src="/jnb-logo.png" alt="제이앤비관세사무소" />
            <span>제이앤비관세사무소가 함께합니다</span>
          </div>
          <p className="eyebrow">IMPORT RADAR · KOREA CUSTOMS DATA</p>
          <h1 className="brand">수입레이더</h1>
          <p className="tagline">HS코드 또는 품목명 하나로 수입요건·부적합이력·법령 개정을 한 화면에서 확인합니다</p>
        </div>
      </header>

      <main className="content">
        <form className="search" onSubmit={onSearch}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="HS코드(예: 0202) 또는 품목명(예: 냉동 쇠고기)"
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? "조회 중" : "조회"}
          </button>
        </form>

        {error && <p className="error">조회에 실패했습니다: {error}</p>}

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
                {isLiveVerified && req.length > 0 && (
                  <div className="verify-strip">
                    <Seal size={30} ringText="VERIFIED · REAL-TIME" center="檢" />
                    <span>관세청 원본 데이터를 지금 이 순간 실시간으로 조회했습니다</span>
                  </div>
                )}
                {req.length === 0 && (
                  <p className="empty">
                    해당 HS코드에 등록된 세관장확인 요건이 없습니다. 코드 앞자리(류·호 단위)로 다시 검색해 보세요.
                  </p>
                )}
                {req.length > 0 && (
                  <table>
                    <thead>
                      <tr>
                        <th>HS부호</th>
                        <th>확인법령</th>
                        <th>요건승인기관</th>
                        <th>적용시작</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.map((r, i) => (
                        <tr key={r.id ?? i}>
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
                {hist.length === 0 && <p className="empty">등록된 부적합·회수 이력이 없습니다.</p>}
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
                      {[h.origin_country, h.company_name].filter(Boolean).join(" · ") || "업체 정보 미공개"}
                    </p>
                    <p className="reason">{h.reason_summary ?? h.reason ?? "사유 미공개"}</p>
                  </article>
                ))}
              </section>
            )}

            {tab === "reg" && (
              <section className="cards">
                {regs.length === 0 && <p className="empty">최근 90일 내 관련 법령 개정 이력이 없습니다.</p>}
                {regs.map((g) => (
                  <article key={g.id} className="card">
                    <div className="card-head">
                      <span className="badge law">{g.amendment_type ?? "개정"}</span>
                      <time>시행 {fmtDate(g.effective_on)}</time>
                    </div>
                    <h3>
                      {g.detail_url ? (
                        <a href={g.detail_url} target="_blank" rel="noreferrer">
                          {g.law_name}
                        </a>
                      ) : (
                        g.law_name
                      )}
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
          <div className="hint">
            <p>
              데이터 출처: 관세청 세관장확인대상물품 · 식약처 수입식품 부적합/회수 · 법제처 국가법령정보.
            </p>
            <p>수입요건은 검색 시점에 관세청 원본을 실시간으로 조회하며, 부적합·회수·법령은 매일 자동 갱신됩니다.</p>
          </div>
        )}
      </main>

      <footer>
        <img src="/jnb-logo.png" alt="제이앤비관세사무소" className="footer-logo" />
        <span>© {new Date().getFullYear()} 수입레이더 · ImportRadar KR · 제이앤비관세사무소</span>
        <span className="disclaimer">
          본 서비스는 참고용이며 법적 효력이 없습니다. 최종 확인은 유니패스·식품안전나라·국가법령정보센터 원문을 기준으로 하시기 바랍니다.
        </span>
      </footer>
    </div>
  );
}
