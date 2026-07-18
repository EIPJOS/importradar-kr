import React from "react";
import { useT } from "../lib/i18n.jsx";

export default function AboutCompany() {
  const t = useT("about");
  const FOCUS_AREAS = t.focusAreas;

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>{t.pageTitle}</h2>
        <span className="browser-count">{t.companyName}</span>
      </div>

      <div className="classify-results">
        <article className="classify-card">
          <div className="card-head">
            <span className="badge confidence-high">{t.badgeIntro}</span>
          </div>
          <h3>{t.introTitle}</h3>
          <p className="reason">{t.introBody}</p>
        </article>

        <article className="classify-card">
          <h3>{t.focusTitle}</h3>
          <div className="chip-row">
            {FOCUS_AREAS.map((area) => (
              <span key={area} className="chip">
                {area}
              </span>
            ))}
          </div>
        </article>

        <article className="classify-card">
          <div className="card-head">
            <span className="badge confidence-medium">{t.badgeContact}</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <img
              src="/hyein-yu-portrait.jpg"
              alt={t.portraitAlt}
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
            <div>
              <h3 style={{ marginTop: 0 }}>{t.staffName}</h3>
              <p className="meta">{t.staffTitle}</p>
            </div>
          </div>
        </article>

        <article className="classify-card">
          <h3>{t.contactTitle}</h3>
          <p className="reason">
            {t.phoneLabel} {t.phone}
            <br />
            {t.emailLabel} {t.email}
            <br />
            {t.addressLabel} {t.address}
          </p>
          <a className="demo-link" href="https://jnbglobal.kr" target="_blank" rel="noreferrer">
            {t.homepageLink}
          </a>
        </article>
      </div>
    </section>
  );
}
