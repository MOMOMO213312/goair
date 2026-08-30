import { FileCheck2, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { uploadPaymentProof } from "@/lib/goair";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ACCEPTED = "image/png,image/jpeg,image/webp,application/pdf";

type PaymentProofUploadProps = {
  ticket: string;
  onUploaded: (url: string) => void;
  onCleared: () => void;
  className?: string;
};

/**
 * Uploads a screenshot/PDF of the transfer to Supabase Storage and hands
 * the resulting URL back to the parent, which appends it to the existing
 * `reference` text field — no new payments-table column required.
 *
 * Degrades gracefully: if the storage bucket isn't set up yet, upload
 * fails with a clear toast and the customer can still submit the payment
 * using the reference number field alone (never blocks the booking).
 */
export function PaymentProofUpload({ ticket, onUploaded, onCleared, className }: PaymentProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED.split(",").includes(file.type)) {
      toast.error("الملف لازم يكون صورة (JPG/PNG/WebP) أو PDF.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("حجم الملف أكبر من 8 ميجا. جرّب صورة أصغر.");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadPaymentProof(ticket, file);
      setFileName(file.name);
      onUploaded(url);
      toast.success("تم رفع إثبات الدفع.");
    } catch {
      toast.error("لم نتمكن من رفع الملف — تقدر تكمل وتكتب رقم العملية بس بدالها.");
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="font-medium">
        صورة إثبات الدفع <span className="text-xs text-muted-foreground">(اختياري — بيسرّع مراجعة حجزك)</span>
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm text-primary">
            <FileCheck2 className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate">{fileName}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setFileName(null);
              onCleared();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            aria-label="إلغاء الملف"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors",
            "hover:border-accent/40 hover:bg-accent/5 disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="size-4" aria-hidden />
              اختر صورة أو PDF
            </>
          )}
        </button>
      )}
    </div>
  );
}
