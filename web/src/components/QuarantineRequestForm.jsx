import React, { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { REQUIRED_NUTRIENTS } from "../lib/nutritionDailyValues.js";

const STEPS = ["수입업소", "제품정보", "원재료", "제조공정", "영양정보", "최종확인"];
const MAX_FILE_MB = 20;
const MAX_TOTAL_MB = 40;

const emptyIngredient = () => ({ name: "", origin: "", ratio_percent: "" });

export default function QuarantineRequestForm() {
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
      setError(`파일당 최대 ${MAX_FILE_MB}MB까지 첨부할 수 있습니다.`);
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
      setError(`첨부파일 전체 용량은 ${MAX_TOTAL_MB}MB를 넘을 수 없습니다.`);
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
          <h2>가공식품 의뢰</h2>
        </div>
        <div className="classify-results">
          <article className="classify-card">
            <div className="card-head">
              <span className="badge confidence-high">접수 완료</span>
            </div>
            <h3>검역 의뢰가 정상적으로 전달되었습니다</h3>
            <p className="meta">제이앤비관세사무소에서 입력하신 이메일로 연락드립니다.</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="classify">
      <div className="browser-head">
        <h2>가공식품 의뢰</h2>
        <span className="browser-count">수입식품 검역 정보 입력</span>
      </div>
      <p className="classify-note">
        제조사 자료를 기다리지 않고, 수입자가 직접 검역 기초 정보를 정리해 제이앤비관세사무소로
        전달할 수 있습니다.
      </p>

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
            <label className="classify-label">수입업소명 *</label>
            <input className="browser-search" value={importer.name} onChange={(e) => setImporter({ ...importer, name: e.target.value })} />
            <label className="classify-label">수입업소 주소</label>
            <input className="browser-search" value={importer.address} onChange={(e) => setImporter({ ...importer, address: e.target.value })} />
            <label className="classify-label">수입업소 연락처</label>
            <input className="browser-search" value={importer.phone} onChange={(e) => setImporter({ ...importer, phone: e.target.value })} />
            <label className="classify-label">사업자번호</label>
            <input className="browser-search" value={importer.bizNo} onChange={(e) => setImporter({ ...importer, bizNo: e.target.value })} />
            <label className="classify-label">이메일 *</label>
            <input className="browser-search" type="email" value={importer.email} onChange={(e) => setImporter({ ...importer, email: e.target.value })} />

            <label className="classify-label">사업자등록증</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx" onChange={(e) => onFileChange("bizReg", e.target.files)} />
            <label className="classify-label">수입식품등의 수입판매업 영업등록증</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx" onChange={(e) => onFileChange("importReg", e.target.files)} />
            <p className="meta">허용 형식: PDF, JPG, PNG, WEBP, HEIC, DOC, DOCX / 파일당 {MAX_FILE_MB}MB, 전체 {MAX_TOTAL_MB}MB 이하</p>
          </>
        )}

        {step === 1 && (
          <>
            <label className="classify-label">제품명 *</label>
            <input className="browser-search" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
            <label className="classify-label">원산지</label>
            <input className="browser-search" value={product.origin} onChange={(e) => setProduct({ ...product, origin: e.target.value })} />
            <label className="classify-label">HS코드</label>
            <input className="browser-search" value={product.hsCode} onChange={(e) => setProduct({ ...product, hsCode: e.target.value })} />
            <label className="classify-label">포장단위</label>
            <input className="browser-search" value={product.packagingUnit} onChange={(e) => setProduct({ ...product, packagingUnit: e.target.value })} />
          </>
        )}

        {step === 2 && (
          <>
            {ingredients.map((ing, i) => (
              <div key={i} className="chip-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <label className="classify-label">원재료 {i + 1}</label>
                <input className="browser-search" placeholder="원재료명" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} />
                <input className="browser-search" placeholder="원산지" value={ing.origin} onChange={(e) => updateIngredient(i, "origin", e.target.value)} />
                <input className="browser-search" placeholder="배합비율 (%)" type="number" value={ing.ratio_percent} onChange={(e) => updateIngredient(i, "ratio_percent", e.target.value)} />
                {ingredients.length > 1 && (
                  <button type="button" className="demo-link" onClick={() => removeIngredient(i)}>
                    삭제
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="chip" onClick={addIngredient}>
              + 원재료 추가
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <label className="classify-label">제조공정 설명</label>
            <textarea
              className="browser-search"
              rows={8}
              value={process}
              onChange={(e) => setProcess(e.target.value)}
              placeholder="원재료 투입부터 포장까지 제조공정을 순서대로 설명해주세요."
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
              <h3>{importer.name || "수입업소명 미입력"}</h3>
              <p className="meta">{importer.email}</p>
              <p className="reason">제품명: {product.name || "미입력"}</p>
              <p className="reason">원재료 {ingredients.filter((i) => i.name.trim()).length}건</p>
              <p className="meta">
                첨부파일 {[files.bizReg, files.importReg].filter(Boolean).length}건
                {totalFileMb() > 0 ? ` (${totalFileMb().toFixed(1)}MB)` : ""}
              </p>
            </article>
          </div>
        )}

        <div className="chip-row">
          {step > 0 && (
            <button type="button" className="chip" onClick={() => setStep((s) => s - 1)}>
              이전
            </button>
          )}
          <button className="classify-submit" type="submit" disabled={submitting || !canProceed()}>
            {step === STEPS.length - 1 ? (submitting ? "전송 중…" : "제출하기") : "다음"}
          </button>
        </div>
      </form>
    </section>
  );
}
