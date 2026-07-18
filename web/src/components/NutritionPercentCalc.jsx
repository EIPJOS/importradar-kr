import React, { useState } from "react";
import { NUTRIENTS, REQUIRED_NUTRIENTS, OPTIONAL_NUTRIENTS, calcPercent } from "../lib/nutritionDailyValues.js";
import { useT } from "../lib/i18n.jsx";

const kjToKcal = (kj) => kj / 4.184;

export default function NutritionPercentCalc() {
  const t = useT("nutritionPct");
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
        <h2>{t.title}</h2>
        <span className="browser-count">
          {t.subtitle}
        </span>
      </div>
      <p className="classify-note">
        {t.note}
      </p>

      <form className="classify-form" onSubmit={calculate}>
        <label className="classify-label">{t.requiredLabel}</label>
        <div className="chip-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div>
            <label className="classify-label" style={{ fontWeight: 400 }}>
              {t.calorieLabel}
            </label>
            <input
              className="browser-search"
              type="number"
              value={amounts["열량"] ?? ""}
              onChange={(e) => onCalorieChange(e.target.value)}
              placeholder={t.caloriePlaceholder}
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

        <label className="classify-label">{t.optionalLabel(activeOptional.length, OPTIONAL_NUTRIENTS.length)}</label>
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
            {t.addButton}
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

        <label className="classify-label">{t.groupLabel}</label>
        <div className="chip-row">
          <button type="button" className={`chip ${group === "adult" ? "on" : ""}`} onClick={() => setGroup("adult")}>
            {t.groupAdult}
          </button>
          <button type="button" className={`chip ${group === "infant" ? "on" : ""}`} onClick={() => setGroup("infant")}>
            {t.groupInfant}
          </button>
        </div>

        <button className="classify-submit" type="submit">
          {t.submitButton}
        </button>
      </form>

      {results && (
        <div className="classify-results">
          <table>
            <thead>
              <tr>
                <th>{t.colNutrient}</th>
                <th>{t.colInput}</th>
                <th>{t.colDailyValue}</th>
                <th>{t.colPercent}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const ref = group === "infant" ? r.infant : r.adult;
                return (
                  <tr key={r.key}>
                    <td>{r.key}</td>
                    <td className="num">{r.amount === "" ? "—" : `${r.amount}${r.unit}`}</td>
                    <td className="num">{ref == null ? t.noReference : `${ref}${r.unit}`}</td>
                    <td className="num">{r.percent == null ? "—" : `${r.percent}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="meta">
            {t.footnote}
          </p>
        </div>
      )}
    </section>
  );
}
