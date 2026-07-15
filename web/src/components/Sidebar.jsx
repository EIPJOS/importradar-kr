import React, { useState } from "react";

// 포켓커스텀 사이드바 구조를 그대로 따르되, 아직 없는 기능은 "준비중"으로
// 정직하게 표시한다(가짜로 작동하는 척하지 않음). soon:false인 항목만 실제 작동한다.
const NAV_GROUPS = [
  {
    label: "HS CODE",
    items: [
      { label: "빠른 HS CODE 분류", soon: false, id: "classify" },
      { label: "분류표 보기", soon: false, id: "browse" },
      { label: "원큐 (One Queue) - B2B API", soon: false, id: "oneq" },
    ],
  },
  {
    label: "도구",
    items: [
      { label: "수입 관부가세 계산기", soon: false, id: "calc" },
      { label: "KC 인증대상 확인", soon: false, id: "kc" },
    ],
  },
  {
    label: "식품검역",
    items: [
      { label: "식품유형 확인", soon: true },
      { label: "정밀검사비용 확인", soon: true },
      { label: "영양성분 입력대상 확인", soon: true },
      { label: "영양성분 퍼센트 계산", soon: true },
    ],
  },
  {
    label: "수입식품 검역 의뢰",
    items: [{ label: "가공식품 의뢰", soon: true }],
  },
];

function NavGroup({ group, defaultOpen, view, onNavigate }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="nav-group">
      <button className="nav-group-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{group.label}</span>
        <span className={`chevron ${open ? "open" : ""}`}>▾</span>
      </button>
      <div className={`nav-group-collapse ${open ? "open" : ""}`}>
        <div className="nav-group-collapse-inner">
          <ul className="nav-group-list">
            {group.items.map((item) =>
              item.soon ? (
                <li key={item.label}>
                  <button className="nav-item soon" disabled title="준비 중인 기능입니다">
                    <span>{item.label}</span>
                    <span className="soon-tag">준비중</span>
                  </button>
                </li>
              ) : (
                <li key={item.label}>
                  <button
                    className={`nav-item active-link ${view === item.id ? "on" : ""}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose, view, onNavigate }) {
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img src="/jnb-logo.png" alt="제이앤비관세사무소" />
          <span>통관메이트</span>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item top ${view === "home" ? "on" : ""}`} onClick={() => onNavigate("home")}>
            홈
          </button>
          <button className="nav-item top soon" disabled title="준비 중인 기능입니다">
            회사소개 <span className="soon-tag">준비중</span>
          </button>

          {NAV_GROUPS.map((g, i) => (
            <NavGroup key={g.label} group={g} defaultOpen={i === 0} view={view} onNavigate={onNavigate} />
          ))}
        </nav>

        <div className="sidebar-foot">© {new Date().getFullYear()} 제이앤비관세사무소</div>
      </aside>
    </>
  );
}
