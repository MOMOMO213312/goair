import type { Language } from "./translations";

export type LegalBlock = { type: "p"; text: string } | { type: "list"; items: string[] };
export type LegalSection = { title: string; blocks: LegalBlock[] };

// ---------------------------------------------------------------------------
// Terms & Conditions
// ---------------------------------------------------------------------------

const termsAr: LegalSection[] = [
  {
    title: "١. طبيعة الخدمة",
    blocks: [
      {
        type: "p",
        text: "GoAir منصة إلكترونية تسهّل حجز مقاعد في رحلات نقل مشترك مجدولة (فان، هاي إيس، أو أوتوبيس حسب المسار) من وإلى المطار، عبر شركاء نقل محليين مرخّصين في مصر ولبنان. GoAir بتدير الحجز والدفع والتنسيق، لكنها مش شركة نقل بتملك أو تشغّل المركبات مباشرة — الالتزام بمعايير السلامة والترخيص مسؤولية شركاء النقل، وGoAir بتتعاقد بس مع شركاء مرخّصين.",
      },
    ],
  },
  {
    title: "٢. الحجز والتذكرة",
    blocks: [
      {
        type: "list",
        items: [
          "كل حجز بيتربط برقم تذكرة مرجعي وكود QR، وده الإثبات الرسمي للحجز",
          "التذكرة شخصية ومخصصة للراكب المسجّل، ولتاريخ وموعد الرحلة المحددين وقت الحجز بس",
          "لازم البيانات المدخلة (الاسم، رقم التليفون، رقم رحلة الطيران لو موجود) تكون صحيحة، لأن أي خطأ فيها ممكن يأخّر أو يعطّل عملية الاستقبال",
        ],
      },
    ],
  },
  {
    title: "٣. السعر والدفع",
    blocks: [
      {
        type: "list",
        items: [
          "السعر المعروض وقت إتمام الحجز هو السعر النهائي الملزم — مش هيتغير حتى لو الأسعار المعروضة على الموقع اتغيّرت بعد كده، ومفيش زيادة سعر وقت الذروة أو الأعياد",
          "طرق الدفع المتاحة بتختلف حسب الدولة: في مصر (إنستاباي / فودافون كاش / تحويل بنكي)، وفي لبنان يُحدَّد لاحقًا حسب الشراكات المصرفية المتاحة فعليًا",
          "الحجز بيتأكد بعد مراجعة إثبات الدفع، وممكن ياخد وقت قبل التأكيد النهائي",
        ],
      },
    ],
  },
  {
    title: "٤. وقت الانتظار المجاني",
    blocks: [
      {
        type: "list",
        items: [
          "رحلات المطار: مهلة انتظار مجانية بعد وقت الهبوط الفعلي للطيارة (لو رقم الرحلة مسجّل وقت الحجز) — تُحدَّد لاحقًا",
          "رحلات الفندق/نقطة الانطلاق: مهلة انتظار مجانية أقصر من الموعد المحدد وقت الحجز — تُحدَّد لاحقًا",
          'تجاوز المهلة دون تواصل من الراكب ممكن يُصنَّف الحجز "لم يحضر" بدون استرجاع تلقائي',
        ],
      },
    ],
  },
  {
    title: "٥. سياسة الإلغاء والتعديل",
    blocks: [
      {
        type: "list",
        items: [
          "إلغاء أو تعديل الموعد قبل الوقت المحدد (المهلة تُعلن وقت الحجز نفسه) بيسمح باسترجاع كامل أو جزئي حسب السياسة المعلنة",
          "إلغاء داخل المهلة القريبة من موعد الرحلة ممكن ما يكونش قابل للاسترجاع الكامل",
          "التعديل والإلغاء بيتم عن طريق صفحة حجوزاتي أو التواصل مع الدعم",
        ],
      },
    ],
  },
  {
    title: "٦. الأمتعة",
    blocks: [
      {
        type: "list",
        items: [
          "كل راكب مسموح له بحد أقصى من الأمتعة يُحدَّد لاحقًا حسب نوع المركبة المخصصة للرحلة",
          "أمتعة غير قياسية (زي معدات رياضية كبيرة، كراسي متحركة) لازم تتحدد وقت الحجز عشان يتخصص المركبة المناسبة",
          "GoAir غير مسؤولة عن الأمتعة المنسية داخل المركبة بعد نزول الراكب — على الراكب التأكد من أغراضه قبل مغادرة المركبة",
        ],
      },
    ],
  },
  {
    title: "٧. مسؤوليات الراكب",
    blocks: [
      {
        type: "list",
        items: [
          "الحضور لنقطة التجمع في الموعد المحدد",
          "إبلاغ GoAir فورًا بأي تغيير في موعد رحلة الطيران يؤثر على موعد النقل",
          "الالتزام بتعليمات السلامة الخاصة بشريك النقل أثناء الرحلة",
        ],
      },
    ],
  },
  {
    title: "٨. حدود المسؤولية",
    blocks: [
      { type: "p", text: "GoAir بتسهّل عملية الحجز والتنسيق مع شركاء نقل ملتزمين بمعايير سلامة واضحة، لكنها مش مسؤولة عن:" },
      {
        type: "list",
        items: [
          "التأخيرات الناتجة عن ظروف خارجة عن السيطرة (ازدحام مروري، تأخير رحلات جوية، ظروف جوية)",
          "أي خسارة ناتجة عن بيانات غير صحيحة أدخلها الراكب وقت الحجز",
        ],
      },
    ],
  },
  {
    title: "٩. القانون الحاكم",
    blocks: [
      {
        type: "p",
        text: "كل حجز يخضع لقانون الدولة اللي بتتم فيها الرحلة فعليًا (مصر أو لبنان)، والاختصاص القضائي للمحاكم المختصة في نفس الدولة. بند مبدئي بس — لازم صياغته النهائية بالتنسيق مع محامٍ محلي في كل دولة على حدة، لأن قوانين حماية المستهلك والعقود التجارية بين مصر ولبنان مختلفة.",
      },
    ],
  },
  {
    title: "١٠. التواصل والشكاوى",
    blocks: [{ type: "p", text: 'لأي استفسار أو شكوى، تواصل معنا عبر صفحة "تواصل معنا".' }],
  },
];

const termsEn: LegalSection[] = [
  {
    title: "1. Nature of the Service",
    blocks: [
      {
        type: "p",
        text: "GoAir is an online platform that makes it easy to book seats on scheduled shared transport trips (van, Hiace, or bus depending on the route) to and from the airport, through licensed local transport partners in Egypt and Lebanon. GoAir manages the booking, payment, and coordination, but is not a transport company that owns or operates the vehicles itself — compliance with safety and licensing standards is the responsibility of the transport partners, and GoAir only contracts with licensed partners.",
      },
    ],
  },
  {
    title: "2. Booking & Ticket",
    blocks: [
      {
        type: "list",
        items: [
          "Every booking is linked to a reference ticket number and a QR code, which serves as official proof of the booking",
          "The ticket is personal to the registered passenger, and valid only for the travel date and time specified at the time of booking",
          "The information entered (name, phone number, flight number if provided) must be accurate, since any error may delay or disrupt the pickup process",
        ],
      },
    ],
  },
  {
    title: "3. Price & Payment",
    blocks: [
      {
        type: "list",
        items: [
          "The price shown when the booking is completed is the final, binding price — it will not change even if prices displayed on the site change afterward, and there is no surge pricing during peak times or holidays",
          "Available payment methods vary by country: in Egypt (InstaPay / Vodafone Cash / bank transfer), and in Lebanon to be determined later based on the banking partnerships actually available",
          "The booking is confirmed after proof of payment is reviewed, which may take some time before final confirmation",
        ],
      },
    ],
  },
  {
    title: "4. Free Waiting Time",
    blocks: [
      {
        type: "list",
        items: [
          "Airport trips: a free waiting period after the flight's actual landing time (if the flight number was registered at booking) — to be determined later",
          "Hotel/departure-point trips: a shorter free waiting period from the time specified at booking — to be determined later",
          'Exceeding the waiting period without the passenger making contact may result in the booking being marked "no-show" with no automatic refund',
        ],
      },
    ],
  },
  {
    title: "5. Cancellation & Change Policy",
    blocks: [
      {
        type: "list",
        items: [
          "Cancelling or changing the schedule before the specified deadline (announced at the time of booking) allows a full or partial refund depending on the announced policy",
          "Cancelling within the window close to the trip time may not be fully refundable",
          "Changes and cancellations are made through the My Bookings page or by contacting support",
        ],
      },
    ],
  },
  {
    title: "6. Luggage",
    blocks: [
      {
        type: "list",
        items: [
          "Each passenger is allowed a maximum amount of luggage, to be determined later depending on the vehicle type assigned to the trip",
          "Non-standard luggage (such as large sports equipment or wheelchairs) must be specified at the time of booking so the appropriate vehicle can be assigned",
          "GoAir is not responsible for items left behind in the vehicle after the passenger disembarks — the passenger is responsible for checking their belongings before leaving the vehicle",
        ],
      },
    ],
  },
  {
    title: "7. Passenger Responsibilities",
    blocks: [
      {
        type: "list",
        items: [
          "Arriving at the meeting point at the specified time",
          "Notifying GoAir immediately of any change to the flight schedule that affects the transport time",
          "Following the transport partner's safety instructions during the trip",
        ],
      },
    ],
  },
  {
    title: "8. Limitation of Liability",
    blocks: [
      { type: "p", text: "GoAir facilitates the booking process and coordination with transport partners committed to clear safety standards, but is not responsible for:" },
      {
        type: "list",
        items: [
          "Delays resulting from circumstances beyond its control (traffic congestion, flight delays, weather conditions)",
          "Any loss resulting from incorrect information entered by the passenger at the time of booking",
        ],
      },
    ],
  },
  {
    title: "9. Governing Law",
    blocks: [
      {
        type: "p",
        text: "Every booking is subject to the law of the country in which the trip actually takes place (Egypt or Lebanon), and the jurisdiction of the competent courts in that same country. This is a preliminary clause only — its final wording must be coordinated with a local lawyer in each country separately, since consumer protection and commercial contract laws differ between Egypt and Lebanon.",
      },
    ],
  },
  {
    title: "10. Contact & Complaints",
    blocks: [{ type: "p", text: 'For any inquiry or complaint, contact us via the "Contact Us" page.' }],
  },
];

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------

const privacyAr: LegalSection[] = [
  {
    title: "١. البيانات اللي بنجمعها",
    blocks: [
      {
        type: "list",
        items: [
          "الاسم الكامل ورقم التليفون/واتساب عند الحجز",
          "صورة إثبات الدفع",
          "رقم رحلة الطيران ومعادها (اختياري، لو أدخلته)",
          "سجل الحجوزات السابقة المرتبط برقم تليفونك",
          "الدولة اللي بتحجز منها/فيها (لتحديد طرق الدفع والعملة المناسبة)",
        ],
      },
    ],
  },
  {
    title: "٢. كيف بنستخدم بياناتك",
    blocks: [
      {
        type: "list",
        items: [
          "لتأكيد حجزك وتنظيم رحلتك من وإلى المطار",
          "للتواصل معك بخصوص حالة حجزك أو أي تغيير في الموعد",
          "لمراجعة إثبات الدفع وتأكيد العملية",
          "لتتبّع مصدر الحجز لو جيت من خلال رابط شريك (شركة طيران) — بيتسجل كود الإحالة في متصفحك مؤقتًا (٣٠ يوم) عشان نقدر نحسب العمولة المستحقة للشريك بدقة",
        ],
      },
    ],
  },
  {
    title: "٣. مع من نشارك بياناتك",
    blocks: [
      {
        type: "list",
        items: [
          "شركة النقل المحلية المسؤولة عن تنفيذ رحلتك (الاسم ورقم التليفون بس، بالقدر اللازم للتنسيق)",
          "شركة الطيران الشريكة، فقط في حال قامت هي بحجز رحلتك نيابة عنك (كشف ركاب) أو لغرض التحقق من عمولة الإحالة",
          "مزوّد خدمة الدفع، بالقدر اللازم لتأكيد عملية الدفع",
          "لا نبيع أو نؤجر بياناتك لأي طرف ثالث لأغراض تسويقية",
        ],
      },
    ],
  },
  {
    title: "٤. التخزين والحماية",
    blocks: [
      {
        type: "p",
        text: "بياناتك متخزنة على بنية تحتية سحابية آمنة (Supabase)، وبيتم الوصول ليها بمفاتيح محدودة الصلاحيات فقط. صور إثبات الدفع متخزنة في مساحة تخزين منفصلة عن باقي البيانات.",
      },
    ],
  },
  {
    title: "٥. حقوقك",
    blocks: [
      {
        type: "list",
        items: [
          "تقدر تطلب معرفة البيانات المسجلة عنك، أو طلب حذفها، بالتواصل معنا مباشرة",
          "تقدر تلغي رابط الإحالة المحفوظ في متصفحك بمسح بيانات الموقع من إعدادات المتصفح",
          "تقدر تلغي اشتراكك من أي نشرة بريدية في أي وقت",
        ],
      },
    ],
  },
  {
    title: "٦. القُصَّر",
    blocks: [
      {
        type: "p",
        text: "الخدمة موجهة للبالغين اللي بيحجزوا رحلات نقل. لو حجزت لقاصر ضمن مجموعة (زي طفل مع أهله)، بيانات الطفل الأساسية (الاسم والعمر لو مطلوب لتحديد نوع المقعد) بتتجمع بس بالقدر اللازم لتنظيم الرحلة بأمان.",
      },
    ],
  },
  {
    title: "٧. تواصل معنا بخصوص الخصوصية",
    blocks: [{ type: "p", text: 'لأي استفسار يخص بياناتك الشخصية في مصر أو لبنان، تواصل معنا عبر صفحة "تواصل معنا".' }],
  },
];

const privacyEn: LegalSection[] = [
  {
    title: "1. Data We Collect",
    blocks: [
      {
        type: "list",
        items: [
          "Full name and phone/WhatsApp number at booking",
          "Proof-of-payment image",
          "Flight number and time (optional, if entered)",
          "Booking history linked to your phone number",
          "The country you are booking from/in (to determine the appropriate payment methods and currency)",
        ],
      },
    ],
  },
  {
    title: "2. How We Use Your Data",
    blocks: [
      {
        type: "list",
        items: [
          "To confirm your booking and organize your trip to and from the airport",
          "To contact you about your booking status or any change in schedule",
          "To review proof of payment and confirm the transaction",
          "To track the source of the booking if you came through a partner (airline) link — a referral code is temporarily stored in your browser (30 days) so we can accurately calculate the commission owed to the partner",
        ],
      },
    ],
  },
  {
    title: "3. Who We Share Your Data With",
    blocks: [
      {
        type: "list",
        items: [
          "The local transport company responsible for carrying out your trip (name and phone number only, to the extent needed for coordination)",
          "The partner airline, only if it booked your trip on your behalf (passenger manifest) or for the purpose of verifying referral commission",
          "The payment service provider, to the extent needed to confirm the payment transaction",
          "We do not sell or rent your data to any third party for marketing purposes",
        ],
      },
    ],
  },
  {
    title: "4. Storage & Protection",
    blocks: [
      {
        type: "p",
        text: "Your data is stored on secure cloud infrastructure (Supabase), and is accessed only with limited-privilege keys. Proof-of-payment images are stored in storage separate from the rest of the data.",
      },
    ],
  },
  {
    title: "5. Your Rights",
    blocks: [
      {
        type: "list",
        items: [
          "You can request to know the data recorded about you, or request its deletion, by contacting us directly",
          "You can clear the referral link stored in your browser by clearing the site's browser data from your browser settings",
          "You can unsubscribe from any email newsletter at any time",
        ],
      },
    ],
  },
  {
    title: "6. Minors",
    blocks: [
      {
        type: "p",
        text: "The service is intended for adults booking transport trips. If you book for a minor as part of a group (such as a child with their family), the child's basic information (name and age, if needed to determine seat type) is collected only to the extent needed to organize the trip safely.",
      },
    ],
  },
  {
    title: "7. Contact Us About Privacy",
    blocks: [{ type: "p", text: 'For any inquiry regarding your personal data in Egypt or Lebanon, contact us via the "Contact Us" page.' }],
  },
];

export const termsContent: Record<Language, LegalSection[]> = { ar: termsAr, en: termsEn };
export const privacyContent: Record<Language, LegalSection[]> = { ar: privacyAr, en: privacyEn };
