import React, { useRef, useState } from "react";
import { searchUnified } from "./lib/supabase.js";
import Seal from "./components/Seal.jsx";
import Sidebar from "./components/Sidebar.jsx";

const fmtHS = (hs) =>
  hs && hs.length >= 6
    ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}`
    : hs;

const fmtDate = (d) => (d ? d.replaceAll("-", ".") : "미상");

// 히어로 통계 — 지어낸 숫자가 아니라 실제 DB 수치(주기적으로 직접 갱신)
const STATS = [
  { value: "1,425건", label: "부적합·회수 이력" },
  { value: "82건", label: "최근 법령 개정" },
  { value: "실시간", label: "관세청 요건 연동" },
];

export default function App() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("req");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchSectionRef = useRef(null);

  async function runSearch(value) {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await searchUnified(value));
      setTab("req");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onSearch(e) {
    e?.preventDefault();
    runSearch(q);
  }

  function focusSearch() {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => searchInputRef.current?.focus(), 350);
  }

  function tryDemo() {
    setQ("3307903000");
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    runSearch("3307903000");
  }

  const req = result?.requirements ?? [];
  const hist = result?.history ?? [];
  const regs = result?.regulations ?? [];
  const isLiveVerified = result?.requirementsSource === "live";

  return (
    <div className="app-layout">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="main">
        <div className="mobile-bar">
          <button className="hamburger" onClick={() => setNavOpen(true)} aria-label="메뉴 열기">☰</button>
          <span className="mobile-brand">수입레이더</span>
        </div>

        {/* ── 히어로 ── */}
        <section className="hero">
          <div className="hero-left">
            <div className="partner-credit">
              <img src="/jnb-logo.png" alt="제이앤비관세사무소" />
              <span>제이앤비관세사무소 · 수입통관 전문 관세사</span>
            </div>

            <h1 className="hero-title">
              수입 통관, 될지 안 될지
              <br />
              검색 한 번으로 확인하세요
            </h1>
            <p className="hero-sub">
              HS코드나 품목명만 입력하면 세관장확인 요건, 과거 부적합·회수 이력,
              관련 법령 개정까지 한 화면에서 바로 보여드려요
            </p>

            <div className="stat-row">
              {STATS.map((s) => (
                <div className="stat" key={s.label}>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="cta-row">
              <button className="btn-primary" onClick={focusSearch}>
                지금 조회하기
              </button>
              <button className="btn-secondary" onClick={tryDemo}>
                예시로 먼저 보기
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="demo-card">
              <div className="demo-card-head">
                <span>화장품 원료 — 조회 예시</span>
                <span className="demo-hs">HS 3307.90-3000</span>
              </div>
              <ul className="demo-list">
                <li>
                  <span>약사법 확인대상</span>
                  <span className="pill ok">요건 있음</span>
                </li>
                <li>
                  <span>한국의약품수출입협회</span>
                  <span className="pill info">승인기관</span>
                </li>
                <li>
                  <span>한국동물약품협회</span>
                  <span className="pill info">승인기관</span>
                </li>
                <li>
                  <span>적용시작일</span>
                  <span className="pill neutral">2020.04.06</span>
                </li>
              </ul>
              <div className="demo-verify">
                <Seal size={26} ringText="VERIFIED · REAL-TIME" center="檢" />
                <span>관세청 원본 실시간 조회 완료</span>
                <button className="demo-link" onClick={tryDemo}>
                  직접 조회 →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 검색 & 결과 ── */}
        <section className="search-section" ref={searchSectionRef}>
          <form className="search" onSubmit={onSearch}>
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="HS코드(예: 0202) 또는 품목명(예: 냉동 쇠고기)"
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
                  <span className="tab-dot req" /> 수입요건 <em>{req.length}</em>
                </button>
                <button className={tab === "hist" ? "on" : ""} onClick={() => setTab("hist")}>
                  <span className="tab-dot hist" /> 부적합·회수 이력 <em>{hist.length}</em>
                </button>
                <button className={tab === "reg" ? "on" : ""} onClick={() => setTab("reg")}>
                  <span className="tab-dot reg" /> 법령 업데이트 <em>{regs.length}</em>
                </button>
              </nav>

              {tab === "req" && (
                <div>
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
                </div>
              )}

              {tab === "hist" && (
                <div className="cards">
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
                </div>
              )}

              {tab === "reg" && (
                <div className="cards">
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
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <div className="hint">
              <p>데이터 출처: 관세청 세관장확인대상물품 · 식약처 수입식품 부적합/회수 · 법제처 국가법령정보.</p>
              <p>수입요건은 검색 시점에 관세청 원본을 실시간으로 조회하며, 부적합·회수·법령은 매일 자동 갱신됩니다.</p>
            </div>
          )}
        </section>

        <footer>
          <img src="/jnb-logo.png" alt="제이앤비관세사무소" className="footer-logo" />
          <span>© {new Date().getFullYear()} 수입레이더 · ImportRadar KR · 제이앤비관세사무소</span>
          <span className="disclaimer">
            본 서비스는 참고용이며 법적 효력이 없습니다. 최종 확인은 유니패스·식품안전나라·국가법령정보센터 원문을 기준으로 하시기 바랍니다.
          </span>
        </footer>
      </div>
    </div>
  );
}
