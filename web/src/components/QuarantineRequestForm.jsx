import React, { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { REQUIRED_NUTRIENTS } from "../lib/nutritionDailyValues.js";
import { useT } from "../lib/i18n.jsx";

const MAX_FILE_MB = 20;
const MAX_TOTAL_MB = 40;

const emptyIngredient = () => ({ name: "", origin: "", ratio_percent: "" });

export default function QuarantineRequestForm() {
  const t = useT("quarantine");
  const STEPS = t.steps;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const [importer, setImporter] = useState({ name: "", address: "", phone: "", bizNo: "", email: "" });
  const [files, setFiles] = useState({ bizReg: null, importReg: null });
  const [product, setProduct] = useState({ name: "", origin: "", hsCode: "", packagingUnit: "" });
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [process, setProcess] = useState("");
  const [nutrition, setNutrition] = useState({});

  function updateIngredient(i, field, value) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }

  function removeIngredient(i) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onFileChange(key, fileList) {
    const file = fileList?.[0] ?? null;
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(t.errorFileTooLarge(MAX_FILE_MB));
      return;
    }
    setError(null);
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function totalFileMb() {
    return ((files.bizReg?.size ?? 0) + (files.importReg?.size ?? 0)) / 1024 / 1024;
  }

  function canProceed() {
    if (step === 0) return importer.name.trim() && importer.email.trim();
    if (step === 1) return product.name.trim();
    return true;
  }

  async function uploadFile(file, label) {
    if (!file) return null;
    const path = `${Date.now()}-${label}-${file.name}`.replace(/\s+/g, "_");
    const { error: uploadError } = await supabase.storage.from("quarantine-attachments").upload(path, file);
    if (uploadError) throw uploadError;
    return { label, path, size: file.size };
  }

  async function onSubmit() {
    if (totalFileMb() > MAX_TOTAL_MB) {
      setError(t.errorTotalTooLarge(MAX_TOTAL_MB));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const attachments = (
        await Promise.all([uploadFile(files.bizReg, "사업자등록증"), uploadFile(files.importReg, "수입판매업영업등록증")])
      ).filter(Boolean);

      const { error: insertError } = await supabase.from("food_import_quarantine_requests").insert({
        importer_name: importer.name,
        importer_address: importer.address,
        importer_phone: importer.phone,
        business_reg_no: importer.bizNo,
        contact_email: importer.email,
        product_name: product.name,
        product_origin: product.origin,
        product_hs_code: product.hsCode,
        packaging_unit: product.packagingUnit,
        ingredients: ingredients.filter((i) => i.name.trim()),
        manufacturing_process: process,
        nutrition_facts: nutrition,
        attachment_paths: attachments,
      });
      if (insertError) throw insertError;
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="classify">
        <div className="browser-head">
          <h2>{t.heading}</h2>
        </div>
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="badge confidence-high">{t.doneBadge}</span>
            </div>
            <h3>{t.doneTitle}</h3>
            <p className="meta">{t.doneMeta}</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>{t.heading}</h2>
        <span className="browser-count">{t.subheading}</span>
      </div>
      <p className="classify-note">{t.note}</p>

      <div className="chip-row">
        {STEPS.map((s, i) => (
          <span key={s} className={`chip ${i === step ? "on" : ""}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <form
        className="classify-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === STEPS.length - 1) onSubmit();
          else if (canProceed()) setStep((s) => s + 1);
        }}
      >
        {step === 0 && (
          <>
            <label className="classify-label">{t.labelImporterName}</label>
            <input className="browser-search" value={importer.name} onChange={(e) => setImporter({ ...importer, name: e.target.value })} />
            <label className="classify-label">{t.labelImporterAddress}</label>
            <input className="browser-search" value={importer.address} onChange={(e) => setImporter({ ...importer, address: e.target.value })} />
            <label className="classify-label">{t.labelImporterPhone}</label>
            <input className="browser-search" value={importer.phone} onChange={(e) => setImporter({ ...importer, phone: e.target.value })} />
            <label className="classify-label">{t.labelBizNo}</label>
            <input className="browser-search" value={importer.bizNo} onChange={(e) => setImporter({ ...importer, bizNo: e.target.value })} />
            <label className="classify-label">{t.labelEmail}</label>
            <input className="browser-search" type="email" value={importer.email} onChange={(e) => setImporter({ ...importer, email: e.target.value })} />

            <label className="classify-label">{t.labelBizRegFile}</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx" onChange={(e) => onFileChange("bizReg", e.target.files)} />
            <label className="classify-label">{t.labelImportRegFile}</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx" onChange={(e) => onFileChange("importReg", e.target.files)} />
            <p className="meta">{t.fileHint(MAX_FILE_MB, MAX_TOTAL_MB)}</p>
          </>
        )}

        {step === 1 && (
          <>
            <label className="classify-label">{t.labelProductName}</label>
            <input className="browser-search" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
            <label className="classify-label">{t.labelProductOrigin}</label>
            <input className="browser-search" value={product.origin} onChange={(e) => setProduct({ ...product, origin: e.target.value })} />
            <label className="classify-label">{t.labelHsCode}</label>
            <input className="browser-search" value={product.hsCode} onChange={(e) => setProduct({ ...product, hsCode: e.target.value })} />
            <label className="classify-label">{t.labelPackagingUnit}</label>
            <input className="browser-search" value={product.packagingUnit} onChange={(e) => setProduct({ ...product, packagingUnit: e.target.value })} />
          </>
        )}

        {step === 2 && (
          <>
            {ingredients.map((ing, i) => (
              <div key={i} className="chip-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <label className="classify-label">{t.labelIngredient(i + 1)}</label>
                <input className="browser-search" placeholder={t.placeholderIngredientName} value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} />
                <input className="browser-search" placeholder={t.placeholderIngredientOrigin} value={ing.origin} onChange={(e) => updateIngredient(i, "origin", e.target.value)} />
                <input className="browser-search" placeholder={t.placeholderIngredientRatio} type="number" value={ing.ratio_percent} onChange={(e) => updateIngredient(i, "ratio_percent", e.target.value)} />
                {ingredients.length > 1 && (
                  <button type="button" className="demo-link" onClick={() => removeIngredient(i)}>
                    {t.deleteBtn}
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="chip" onClick={addIngredient}>
              {t.addIngredientBtn}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <label className="classify-label">{t.labelProcess}</label>
            <textarea
              className="browser-search"
              rows={8}
              value={process}
              onChange={(e) => setProcess(e.target.value)}
              placeholder={t.placeholderProcess}
            />
          </>
        )}

        {step === 4 && (
          <>
            {REQUIRED_NUTRIENTS.map((n) => (
              <div key={n.key}>
                <label className="classify-label" style={{ fontWeight: 400 }}>
                  {n.key} ({n.unit})
                </label>
                <input
                  className="browser-search"
                  type="number"
                  value={nutrition[n.key] ?? ""}
                  onChange={(e) => setNutrition({ ...nutrition, [n.key]: e.target.value })}
                />
              </div>
            ))}
          </>
        )}

        {step === 5 && (
          <div className="classify-results">
            <article className="classify-card">
              <h3>{importer.name || t.importerNameFallback}</h3>
              <p className="meta">{importer.email}</p>
              <p className="reason">{t.reasonProductName(product.name || t.productNameFallback)}</p>
              <p className="reason">{t.ingredientsCount(ingredients.filter((i) => i.name.trim()).length)}</p>
              <p className="meta">
                {t.attachmentsCount([files.bizReg, files.importReg].filter(Boolean).length)}
                {totalFileMb() > 0 ? t.attachmentsSizeSuffix(totalFileMb().toFixed(1)) : ""}
              </p>
            </article>
          </div>
        )}

        <div className="chip-row">
          {step > 0 && (
            <button type="button" className="chip" onClick={() => setStep((s) => s - 1)}>
              {t.prevBtn}
            </button>
          )}
          <button className="classify-submit" type="submit" disabled={submitting || !canProceed()}>
            {step === STEPS.length - 1 ? (submitting ? t.submittingBtn : t.submitBtn) : t.nextBtn}
          </button>
        </div>
      </form>
    </section>
  );
}
