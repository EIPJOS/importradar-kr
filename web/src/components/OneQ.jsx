import React, { useState } from "react";
import { supabase, getTariffRates, fetchLiveRequirements } from "../lib/supabase.js";
import { ORIGINS } from "../lib/tariffRateSelect.js";
import { useT } from "../lib/i18n.jsx";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hs-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function classify(body, t) {
  const res = await fetch(FUNCTIONS_URL, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || t.requestFailed);
  return data;
}

export default function OneQ({ onSelect }) {
  const t = useT("oneQ");
  const RATE_LABELS = t.rateLabels;
  const PAIN_POINTS = t.painPoints;
  const STATS = t.stats;
  const FAQS = t.faqs;
  const [productName, setProductName] = useState("");
  const [material, setMaterial] = useState("");
  const [purpose, setPurpose] = useState("");
  const [country, setCountry] = useState("중국");
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [demoError, setDemoError] = useState(null);
  const [extra, setExtra] = useState(null); // { rates, requirements }
  const [answer, setAnswer] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const [form, setForm] = useState({ name: "", contact: "", email: "", message: "" });
  const [leadState, setLeadState] = useState("idle"); // idle | sending | done | error

  async function runDemo(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    setLoading(true);
    setDemoError(null);
    setDemoResult(null);
    setExtra(null);
    setAnswer("");
    try {
      const data = await classify({ productName, originCountry: country, language: "ko", material, purpose }, t);
      setDemoResult(data);
      const top = data.results?.[0];
      if (top) {
        const [rates, requirements] = await Promise.all([
          getTariffRates(top.hs_code).catch(() => []),
          fetchLiveRequirements(top.hs_code).catch(() => null),
        ]);
        setExtra({ rates, requirements: requirements?.requirements ?? [] });
      }
    } catch (err) {
      setDemoError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function reclassifyWithAnswer(e) {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    setDemoError(null);
    try {
      // 되묻는 질문이 재질/용도 중 어느 쪽이었는지 모르니 둘 다에 채워 넣는다 —
      // 프롬프트가 실제로 필요한 쪽만 참고하므로 결과에는 영향 없다.
      const data = await classify(
        {
          productName,
          originCountry: country,
          language: "ko",
          material: material || answer,
          purpose: purpose || answer,
        },
        t
      );
      setDemoResult(data);
      const top = data.results?.[0];
      if (top) {
        const [rates, requirements] = await Promise.all([
          getTariffRates(top.hs_code).catch(() => []),
          fetchLiveRequirements(top.hs_code).catch(() => null),
        ]);
        setExtra({ rates, requirements: requirements?.requirements ?? [] });
      }
    } catch (err) {
      setDemoError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLeadState("sending");
    try {
      const { error } = await supabase.from("leads").insert({ source: "oneq", ...form });
      if (error) throw error;
      setLeadState("done");
    } catch {
      setLeadState("error");
    }
  }

  const topPick = demoResult?.results?.[0];
  const isProvisional = demoResult?.status === "provisional";

  return (
    <section className="oneq">
      <div className="oneq-eyebrow">{t.eyebrow}</div>
      <h1 className="oneq-title">{t.title}</h1>
      <p className="oneq-sub">{t.sub}</p>

      <div className="oneq-pain-grid">
        {PAIN_POINTS.map((p) => (
          <div className="oneq-pain-card" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>
      <p className="oneq-pain-note">{t.painNote}</p>

      {/* ── 실제 작동하는 데모 (hs-classify 엔진 재사용) ── */}
      <div className="oneq-demo">
        <h2>{t.demoHeading}</h2>
        <p className="classify-note">{t.demoNote}</p>

        <div className="classify-split">
          <div className="classify-col-form">
            <form className="classify-form" onSubmit={runDemo}>
              <label className="classify-label">{t.productNameLabel}</label>
              <input
                className="browser-search"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t.productNamePlaceholder}
              />
              <label className="classify-label">{t.materialLabel}</label>
              <input className="browser-search" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder={t.materialPlaceholder} />
              <label className="classify-label">{t.purposeLabel}</label>
              <input className="browser-search" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t.purposePlaceholder} />
              <label className="classify-label">{t.originLabel}</label>
              <div className="chip-row">
                {ORIGINS.map((c) => (
                  <button type="button" key={c} className={`chip ${country === c ? "on" : ""}`} onClick={() => setCountry(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <button className="classify-submit" type="submit" disabled={loading}>
                {loading ? t.requestSending : t.requestSubmit}
              </button>
            </form>
            {demoError && <p className="error">{demoError}</p>}
          </div>

          <div className="classify-col-results">
            {!demoResult && !loading && (
              <div className="classify-empty-panel">
                <span className="icon">📡</span>
                <span>{t.emptyPrompt}</span>
              </div>
            )}
            {loading && (
              <div className="classify-empty-panel">
                <span className="icon">⏳</span>
                <span>{t.loadingPrompt}</span>
              </div>
            )}

            {demoResult && topPick && (
              <div className="classify-card">
                <div className="card-head">
                  <span className="demo-hs">{topPick.hs_code}</span>
                  <span className={`badge ${isProvisional ? "confidence-medium" : "confidence-high"}`}>
                    {isProvisional ? t.provisionalBadge : t.confirmedBadge}
                  </span>
                </div>
                <h3>{topPick.name_ko}</h3>
                <p className="meta">{topPick.name_en}</p>
                {topPick.reasoning && <p className="reason">{topPick.reasoning}</p>}

                {isProvisional && demoResult.clarifying_question && (
                  <div className="req-detail" style={{ marginTop: 10 }}>
                    <p>
                      <strong>{t.clarifyHeading}</strong>
                    </p>
                    <p className="reason">{demoResult.clarifying_question}</p>
                    <form onSubmit={reclassifyWithAnswer} className="chip-row" style={{ marginTop: 8 }}>
                      <input
                        className="browser-search"
                        style={{ flex: 1 }}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder={t.answerPlaceholder}
                      />
                      <button className="classify-submit" type="submit" disabled={loading} style={{ width: "auto", padding: "0 16px" }}>
                        {t.requeryBtn}
                      </button>
                    </form>
                  </div>
                )}

                {extra && (
                  <>
                    {extra.rates.length > 0 ? (
                      <div className="chip-row" style={{ marginTop: 10 }}>
                        {extra.rates
                          .filter((r) => RATE_LABELS[r.rate_type] && r.rate_percent != null)
                          .map((r) => (
                            <span key={r.rate_type} className="chip">
                              {RATE_LABELS[r.rate_type]} {r.rate_percent}%
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className="meta" style={{ marginTop: 10 }}>
                        {t.noRateInfo}
                      </p>
                    )}
                    {extra.requirements.length > 0 ? (
                      <p className="reason" style={{ marginTop: 8 }}>
                        {t.reqCount(extra.requirements.length)} {extra.requirements.map((req) => req.law_name).filter(Boolean).join(", ")}
                      </p>
                    ) : (
                      <p className="meta" style={{ marginTop: 8 }}>
                        {t.noReqInfo}
                      </p>
                    )}
                  </>
                )}

                <button className="demo-link" onClick={() => onSelect(topPick.hs_code)}>
                  {t.viewFullBtn}
                </button>
              </div>
            )}

            {demoResult && !topPick && (
              <div className="classify-empty-panel">
                <span className="icon">🔍</span>
                <span>{demoResult.note ?? t.noMatchNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 신뢰 지표 (실제 수치만) ── */}
      <div className="oneq-stats">
        {STATS.map((s) => (
          <div className="oneq-stat" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="oneq-honesty-note">{t.honestyNote}</p>

      {/* ── FAQ ── */}
      <div className="oneq-faq">
        <h2>{t.faqHeading}</h2>
        {FAQS.map((f, i) => (
          <div className="faq-item" key={f.q}>
            <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span>{f.q}</span>
              <span className={`chevron ${openFaq === i ? "open" : ""}`}>▾</span>
            </button>
            <div className={`faq-collapse ${openFaq === i ? "open" : ""}`}>
              <div className="faq-collapse-inner">
                <p className="faq-a">{f.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 문의 폼 (실제 저장됨) ── */}
      <div className="oneq-cta">
        <h2>{t.ctaHeading}</h2>
        <p>{t.ctaBody}</p>

        <div className="oneq-contact-row">
          <a className="oneq-contact-btn" href="mailto:hyein.yu@jnbglobal.kr">✉ hyein.yu@jnbglobal.kr</a>
          <a className="oneq-contact-btn" href="tel:032-834-7188">☎ 032-834-7188</a>
        </div>
        <p className="oneq-contact-meta">{t.contactMeta}</p>

        {leadState === "done" ? (
          <p className="oneq-lead-done">{t.leadDone}</p>
        ) : (
          <form className="oneq-lead-form" onSubmit={submitLead}>
            <input placeholder={t.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder={t.contactPlaceholder} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <input placeholder={t.emailPlaceholder} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <textarea placeholder={t.messagePlaceholder} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
            <button className="classify-submit" type="submit" disabled={leadState === "sending"}>
              {leadState === "sending" ? t.sendingBtn : t.sendBtn}
            </button>
            {leadState === "error" && <p className="error">{t.sendError}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
