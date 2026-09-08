import type { Language } from "./translations";

export type FaqEntry = { q: string; a: string };
export type FaqGroup = { title: string; items: FaqEntry[] };

const ar: FaqGroup[] = [
  {
    title: "الحجز",
    items: [
      {
        q: "إزاي أحجز رحلتي؟",
        a: "اختار الدولة والمطار والوجهة والتاريخ، اختار الموعد المناسب من المواعيد المتاحة، اكتب بياناتك، وادفع. هتوصلك تذكرة برقم مرجعي وكود QR بعد التأكيد.",
      },
      {
        q: "السعر بيتغير حسب وقت الحجز أو الزحمة؟",
        a: "لأ. السعر ثابت ومعلن من أول لحظة، ومفيش زيادة وقت الذروة أو الأعياد — السعر اللي بتشوفه وقت الحجز هو اللي بتدفعه بالظبط.",
      },
      {
        q: "السعر بيشمل كل الركاب في العربية ولا لكل راكب لوحده؟",
        a: "السعر معروض للراكب الواحد في الرحلات المشتركة (فان/هاي إيس). لو عايز العربية كلها لنفسك، اختار خيار الرحلة الخاصة وقت الحجز.",
      },
      {
        q: "أقدر أحجز في مصر ولبنان من نفس الموقع؟",
        a: "أيوة، اختار الدولة الأول في فورم البحث، وهتظهرلك المطارات والوجهات المتاحة في نفس الدولة.",
      },
    ],
  },
  {
    title: "الشروط والأمتعة",
    items: [
      {
        q: "كام حقيبة مسموح لي آخدها معايا؟",
        a: "بيعتمد على نوع المركبة المخصصة لرحلتك. لو معاك حقائب زيادة عن المعتاد أو أمتعة غير قياسية (زي معدات رياضية)، تواصل معانا وقت الحجز عشان نظبطلك المكان المناسب.",
      },
      {
        q: "لازم أقول رقم رحلة طيراني؟",
        a: "مش إجباري لرحلة الذهاب، لكن بننصح بيه بشدة لأنه بيخلينا نتابع أي تأخير في طيرانك ونظبط وقت استقبالك تلقائيًا. لرحلة العودة (من بيتك للمطار)، لازم تقول رقم رحلتك عشان نحسب الموعد المناسب صح.",
      },
    ],
  },
  {
    title: "التعديل والإلغاء",
    items: [
      {
        q: "أقدر ألغي أو أعدّل حجزي؟",
        a: "أيوة. الإلغاء أو التعديل قبل الموعد المحدد (المهلة معلنة وقت الحجز نفسه) بيسمح باسترجاع كامل أو جزئي. الإلغاء قريب جدًا من موعد الرحلة ممكن ما يكونش قابل للاسترجاع الكامل.",
      },
      {
        q: 'لو ما جيتش نقطة التجمع، هرجع فلوسي؟',
        a: 'لو معاداش الراكب لنقطة التجمع خلال مهلة الانتظار المعلنة، الحجز يُسجَّل "لم يحضر" ومفيش استرجاع تلقائي. لو هتتأخر، كلمنا قبل الموعد ونشوف نساعدك إزاي.',
      },
      {
        q: "أقدر أحجز ذهاب وعودة مع بعض؟",
        a: 'أيوة، تقدر تختار "ذهاب وعودة" وقت الحجز وتحدد موعد الرحلتين مرة واحدة.',
      },
    ],
  },
  {
    title: "الدفع",
    items: [
      {
        q: "إيه طرق الدفع المتاحة؟",
        a: "في مصر: إنستاباي، فودافون كاش، أو التحويل البنكي المباشر. في لبنان: هيتحدد لاحقًا حسب الشراكات المصرفية المتاحة. بعد التحويل، بترفع صورة إثبات الدفع ونراجعها ونأكد حجزك.",
      },
      {
        q: "قد إيه بتستغرق مراجعة الدفع؟",
        a: "عادةً خلال ساعات قليلة. هتوصلك رسالة تأكيد فور مراجعة الدفع والموافقة عليه.",
      },
    ],
  },
  {
    title: "يوم السفر — الاستقبال",
    items: [
      {
        q: "هلاقي السائق فين بالظبط؟",
        a: 'تفاصيل نقطة اللقاء الدقيقة (المكان، رقم العربية، رقم تليفون السائق) بتوصلك قبل موعد رحلتك مباشرة — مش وصف عام زي "صالة الوصول" بس.',
      },
      {
        q: "طيارتي اتأخرت، هيحصل إيه لموعد الفان؟",
        a: "لو كنت كتبت رقم رحلتك وقت الحجز، بنتابع التأخير تلقائيًا ونعدّل وقت استقبالك على حسبه من غير أي رسوم إضافية. لو محصلش تواصل معانا، كلمنا فورًا على رقم الدعم.",
      },
      {
        q: "أعمل إيه لو نسيت حاجة في العربية؟",
        a: "تواصل معانا فورًا برقم تذكرتك ووصف الغرض، وهنساعدك تلاقيه — لكن راجع العربية قبل ما تنزل، لأن GoAir مش مسؤولة عن أغراض متروكة بعد نزول الراكب.",
      },
    ],
  },
  {
    title: "عام",
    items: [
      {
        q: "إزاي أتواصل معاكم لو حصلت مشكلة؟",
        a: "تقدر تكلمنا مباشرة على واتساب الدعم المتاح في كل صفحات الموقع، في مصر أو لبنان.",
      },
    ],
  },
];

const en: FaqGroup[] = [
  {
    title: "Booking",
    items: [
      {
        q: "How do I book my trip?",
        a: "Pick your country, airport, destination, and date, choose a suitable time from the available schedules, enter your details, and pay. You'll get a ticket with a reference number and QR code once confirmed.",
      },
      {
        q: "Does the price change based on booking time or demand?",
        a: "No. The price is fixed and shown upfront, with no peak-hours or holiday surcharge — the price you see when booking is exactly what you pay.",
      },
      {
        q: "Does the price cover the whole vehicle or just one seat?",
        a: "The price shown is per seat on shared trips (van/Hiace). If you want the whole vehicle to yourself, choose the private transfer option when booking.",
      },
      {
        q: "Can I book in both Egypt and Lebanon from the same site?",
        a: "Yes — pick the country first in the search form, and you'll see the airports and destinations available in that country.",
      },
    ],
  },
  {
    title: "Terms & Luggage",
    items: [
      {
        q: "How many bags can I bring?",
        a: "It depends on the vehicle assigned to your trip. If you have extra or non-standard luggage (like sports gear), contact us when booking so we can arrange the right vehicle for you.",
      },
      {
        q: "Do I need to give my flight number?",
        a: "It's not required for an outbound (home-to-airport) trip, but strongly recommended since it lets us track any flight delay and automatically adjust your pickup time. For a return trip (airport-to-home), your flight number is required so we can calculate the right pickup time.",
      },
    ],
  },
  {
    title: "Changes & Cancellation",
    items: [
      {
        q: "Can I cancel or change my booking?",
        a: "Yes. Cancelling or changing before the cutoff (stated at booking time) allows a full or partial refund. Cancelling very close to the trip time may not be fully refundable.",
      },
      {
        q: "If I miss the meeting point, do I get my money back?",
        a: 'If the passenger doesn\'t show up at the meeting point within the stated waiting window, the booking is marked "no-show" with no automatic refund. If you\'re running late, call us before the pickup time and we\'ll see how we can help.',
      },
      {
        q: "Can I book a round trip together?",
        a: 'Yes, you can choose "round trip" when booking and set both trip times at once.',
      },
    ],
  },
  {
    title: "Payment",
    items: [
      {
        q: "What payment methods are available?",
        a: "In Egypt: InstaPay, Vodafone Cash, or a direct bank transfer. In Lebanon: to be determined based on available banking partnerships. After transferring, you upload a proof-of-payment photo and we review and confirm your booking.",
      },
      {
        q: "How long does payment review take?",
        a: "Usually within a few hours. You'll get a confirmation message as soon as your payment is reviewed and approved.",
      },
    ],
  },
  {
    title: "Travel Day — Pickup",
    items: [
      {
        q: "Where exactly will I find the driver?",
        a: 'The exact meeting point details (location, vehicle number, driver\'s phone number) reach you right before your trip time — not a generic description like "arrivals hall" alone.',
      },
      {
        q: "My flight is delayed — what happens to my van's time?",
        a: "If you entered your flight number when booking, we track the delay automatically and adjust your pickup time accordingly at no extra charge. If you didn't, contact us right away on the support number.",
      },
      {
        q: "What if I forgot something in the vehicle?",
        a: "Contact us right away with your ticket number and a description of the item, and we'll help you find it — but please check the vehicle before you get out, as GoAir isn't responsible for items left behind after the passenger exits.",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        q: "How do I reach you if I have an issue?",
        a: "You can message us directly on the support WhatsApp available on every page of the site, in Egypt or Lebanon.",
      },
    ],
  },
];

export const faqContent: Record<Language, FaqGroup[]> = { ar, en };
