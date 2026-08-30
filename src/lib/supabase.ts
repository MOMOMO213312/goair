import { createClient } from "@supabase/supabase-js";

// Publishable anon key — safe on the client. All writes are protected by RLS
// and by the database-side guards (create_booking_safe, validate_payment_amount).
const SUPABASE_URL = "https://cvrjaprlnkutocvbnjhc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cmphcHJsbmt1dG9jdmJuamhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTk4MDMsImV4cCI6MjEwMTIzNTgwM30.Egbx6YqnEeCVBc9avOTV8V9yj_kAvGJ9itHKC4wj-vs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});