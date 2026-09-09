# goair-i18n-batch3 — English translation wiring (part 1)

Drop this folder into the repo root (same as `goair-i18n-batch2` /
`goair-i18n-fixes` before it) and copy each file over its matching path
under `src/`, then commit/push. It does not touch anything outside `src/`.

## What this batch does

The database already has `_en` columns for 8 tables (added directly via
Supabase migration — no file changes needed for that part). This batch
wires the **frontend** to read them, using a new `localize()` /
`localizeList()` helper (`src/lib/i18n/localize.ts`) — same fallback
pattern as the existing `country-labels.ts`: shows the English value when
the UI is in English and one exists, otherwise falls back to Arabic.
Nothing that's used as a filter/matching key (ids, `country`, `method`,
etc.) is touched — only what's *displayed*.

## Files in this batch

- `src/lib/i18n/localize.ts` — **new file**, the helper itself
- `src/lib/goair.ts` — added `nameEn`/`taglineEn`/`featuresEn`/`descriptionEn`/
  `label_en`/`details_en`/`*_en` fields to the `AddonService`, `PackageTier`,
  `SubscriptionPlan`, `PaymentMethod`, `Trip` types and their fetch functions
- `src/lib/announcements.ts` — added `messageEn` to `Announcement`
- `src/components/goair/announcement-ticker.tsx` — homepage announcement bar
- `src/components/goair/booking/booking-addons-step.tsx` — add-on cards
  (name + description)
- `src/routes/book.tsx` — add-on names shown in the booking confirm step
- `src/routes/package.tsx` — package name/tagline/features shown everywhere
  in the package booking flow (summary card, price summary, confirm step)
- `src/components/goair/deals-teaser.tsx` — homepage "packages" teaser cards
- `src/routes/explore.tsx` — **partially done**: the packages tab
  (`PackageCard`) is localized; the subscriptions tab (`SubscriptionPlanCard`)
  is NOT yet — that's next.

## Still pending (next batch)

- `SubscriptionPlanCard` in `src/routes/explore.tsx` (name/tagline/features)
- `src/routes/subscribe.tsx` (plan name + country label)
- `src/components/goair/payment/payment-methods-form.tsx` (payment method
  label/details)
- Trip/destination display names (`trip.destination` / `origin` /
  `airport_name`) across `search.tsx`, `book.tsx`, `destination-card.tsx`,
  `search-result-card.tsx`, `search-filters-panel.tsx` — bigger piece,
  touches the same identity/filter-key fields discussed in the country-label
  fix, needs more care.
