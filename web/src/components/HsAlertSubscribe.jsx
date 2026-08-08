import React, { useState } from "react";
import { subscribeHsAlert } from "../lib/supabase.js";
import { useT, useLang } from "../lib/i18n.jsx";

export default function HsAlertSubscribe({ hsCode }) {
  const t = useT("home").alert;
  const lang = useLang();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error | already

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await subscribeHsAlert(email.trim(), hsCode, lang);
      setStatus("done");
    } catch (err) {
      // unique(email, hs_code) 위반 — 이미 신청된 조합
      setStatus(err?.code === "23505" ? "already" : "error");
    }
  }

  return (
    <div className="alert-subscribe">
      <div className="alert-subscribe-text">
        <strong>{t.heading}</strong>
        <span>{t.body}</span>
      </div>
      {status === "done" || status === "already" ? (
        <p className="alert-subscribe-msg">{status === "done" ? t.success : t.already}</p>
      ) : (
        <form className="alert-subscribe-form" onSubmit={onSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
          />
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? t.buttonLoading : t.button}
          </button>
        </form>
      )}
      {status === "error" && <p className="alert-subscribe-msg error">{t.error}</p>}
    </div>
  );
}
