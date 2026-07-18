import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useT, useLang, LANGS } from "../lib/i18n.jsx";

function NavGroup({ group, defaultOpen, view, onNavigate, soonLabel, soonTitle }) {
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
                  <button className="nav-item soon" disabled title={soonTitle}>
                    <span>{item.label}</span>
                    <span className="soon-tag">{soonLabel}</span>
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
  const t = useT("common");
  const lang = useLang();

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img src="/jnb-logo.png" alt={t.logoAlt} />
          <span>{t.brand}</span>
        </div>

        <div className="lang-switch-group">
          {LANGS.map((l) => (
            <Link key={l} to={`/${l}`} className={`lang-switch ${l === lang ? "active" : ""}`}>
              {t.langSwitch[l]}
            </Link>
          ))}
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item top ${view === "home" ? "on" : ""}`} onClick={() => onNavigate("home")}>
            {t.navHome}
          </button>
          <button className={`nav-item top ${view === "about" ? "on" : ""}`} onClick={() => onNavigate("about")}>
            {t.navAbout}
          </button>

          {t.navGroups.map((g) => (
            <NavGroup
              key={g.label}
              group={g}
              defaultOpen
              view={view}
              onNavigate={onNavigate}
              soonLabel={t.soonLabel}
              soonTitle={t.soonTitle}
            />
          ))}
        </nav>

        <div className="sidebar-foot">{t.footer(new Date().getFullYear())}</div>
      </aside>
    </>
  );
}
