// Arabic translations — this is the source-of-truth language.
// Keep this file's key structure IDENTICAL to en.ts (same nesting, same keys).
// Add new keys here first, then mirror them in en.ts.

const ar = {
  common: {
    appName: "GoAir",
    loading: "بتحمّل...",
    tryAgain: "حاول تاني",
    home: "الرئيسية",
  },
  header: {
    home: "الرئيسية",
    explore: "استكشف",
    packages: "الباقات",
    subscriptions: "الاشتراكات",
    myTrips: "رحلاتي",
    trackBooking: "تتبع حجزي",
    menu: "القائمة",
  },
  languageToggle: {
    label: "اللغة",
    ar: "عربي",
    en: "English",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    body: "الصفحة اللي بتدور عليها مش موجودة أو اتنقلت لمكان تاني.",
    backHome: "الرجوع للرئيسية",
  },
  errorPage: {
    title: "الصفحة دي متحملتش",
    body: "حصل خطأ من عندنا. جرّب تحدّث الصفحة أو ارجع للرئيسية.",
    retry: "حاول تاني",
    home: "الرئيسية",
  },
  footer: {
    tagline: "نقل مشترك من وإلى المطارات في مصر ولبنان — سعر ثابت، مواعيد معروفة، ومندوب باسمك في صالة الوصول.",
    emailPlaceholder: "بريدك الإلكتروني",
    subscribe: "اشترك",
    invalidEmail: "اكتب بريد إلكتروني صحيح.",
    subscribeSuccess: "تم تسجيلك في القائمة البريدية.",
    subscribeError: "لم نتمكن من تسجيل بريدك.",
    goairHeading: "GoAir",
    myBookings: "حجوزاتي",
    partnerPrograms: "برامج الشراكات",
    contactUs: "تواصل معنا",
    policiesHeading: "سياسات",
    faq: "الأسئلة الشائعة",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    trustedRiders: "+10,000 راكب وثق برحلته معانا",
    tagFooter: "Hand on the land, eye on the sky.",
  },
  home: {
    meta: {
      title: "GoAir — نقل مشترك من وإلى المطار في مصر ولبنان",
      description:
        "احجز مقعدك في نقل مشترك من وإلى مطارات مصر ولبنان: سعر ثابت لكل مقعد، مواعيد ثابتة، واستقبال خارج المطار.",
      ogDescription: "سعر ثابت، مواعيد معروفة، واستقبال خارج المطار بدون مفاوضات.",
    },
    errorLoadingTrips: {
      title: "مش قادرين نحمّل الخطوط دلوقتي",
      body: "جرّب تحديث الصفحة بعد لحظات.",
    },
    hero: {
      badge: "مصر ولبنان — متاح الآن",
      title: "رحلتك تبدأ من هنا",
      subtitle: "حلول سفر متكاملة مصممة لكل رحلة",
      imageAlt: "مدرج مطار وقت الغروب",
      statActiveRoutes: "خط رحلة نشط",
      statCountrySingular: "دولة متاحة الآن",
      statCountryPlural: "دول متاحة الآن",
      statSupport: "دعم متواصل",
    },
    faq: {
      title: "أسئلة سريعة",
      q1: "هأقابل السائق فين؟",
      a1: "نقطة التقاء واضحة خارج المطار — التفاصيل تظهر في تذكرتك بعد تأكيد الحجز.",
      q2: "السعر بيتغير؟",
      a2: "السعر المعروض لكل مقعد ثابت — ما تشوفش سعر مختلف عند الدفع.",
      q3: "ازاي أتابع حجزي؟",
      a3: "من صفحة «حجوزاتي» — اكتب كود التذكرة اللي استلمته بعد الحجز.",
    },
  },
} as const;

export default ar;
