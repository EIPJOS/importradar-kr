import React from "react";

const FOCUS_AREAS = ["수출입통관", "식품검역", "품목분류(HS)", "FTA 원산지", "관세·외환조사 대응"];

export default function AboutCompany() {
  return (
    <section className="classify">
      <div className="browser-head">
        <h2>회사소개</h2>
        <span className="browser-count">제이앤비관세사무소</span>
      </div>

      <div className="classify-results">
        <article className="classify-card">
          <div className="card-head">
            <span className="badge confidence-high">식품 수출입 통관·검역 전문 관세사</span>
          </div>
          <h3>수출입의 모든 과정에 전문성을 더합니다</h3>
          <p className="reason">
            식품검역, 수출입통관, 품목분류, FTA까지 — 검역·표시사항·원산지 중 한 곳만 막혀도 화물
            전체가 멈춥니다. 통관이 시작되기 전에 리스크를 막습니다.
          </p>
        </article>

        <article className="classify-card">
          <h3>전문분야</h3>
          <div className="chip-row">
            {FOCUS_AREAS.map((area) => (
              <span key={area} className="chip">
                {area}
              </span>
            ))}
          </div>
        </article>

        <article className="classify-card">
          <div className="card-head">
            <span className="badge confidence-medium">담당 관세사</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <img
              src="/hyein-yu-portrait.jpg"
              alt="유혜인 관세사"
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
            <div>
              <h3 style={{ marginTop: 0 }}>유혜인 관세사</h3>
              <p className="meta">제이앤비관세사무소 대표</p>
            </div>
          </div>
        </article>

        <article className="classify-card">
          <h3>연락처</h3>
          <p className="reason">
            전화. 032-834-7188
            <br />
            이메일. hyein.yu@jnbglobal.kr
            <br />
            주소. 인천광역시 연수구 인천타워대로 323, 송도센트로드 A동 1716호
          </p>
          <a className="demo-link" href="https://jnbglobal.kr" target="_blank" rel="noreferrer">
            제이앤비관세사무소 홈페이지 →
          </a>
        </article>
      </div>
    </section>
  );
}
