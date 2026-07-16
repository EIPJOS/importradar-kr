import React, { useState } from "react";
import { supabase, getTariffRates, fetchLiveRequirements } from "../lib/supabase.js";
import { ORIGINS } from "../lib/tariffRateSelect.js";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hs-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const RATE_LABELS = {
  A: "기본",
  C: "WTO",
  FCN1: "한중FTA",
  FUS1: "한미FTA",
  FEU1: "한EU FTA",
  FVN1: "한베트남FTA",
  FAS1: "한아세안FTA",
  FRCJP1: "RCEP(한일)",
};

const PAIN_POINTS = [
  {
    title: "모호한 제품명",
    body: "고객은 “이어폰”, “히터”, “컵”처럼 짧게만 적습니다. 그 한 단어로 카테고리를 직접 고르게 하면, 잘못된 선택이 그대로 신고로 이어집니다.",
  },
  {
    title: "카테고리 오선택 → 분류 오류",
    body: "카테고리 하나를 잘못 고르면 요건도 함께 틀어집니다. 오분류의 책임은 결국 고객을 상대하는 쪽이 지게 됩니다.",
  },
  {
    title: "통관 지연 · 고객 이탈",
    body: "오분류로 통관이 지연되면 클레임과 재문의가 쌓이고, 응대 시간이 늘어날수록 고객은 다른 곳을 찾습니다.",
  },
];

const STATS = [
  { value: "12,469건", label: "HS코드 마스터(관세청)" },
  { value: "75,574건", label: "관세율 데이터(기본·WTO·FTA 6종)" },
  { value: "무제한", label: "무료 · 로그인 불필요" },
  { value: "실시간", label: "세관장확인 요건 연동" },
];

const FAQS = [
  {
    q: "confirmed와 provisional은 뭐가 다른가요?",
    a: "후보가 뚜렷하게 하나로 좁혀지면 confirmed(확정), “히터”처럼 재질·용도에 따라 다른 코드로 갈릴 수 있는 동명이물이면 provisional(잠정) + 확인 질문을 함께 드립니다. 잠정 배지일 때는 재질/용도를 채워 재조회하면 확정을 시도합니다.",
  },
  {
    q: "AI 분류와 실제 신고가 다를 수 있나요?",
    a: "네, 참고용입니다. 원큐는 관세청 공공데이터(HS코드 마스터 12,469건)에서 후보를 찾고 AI가 그 안에서 선택하는 방식이라 실존하지 않는 코드는 나오지 않지만, 관세사 실제 신고 이력으로 검증된 확정치는 아닙니다. 최종 신고 전 관세사 확인을 권장합니다.",
  },
  {
    q: "API로 연동할 수 있나요?",
    a: "지금은 웹 데모로 먼저 제공하고 있습니다. 배대지·포워더 시스템에 API로 직접 연동하고 싶으시면 아래 문의 폼으로 남겨주세요.",
  },
  {
    q: "세율과 수입요건도 같이 오나요?",
    a: "네. HS코드 후보마다 원산지 기준 관세율(기본·WTO·FTA)과 세관장확인 수입요건을 같은 응답에 함께 반환합니다.",
  },
  {
    q: "데이터는 어디서 오나요?",
    a: "관세청 세관장확인대상물품, HS코드 마스터, 품목번호별 관세율표, 식약처 수입식품 부적합·회수, 법제처 국가법령정보를 매일/매주 자동 수집하고, 여기에 Claude AI 분류 로직을 결합합니다.",
  },
];

async function classify(body) {
  const res = await fetch(FUNCTIONS_URL, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "요청 실패");
  return data;
}

export default function OneQ({ onSelect }) {
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
      const data = await classify({ productName, originCountry: country, language: "ko", material, purpose });
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
      const data = await classify({
        productName,
        originCountry: country,
        language: "ko",
        material: material || answer,
        purpose: purpose || answer,
      });
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
      <div className="oneq-eyebrow">B2B 연동 · 배대지/포워더 전용 (준비 중)</div>
      <h1 className="oneq-title">카테고리 선택 없이, 제품명 하나로 끝내세요</h1>
      <p className="oneq-sub">
        원큐(One Queue) API 한 번이면 HS코드 후보와 관세율, 수입요건까지 한 번에 돌아옵니다.
        애매한 품명은 카테고리 목록 대신 속성 1개만 되물어 확정을 시도합니다.
      </p>

      <div className="oneq-pain-grid">
        {PAIN_POINTS.map((p) => (
          <div className="oneq-pain-card" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>
      <p className="oneq-pain-note">
        원큐는 카테고리 선택 화면 자체를 없애는 걸 지향합니다. 제품명만 받고, 필요할 때만 속성을 되묻는 방식입니다.
      </p>

      {/* ── 실제 작동하는 데모 (hs-classify 엔진 재사용) ── */}
      <div className="oneq-demo">
        <h2>지금 바로 테스트해보기</h2>
        <p className="classify-note">아래는 실제로 작동하는 데모입니다 — API 요청 한 번으로 HS코드·관세율·수입요건이 함께 돌아옵니다.</p>

        <div className="classify-split">
          <div className="classify-col-form">
            <form className="classify-form" onSubmit={runDemo}>
              <label className="classify-label">제품명 *</label>
              <input
                className="browser-search"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="예: 히터, 무선 이어폰(블루투스)"
              />
              <label className="classify-label">재질 (선택)</label>
              <input className="browser-search" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="예: 플라스틱, 세라믹" />
              <label className="classify-label">용도 (선택)</label>
              <input className="browser-search" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="예: 가정용 실내난방, 산업용 설비" />
              <label className="classify-label">원산지 국가</label>
              <div className="chip-row">
                {ORIGINS.map((c) => (
                  <button type="button" key={c} className={`chip ${country === c ? "on" : ""}`} onClick={() => setCountry(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <button className="classify-submit" type="submit" disabled={loading}>
                {loading ? "요청 중…" : "API 요청 보내기"}
              </button>
            </form>
            {demoError && <p className="error">{demoError}</p>}
          </div>

          <div className="classify-col-results">
            {!demoResult && !loading && (
              <div className="classify-empty-panel">
                <span className="icon">📡</span>
                <span>제품명을 입력하고 API 요청을 보내주세요</span>
              </div>
            )}
            {loading && (
              <div className="classify-empty-panel">
                <span className="icon">⏳</span>
                <span>약 10초 내에 응답이 옵니다…</span>
              </div>
            )}

            {demoResult && topPick && (
              <div className="classify-card">
                <div className="card-head">
                  <span className="demo-hs">{topPick.hs_code}</span>
                  <span className={`badge ${isProvisional ? "confidence-medium" : "confidence-high"}`}>
                    {isProvisional ? "잠정 (provisional)" : "확정 (confirmed)"}
                  </span>
                </div>
                <h3>{topPick.name_ko}</h3>
                <p className="meta">{topPick.name_en}</p>
                {topPick.reasoning && <p className="reason">{topPick.reasoning}</p>}

                {isProvisional && demoResult.clarifying_question && (
                  <div className="req-detail" style={{ marginTop: 10 }}>
                    <p>
                      <strong>확정하려면 한 가지만 더 알려주세요</strong>
                    </p>
                    <p className="reason">{demoResult.clarifying_question}</p>
                    <form onSubmit={reclassifyWithAnswer} className="chip-row" style={{ marginTop: 8 }}>
                      <input
                        className="browser-search"
                        style={{ flex: 1 }}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="답변을 입력하세요"
                      />
                      <button className="classify-submit" type="submit" disabled={loading} style={{ width: "auto", padding: "0 16px" }}>
                        재조회
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
                        등록된 관세율 정보 없음
                      </p>
                    )}
                    {extra.requirements.length > 0 ? (
                      <p className="reason" style={{ marginTop: 8 }}>
                        수입요건 {extra.requirements.length}건: {extra.requirements.map((req) => req.law_name).filter(Boolean).join(", ")}
                      </p>
                    ) : (
                      <p className="meta" style={{ marginTop: 8 }}>
                        등록된 세관장확인 요건 없음
                      </p>
                    )}
                  </>
                )}

                <button className="demo-link" onClick={() => onSelect(topPick.hs_code)}>
                  이 코드로 수입요건 전체보기 →
                </button>
              </div>
            )}

            {demoResult && !topPick && (
              <div className="classify-empty-panel">
                <span className="icon">🔍</span>
                <span>{demoResult.note ?? "일치하는 분류를 찾지 못했습니다."}</span>
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
      <p className="oneq-honesty-note">
        이 분류는 관세청 공공데이터와 AI 추론으로 생성되며, 실제 관세사 신고 이력으로 검증된 확정치가 아닙니다.
        최종 신고 전에는 관세사 확인을 권장합니다.
      </p>

      {/* ── FAQ ── */}
      <div className="oneq-faq">
        <h2>자주 묻는 질문</h2>
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
        <h2>카테고리 선택 없는 통관, 원큐로 시작하세요</h2>
        <p>API 연동 방식은 물량과 시스템에 맞춰 협의합니다. 아래 남겨주시면 확인 후 연락드립니다.</p>

        <div className="oneq-contact-row">
          <a className="oneq-contact-btn" href="mailto:hyein.yu@jnbglobal.kr">✉ hyein.yu@jnbglobal.kr</a>
          <a className="oneq-contact-btn" href="tel:032-834-7188">☎ 032-834-7188</a>
        </div>
        <p className="oneq-contact-meta">
          제이엔비관세사무소 · 323 Incheontower-daero, A 1716 · 평일 07:30–18:00
        </p>

        {leadState === "done" ? (
          <p className="oneq-lead-done">문의가 접수됐습니다. 확인 후 연락드리겠습니다.</p>
        ) : (
          <form className="oneq-lead-form" onSubmit={submitLead}>
            <input placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="연락처 (선택)" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <input placeholder="이메일" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <textarea placeholder="문의 내용을 입력해주세요" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
            <button className="classify-submit" type="submit" disabled={leadState === "sending"}>
              {leadState === "sending" ? "전송 중…" : "문의하기"}
            </button>
            {leadState === "error" && <p className="error">전송에 실패했습니다. 잠시 후 다시 시도해주세요.</p>}
          </form>
        )}
      </div>
    </section>
  );
}
