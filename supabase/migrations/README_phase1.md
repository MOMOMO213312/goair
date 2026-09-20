# GoAir — Phase 1 migrations (طُبّقت على الإنتاج بتاريخ 2026-09-20)

1. `20260920120001_phase1_harden_direct_writes_and_money_paths.sql`
2. `20260920120002_phase1_fix_trip_assignment_lifecycle.sql`
3. `20260920120003_phase1_drop_ambiguous_create_booking_safe_overload.sql`

الملفات دي **متطبّقة بالفعل** على قاعدة الإنتاج (`cvrjaprlnkutocvbnjhc`) وهي هنا للتوثيق ولإعادة بناء البيئة.
كلها idempotent، فتشغيلها تاني آمن.

لو بتستخدم Supabase CLI ومش عايز يعيد تشغيلها على الإنتاج، علّمها كمتطبّقة:

    supabase migration repair --status applied 20260920120001 20260920120002 20260920120003
