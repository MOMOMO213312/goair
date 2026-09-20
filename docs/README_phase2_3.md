# Phase 2 + 3a (+ 3b frontend)

## supabase/migrations/ — ALREADY APPLIED ON PRODUCTION (documentation / rebuild only)
- 20260920130001 service_role grants for the edge functions
- 20260920130002 submit_payment_safe
- 20260920130003 payment-proofs bucket limits + no listing
- 20260920130004 submit_subscription_payment_safe
(If you use `supabase db push`, first run:
 supabase migration repair --status applied 20260920130001 20260920130002 20260920130003 20260920130004)

## src/ — NOT YET DEPLOYED (files based on main @ 8257b94)
- src/lib/goair.ts, src/routes/payment.tsx, src/routes/subscribe.tsx
  now pay through the new RPCs instead of inserting into payments / subscription_payments.
- docs/phase3b-frontend-payments.patch = the same change as a diff.
- Not type-checked/run locally: test on a Vercel preview first.
- `subscriptionId` state in subscribe.tsx is now unused (possible lint warning).

## After deploying + testing one booking payment and one subscription payment
Ask to close the direct INSERT policies on payments and subscription_payments.
