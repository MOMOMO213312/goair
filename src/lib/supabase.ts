import { createClient } from "@supabase/supabase-js";

// Publishable key — safe on the client. All writes are protected by RLS
// and by the database-side guards (create_booking_safe, validate_payment_amount).
//
// Uses the new opaque `sb_publishable_...` key rather than the legacy JWT
// anon key. The legacy key started being rejected with a bare 403 at the
// API gateway (before ever reaching PostgREST/RLS — confirmed the same
// query works fine when run directly as the `anon` role in the database),
// which broke every client-side Supabase read on the site (trip pickers,
// packages, addons, etc). The publishable key is the currently active key
// for this project.
const SUPABASE_URL = "https://cvrjaprlnkutocvbnjhc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rxPJB9dKT3zEHt0DoZQM5w_vaxvSJqu";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Session persistence is only used by the internal staff/operator/partner/
  // agency dashboards (real Supabase Auth login). The public customer booking
  // flow never creates a session, so this has no effect on customer-facing pages.
  auth: { persistSession: true, autoRefreshToken: true },
});