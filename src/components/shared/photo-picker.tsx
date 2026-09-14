import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";

// منتقي صور بسيط: بيعرض الصور الموجودة (روابط) والصور المختارة لسه ماترفعتش
// (كملفات محلية) في نفس الشبكة، وبيسمح بإضافة/حذف لحد أقصى maxCount.
export function PhotoPicker({
  label,
  maxCount,
  existingPhotos,
  onRemoveExisting,
  newFiles,
  onNewFilesChange,
}: {
  label: string;
  maxCount: number;
  existingPhotos: string[];
  onRemoveExisting: (url: string) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingPhotos.length + newFiles.length;
  const canAddMore = totalCount < maxCount;

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const room = maxCount - totalCount;
    if (room <= 0) {
      toast.error(`أقصى عدد صور ${maxCount}.`);
      return;
    }
    onNewFilesChange([...newFiles, ...picked.slice(0, room)]);
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} (اختياري — لحد {maxCount})
      </Label>
      <div className="flex flex-wrap gap-2">
        {existingPhotos.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border/80">
            <img src={url} alt="صورة" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(url)}
              className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="حذف الصورة"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {newFiles.map((file, i) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div key={`${file.name}-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border/80">
              <img
                src={previewUrl}
                alt={file.name}
                className="h-full w-full object-cover"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
              <button
                type="button"
                onClick={() => onNewFilesChange(newFiles.filter((_, idx) => idx !== i))}
                className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="إلغاء الصورة"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {canAddMore ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px]">إضافة</span>
          </button>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePick} />
    </div>
  );
}
