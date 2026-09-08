# GoAir — دليل استكمال الترجمة (i18n)

البنية التحتية جاهزة وشغالة (مطبقة على Header, Footer, Homepage, 404/Error pages).
الملف ده هو الدليل عشان تكمل بيه باقي الموقع — إما بنفسك أو عبر Claude Code.

## البنية الجاهزة

```
src/lib/i18n/
  translations/
    ar.ts       ← كل نص عربي (اللغة الأساسية / default)
    en.ts       ← نفس المفاتيح بالظبط بالإنجليزي
    index.ts    ← types + قائمة اللغات
  language-context.tsx  ← LanguageProvider + useLanguage() + useTranslation()

src/components/language-toggle.tsx  ← زرار EN/عربي (موجود في الـ Header)
```

- الافتراضي: **عربي (RTL)**.
- التبديل **يدوي فقط** (زرار)، مفيش auto-detect حسب الدولة/المتصفح.
- الاختيار بيتحفظ في `localStorage` (`goair_lang`) وبيتطبّق على `<html lang dir>`.
- الـ SSR الأول دايمًا بيرندر عربي (مفيش وميض/flash إلا لو الزائر كان مختار إنجليزي قبل كده — تريد أوف واعي، مش خطأ. لو حبيت تحسّنها لاحقًا: اقرأ الكوكي على السيرفر في `__root.tsx`).

## النمط اللي تتبعه لكل ملف (Route أو Component)

### 1. ضيف المفاتيح في `ar.ts` و `en.ts` الأول

لازم الاتنين يكون عندهم **نفس البنية بالظبط** (نفس المفاتيح، نفس التداخل/nesting).
مثال — لو بتضيف صفحة `/faq`:

```ts
// ar.ts
faqPage: {
  title: "الأسئلة الشائعة",
  subtitle: "...",
},

// en.ts
faqPage: {
  title: "Frequently Asked Questions",
  subtitle: "...",
},
```

### 2. في الملف نفسه (route أو component)

```tsx
import { useTranslation } from "@/lib/i18n/language-context";

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("faqPage.title")}</h1>;
}
```

استبدل كل نص عربي هارد-كودد جوه الـ JSX بـ `{t("...")}`.

### 3. الحالة الخاصة: `head()` في الـ routes (meta tags/SEO)

دالة `head()` بتتنفذ *قبل* ما الـ Provider يترندر (لأنها بتغذي `<HeadContent />` في الـ shell)،
فمينفعش تستخدم `useTranslation()` جواها. الحل المتبع في `index.tsx`:

```ts
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";
const pageMeta = translations[DEFAULT_LANGUAGE].faqPage;

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: pageMeta.title }] }),
  // ...
});
```

يعني الـ `<title>` والـ meta tags هتفضل عربي دايمًا حتى لو المستخدم بدّل للإنجليزي (client-side فقط).
ده تريد-أوف مقبول للـ v1. لو عايز تظبطها بالكامل لاحقًا، محتاج تقرأ لغة المستخدم من كوكي على
السيرفر جوه TanStack Start loader/beforeLoad بدل ما تعتمد على localStorage بس.

### 4. نصوص جوه بيانات جاية من الداتابيز (مش string literals)

نصوص زي `meeting_point`, `trip.destination`, رسائل الإدمن، إلخ — **دي مش جزء من هذا الترحيل**.
البيانات دي بتتخزن عربي في الداتابيز أصلاً ومفيش حل ترجمة تلقائية ليها دلوقتي (يحتاج قرار منفصل:
إما تترجم يدوي وتضيف عمود `_en` في كل جدول، أو تسيبها عربي دايمًا بغض النظر عن لغة الواجهة).

## الملفات اللي لسه محتاجة ترحيل (39 route + 61 component)

رتّبهم حسب الأولوية دي (الأهم أولًا — صفحات العميل الحقيقية قبل لوحات الإدارة):

**أولوية 1 — رحلة الحجز (العميل الحقيقي بيشوفها):**
- `src/routes/search.tsx`
- `src/routes/book.tsx`
- `src/routes/payment.tsx`
- `src/routes/confirmation.tsx`
- `src/routes/my-bookings.tsx`
- `src/components/goair/search/*` (كل الملفات دي)
- `src/components/goair/payment/*`
- `src/components/goair/confirmation/*`

**أولوية 2 — باقي صفحات العميل:**
- `src/routes/explore.tsx`, `package.tsx`, `subscribe.tsx`, `contact.tsx`, `faq.tsx`, `terms.tsx`, `privacy.tsx`
- باقي `src/components/goair/*` (اللي مش search/payment/confirmation)

**أولوية 3 — بوابات الشراكة (partner/agency/operator):**
- `src/routes/partner.*`, `agency.*`, `operator.*`
- `src/components/partner/*`, `src/components/agency/*`, `src/components/operator/*`

**أولوية 4 — لوحة الإدمن (داخلي، مش لازم إنجليزي أصلًا لو الفريق كله عربي):**
- `src/routes/admin.*`
- `src/components/admin/*`

## Checklist سريع لكل ملف

- [ ] لقيت كل الـ string العربي الهارد-كودد جوه JSX (`grep -n '[ء-ي]' path/to/file.tsx`)
- [ ] ضفت المفاتيح المقابلة في `ar.ts` **و** `en.ts` بنفس البنية
- [ ] استبدلت النصوص بـ `t("...")`
- [ ] لو الملف فيه `head()`، طبّقت الحل بتاع القسم 3 فوق
- [ ] `npx tsc --noEmit` مفيهوش أخطاء جديدة (فيه 69 خطأ قديم في المشروع أصلاً، متعلقة بحاجة تانية خالص —
      متأكد إن رقم الأخطاء منزادش عن كده بعد تعديلك)

## ملاحظة عن الـ RTL/LTR

الـ `dir` بيتغير تلقائي على `<html>` (rtl للعربي، ltr للإنجليزي) — التخطيط العام (flex, grid) هيتقلب
صح تلقائيًا لأنه معتمد على منطق المتصفح. لكن لو فيه أي مكان في الكود مستخدم `mr-`/`ml-`/`text-right`/
`text-left` (بدل `ms-`/`me-`/`text-start`/`text-end` المنطقية)، ده هيفضل ثابت في نفس الاتجاه حتى لو
بدّلت اللغة. لو شفت تخطيط غريب بعد تحويل صفحة معينة للإنجليزي، دور على `mr-`/`ml-` في نفس الملف
وحولها لـ logical properties (`ms-`/`me-`).
