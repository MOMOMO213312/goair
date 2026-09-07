import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminToken } from "@/lib/admin-session";
import {
  adminListTripOptions,
  adminUpdateTripOptionPrice,
  isAdminAuthError,
  type AdminTripOptionRow,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({ meta: [{ title: "الأسعار — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: PricingPage,
});

const BOOKING_TYPE_LABELS: Record<string, string> = {
  shared: "مشترك",
  private: "خاص (كل العربية)",
};

function bookingTypeLabel(type: string) {
  return BOOKING_TYPE_LABELS[type] ?? type;
}

function PricingPage() {
  const token = useAdminToken();
  const qc = useQueryClient();

  const optionsQuery = useQuery({
    queryKey: ["admin-trip-options", token],
    queryFn: () => adminListTripOptions(token),
    retry: false,
    enabled: Boolean(token),
  });

  const [search, setSearch] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  if (!token) return null;
  if (optionsQuery.isPending) return <AdminLoading />;
  if (optionsQuery.isError) {
    return isAdminAuthError(optionsQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const rows = optionsQuery.data ?? [];

  // Group rows into one entry per line (trip), each holding its vehicle-type price rows.
  const lines = useMemoLines(rows);

  const filteredLines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter(
      (l) =>
        l.origin.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.airportName.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q),
    );
  }, [lines, search]);

  const selectedLine = filteredLines.find((l) => l.tripId === selectedTripId) ?? lines.find((l) => l.tripId === selectedTripId);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-trip-options", token] });

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-extrabold text-primary">الخطوط</h2>
        <Input
          placeholder="دور على خط (مطار / وجهة / دولة)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-3"
        />
        <ul className="mt-3 max-h-[70vh] divide-y divide-border/60 overflow-y-auto">
          {filteredLines.map((line) => (
            <li key={line.tripId}>
              <button
                onClick={() => setSelectedTripId(line.tripId)}
                className={`w-full rounded-lg px-2 py-2.5 text-right text-sm transition-colors hover:bg-muted ${
                  selectedTripId === line.tripId ? "bg-primary/10 font-bold text-primary" : "text-foreground"
                }`}
              >
                <div className="font-bold">{line.origin} ← {line.destination}</div>
                <div className="text-xs text-muted-foreground">
                  {line.airportName} — {line.country}
                  {!line.tripIsActive ? <span className="text-destructive"> (غير مفعّل)</span> : null}
                </div>
              </button>
            </li>
          ))}
          {filteredLines.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">مفيش خطوط مطابقة.</li>
          ) : null}
        </ul>
      </Card>

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)]">
        {!selectedLine ? (
          <p className="py-10 text-center text-sm text-muted-foreground">اختار خط من القائمة عشان تعدّل أسعاره.</p>
        ) : (
          <>
            <h2 className="font-display text-lg font-extrabold text-primary">
              {selectedLine.origin} ← {selectedLine.destination}
            </h2>
            <p className="text-sm text-muted-foreground">{selectedLine.airportName} — {selectedLine.country}</p>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع العربية</TableHead>
                  <TableHead className="text-right">نوع الحجز</TableHead>
                  <TableHead className="text-right">السعر (USD)</TableHead>
                  <TableHead className="text-right">مفعّل</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedLine.options.map((opt) => (
                  <PriceRow key={opt.tripOptionId} option={opt} token={token} onSaved={refresh} />
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>
    </div>
  );
}

type LineGroup = {
  tripId: string;
  country: string;
  airportName: string;
  origin: string;
  destination: string;
  tripIsActive: boolean;
  options: AdminTripOptionRow[];
};

function useMemoLines(rows: AdminTripOptionRow[]): LineGroup[] {
  return useMemo(() => {
    const map = new Map<string, LineGroup>();
    for (const row of rows) {
      let group = map.get(row.tripId);
      if (!group) {
        group = {
          tripId: row.tripId,
          country: row.country,
          airportName: row.airportName,
          origin: row.origin,
          destination: row.destination,
          tripIsActive: row.tripIsActive,
          options: [],
        };
        map.set(row.tripId, group);
      }
      group.options.push(row);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.country === b.country ? a.origin.localeCompare(b.origin, "ar") : a.country.localeCompare(b.country, "ar"),
    );
  }, [rows]);
}

function PriceRow({
  option,
  token,
  onSaved,
}: {
  option: AdminTripOptionRow;
  token: string;
  onSaved: () => void;
}) {
  const [price, setPrice] = useState(String(option.priceUsd));
  const [active, setActive] = useState(option.optionIsActive);
  const [busy, setBusy] = useState(false);

  const dirty = Number(price) !== option.priceUsd || active !== option.optionIsActive;

  async function save() {
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("اكتب سعر صحيح.");
      return;
    }
    setBusy(true);
    try {
      await adminUpdateTripOptionPrice(token, option.tripOptionId, value, active);
      toast.success("تم تحديث السعر.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-bold text-primary">{option.vehicleLabelAr}</TableCell>
      <TableCell>
        <Badge variant="secondary">{bookingTypeLabel(option.bookingType)}</Badge>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step="0.5"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28"
        />
      </TableCell>
      <TableCell>
        <Switch checked={active} onCheckedChange={setActive} />
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          disabled={!dirty || busy}
          onClick={save}
          className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
        >
          حفظ
        </Button>
      </TableCell>
    </TableRow>
  );
}
