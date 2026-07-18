import React, { useEffect, useRef, useState } from "react";
import { browseHsCodes, browseHsCodesInChapter, getChapterCounts } from "../lib/supabase.js";
import { HS_SECTIONS, findChapterName } from "../lib/hsSections.js";
import { useT } from "../lib/i18n.jsx";

const fmtHS = (hs) =>
  hs && hs.length >= 6 ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}` : hs;

function ResultTable({ rows, onSelect }) {
  const t = useT("hsBrowser");
  return (
    <table className="browser-table">
      <thead>
        <tr>
          <th>{t.colHsCode}</th>
          <th>{t.colNameKo}</th>
          <th>{t.colNameEn}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.hs_code} onClick={() => onSelect(r.hs_code)} className="clickable">
            <td className="hs">{fmtHS(r.hs_code)}</td>
            <td>{r.name_ko ?? "—"}</td>
            <td className="en">{r.name_en ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function HsCodeBrowser({ onSelect }) {
  const t = useT("hsBrowser");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const [chapterCounts, setChapterCounts] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [chapter, setChapter] = useState(null); // 선택된 류(2자리)
  const [chapterQ, setChapterQ] = useState("");
  const [chapterRows, setChapterRows] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const chapterDebounceRef = useRef(null);

  useEffect(() => {
    getChapterCounts()
      .then(setChapterCounts)
      .catch(() => setChapterCounts(new Map()));
  }, []);

  useEffect(() => {
    if (chapter) return; // 류 탐색 모드일 땐 전체검색 안 함
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setRows(await browseHsCodes(q));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [q, chapter]);

  useEffect(() => {
    if (!chapter) return;
    setChapterLoading(true);
    clearTimeout(chapterDebounceRef.current);
    chapterDebounceRef.current = setTimeout(async () => {
      try {
        setChapterRows(await browseHsCodesInChapter(chapter, chapterQ));
      } finally {
        setChapterLoading(false);
      }
    }, 250);
    return () => clearTimeout(chapterDebounceRef.current);
  }, [chapter, chapterQ]);

  function openChapter(no) {
    setChapter(no);
    setChapterQ("");
  }

  function backToBrowse() {
    setChapter(null);
    setChapterQ("");
  }

  // ── 류(chapter) 상세 화면 ──
  if (chapter) {
    return (
      <section className="browser">
        <div className="browser-head">
          <h2>
            {t.chapterTitle(Number(chapter))} {findChapterName(chapter)}
          </h2>
          <span className="browser-count">{t.count(chapterCounts?.get(chapter) ?? "—")}</span>
        </div>
        <button type="button" className="chip" onClick={backToBrowse} style={{ marginBottom: 10 }}>
          {t.backToBrowse}
        </button>
        <input
          className="browser-search"
          value={chapterQ}
          onChange={(e) => setChapterQ(e.target.value)}
          placeholder={t.chapterSearchPlaceholder}
          autoFocus
        />
        {chapterLoading && <p className="empty">{t.loading}</p>}
        {!chapterLoading && chapterRows.length === 0 && <p className="empty">{t.noResultsChapter}</p>}
        {!chapterLoading && chapterRows.length > 0 && <ResultTable rows={chapterRows} onSelect={onSelect} />}
        {!chapterLoading && chapterRows.length === 120 && (
          <p className="browser-more">{t.moreResultsChapter}</p>
        )}
      </section>
    );
  }

  // ── 검색어가 있으면 기존 전체 검색 결과 화면 ──
  if (q.trim()) {
    return (
      <section className="browser">
        <div className="browser-head">
          <h2>{t.title}</h2>
          <span className="browser-count">{t.searchingAll}</span>
        </div>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          autoFocus
        />
        {loading && <p className="empty">{t.loading}</p>}
        {!loading && rows.length === 0 && (
          <p className="empty">{t.noResultsSearch}</p>
        )}
        {!loading && rows.length > 0 && <ResultTable rows={rows} onSelect={onSelect} />}
        {!loading && rows.length === 60 && (
          <p className="browser-more">{t.moreResultsSearch}</p>
        )}
      </section>
    );
  }

  // ── 기본 화면: 부→류 계층 탐색 + 자주 조회되는 품목 ──
  return (
    <section className="browser">
      <div className="browser-head">
        <h2>{t.title}</h2>
        <span className="browser-count">{t.hierarchySubtitle}</span>
      </div>

      <input
        className="browser-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.searchPlaceholder}
        autoFocus
      />

      <div className="section-list" style={{ marginTop: 16 }}>
        {HS_SECTIONS.map((section) => (
          <React.Fragment key={section.no}>
            <button
              type="button"
              className="section-row"
              onClick={() => setOpenSection(openSection === section.no ? null : section.no)}
            >
              <span className="no">{t.sectionLabel(section.no)}</span>
              <span className="name">{section.name}</span>
              <span className={`chevron ${openSection === section.no ? "open" : ""}`}>▾</span>
            </button>
            {openSection === section.no && (
              <div className="chapter-sublist">
                {section.chapters.map((c) => (
                  <button type="button" key={c.no} className="chapter-row" onClick={() => openChapter(c.no)}>
                    <span className="no">{t.chapterLabel(c.no)}</span>
                    <span className="name">{c.name}</span>
                    <span className="count">{chapterCounts?.get(c.no) ? t.count(chapterCounts.get(c.no)) : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {loading && <p className="empty">{t.loading}</p>}
      {!loading && rows.length > 0 && (
        <>
          <p className="classify-note" style={{ marginTop: 16 }}>
            {t.frequentItems}
          </p>
          <ResultTable rows={rows} onSelect={onSelect} />
        </>
      )}
    </section>
  );
}
