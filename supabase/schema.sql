-- ImportRadar KR — Supabase schema
-- Run in Supabase SQL Editor (or: supabase db push)

create extension if not exists pg_trgm;

-- =====================================================================
-- hs_codes: HS 코드 마스터 (수집 과정에서 등장한 코드를 upsert로 축적)
-- =====================================================================
create table if not exists hs_codes (
  hs_code       text primary key,              -- 10자리 HSK, 짧은 코드도 허용
  name_ko       text,
  name_en       text,
  chapter       text generated always as (substring(hs_code from 1 for 2)) stored,
  heading       text generated always as (substring(hs_code from 1 for 4)) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_hs_codes_name_trgm on hs_codes using gin (name_ko gin_trgm_ops);

-- =====================================================================
-- import_requirements: 세관장확인대상물품 (관세청, data.go.kr 15101589)
-- =====================================================================
create table if not exists import_requirements (
  id              bigint generated always as identity primary key,
  hs_code         text not null,
  imex_type       text not null check (imex_type in ('import','export')),
  law_code        text,                        -- 신고인 확인법령코드
  law_name        text,                        -- 신고인 확인법령명
  agency_code     text,                        -- 요건승인기관코드
  agency_name     text,                        -- 요건승인기관명
  effective_from  date,                        -- 적용시작일자
  effective_to    date,
  raw             jsonb not null,              -- 원문 레코드 보존
  synced_at       timestamptz not null default now(),
  unique (hs_code, imex_type, law_code, agency_code, effective_from)
);
create index if not exists idx_req_hs on import_requirements (hs_code);
create index if not exists idx_req_law on import_requirements (law_name);

-- =====================================================================
-- rejection_history: 수입식품 부적합 + 회수판매중지 (식약처) 통합
--   source: 'rejection'(통관 부적합) | 'recall'(통관 후 회수·판매중지)
-- =====================================================================
create table if not exists rejection_history (
  id              bigint generated always as identity primary key,
  source          text not null check (source in ('rejection','recall')),
  external_key    text not null,               -- 원천 레코드 식별자(중복 방지용 조합키)
  product_name    text,
  hs_code         text,                        -- 원천에 없으면 null, 2단계에서 매핑
  origin_country  text,
  company_name    text,                        -- 수입/제조사
  reason          text,                        -- 부적합/회수 사유 (원문)
  reason_summary  text,                        -- Claude 요약 (평문 한국어 1-2문장)
  recall_grade    text,                        -- 회수등급 (recall만)
  event_date      date,                        -- 부적합 판정일/회수 개시일
  raw             jsonb not null,
  synced_at       timestamptz not null default now(),
  unique (source, external_key)
);
create index if not exists idx_rej_product_trgm on rejection_history using gin (product_name gin_trgm_ops);
create index if not exists idx_rej_hs on rejection_history (hs_code);
create index if not exists idx_rej_date on rejection_history (event_date desc);

-- =====================================================================
-- regulation_updates: 법령 개정 이력 (법제처 open.law.go.kr)
-- =====================================================================
create table if not exists regulation_updates (
  id              bigint generated always as identity primary key,
  law_id          text not null,               -- 법령ID
  law_name        text not null,
  ministry        text,                        -- 소관부처
  amendment_type  text,                        -- 제정/일부개정/전부개정/폐지 등
  promulgated_on  date,                        -- 공포일자
  effective_on    date,                        -- 시행일자
  summary         text,                        -- Claude 요약
  detail_url      text,
  raw             jsonb not null,
  synced_at       timestamptz not null default now(),
  unique (law_id, promulgated_on)
);
create index if not exists idx_reg_law_name on regulation_updates (law_name);
create index if not exists idx_reg_effective on regulation_updates (effective_on desc);

-- =====================================================================
-- subscriptions: Pro 티어 워치리스트 (Stripe 연동은 후순위)
-- =====================================================================
create table if not exists subscriptions (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  plan            text not null default 'free' check (plan in ('free','pro','team')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  watchlist       jsonb not null default '[]'::jsonb,  -- [{hs_code, label}]
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

-- =====================================================================
-- RLS: 공개 데이터는 anon 읽기 허용, 쓰기는 service_role만
-- =====================================================================
alter table hs_codes            enable row level security;
alter table import_requirements enable row level security;
alter table rejection_history   enable row level security;
alter table regulation_updates  enable row level security;
alter table subscriptions       enable row level security;

create policy "public read" on hs_codes            for select using (true);
create policy "public read" on import_requirements for select using (true);
create policy "public read" on rejection_history   for select using (true);
create policy "public read" on regulation_updates  for select using (true);
create policy "own subscription" on subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- 통합 검색 RPC: HS코드 prefix 또는 품목명 부분일치 → 3개 영역 한 번에
-- =====================================================================
create or replace function search_unified(q text)
returns jsonb
language sql stable
as $$
  select jsonb_build_object(
    'requirements', coalesce((
      select jsonb_agg(to_jsonb(r) - 'raw' order by r.effective_from desc)
      from (
        select * from import_requirements
        where hs_code like q || '%'
        limit 100
      ) r), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(to_jsonb(h) - 'raw' order by h.event_date desc nulls last)
      from (
        select * from rejection_history
        where hs_code like q || '%' or product_name ilike '%' || q || '%'
        limit 100
      ) h), '[]'::jsonb),
    'regulations', coalesce((
      select jsonb_agg(to_jsonb(g) - 'raw' order by g.effective_on desc nulls last)
      from (
        select * from regulation_updates
        where law_name ilike '%' || q || '%'
           or exists (
             select 1 from import_requirements ir
             where ir.hs_code like q || '%' and ir.law_name = regulation_updates.law_name
           )
        limit 50
      ) g), '[]'::jsonb)
  );
$$;
