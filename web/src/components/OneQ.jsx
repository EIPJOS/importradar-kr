import React, { useState } from "react";
import { supabase } from "../lib/supabase.js";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hs-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PAIN_POINTS = [
  {
    title: "모호한 제품명",
    body: "고객은 \u201c이어폰\u201d, \u201c히터\u201d, \u201c컵\u201d처럼 짧게만 적습니다. 그 한 단어로 카테고리를 직접 고르게 하면, 잘못된 선택이 그대로 신고로 이어집니다.",
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

const FAQS = [
  {
    q: "AI 분류와 실제 신고가 다를 수 있나요?",
    a: "네, 참고용입니다. 원큐는 관세청 공공데이터(HS코드 마스터 12,469건)에서 후보를 찾고 AI가 그 안에서 선택하는 방식이라 실존하지 않는 코드는 나오지 않지만, 관세사 실제 신고 이력으로 검증된 확정치는 아닙니다. 최종 신고 전 관세사 확인을 권장합니다.",
  },
  {
    q: "API로 연동할 수 있나요?",
    a: "지금은 웹 데모로 먼저 제공하고 있습니다. 배대지·포워더 시스템에 API로 직접 연동하고 싶으시면 아래 문의 폼으로 남겨주세요.",
  },
  {
    q: "데이터는 어디서 오나요?",
    a: "관세청 세관장확인대상물품, HS코드 마스터, 식약처 수입식품 부적합·회수, 법제처 국가법령정보를 매일/매주 자동 수집하고, 여기에 Claude AI 분류 로직을 결합합니다.",
  },
  {
    q: "비용은 어떻게 되나요?",
    a: "현재는 무료로 제공 중입니다. B2B API 연동은 별도 협의가 필요하며, 아래 문의 폼으로 연락 주시면 안내드립니다.",
  },
];

export default function OneQ({ onSelect }) {
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [demoError, setDemoError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const [form, setForm] = useState({ name: "", contact: "", email: "", message: "" });
  const [leadState, setLeadState] = useState("idle"); // idle | sending | done | error

  async function runDemo(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    setLoading(true);
    setDemoError(null);
    setDemoResult(null);
    try {
      const res = await fetch(FUNCTIONS_URL, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ productName, originCountry: "미상", language: "ko" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "요청 실패");
      setDemoResult(data);
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

  return (
    <section className="oneq">
      <div className="oneq-eyebrow">B2B 연동 · 배대지/포워더 전용 (준비 중)</div>
      <h1 className="oneq-title">카테고리 선택 없이, 제품명 하나로 끝내세요</h1>
      <p className="oneq-sub">
        원큐(One Queue) API 한 번이면 HS코드 후보와 수입요건까지 한 번에 돌아옵니다.
        고객이 카테고리를 직접 고르다가 오분류로 이어지는 문제를 없애는 게 목표입니다.
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
        <p className="classify-note">
          아래는 실제로 작동하는 데모입니다 — "빠른 HS CODE 분류"와 같은 엔진을 씁니다.
          관세율 조회는 아직 준비 중이라 이번 데모에는 포함되지 않습니다.
        </p>
        <form className="oneq-demo-form" onSubmit={runDemo}>
          <input
            className="browser-search"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="예: 무선 이어폰(블루투스)"
          />
          <button className="classify-submit" type="submit" disabled={loading}>
            {loading ? "요청 중…" : "API 요청 보내기"}
          </button>
        </form>

        {demoError && <p className="error">{demoError}</p>}

        {demoResult && (
          <div className="oneq-demo-result">
            {topPick ? (
              <>
                <div className="card-head">
                  <span className="demo-hs">{topPick.hs_code}</span>
                  <span className={`badge confidence-${topPick.confidence}`}>신뢰도 {topPick.confidence}</span>
                </div>
                <h3>{topPick.name_ko}</h3>
                <p className="meta">{topPick.name_en}</p>
                {topPick.reasoning && <p className="reason">{topPick.reasoning}</p>}
                <button className="demo-link" onClick={() => onSelect(topPick.hs_code)}>
                  이 코드로 수입요건 조회 →
                </button>
              </>
            ) : (
              <p className="empty">{demoResult.note ?? "일치하는 분류를 찾지 못했습니다."}</p>
            )}
          </div>
        )}
      </div>

      {/* ── 신뢰 지표 (실제 수치만) ── */}
      <div className="oneq-stats">
        <div className="oneq-stat"><strong>12,469건</strong><span>HS코드 마스터(관세청)</span></div>
        <div className="oneq-stat"><strong>1,425건</strong><span>부적합·회수 이력 자동 반영</span></div>
        <div className="oneq-stat"><strong>AI 참고용</strong><span>관세사 확인 권장</span></div>
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
