import React, { useEffect, useRef, useState } from "react";
import { browseHsCodes, browseHsCodesInChapter, getChapterCounts } from "../lib/supabase.js";
import { HS_SECTIONS, findChapterName } from "../lib/hsSections.js";

const fmtHS = (hs) =>
  hs && hs.length >= 6 ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}` : hs;

function ResultTable({ rows, onSelect }) {
  return (
    <table className="browser-table">
      <thead>
        <tr>
          <th>HS부호</th>
          <th>한글품목명</th>
          <th>영문품목명</th>
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
            제{Number(chapter)}류 {findChapterName(chapter)}
          </h2>
          <span className="browser-count">{chapterCounts?.get(chapter) ?? "—"}건</span>
        </div>
        <button type="button" className="chip" onClick={backToBrowse} style={{ marginBottom: 10 }}>
          ← 부·류 목록으로
        </button>
        <input
          className="browser-search"
          value={chapterQ}
          onChange={(e) => setChapterQ(e.target.value)}
          placeholder="이 류 안에서 코드 또는 품목명으로 검색"
          autoFocus
        />
        {chapterLoading && <p className="empty">불러오는 중…</p>}
        {!chapterLoading && chapterRows.length === 0 && <p className="empty">일치하는 HS코드가 없습니다.</p>}
        {!chapterLoading && chapterRows.length > 0 && <ResultTable rows={chapterRows} onSelect={onSelect} />}
        {!chapterLoading && chapterRows.length === 120 && (
          <p className="browser-more">상위 120건만 표시됩니다 — 검색어로 좁혀보세요.</p>
        )}
      </section>
    );
  }

  // ── 검색어가 있으면 기존 전체 검색 결과 화면 ──
  if (q.trim()) {
    return (
      <section className="browser">
        <div className="browser-head">
          <h2>HS코드 분류표</h2>
          <span className="browser-count">전체 12,469건 중 검색</span>
        </div>
        <input
          className="browser-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="HS코드 앞자리(예: 0202) 또는 품목명(예: 냉동)으로 검색"
          autoFocus
        />
        {loading && <p className="empty">불러오는 중…</p>}
        {!loading && rows.length === 0 && (
          <p className="empty">일치하는 HS코드가 없습니다. 검색어를 줄이거나 코드 앞자리로 시도해 보세요.</p>
        )}
        {!loading && rows.length > 0 && <ResultTable rows={rows} onSelect={onSelect} />}
        {!loading && rows.length === 60 && (
          <p className="browser-more">상위 60건만 표시됩니다 — 검색어를 더 구체적으로 입력해 좁혀보세요.</p>
        )}
      </section>
    );
  }

  // ── 기본 화면: 부→류 계층 탐색 + 자주 조회되는 품목 ──
  return (
    <section className="browser">
      <div className="browser-head">
        <h2>HS코드 분류표</h2>
        <span className="browser-count">부(21개)·류(97개) 계층 탐색</span>
      </div>

      <input
        className="browser-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="HS코드 앞자리(예: 0202) 또는 품목명(예: 냉동)으로 검색"
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
              <span className="no">제{section.no}부</span>
              <span className="name">{section.name}</span>
              <span className={`chevron ${openSection === section.no ? "open" : ""}`}>▾</span>
            </button>
            {openSection === section.no && (
              <div className="chapter-sublist">
                {section.chapters.map((c) => (
                  <button type="button" key={c.no} className="chapter-row" onClick={() => openChapter(c.no)}>
                    <span className="no">{c.no}류</span>
                    <span className="name">{c.name}</span>
                    <span className="count">{chapterCounts?.get(c.no) ? `${chapterCounts.get(c.no)}건` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {loading && <p className="empty">불러오는 중…</p>}
      {!loading && rows.length > 0 && (
        <>
          <p className="classify-note" style={{ marginTop: 16 }}>
            자주 조회되는 품목
          </p>
          <ResultTable rows={rows} onSelect={onSelect} />
        </>
      )}
    </section>
  );
}
