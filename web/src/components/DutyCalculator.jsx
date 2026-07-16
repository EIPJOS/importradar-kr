import React, { useState } from "react";
import { getTariffRates } from "../lib/supabase.js";
import { ORIGINS, selectApplicableRate } from "../lib/tariffRateSelect.js";

const won = (n) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

export default function DutyCalculator({ initialHsCode, onSelect }) {
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
      setError("HS코드를 6자리 이상 입력해주세요.");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      setError("물품가격을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const rates = await getTariffRates(hs);
      if (rates.length === 0) {
        setError("등록된 관세율 정보를 찾을 수 없습니다. HS코드를 다시 확인해주세요.");
        return;
      }

      const applied = selectApplicableRate(rates, origin);
      if (!applied) {
        setError("이 HS코드는 종량세 등 정률 계산이 어려운 품목입니다. 관세사 확인이 필요합니다.");
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
        <h2>수입 관부가세 계산기</h2>
        <span className="browser-count">관세청 관세율표 기준 · 참고용</span>
      </div>
      <p className="classify-note">
        HS코드와 물품가격을 입력하면 관세·부가가치세·총 수입비용을 계산해드립니다.
        FTA 협정세율은 원산지증명서 구비를 전제로 적용됩니다.
      </p>

      <form className="classify-form" onSubmit={onSubmit}>
        <label className="classify-label">HS코드</label>
        <input
          className="browser-search"
          value={hsCode}
          onChange={(e) => setHsCode(e.target.value)}
          placeholder="예: 8517130000"
        />

        <label className="classify-label">원산지 국가</label>
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

        <label className="classify-label">물품가격 (KRW, FOB 기준)</label>
        <input
          className="browser-search"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="예: 1000000"
        />

        <label className="classify-label">국제운임 (KRW)</label>
        <input
          className="browser-search"
          type="number"
          min="0"
          value={freight}
          onChange={(e) => setFreight(e.target.value)}
        />

        <label className="classify-label">보험료 (KRW)</label>
        <input
          className="browser-search"
          type="number"
          min="0"
          value={insurance}
          onChange={(e) => setInsurance(e.target.value)}
        />

        <button className="classify-submit" type="submit" disabled={loading}>
          {loading ? "계산 중…" : "세금 계산하기"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="demo-hs">{result.hs}</span>
              <span className="badge confidence-high">
                적용세율 {result.appliedRate}% ({result.appliedSource})
              </span>
            </div>
            <table>
              <tbody>
                <tr>
                  <td>CIF 가격</td>
                  <td className="num">{won(result.cif)}</td>
                </tr>
                <tr>
                  <td>관세 ({result.appliedRate}%)</td>
                  <td className="num">{won(result.duty)}</td>
                </tr>
                <tr>
                  <td>부가가치세 (10%)</td>
                  <td className="num">{won(result.vat)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>총 납부세액</strong>
                  </td>
                  <td className="num">
                    <strong>{won(result.duty + result.vat)}</strong>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>최종 수입비용</strong>
                  </td>
                  <td className="num">
                    <strong>{won(result.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            {!result.ftaAvailable && result.basicRate != null && (
              <p className="reason">
                선택한 원산지에는 등록된 FTA 협정세율이 없어 기본세율/WTO협정세율 중 낮은 쪽을 적용했습니다
                (기본세율 {result.basicRate}%).
              </p>
            )}
            <p className="meta">
              본 계산은 참고용이며 법적 효력이 없습니다. FTA 협정세율은 원산지증명서 구비 시에만 적용 가능하며,
              정확한 세액은 관세사 확인이 필요합니다.
            </p>
            {onSelect && (
              <button className="demo-link" onClick={() => onSelect(result.hs)}>
                이 코드로 수입요건 조회 →
              </button>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
