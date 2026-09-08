import { Languages } from "lucide-react";

import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";

/**
 * Manual AR/EN toggle. Flips <html lang/dir> and persists the choice
 * (see LanguageProvider) — no browser/country auto-detection.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`gap-1.5 font-bold ${className ?? ""}`}
      onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
      aria-label={language === "ar" ? "Switch to English" : "التبديل للعربي"}
    >
      <Languages className="size-4" aria-hidden />
      {language === "ar" ? "EN" : "عربي"}
    </Button>
  );
}
