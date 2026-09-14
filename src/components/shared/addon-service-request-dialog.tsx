import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchAddonServices,
  fetchPublicGroundHandlingServices,
  type AddonService,
  type GroundHandlingPublicService,
} from "@/lib/goair";

export type AddonServiceRequestTarget = {
  bookingId: string;
  /** Shown in the dialog header — e.g. passenger name + route. */
  label: string;
  airportCode: string | null;
  travelDate: string | null;
};

/**
 * Shared "طلب خدمة إضافية" dialog for the Partner and Operator dashboards.
 * Lets a business add an addon/ground-handling service to a booking that
 * already exists — no new transfer/trip request needed. Used with
 * `partner_request_addon_service` / `operator_request_addon_service`.
 */
export function AddonServiceRequestDialog({
  target,
  submitting,
  onClose,
  onSubmit,
}: {
  target: AddonServiceRequestTarget | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (params: { addonServiceIds: string[]; groundHandlingServiceIds: string[] }) => void;
}) {
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [ghIds, setGhIds] = useState<string[]>([]);

  const addonsQuery = useQuery({
    queryKey: ["goair", "addon-services"],
    queryFn: fetchAddonServices,
    enabled: Boolean(target),
  });

  const ghQuery = useQuery({
    queryKey: ["goair", "ground-handling-services", target?.airportCode, target?.travelDate],
    queryFn: () => fetchPublicGroundHandlingServices(target!.airportCode!, target!.travelDate),
    enabled: Boolean(target?.airportCode),
  });

  const addons = addonsQuery.data ?? [];
  const ghServices = target?.airportCode ? ghQuery.data ?? [] : [];

  const totalUsd = useMemo(() => {
    const addonsTotal = addons
      .filter((a) => addonIds.includes(a.id))
      .reduce((sum: number, a: AddonService) => sum + a.priceUsd, 0);
    const ghTotal = ghServices
      .filter((s) => ghIds.includes(s.id))
      .reduce((sum: number, s: GroundHandlingPublicService) => sum + s.priceUsd, 0);
    return addonsTotal + ghTotal;
  }, [addons, addonIds, ghServices, ghIds]);

  function toggleAddon(id: string) {
    setAddonIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function toggleGh(id: string) {
    setGhIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setAddonIds([]);
      setGhIds([]);
      onClose();
    }
  }

  function submit() {
    if (addonIds.length === 0 && ghIds.length === 0) return;
    onSubmit({ addonServiceIds: addonIds, groundHandlingServiceIds: ghIds });
  }

  const isLoading = addonsQuery.isFetching || ghQuery.isFetching;
  const hasNothingToShow = !isLoading && addons.length === 0 && ghServices.length === 0;

  return (
    <Dialog open={Boolean(target)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>طلب خدمة إضافية</DialogTitle>
          <DialogDescription>
            {target?.label ?? ""}
            {" — الخدمة هتتضاف على الحجز الحالي، من غير طلب نقل جديد."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">جاري تحميل الخدمات المتاحة…</p>
        ) : hasNothingToShow ? (
          <p className="text-sm text-muted-foreground">مفيش خدمات إضافية متاحة دلوقتي.</p>
        ) : (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto">
            {ghServices.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">خدمات المطار (مقدّمين معتمدين)</p>
                {ghServices.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                      ghIds.includes(s.id) ? "border-accent bg-accent/5" : "border-border"
                    }`}
                  >
                    <Checkbox checked={ghIds.includes(s.id)} onCheckedChange={() => toggleGh(s.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-primary">
                        {s.name} <span className="font-normal text-muted-foreground">— {s.partnerName}</span>
                      </span>
                      {s.description ? (
                        <span className="block text-xs text-muted-foreground">{s.description}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        ${s.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        {s.terminal ? ` · ${s.terminal}` : ""}
                        {s.direction ? ` · ${s.direction === "arrival" ? "وصول" : "مغادرة"}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            {addons.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">خدمات إضافية عامة</p>
                {addons.map((addon) => (
                  <label
                    key={addon.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                      addonIds.includes(addon.id) ? "border-accent bg-accent/5" : "border-border"
                    }`}
                  >
                    <Checkbox checked={addonIds.includes(addon.id)} onCheckedChange={() => toggleAddon(addon.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-primary">{addon.name}</span>
                      {addon.description ? (
                        <span className="block text-xs text-muted-foreground">{addon.description}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        ${addon.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm font-bold text-accent">
            {totalUsd > 0 ? `الإجمالي: $${totalUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : ""}
          </span>
          <Button
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            disabled={submitting || (addonIds.length === 0 && ghIds.length === 0)}
            onClick={submit}
          >
            {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
