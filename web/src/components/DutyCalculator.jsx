import React, { useState } from "react";
import { getTariffRates } from "../lib/supabase.js";
import { ORIGINS, selectApplicableRate } from "../lib/tariffRateSelect.js";
import { useT } from "../lib/i18n.jsx";

const won = (n) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

export default function DutyCalculator({ initialHsCode, onSelect }) {
  const t = useT("dutyCalc");
  const [hsCode, setHsCode] = useState(initialHsCode ?? "");
  const [origin, setOrigin] = useState("중국");
  const [price, setPrice] = useState("");
  const [freight, setFreight] = useState("0");
  const [insurance, setInsurance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const hs = hsCode.replace(/\D/g, "");
    const priceNum = Number(price);
    if (hs.length < 6) {
      setError(t.errHsLength);
      return;
    }
    if (!priceNum || priceNum <= 0) {
      setError(t.errPrice);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const rates = await getTariffRates(hs);
      if (rates.length === 0) {
        setError(t.errNoRates);
        return;
      }

      const applied = selectApplicableRate(rates, origin);
      if (!applied) {
        setError(t.errNotAdValorem);
        return;
      }
      const basicRow = rates.find((r) => r.rate_type === "A");

      const freightNum = Number(freight) || 0;
      const insuranceNum = Number(insurance) || 0;
      const cif = priceNum + freightNum + insuranceNum;
      const duty = (cif * applied.rate_percent) / 100;
      const vat = (cif + duty) * 0.1;
      const total = cif + duty + vat;

      setResult({
        hs,
        cif,
        appliedRate: applied.rate_percent,
        appliedSource: applied.source,
        basicRate: basicRow?.rate_percent ?? null,
        ftaAvailable: applied.source.startsWith("FTA"),
        duty,
        vat,
        total,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>{t.title}</h2>
        <span className="browser-count">{t.subtitle}</span>
      </div>
      <p className="classify-note">{t.description}</p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">{t.hsCodeLabel}</label>
        <input
          className="browser-search"
          value={hsCode}
          onChange={(e) => setHsCode(e.target.value)}
          placeholder={t.hsCodePlaceholder}
        />

        <label className="classify-label">{t.originLabel}</label>
        <div className="chip-row">
          {ORIGINS.map((o) => (
            <button
              type="button"
              key={o}
              className={`chip ${origin === o ? "on" : ""}`}
              onClick={() => setOrigin(o)}
            >
              {o}
            </button>
          ))}
        </div>

        <label className="classify-label">{t.priceLabel}</label>
        <input
          className="browser-search"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t.pricePlaceholder}
        />

        <label className="classify-label">{t.freightLabel}</label>
        <input
          className="browser-search"
          type="number"
          min="0"
          value={freight}
          onChange={(e) => setFreight(e.target.value)}
        />

        <label className="classify-label">{t.insuranceLabel}</label>
        <input
          className="browser-search"
          type="number"
          min="0"
          value={insurance}
          onChange={(e) => setInsurance(e.target.value)}
        />

        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? t.loadingLabel : t.submitLabel}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="demo-hs">{result.hs}</span>
              <span className="badge confidence-high">
                {t.appliedRateBadge(result.appliedRate, result.appliedSource)}
              </span>
            </div>
            <table>
              <tbody>
                <tr>
                  <td>{t.tdCif}</td>
                  <td className="num">{won(result.cif)}</td>
                </tr>
                <tr>
                  <td>{t.tdDuty(result.appliedRate)}</td>
                  <td className="num">{won(result.duty)}</td>
                </tr>
                <tr>
                  <td>{t.tdVat}</td>
                  <td className="num">{won(result.vat)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{t.tdTotalDuty}</strong>
                  </td>
                  <td className="num">
                    <strong>{won(result.duty + result.vat)}</strong>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>{t.tdFinalCost}</strong>
                  </td>
                  <td className="num">
                    <strong>{won(result.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            {!result.ftaAvailable && result.basicRate != null && (
              <p className="reason">{t.ftaFallbackReason(result.basicRate)}</p>
            )}
            <p className="meta">{t.disclaimer}</p>
            {onSelect && (
              <button className="demo-link" onClick={() => onSelect(result.hs)}>
                {t.selectButton}
              </button>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
