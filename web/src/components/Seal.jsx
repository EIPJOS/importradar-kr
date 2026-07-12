import React from "react";

// 통관 도장(seal) — 이 사이트의 시그니처 요소.
// 실제 통관서류에 찍히는 원형 도장에서 착안: 링 텍스트 + 한자 중앙 글자.
// size가 크면 마스트헤드 워터마크로, 작으면 결과 배지로 쓰인다.
export default function Seal({ size = 84, ringText = "IMPORT RADAR · SEOUL", center = "通關", className = "" }) {
  const id = `sealpath-${size}-${center}`;
  return (
    <svg viewBox="0 0 88 88" width={size} height={size} className={`seal ${className}`} aria-hidden="true">
      <circle cx="44" cy="44" r="41" className="seal-ring-outer" />
      <circle cx="44" cy="44" r="34.5" className="seal-ring-inner" />
      <path id={id} d="M 44 44 m -29 0 a 29 29 0 1 1 58 0" fill="none" />
      <text className="seal-ring-text">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {ringText}
        </textPath>
      </text>
      <text x="44" y="53" textAnchor="middle" className="seal-center-text">
        {center}
      </text>
    </svg>
  );
}
