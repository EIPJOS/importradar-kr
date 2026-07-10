# ImportRadar KR (수입레이더)

HS코드/품목명 → 수입요건 + 부적합·회수 이력 + 법령 개정을 한 화면에서. 관세사·수출입 사업자용.

## 구조

```
supabase/schema.sql        # 5개 테이블 + search_unified RPC + RLS
pipeline/                  # Node 22, 의존성 2개 (supabase-js, fast-xml-parser)
  lib/datagovkr.js         #   data.go.kr 공통 페처 (페이징/재시도/XML·JSON)
  lib/summarize.js         #   Claude Haiku로 사유·개정 요약 (키 없으면 자동 스킵)
  jobs/sync_requirements.js  # 관세청 세관장확인대상 (주간)
  jobs/sync_rejections.js    # 식약처 부적합 (일간)
  jobs/sync_recalls.js       # 식약처 회수판매중지 (일간)
  jobs/sync_law_updates.js   # 법제처 최근 90일 개정 (주간)
.github/workflows/sync.yml # cron 2개 + 수동 트리거(workflow_dispatch)
web/                       # React/Vite → Vercel
```

## 셋업 순서

1. **Supabase**: 새 프로젝트 → SQL Editor에 `supabase/schema.sql` 실행
2. **GitHub secrets** 등록 (`.env.example` 참조):
   `DATA_GO_KR_KEY`, `LAW_GO_KR_OC`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`(선택), `CUSTOMS_REQ_ENDPOINT`(아래 참조)
3. **첫 수집**: Actions 탭 → data-sync → Run workflow (job=all)
4. **프론트**: `web/.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → `npm i && npm run dev` → Vercel 연결 (root: `web/`)

## ⚠️ 승인 후 확정할 것 2가지

1. **`CUSTOMS_REQ_ENDPOINT`** — 세관장확인대상물품은 GW형 API라 요청주소가
   활용신청 승인 후 data.go.kr 상세페이지의 Swagger(활용 명세)에서만 보인다.
   승인되면 전체 URL을 secrets에 등록. 요청 파라미터명(`imexTp` 가정)과
   응답 필드명도 Swagger 기준으로 `sync_requirements.js`의 `normalize()` 매핑 확정.
2. **식약처 응답 필드명** — `normalize()`가 여러 후보 키를 관대하게 매핑하지만,
   첫 실행 후 `rejection_history.raw` 컬럼의 실제 키를 보고 매핑을 정리할 것.
   원문은 항상 `raw`(jsonb)에 보존되므로 매핑 수정 후 재파싱 가능.

## 확정된 엔드포인트

| 소스 | URL |
|---|---|
| 부적합 | `https://apis.data.go.kr/1471000/PrsecImproptFoodInfoService03/getPrsecImproptFoodList01` |
| 회수판매중지 | `http://apis.data.go.kr/1471000/IprtFoodReclSaleStopPrdtStusService/getIprtFoodReclSaleStopPrdtStusInq` |
| 법제처 | `http://www.law.go.kr/DRF/lawSearch.do?OC={OC}&target=eflaw&type=JSON` |
| 세관장확인(GW) | 승인 후 Swagger에서 확인 → `CUSTOMS_REQ_ENDPOINT` |

## 다음 단계 (체크리스트 이어서)

- [ ] data.go.kr API 키 발급 → secrets 등록 → 첫 수집 실행
- [ ] 법제처 OC 발급
- [ ] MVP 검색 페이지 배포 (Vercel)
- [ ] AdSense 연동 (`web/index.html`에 스크립트 삽입 자리 확보됨)
- [ ] 구독/Stripe — subscriptions 테이블만 선반영, 결제는 트래픽 검증 후
