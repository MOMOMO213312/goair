# GOAIR — Airport Transportation & Ground Mobility Platform

> منصة نقل أرضي ومطارات: Shared/Private Airport Transfer, Car Rental (rent-with-driver), Ground Handling Services, وشراكات Airline/Agency — تشغّل عبر شبكة مزودين (Operators/Rental Partners/Ground Handling Partners) وليس أسطول مملوك لـ GOAIR.

هذا الملف يوثّق **الحالة الفعلية الحالية** للمشروع، لا خطة بناء أولية. أي عمل مستقبلي (بشري أو عبر أداة توليد كود) يجب أن يبني على ما هو موجود فعلاً هنا، لا على افتراضات v1 قديمة.

---

## ١. النموذج التجاري الأساسي

**Network-not-fleet**: GOAIR لا تملك مركبات ولا سائقين ولا خدمات أرضية. كل طرف يملك أصوله الخاصة:
- **Transport Operators** يملكون المركبات والسائقين وينفذون رحلات الـ Transfer
- **Rental Partners** يملكون السيارات (rent-with-driver) ويحددون تسعيرهم (بموافقة إدارية قبل الظهور للعامة)
- **Ground Handling Partners** يقدمون خدمات المطار الإضافية (Fast Track, Meet & Assist, Lounge...)
- **Airlines / Travel Agencies** (موحّدون تحت جدول `partners`) يحيلون ركاب عبر عمولة

مصادر الإيراد: هامش النقل (فرق سعر العميل عن مستحقات الـ operator)، رسوم الخدمات الإضافية، الإيجار، اشتراكات العملاء، الباقات، عمولات شراكات الطيران/الوكالات.

---

## ٢. الأسواق الحالية

مصدر الحقيقة الوحيد لقائمة الدول هو جدول `launch_markets` — **لا يوجد أي هاردكود لقائمة دول في الكود**.

| الدولة | العملة المعروضة | ظاهرة للعامة |
|---|---|---|
| مصر | USD | ✅ |
| لبنان | USD | ✅ |
| الأردن | JOD | ❌ (جاهزة تقنيًا، بانتظار قرار فتح) |
| أوغندا | UGX | ❌ |

تركيا: غير مبدوءة إطلاقًا.

طبقة العملة/الضريبة (`exchange_rates`, `tax_rules`) موجودة كطبقة presentment منفصلة عن الـ USD الداخلي (ledger)، مربوطة فعليًا في `create_booking_safe` وRPCs الإيجار والاشتراكات.

---

## ٣. أنواع المركبات (`vehicle_types`)

| الكود | الاسم | السعة |
|---|---|---|
| `car` | Private Car | ٤ ركاب (تدعم premium/standard) |
| `van` | Van | ٨ ركاب |
| `hiace` | Hiace | ١٤ راكب |
| `bus` | Bus | ٥٠ راكب |

Private ride موجود فعليًا (`create_private_booking_safe`) — التقسيم premium/standard مطبّق على `car` فقط، أُلغي عمدًا من `van`/`hiace`.

---

## ٤. البورتالات الخمسة (كلها مبنية وشغالة فعليًا)

المشروع بُني بـ TanStack Start (React + TypeScript) + Tailwind + shadcn/ui، وقاعدة بيانات Supabase (Postgres + RLS). ٦٥ صفحة/route فعلية في `src/routes/`، موزعة على:

1. **Admin** (`admin.*`, ١٦ صفحة فرعية) — bookings, pricing, fleet, partners, rental applications/vehicles/partners, ground handling, subscription plans, packages, requests, announcements, team/roles
2. **Operator Portal** (`operator.*`) — fleet, trips (assign/execute), sell (بيع كـ sales partner), statements, team
3. **Partner Portal** (`partner.*`, موحّد لـ airlines + agencies تحت `/partner`) — book, bookings, capacity, services, subscriptions, statements, team, terms
4. **Ground Handling Portal** (`ground-handling.*`, ٨ صفحات) — requests, flights, travelers, services, staff, statements, reports, team
5. **Rental Provider Portal** (`rental-provider.*`) — vehicles, bookings, team

بالإضافة لصفحات العميل العامة: `index`, `search`, `book`, `payment`, `confirmation`, `my-bookings`, `explore`, `package`, `rent-a-car`, `rent-your-car`, `subscribe`, `agency`, `contact`, `faq`, `terms`, `privacy`.

**لا يوجد أي admin dashboard منفصل غير موجود، ولا operator portal غير موجود — كلاهما مبني بالكامل.**

---

## ٥. قواعد الحجز والأمان (يجب الالتزام بها في أي كود جديد)

- **كل إنشاء حجز يمر حصريًا عبر RPC**: `create_booking_safe` أو `create_private_booking_safe`. **لا يوجد ولا يجب أن يوجد أي `insert`/`update` مباشر على جدول `booking`** من الفرونت إند — تم التحقق من هذا في الكود الحالي (`src/lib/goair.ts`) وهو نظيف تمامًا في هذه النقطة.
- مفتاح Supabase في `src/lib/supabase.ts` هو **publishable/anon key فقط** (`sb_publishable_...`) — أي service_role key ممنوع نهائيًا من الظهور في كود العميل.
- القراءة المصرح بها للحجز عبر `get_booking_by_ticket` فقط (بـ `ticket_code`)، لا يوجد SELECT policy مباشر على `booking`/`payments`.
- الإلغاء عبر `cancel_booking_by_ticket` فقط.
- الدفع: proof-of-payment يدوي (تحويل بنكي/InstaPay/Vodafone Cash) + مراجعة إدارية — لا يوجد payment gateway حتى الآن.

---

## ٦. حالة تكامل TripRing (Ecosystem Layer)

جدول `external_links` موجود في الـ DB (migration `add_ecosystem_external_links`) ويحمل: `local_booking_id`, `external_platform`, `external_reference`, `pnr`, `ticket_numbers`, `issuing_agency`, `link_type`, `match_method`, `match_confidence`.

`create_booking_safe` يقبل بالفعل بارامترات الربط الخارجي (migration `create_booking_safe_add_external_link_params`).

**⚠️ الفجوة الحالية: الفرونت إند لا يرسل هذه البارامترات إطلاقًا.** `createBookingSafe()` في `src/lib/goair.ts` ترسل كل بيانات الحجز (اسم، تليفون، رحلة، إضافات...) لكن بدون أي `p_external_platform`/`p_pnr`. أي عميل قادم من TripRing عبر رابط إحالة لا يُسجَّل حاليًا كمصدره TripRing. **هذه أعلى أولوية فعلية لأي خطوة نحو تكامل حقيقي مع TripRing** — العمل مطلوب في الفرونت إند فقط، الـ backend جاهز ومنتظر.

ملاحظة تصميمية: `external_links` بحالته الحالية جسر تذاكر/PNR، وليس Identity/Passenger/Journey layer كامل — أي تصميم مستقبلي لربط أعمق (مسافر موحّد، رحلة كاملة، توزيع إيراد عبر منصتين) يحتاج طبقة جديدة فوقه، لا تعديلًا عليه.

---

## ٧. فجوات أمنية معروفة (يجب إغلاقها، غير مصلحة بعد)

- ١١ جدول عليها RLS مفعّل **بدون أي policy**: `booking_addon_services`, `booking_passengers`, `customer_subscriptions` (متعمّد — القراءة فقط عبر RPC)، `exchange_rates`, `external_links`, `ground_handling_partners`, `ground_handling_services`, `ground_handling_staff`, `ground_handling_statements`, `rental_partner_statements`, `tax_rules`
- حماية كلمات المرور المسربة (HaveIBeenPwned) في Supabase Auth **متوقفة**
- ١٧٨ دالة SECURITY DEFINER قابلة للتنفيذ من `anon`/`authenticated` — متوقع جزئيًا ضمن فلسفة "RPC-gated access" المعتمدة، لكن العدد كبير جدًا ويحتاج مراجعة أمنية مخصصة، غير مغطاة هنا

---

## ٨. حالة البيانات التشغيلية

القاعدة جاهزة هيكليًا بالكامل، لكن حجم العمليات الفعلية لا يزال شبه صفري (`booking`, `rental_bookings`, `ground_handling_services` كلها بحدود ٠-٢ صف فعلي وقت آخر مراجعة). أي عمل هندسي جديد على تكامل TripRing أو توسع جغرافي يجب أن يأتي بعد إثبات حجم حجوزات حقيقي في مصر ولبنان، لا قبله.

---

## ٩. التطوير محليًا

```bash
git clone <repo-url>
cd goair
npm i
npm run dev
```

Stack: TanStack Start + React + TypeScript + Tailwind CSS + shadcn/ui + Supabase (`@supabase/supabase-js`).

**Live**: goair-iota.vercel.app
