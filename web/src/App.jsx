import React, { useEffect, useRef, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { searchUnified } from "./lib/supabase.js";
import Seal from "./components/Seal.jsx";
import Sidebar from "./components/Sidebar.jsx";
import HsCodeBrowser from "./components/HsCodeBrowser.jsx";
import QuickClassify from "./components/QuickClassify.jsx";
import OneQ from "./components/OneQ.jsx";
import DutyCalculator from "./components/DutyCalculator.jsx";
import KcCertCheck from "./components/KcCertCheck.jsx";
import FoodTypeCheck from "./components/FoodTypeCheck.jsx";
import InspectionCostCheck from "./components/InspectionCostCheck.jsx";
import NutritionRequirementCheck from "./components/NutritionRequirementCheck.jsx";
import NutritionPercentCalc from "./components/NutritionPercentCalc.jsx";
import QuarantineRequestForm from "./components/QuarantineRequestForm.jsx";
import AboutCompany from "./components/AboutCompany.jsx";
import { useT, LangContext } from "./lib/i18n.jsx";
import CONTENT from "./content/index.js";

const fmtHS = (hs) =>
  hs && hs.length >= 6
    ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}`
    : hs;

export default function AppRoute() {
  const { lang } = useParams();
  if (!CONTENT[lang]) return <Navigate to="/ko" replace />;
  return (
    <LangContext.Provider value={lang}>
      <App />
    </LangContext.Provider>
  );
}

function App() {
  const t = useT("home");
  const tc = useT("common");
  const fmtDate = (d) => (d ? d.replaceAll("-", ".") : t.dateUnknown);

  const [view, setView] = useState("home"); // "home" | "browse"
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("req");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchSectionRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = tc.meta.lang;
    document.title = tc.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", tc.meta.description);
  }, [tc]);

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
    if (view !== "home") setView("home");
    setTimeout(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      searchInputRef.current?.focus();
    }, 30);
  }

  function tryDemo() {
    setView("home");
    setQ("3307903000");
    setTimeout(() => searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    runSearch("3307903000");
  }

  function onNavigate(id) {
    setView(id);
    setNavOpen(false);
  }

  function onSelectHsCode(hsCode) {
    setView("home");
    setQ(hsCode);
    setTimeout(() => searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    runSearch(hsCode);
  }

  const req = result?.requirements ?? [];
  const hist = result?.history ?? [];
  const regs = result?.regulations ?? [];
  const isLiveVerified = result?.requirementsSource === "live";

  return (
    <div className="app-layout">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} view={view} onNavigate={onNavigate} />

      <div className="main">
        <div className="mobile-bar">
          <button className="hamburger" onClick={() => setNavOpen(true)} aria-label={tc.mobileMenuAria}>☰</button>
          <span className="mobile-brand">{tc.brand}</span>
        </div>

        {view === "browse" && (
          <div className="browse-page">
            <HsCodeBrowser onSelect={onSelectHsCode} />
          </div>
        )}

        {view === "classify" && (
          <div className="browse-page">
            <QuickClassify onSelect={onSelectHsCode} />
          </div>
        )}

        {view === "oneq" && (
          <div className="browse-page">
            <OneQ onSelect={onSelectHsCode} />
          </div>
        )}

        {view === "calc" && (
          <div className="browse-page">
            <DutyCalculator onSelect={onSelectHsCode} />
          </div>
        )}

        {view === "kc" && (
          <div className="browse-page">
            <KcCertCheck />
          </div>
        )}

        {view === "foodtype" && (
          <div className="browse-page">
            <FoodTypeCheck />
          </div>
        )}

        {view === "inspectioncost" && (
          <div className="browse-page">
            <InspectionCostCheck />
          </div>
        )}

        {view === "nutritionreq" && (
          <div className="browse-page">
            <NutritionRequirementCheck />
          </div>
        )}

        {view === "nutritionpct" && (
          <div className="browse-page">
            <NutritionPercentCalc />
          </div>
        )}

        {view === "quarantine" && (
          <div className="browse-page">
            <QuarantineRequestForm />
          </div>
        )}

        {view === "about" && (
          <div className="browse-page">
            <AboutCompany />
          </div>
        )}

        {view === "home" && (
          <>
            {/* ── 히어로 ── */}
            <section className="hero">
              <div className="hero-left">
                <div className="partner-credit">
                  <img src="/jnb-logo.png" alt={tc.logoAlt} />
                  <span>{t.partnerCredit}</span>
                </div>

                <h1 className="hero-title">
                  {t.heroTitle[0]}
                  <br />
                  {t.heroTitle[1]}
                </h1>
                <p className="hero-sub">{t.heroSub}</p>

                <div className="stat-row">
                  {t.stats.map((s) => (
                    <div className="stat" key={s.label}>
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="cta-row">
                  <button className="btn-primary" onClick={focusSearch}>
                    {t.ctaPrimary}
                  </button>
                  <button className="btn-secondary" onClick={tryDemo}>
                    {t.ctaSecondary}
                  </button>
                </div>
              </div>

              <div className="hero-right">
                <div className="demo-card">
                  <div className="demo-card-head">
                    <span>{t.demoHead}</span>
                    <span className="demo-hs">HS 3307.90-3000</span>
                  </div>
                  <ul className="demo-list">
                    {t.demoItems.map((d) => (
                      <li key={d.label}>
                        <span>{d.label}</span>
                        <span className={`pill ${d === t.demoItems[3] ? "neutral" : d === t.demoItems[0] ? "ok" : "info"}`}>{d.pill}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="demo-verify">
                    <Seal size={26} ringText="VERIFIED · REAL-TIME" center="檢" />
                    <span>{t.demoVerify}</span>
                    <button className="demo-link" onClick={tryDemo}>
                      {t.demoLink}
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
                  placeholder={t.searchPlaceholder}
                />
                <button type="submit" disabled={loading}>
                  {loading ? t.searchBtnLoading : t.searchBtn}
                </button>
              </form>

              {error && <p className="error">{t.errorPrefix}{error}</p>}

              {result && (
                <>
                  <nav className="tabs">
                    <button className={tab === "req" ? "on" : ""} onClick={() => setTab("req")}>
                      <span className="tab-dot req" /> {t.tabReq} <em>{req.length}</em>
                    </button>
                    <button className={tab === "hist" ? "on" : ""} onClick={() => setTab("hist")}>
                      <span className="tab-dot hist" /> {t.tabHist} <em>{hist.length}</em>
                    </button>
                    <button className={tab === "reg" ? "on" : ""} onClick={() => setTab("reg")}>
                      <span className="tab-dot reg" /> {t.tabReg} <em>{regs.length}</em>
                    </button>
                  </nav>

                  {tab === "req" && (
                    <div>
                      {isLiveVerified && req.length > 0 && (
                        <div className="verify-strip">
                          <Seal size={30} ringText="VERIFIED · REAL-TIME" center="檢" />
                          <span>{t.liveVerifiedStrip}</span>
                        </div>
                      )}
                      {req.length === 0 && (
                        <p className="empty">{t.emptyReq}</p>
                      )}
                      {req.length > 0 && (
                        <table>
                          <thead>
                            <tr>
                              <th>{t.reqTableHead[0]}</th>
                              <th>{t.reqTableHead[1]}</th>
                              <th>{t.reqTableHead[2]}</th>
                              <th>{t.reqTableHead[3]}</th>
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
                      {hist.length === 0 && <p className="empty">{t.emptyHist}</p>}
                      {hist.map((h) => (
                        <article key={h.id} className={`card ${h.source}`}>
                          <div className="card-head">
                            <span className={`badge ${h.source}`}>
                              {h.source === "rejection" ? t.badgeRejection : `${t.badgeRecall}${h.recall_grade ? " · " + h.recall_grade : ""}`}
                            </span>
                            <time>{fmtDate(h.event_date)}</time>
                          </div>
                          <h3>{h.product_name}</h3>
                          <p className="meta">
                            {[h.origin_country, h.company_name].filter(Boolean).join(" · ") || t.companyUnknown}
                          </p>
                          <p className="reason">{h.reason_summary ?? h.reason ?? t.reasonUnknown}</p>
                        </article>
                      ))}
                    </div>
                  )}

                  {tab === "reg" && (
                    <div className="cards">
                      {regs.length === 0 && <p className="empty">{t.emptyReg}</p>}
                      {regs.map((g) => (
                        <article key={g.id} className="card">
                          <div className="card-head">
                            <span className="badge law">{g.amendment_type ?? t.amendmentDefault}</span>
                            <time>{t.effectivePrefix}{fmtDate(g.effective_on)}</time>
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
                  <p>{t.hint1}</p>
                  <p>{t.hint2}</p>
                </div>
              )}
            </section>
          </>
        )}

        <footer>
          <img src="/jnb-logo-horizontal.png" alt={tc.logoAlt} className="footer-logo" />
          <span>{t.footerLine(new Date().getFullYear())}</span>
          <span className="disclaimer">{t.footerDisclaimer}</span>
        </footer>
      </div>
    </div>
  );
}
