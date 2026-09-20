-- Display currencies (SAR, AED, KWD, QAR, BHD, OMR, YER) — ALREADY APPLIED ON PRODUCTION
-- (project GOAIR) as migration `add_currencies_display_metadata_and_gulf_rates`, plus the YER step below.
-- USD stays the source of truth for every price/booking/payment; these currencies are display-only.
-- Additive: no existing table, column or function is changed.

create table if not exists public.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  name_ar text not null,
  name_en text not null,
  symbol_ar text not null,
  symbol_en text not null,
  decimals smallint not null default 2 check (decimals between 0 and 3),
  rounding_step numeric not null default 0.01 check (rounding_step > 0),
  sort_order int not null default 100,
  is_display_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.currencies enable row level security;

drop policy if exists deny_all_direct_access_rpc_only on public.currencies;
create policy deny_all_direct_access_rpc_only on public.currencies
  for all to anon, authenticated using (false) with check (false);

revoke select, insert, update, delete on public.currencies from anon, authenticated;

-- get_exchange_rate() uses "limit 1" with no ordering, so guarantee one active rate per currency.
create unique index if not exists exchange_rates_one_active_per_currency
  on public.exchange_rates (currency_code) where is_active;

-- Rates are "local units per 1 USD" (same convention as the existing EGP = 51.3 row).
-- SAR/AED/QAR/BHD/OMR are official USD pegs. KWD tracks a basket and needs periodic refreshing.
-- YER uses the Aden (government-controlled areas) rate, ~1,520-1,550 per USD as of Aug 2026; the
-- Sanaa rate (~535-540) is deliberately NOT used. Refresh these rows when the market moves.
insert into public.exchange_rates (currency_code, rate_to_usd, is_active, source)
select v.code, v.rate, true, v.src
from (values
  ('SAR', 3.75::numeric,   'peg_official_2026_09'),
  ('AED', 3.6725::numeric, 'peg_official_2026_09'),
  ('QAR', 3.64::numeric,   'peg_official_2026_09'),
  ('BHD', 0.376::numeric,  'peg_official_2026_09'),
  ('OMR', 0.3845::numeric, 'peg_official_2026_09'),
  ('KWD', 0.3082::numeric, 'manual_seed_2026_09'),
  ('YER', 1535::numeric,   'manual_seed_2026_09_aden')
) as v(code, rate, src)
where not exists (
  select 1 from public.exchange_rates er where er.currency_code = v.code and er.is_active
);

insert into public.currencies (code, name_ar, name_en, symbol_ar, symbol_en, decimals, rounding_step, sort_order, is_display_enabled) values
  ('USD', 'دولار أمريكي', 'US Dollar',      '$',    '$',   2, 0.01, 10, true),
  ('EGP', 'جنيه مصري',    'Egyptian Pound', 'ج.م',  'EGP', 0, 5,    20, true),
  ('SAR', 'ريال سعودي',   'Saudi Riyal',    'ر.س',  'SAR', 2, 0.5,  30, true),
  ('AED', 'درهم إماراتي', 'UAE Dirham',     'د.إ',  'AED', 2, 0.5,  40, true),
  ('KWD', 'دينار كويتي',  'Kuwaiti Dinar',  'د.ك',  'KWD', 3, 0.05, 50, true),
  ('QAR', 'ريال قطري',    'Qatari Riyal',   'ر.ق',  'QAR', 2, 0.5,  60, true),
  ('BHD', 'دينار بحريني', 'Bahraini Dinar', 'د.ب',  'BHD', 3, 0.05, 70, true),
  ('OMR', 'ريال عماني',   'Omani Rial',     'ر.ع',  'OMR', 3, 0.05, 80, true),
  ('YER', 'ريال يمني',    'Yemeni Rial',    'ر.ي',  'YER', 0, 100,  90, true)
on conflict (code) do update set is_display_enabled = excluded.is_display_enabled
  where public.currencies.code = 'YER';

-- Public read path (rates stay locked behind the RPC, same pattern as exchange_rates).
create or replace function public.get_display_currencies()
returns table (
  code text, name_ar text, name_en text, symbol_ar text, symbol_en text,
  decimals int, rounding_step numeric, rate_to_usd numeric, sort_order int
)
language sql stable security definer set search_path = public as $$
  select c.code, c.name_ar, c.name_en, c.symbol_ar, c.symbol_en,
         c.decimals::int, c.rounding_step,
         case when c.code = 'USD' then 1::numeric else r.rate_to_usd end,
         c.sort_order
  from public.currencies c
  left join lateral (
    select er.rate_to_usd from public.exchange_rates er
    where er.currency_code = c.code and er.is_active
    order by er.effective_at desc limit 1
  ) r on true
  where c.is_display_enabled and (c.code = 'USD' or r.rate_to_usd is not null)
  order by c.sort_order;
$$;

revoke all on function public.get_display_currencies() from public;
grant execute on function public.get_display_currencies() to anon, authenticated;
