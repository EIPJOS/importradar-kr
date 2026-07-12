import React, { useEffect, useRef, useState } from "react";
import { browseHsCodes } from "../lib/supabase.js";

const fmtHS = (hs) =>
  hs && hs.length >= 6 ? `${hs.slice(0, 4)}.${hs.slice(4, 6)}${hs.length > 6 ? "-" + hs.slice(6) : ""}` : hs;

export default function HsCodeBrowser({ onSelect }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
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
  }, [q]);

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

      {!loading && rows.length > 0 && (
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
      )}
      {!loading && rows.length === 60 && (
        <p className="browser-more">상위 60건만 표시됩니다 — 검색어를 더 구체적으로 입력해 좁혀보세요.</p>
      )}
    </section>
  );
}
