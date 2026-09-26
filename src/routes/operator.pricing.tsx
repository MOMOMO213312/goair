import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OperatorAuthError, OperatorLoading, OperatorSection } from "@/components/operator/operator-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOperatorToken } from "@/lib/operator-session";
import {
  getOperatorTripLines,
  isOperatorAuthError,
  operatorSubmitTripRate,
  type OperatorTripLine,
} from "@/lib/operator";

export const Route = createFileRoute("/operator/pricing")({
  head: () => ({ meta: [{ title: "أسعاري على الخطوط — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: OperatorPricingPage,
});

function OperatorPricingPage() {
  const token = useOperatorToken();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const linesQuery = useQuery({
    queryKey: ["operator-trip-lines", token],
    queryFn: () => getOperatorTripLines(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (linesQuery.isPending) return <OperatorLoading />;
  if (linesQuery.isError) {
    return isOperatorAuthError(linesQuery.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;
  }

  const lines = linesQuery.data ?? [];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? lines.filter(
        (l) =>
          l.origin.toLowerCase().includes(q) ||
          l.destination.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q),
      )
    : lines;

  const refresh = () => qc.invalidateQueries({ queryKey: ["operator-trip-lines", token] });

  return (
    <OperatorSection
      title="أسعاري على الخطوط"
      description="اكتب تكلفتك على أي خط. الأدمن هو اللي بيختار مين يشتغل على كل خط — دخولك للسعر هنا مجرد عرض لحد ما يتم اعتماده."
    >
      <Input
        placeholder="دور على خط (مطار / وجهة / دولة)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الخط</TableHead>
            <TableHead className="text-right">العربية</TableHead>
            <TableHead className="text-right">نوع الحجز</TableHead>
            <TableHead className="text-right">تكلفتي (USD)</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((line) => (
            <LineRow key={line.tripOptionId} line={line} token={token} onSaved={refresh} />
          ))}
        </TableBody>
      </Table>
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">مفيش خطوط مطابقة.</p>
      ) : null}
    </OperatorSection>
  );
}

function LineRow({
  line,
  token,
  onSaved,
}: {
  line: OperatorTripLine;
  token: string;
  onSaved: () => void;
}) {
  const [cost, setCost] = useState(line.myRateUsd === null ? "" : String(line.myRateUsd));
  const [busy, setBusy] = useState(false);

  const costValue = Number(cost);
  const dirty = cost.trim() !== "" && costValue !== line.myRateUsd;

  async function save() {
    if (cost.trim() === "" || !Number.isFinite(costValue) || costValue < 0) {
      toast.error("اكتب تكلفة صحيحة.");
      return;
    }
    setBusy(true);
    try {
      await operatorSubmitTripRate(token, line.tripOptionId, costValue);
      toast.success("تم إرسال تكلفتك — في انتظار اعتماد الأدمن.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = useMemo(() => {
    if (line.myRateIsActive) {
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">أنت الشغال على الخط ده</Badge>;
    }
    if (line.activeOperatorName) {
      return <Badge variant="secondary">شغال حاليًا: {line.activeOperatorName}</Badge>;
    }
    return <Badge variant="outline">لسه محدش متفعّل</Badge>;
  }, [line.myRateIsActive, line.activeOperatorName]);

  return (
    <TableRow>
      <TableCell>
        <div className="font-bold">{line.origin} ← {line.destination}</div>
        <div className="text-xs text-muted-foreground">{line.airportName} — {line.country}</div>
      </TableCell>
      <TableCell>{line.vehicleLabelAr}</TableCell>
      <TableCell>
        <Badge variant="secondary">{line.bookingType === "shared" ? "مشترك" : "خاص"}</Badge>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step="0.5"
          placeholder="اكتب تكلفتك"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="w-32"
        />
      </TableCell>
      <TableCell>{statusBadge}</TableCell>
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
