# Airport Connect Pro

MASTER BUILD PROMPT — GoAir (v2 — Corrected Against Real Database)

Airport Shared Mobility Platform — Customer Booking & Pricing Engine

 

Note on this revision: This is your v1 master prompt, corrected against the actual live Supabase database (project "GOAIR") after a full technical audit. The previous version described a schema and pricing model that do not exist in the real database and would have caused every booking/payment call to fail. Sections marked [VERIFIED] match the real database exactly. Sections marked [CORRECTED] replace incorrect assumptions from the previous version. Everything else is unchanged from your original intent.

 

You are the Lead Product Manager, Senior UX/UI Designer, UX Researcher, Product Architect, and Full-Stack Engineer responsible for building GoAir, a premium airport shared transportation platform.

 

Your job is not simply to build a functional website. Your primary goal is to build a world-class booking experience comparable in usability, clarity, speed, and visual quality to major transportation and travel booking platforms such as GoBus, FlixBus, Uber, Booking.com, Wego, and modern airline websites — while creating a unique identity for this product. Do NOT copy their branding, layouts, logos, or copyrighted design. Study their product patterns conceptually and implement a better original experience.

 

1. PRODUCT CONCEPT [CORRECTED — vehicle list and trip type]

 

Build an Airport Mobility Marketplace-style experience connecting passengers with shared transportation to and from airports.

 

Vehicle types [CORRECTED — matches real vehicle_types table exactly, 3 types only, no private/Sedan option in v1]:

- فان / Van — 8 seats

- هاي إيس / Hiace — 14 seats

- أوتوبيس / Bus — 50 seats (not 30 — verified against the real capacity value)

 

[CORRECTED] There is no private/Sedan ride option in v1. GoAir v1 is shared transport only. Do not build a "Shared vs Private" trip-type toggle. This was deliberately excluded to keep v1 simple.

 

[CORRECTED] The vehicle type itself is never shown to the customer as a label ("Van"/"Hiace"/"Bus"). The customer only ever sees the route, the fixed departure time, and the price. Vehicle type is an internal dispatch concept only, used by GoAir's ops team.

 

Core routes: Airport → City / Destination, City / Destination → Airport. [UNCHANGED — scope] Keep the route model generic (trip.destination as free text) so adding more route types later needs no schema change.

 

[UNCHANGED — business model] GoAir contracts directly with a small number of vetted local transport partners per city, managed by GoAir's own team through direct database access (SQL) — not a self-service operator portal. No operator-facing login in v1.

 

[UNCHANGED — the actual primary business goal] GoAir's current top priority is landing a commission-based referral partnership with an airline company: the airline shares a tracking link, passengers who book through it are tagged with partner_id, and the airline sees referred bookings and commission owed. This is core to why v1 needs to look credible and work end-to-end without visible placeholders.

 

2. INITIAL MARKET [VERIFIED — matches launch_markets table]

 

The first launch markets are Egypt AND Lebanon, together, both live at once. This is now reflected in the launch_markets table (both set to is_visible_to_public = true). Jordan and Uganda exist fully in the database (priced, scheduled) but stay hidden (is_visible_to_public = false) until a deliberate future decision to open them — flip one row in launch_markets, no code change needed.

 

The search widget's country/destination dropdowns must read from launch_markets (where is_visible_to_public = true), never hardcode the country list.

 

Arabic RTL is the default, not an alternate mode.

 

[OPEN ITEM — do not guess] Payment methods per country: Egypt has Vodafone Cash + InstaPay (Egypt-only) plus Bank Transfer, Cash on Arrival, and International Card (available in both countries). Lebanon-specific payment methods (likely OMT / Whish Money) are NOT yet decided or in the database — payment_settings now has a country column (null = available in both countries) ready for them, but do not invent or hardcode a Lebanese method name until it's confirmed and inserted into payment_settings.

 

Country-specific legal terms: Terms of Use and Privacy Policy need review by a licensed lawyer in both Egypt and Lebanon before real launch.

 

3. MOST IMPORTANT REQUIREMENT — UI / UX [UNCHANGED]

 

The UI/UX is the highest priority. Do not build a generic SaaS dashboard. The product must feel like a large established travel company. The first impression must communicate: Trust + Travel + Airport + Reliability + Simplicity. The customer should understand the product within 5 seconds.

 

4. BRAND & DESIGN SYSTEM [UNCHANGED]

 

Typography: Cairo (display/headings, bold–extrabold) + Tajawal (body text).

Color tokens: Navy #1F3B57 (primary), Gold #C97A2B (accent/CTAs), Mist #EAF1F8 (secondary background), White #FFFFFF (primary background), Gray #666666 (secondary text). No dark mode.

Signature element: a recurring dashed, curved "flight path" line (SVG) — hero background, section divider, loading/empty states.

Hero pattern: full-bleed real photo (airport/runway at golden hour) with a dark navy gradient overlay, search form as a floating white card with strong shadow.

Cards: soft shadow, rounded-xl corners, real photography for destinations.

Icons: Lucide, consistently.

 

5. CUSTOMER HOMEPAGE [CORRECTED — no trip-type toggle]

 

Hero + floating search widget: Country (from launch_markets) → Airport → Destination → Date → Passengers (single seat count, no adults/children/infants split — see Section 26).

 

Destination cards below the hero: real domestic ground routes GoAir actually serves, pulled from trip (e.g. CAI → Nasr City, CAI → Downtown, BEY → Jounieh) — never international flight-style city cards.

 

Trust strip directly under the hero: fixed price guarantee, free cancellation window, named meet-and-greet at arrivals.

 

6–10. SEARCH, PRICING, VEHICLE SELECTION, RESULTS [CORRECTED — pricing model]

 

[CORRECTED — pricing formula] GoAir does NOT use a dynamic base+distance+time+surcharge formula in v1. Every (route × vehicle type) combination has a pre-researched, pre-computed fixed price per seat, already stored in trip_options.price_usd (grounded in real official/market fare research per country — see the pricing audit report). Total price = trip_options.price_usd × seats_count, computed server-side inside create_booking_safe — never computed or recomputed on the client.

 

[UNCHANGED — price transparency] Customer-facing breakdown shows: price per seat × number of seats = total. Internal cost basis and airline commission math must never appear in any customer- or partner-facing UI or client-side code.

 

Results page shows, per available schedule: departure time, price per seat (live-multiplied by the passenger count the customer entered), and remaining seats (computed as vehicle capacity minus already-booked seats for that schedule + date, excluding cancelled bookings). If remaining seats < requested seats, disable the "Book" button and show "Not enough seats available."

 

If no schedules match: never show an empty page. Show "اطلب الخط ده" (custom_requests insert) as the fallback, per GoAir's own "never an empty result" principle.

 

11. BOOKING FLOW [CORRECTED — the exact real functions, including one the previous prompt missed]

 

Search → Choose schedule → Passenger details → Payment → Confirmation.

 

[CORRECTED — the actual current priority] All booking creation MUST go through supabase.rpc('create_booking_safe', {...}) — never a raw insert into booking. This function locks the schedule row, checks real remaining capacity (respecting schedules.capacity_override if set, otherwise the linked vehicle_type's capacity), computes and stores expected_total_usd server-side from trip_options.price_usd × seats_count, and rejects the call if there isn't enough room. This is what prevents GoBus's worst known failure mode (seat shows booked, then available again).

 

[CORRECTED] All payment submissions MUST go through a normal insert into payments — but that insert is protected by a database trigger (validate_payment_amount) that automatically rejects any amount_usd not matching the booking's expected_total_usd (small rounding tolerance). Do not try to "validate" the amount in the frontend only — the database is the real guard.

 

[CORRECTED] Confirmation and "My Bookings" (/my-bookings, looked up by ticket_code, no login) MUST call supabase.rpc('get_booking_by_ticket', { p_ticket_code }) — this is the only sanctioned read path for a customer's own booking. There is no direct SELECT policy on booking or payments for anon/authenticated — this was a deliberate fix after a full public-data-exposure vulnerability was found and closed. Do not try to add a direct SELECT policy back.

 

[NEW] Cancellation from the customer side MUST call supabase.rpc('cancel_booking_by_ticket', { p_ticket_code, p_reason }) — sets status, cancellation_reason, cancelled_at, and refund_status='pending' atomically. Show the cancellation policy text next to the cancel button (see Section 12-14).

 

Do not build Sections 21–23 (repeat booking, operator portal, admin platform beyond what's specified below) before this safety wiring is done and tested end-to-end.

 

12–14. AIRPORT PICKUP, FLIGHT-AWARE BOOKING, CONFIRMATION [CORRECTED — real column names]

 

Flight number capture (flight_number, flight_origin, flight_scheduled_time on booking), a named meet-and-greet point (meeting_point — free text like "بجانب عمود رقم 3، لافتة GoAir الزرقاء", never a generic "arrivals hall"), and a QR code encoding ticket_code on the confirmation page — these are v1 priorities.

 

Show a clear, fixed waiting-grace-period policy on both the booking page and confirmation: "لو اتأخرت طيارتك، سائقك هيستناك مجانًا لحد ساعة من وقت الهبوط الفعلي." (actual_landing_time exists on booking for this purpose — populated manually/by ops for v1, not by a live flight-data feed).

 

Live flight-status integration (Scheduled/Delayed/Landed) is correctly scoped as post-v1, requiring a real flight-data provider contract.

 

15–16. MOBILE UX & RTL [UNCHANGED]

 

Mobile-first, sticky CTA, minimal typing, native-feeling Arabic RTL as the default.

 

17–18. DESIGN SYSTEM COMPONENTS [UNCHANGED — see Section 4]

 

19. HOMEPAGE SECTIONS [UNCHANGED]

 

Booking widget → Destination cards (real local routes) → Trust strip → FAQ preview → Footer (with newsletter signup — insert into newsletter_subscribers — and a "تواصل معنا" link to a contact form that inserts into contact_messages).

 

Add a /partner page — the airline partnership pitch — linked from the main nav as "شركاء الطيران". This is currently GoAir's most important page after the booking flow itself.

 

20–21. CUSTOMER ACCOUNT & REPEAT BOOKING [DEFERRED — not v1]

 

No login/account system in v1 — bookings are looked up by ticket_code via get_booking_by_ticket, matching the "no accounts, low friction" spirit of v1.

 

22. OPERATOR EXPERIENCE [DEFERRED — not v1]

 

No operator-facing login. Vehicle/driver assignment happens directly in the database (trip_assignments table, one row per schedule + travel_date — never per individual booking) by GoAir's own team, using the needs_dispatch and daily_passenger_manifest views as the daily workflow tools.

 

23. ADMIN PLATFORM [CORRECTED — no dashboard UI in v1]

 

[CORRECTED] There is no admin dashboard UI in v1 at all — not even a simple password-gated one. All admin operations (reviewing payments, assigning drivers/vehicles, processing cancellations/refunds, reviewing contact messages) happen directly via SQL in the Supabase SQL editor. This was a deliberate simplicity decision, not a gap to fill — do not build /dashboard for v1. (Revisit once manual SQL genuinely becomes the bottleneck.)

 

24–25. PRICING ENGINE [CORRECTED — matches Section 6-10]

 

There is no configurable pricing engine (no base fare / per-km / per-minute / surcharge admin tool) in v1. Prices live as fixed values in trip_options.price_usd, set and maintained directly via SQL as part of the pricing research process already completed for the launch routes. Do not build a pricing-config UI for v1.

 

26. DATABASE [CORRECTED — this is the real, verified schema]

 

Core tables actually in use: trip, schedules, trip_options, vehicle_types, launch_markets, booking, payments, payment_settings, drivers, vehicles, trip_assignments, airline_partners, partner_statements, capacity_forecasts, ratings, custom_requests, contact_messages, newsletter_subscribers, notifications_log.

 

Key booking columns (real names — use these exactly): full_name, phone_number, trip_id, schedule_id, trip_option_id, travel_date, travel_datetime, seats_count (single integer, no adults/children/infants split), status ('pending'|'confirmed'|'cancelled'), ticket_code, invoice_number, expected_total_usd (set server-side by create_booking_safe — never read/write it directly from the client), flight_number, flight_origin, flight_scheduled_time, actual_landing_time, meeting_point, luggage_count, trip_assignment_id, cancellation_reason, cancelled_at, refund_status, source, partner_id, updated_at (auto).

 

There is no direction column and no booking_group_id column — do not reference them.

 

trip carries distance_km (not duration_minutes — that column does not exist).

 

Never call create_booking_safe or read/write booking directly for pricing — always go through the RPC functions listed in Section 11.

 

Do not invent parallel tables (users, operators, route_stops, booking_passengers, audit_logs, etc.) for v1. If a v1 feature needs a new table (e.g. discount_codes for a launch promo — see the Final Vision roadmap), propose it explicitly rather than assuming it already exists.

 

27. TECHNICAL REQUIREMENTS [UNCHANGED, with one correction]

 

Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui.

Backend/DB/Auth/Storage: Supabase (Postgres + RLS + Storage + Anonymous Auth on the client — never expose the service role key client-side).

Booking safety: the four RPC functions in Section 11 [CORRECTED — four, not three: create_booking_safe, get_booking_by_ticket, cancel_booking_by_ticket, plus the validate_payment_amount trigger that runs automatically on payment insert] — call them through supabase.rpc(...), not raw table insert/update.

Payments: manual proof-of-payment upload + manual admin review via SQL for v1 (no payment gateway integration yet).

Notifications: WhatsApp-first for v1 (manual, via support number); the notifications_log table exists to record what was sent, but automated sending needs a messaging provider contract first (Priority 2).

Hosting: GitHub → Vercel auto-deploy on push to main.

 

28–34. PERFORMANCE, RESPONSIVE DESIGN, EMPTY STATES, ERROR HANDLING, TRUST, AUTOCOMPLETE, DIFFERENTIATION [UNCHANGED]

 

Never leave a blank screen or infinite loading spinner on a failed booking or payment — this is GoBus's proven central failure mode, not a minor polish item. Every create_booking_safe or payment insert failure must surface a specific, human-readable error to the customer immediately.

 

35. MVP PRIORITY [CORRECTED — nothing is "already built"; this is the real starting priority order]

 

Priority 1 — build first

Homepage with launch_markets-driven search, results page with live seat-count math, booking flow wired to create_booking_safe from day one (not retrofitted later), payment insert protected by validate_payment_amount, confirmation page with QR + get_booking_by_ticket, /my-bookings lookup + cancel_booking_by_ticket.

 

Priority 2

/partner pitch page, clear cancellation/wait-policy text, contact form + newsletter signup wired to their real tables, launch discount code (requires a new discount_codes table — propose schema before building), Lebanon payment methods finalized and inserted into payment_settings.

 

Priority 3

Automated flight-landing notifications (needs a messaging provider), customer accounts, repeat booking, partner commission portal with real login.

 

Priority 4 (explicitly not v1)

Operator self-service portal, admin dashboard UI, live GPS tracking, door-to-door pooling, loyalty wallet, dynamic/demand-based pricing, private/Sedan rides.

 

36–38. UX PROCESS, QUALITY BAR, FINAL INSTRUCTION [UNCHANGED]

 

Design the full customer journey before writing more code; hold every new screen to: would this look credible next to a major airline website, and would a first-time user complete a booking on their phone in under two minutes without help. Act as the founding product team, not a code generator.

 

BUILD A WORLD-CLASS CUSTOMER BOOKING EXPERIENCE — for Egypt and Lebanon together, with an airline commission model at its core, on the real database schema verified above, not an assumed one.

 LOGO ATTACHED AS PHOTO

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://groundwing-rides.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e8e48b10-2c58-4cb4-8bd1-54077cc24bd4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
