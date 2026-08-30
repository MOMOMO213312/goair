import { createFileRoute } from "@tanstack/react-router";

import { LegalDraftNotice } from "@/components/goair/legal/legal-draft-notice";
import { SectionHeader } from "@/components/goair/section-header";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — GoAir" },
      { name: "description", content: "إزاي GoAir بتجمع وتستخدم وتحمي بياناتك." },
      { property: "og:title", content: "سياسة الخصوصية — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function PrivacyPage() {
  return (
    <div className="bg-mist/30 pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader title="سياسة الخصوصية" description="آخر تحديث: يُحدَّد قبل الإطلاق." />

        <LegalDraftNotice
          text={
            'تنبيه مهم: المستند ده مسودة أولية، مش صياغة قانونية معتمدة. بما إن GoAir هتطلق في مصر ولبنان معًا، لازم يراجع المستند ده محامٍ مرخّص في الدولتين الاتنين قبل الإطلاق الفعلي — قوانين حماية البيانات في مصر ولبنان مختلفة عن بعض، ومحتاجة مراجعة منفصلة لكل دولة.'
          }
        />

        <Card className="p-6 sm:p-8">
          <Section title="١. البيانات اللي بنجمعها">
            <List
              items={[
                "الاسم الكامل ورقم التليفون/واتساب عند الحجز",
                "صورة إثبات الدفع",
                "رقم رحلة الطيران ومعادها (اختياري، لو أدخلته)",
                "سجل الحجوزات السابقة المرتبط برقم تليفونك",
                "الدولة اللي بتحجز منها/فيها (لتحديد طرق الدفع والعملة المناسبة)",
              ]}
            />
          </Section>

          <Section title="٢. كيف بنستخدم بياناتك">
            <List
              items={[
                "لتأكيد حجزك وتنظيم رحلتك من وإلى المطار",
                "للتواصل معك بخصوص حالة حجزك أو أي تغيير في الموعد",
                "لمراجعة إثبات الدفع وتأكيد العملية",
                "لتتبّع مصدر الحجز لو جيت من خلال رابط شريك (شركة طيران) — بيتسجل كود الإحالة في متصفحك مؤقتًا (٣٠ يوم) عشان نقدر نحسب العمولة المستحقة للشريك بدقة",
              ]}
            />
          </Section>

          <Section title="٣. مع من نشارك بياناتك">
            <List
              items={[
                "شركة النقل المحلية المسؤولة عن تنفيذ رحلتك (الاسم ورقم التليفون بس، بالقدر اللازم للتنسيق)",
                "شركة الطيران الشريكة، فقط في حال قامت هي بحجز رحلتك نيابة عنك (كشف ركاب) أو لغرض التحقق من عمولة الإحالة",
                "مزوّد خدمة الدفع، بالقدر اللازم لتأكيد عملية الدفع",
                "لا نبيع أو نؤجر بياناتك لأي طرف ثالث لأغراض تسويقية",
              ]}
            />
          </Section>

          <Section title="٤. التخزين والحماية">
            <p>
              بياناتك متخزنة على بنية تحتية سحابية آمنة (Supabase)، وبيتم الوصول ليها بمفاتيح
              محدودة الصلاحيات فقط. صور إثبات الدفع متخزنة في مساحة تخزين منفصلة عن باقي البيانات.
            </p>
          </Section>

          <Section title="٥. حقوقك">
            <List
              items={[
                "تقدر تطلب معرفة البيانات المسجلة عنك، أو طلب حذفها، بالتواصل معنا مباشرة",
                "تقدر تلغي رابط الإحالة المحفوظ في متصفحك بمسح بيانات الموقع من إعدادات المتصفح",
                "تقدر تلغي اشتراكك من أي نشرة بريدية في أي وقت",
              ]}
            />
          </Section>

          <Section title="٦. القُصَّر">
            <p>
              الخدمة موجهة للبالغين اللي بيحجزوا رحلات نقل. لو حجزت لقاصر ضمن مجموعة (زي طفل مع
              أهله)، بيانات الطفل الأساسية (الاسم والعمر لو مطلوب لتحديد نوع المقعد) بتتجمع بس
              بالقدر اللازم لتنظيم الرحلة بأمان.
            </p>
          </Section>

          <Section title="٧. تواصل معنا بخصوص الخصوصية">
            <p>لأي استفسار يخص بياناتك الشخصية في مصر أو لبنان، تواصل معنا عبر صفحة "تواصل معنا".</p>
          </Section>
        </Card>
      </div>
    </div>
  );
}
