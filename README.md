# GoAir — Phase 2 Frontend: Vehicle/Driver Compliance UI

الباك إند خلص فعلاً على الداتابيز (RPCs + الأعمدة كلها موجودة ومربوطة).
ده الفرونت إند بس، اللي كان ناقص.

## الملفات
انسخ الملفات دي بنفس المسار جوه الريبو (استبدال/إضافة):

- `src/lib/compliance.ts` **(جديد)** — دالة مشتركة بتحدد حالة أي تاريخ انتهاء:
  منتهية / قربت تنتهي (خلال 14 يوم) / سارية / غير مسجّلة.
- `src/components/goair/compliance-badge.tsx` **(جديد)** — الشارة (badge) المستخدمة في الصفحات التلاتة.
- `src/lib/admin.ts` **(معدّل)** — أضفت `license_number`/`license_expiry` لنوع `AdminDriver`،
  و`registration_expiry`/`insurance_expiry` لنوع `AdminVehicle`، ودالتين جداد:
  `adminUpdateDriverCompliance` و`adminUpdateVehicleCompliance`.
- `src/lib/operator.ts` **(معدّل)** — نفس الفكرة لكن لبوابة شركة النقل:
  `operatorUpdateDriverCompliance` و`operatorUpdateVehicleCompliance`.
- `src/routes/admin.fleet.tsx` **(معدّل)** — كل سائق/عربية دلوقتي عندها badge لحالة الامتثال
  وزرار تعديل (قلم) بيفتح فورم صغير لتحديث تاريخ الرخصة/الترخيص/التأمين.
- `src/routes/admin.index.tsx` **(معدّل)** — شاشة التخصيص (assign trip):
  الليستة بتاعة السائقين/العربيات بتظهر تحذير (⚠️) جنب أي واحد فيهم قريب من الانتهاء،
  ولما تختار سائق/عربية بيظهر تحت الكارت تحذير واضح بالتواريخ لو فيه خطر — قبل ما تدوس "تخصيص".
- `src/routes/operator.fleet.tsx` **(معدّل)** — شركة النقل تقدر تسجّل/تحدّث تواريخ الرخصة
  والترخيص والتأمين بنفسها (self-report)، بنفس الـbadge.

## ملاحظات
- `CHANGES.diff` موجود لو حابب تراجع الفروق بصيغة git diff بدل ما تفتح كل ملف.
- عملت `tsc --noEmit` و`eslint` على الملفات دي — مفيش أخطاء تايبسكريبت، والتحذيرات
  اللي طلعت في eslint كلها `prettier/prettier` (تنسيق مسافات/أسطر) موجودة أصلاً في الكود
  القديم بنفس الكثافة تقريبًا، مش حاجة جديدة سببها التعديل ده.
- الباك إند (الأعمدة + كل الـ RPCs زي `admin_update_driver`, `admin_update_vehicle`,
  `operator_update_driver_compliance`, `operator_update_vehicle_compliance`) شغّال بالفعل
  على مشروع Supabase الحيّ (GOAIR) — مفيش أي migration مطلوبة.
