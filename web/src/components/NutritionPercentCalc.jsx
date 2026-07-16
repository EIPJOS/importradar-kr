import React, { useState } from "react";
import { NUTRIENTS, REQUIRED_NUTRIENTS, OPTIONAL_NUTRIENTS, calcPercent } from "../lib/nutritionDailyValues.js";

const kjToKcal = (kj) => kj / 4.184;

export default function NutritionPercentCalc() {
  const [amounts, setAmounts] = useState({});
  const [group, setGroup] = useState("adult");
  const [activeOptional, setActiveOptional] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [results, setResults] = useState(null);

  function setAmount(key, value) {
    setAmounts((prev) => ({ ...prev, [key]: value }));
  }

  function onCalorieChange(value) {
    const n = Number(value);
    if (value && Number.isFinite(n) && n >= 1000) {
      setAmount("열량", String(Math.round(kjToKcal(n))));
    } else {
      setAmount("열량", value);
    }
  }

  function addOptional(key) {
    setActiveOptional((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setPickerOpen(false);
  }

  function removeOptional(key) {
    setActiveOptional((prev) => prev.filter((k) => k !== key));
    setAmounts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function calculate(e) {
    e.preventDefault();
    const active = [...REQUIRED_NUTRIENTS, ...OPTIONAL_NUTRIENTS.filter((n) => activeOptional.includes(n.key))];
    setResults(
      active.map((n) => ({
        ...n,
        amount: amounts[n.key] ?? "",
        percent: calcPercent(n, amounts[n.key], group),
      }))
    );
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>영양성분 퍼센트 계산</h2>
        <span className="browser-count">
          식품 등의 표시ㆍ광고에 관한 법률 시행규칙 별표5 · 1일 영양성분 기준치
        </span>
      </div>
      <p className="classify-note">
        측정한 영양성분 함량을 입력하면 1일 영양성분 기준치 대비 퍼센트(%)를 계산합니다. 반올림·표시
        방법 등 세부 규정은 별표3을 함께 확인하세요.
      </p>

      <form className="classify-form" onSubmit={calculate}>
        <label className="classify-label">필수 영양성분 (9)</label>
        <div className="chip-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div>
            <label className="classify-label" style={{ fontWeight: 400 }}>
              열량 (kcal)
            </label>
            <input
              className="browser-search"
              type="number"
              value={amounts["열량"] ?? ""}
              onChange={(e) => onCalorieChange(e.target.value)}
              placeholder="1000kJ 이상 입력 시 자동으로 kcal 환산"
            />
          </div>
          {REQUIRED_NUTRIENTS.map((n) => (
            <div key={n.key}>
              <label className="classify-label" style={{ fontWeight: 400 }}>
                {n.key} ({n.unit})
              </label>
              <input
                className="browser-search"
                type="number"
                value={amounts[n.key] ?? ""}
                onChange={(e) => setAmount(n.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <label className="classify-label">선택 영양성분 ({activeOptional.length}/{OPTIONAL_NUTRIENTS.length})</label>
        <div className="chip-row">
          {activeOptional.map((key) => {
            const n = OPTIONAL_NUTRIENTS.find((o) => o.key === key);
            return (
              <button type="button" key={key} className="chip on" onClick={() => removeOptional(key)}>
                {n.key} ✕
              </button>
            );
          })}
          <button type="button" className="chip" onClick={() => setPickerOpen((o) => !o)}>
            + 추가
          </button>
        </div>
        {pickerOpen && (
          <div className="chip-row">
            {OPTIONAL_NUTRIENTS.filter((n) => !activeOptional.includes(n.key)).map((n) => (
              <button type="button" key={n.key} className="chip" onClick={() => addOptional(n.key)}>
                {n.key}
              </button>
            ))}
          </div>
        )}
        {activeOptional.length > 0 && (
          <div className="chip-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            {activeOptional.map((key) => {
              const n = OPTIONAL_NUTRIENTS.find((o) => o.key === key);
              return (
                <div key={key}>
                  <label className="classify-label" style={{ fontWeight: 400 }}>
                    {n.key} ({n.unit})
                  </label>
                  <input
                    className="browser-search"
                    type="number"
                    value={amounts[n.key] ?? ""}
                    onChange={(e) => setAmount(n.key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <label className="classify-label">기준 집단</label>
        <div className="chip-row">
          <button type="button" className={`chip ${group === "adult" ? "on" : ""}`} onClick={() => setGroup("adult")}>
            성인
          </button>
          <button type="button" className={`chip ${group === "infant" ? "on" : ""}`} onClick={() => setGroup("infant")}>
            영유아 (만 1-2세)
          </button>
        </div>

        <button className="classify-submit" type="submit">
          퍼센트 계산하기
        </button>
      </form>

      {results && (
        <div className="classify-results">
          <table>
            <thead>
              <tr>
                <th>영양성분</th>
                <th>입력값</th>
                <th>1일 기준치</th>
                <th>%기준치</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const ref = group === "infant" ? r.infant : r.adult;
                return (
                  <tr key={r.key}>
                    <td>{r.key}</td>
                    <td className="num">{r.amount === "" ? "—" : `${r.amount}${r.unit}`}</td>
                    <td className="num">{ref == null ? "기준치 없음" : `${ref}${r.unit}`}</td>
                    <td className="num">{r.percent == null ? "—" : `${r.percent}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="meta">
            트랜스지방은 별표5에 1일 기준치가 없어 함량만 표시하고 퍼센트는 계산하지 않습니다. 영유아
            모드는 별표5 비고에 따라 탄수화물·당류·단백질·지방 4종만 별도 기준치가 있고, 나머지는
            국민영양관리법상 별도 섭취기준을 따라야 하므로 이 계산기에서는 제공하지 않습니다.
          </p>
        </div>
      )}
    </section>
  );
}
