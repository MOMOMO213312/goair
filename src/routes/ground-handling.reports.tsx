import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GHLoading, GHEmpty, GHAuthError, GHSection, GHStatCard } from "@/components/ground-handling/ground-handling-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGroundHandlingReports, isGroundHandlingAuthError } from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/reports")({
  head: () => ({ meta: [{ title: "التقارير — بوابة GOAIR للخدمات الأرضية" }] }),
  component: ReportsPage,
});

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ReportsPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const [from, setFrom] = useState(isoDate(monthAgo));
  const [to, setTo] = useState(isoDate(today));

  const reportsQuery = useQuery({
    queryKey: ["ground-handling-reports", token, from, to],
    queryFn: () => getGroundHandlingReports(token as string, from, to),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (reportsQuery.isError) {
    if (isGroundHandlingAuthError(reportsQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const r = reportsQuery.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>من تاريخ</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>إلى تاريخ</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {reportsQuery.isPending ? (
        <GHLoading />
      ) : !r ? (
        <GHEmpty>مفيش بيانات للفترة دي.</GHEmpty>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <GHStatCard label="الخدمات المكتملة" value={r.completedCount} />
            <GHStatCard label="الطلبات الملغاة" value={r.cancelledCount} />
          </div>

          <GHSection title="الخدمات حسب المطار">
            {r.byAirport.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>
            ) : (
              <div className="space-y-1.5">
                {r.byAirport.map((row) => (
                  <div key={row.airportCode} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.airportCode}</span>
                    <span className="font-bold text-primary">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </GHSection>

          <GHSection title="الخدمات حسب النوع">
            {r.byService.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>
            ) : (
              <div className="space-y-1.5">
                {r.byService.map((row) => (
                  <div key={row.serviceName} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.serviceName}</span>
                    <span className="font-bold text-primary">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </GHSection>

          <GHSection title="الخدمات حسب الفترة">
            {r.byPeriod.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>
            ) : (
              <div className="space-y-1.5">
                {r.byPeriod.map((row) => (
                  <div key={row.date} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.date}</span>
                    <span className="font-bold text-primary">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </GHSection>

          <GHSection title="أداء الموظفين">
            {r.staffPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>
            ) : (
              <div className="space-y-1.5">
                {r.staffPerformance.map((row) => (
                  <div key={row.staffName} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.staffName}</span>
                    <span className="font-bold text-primary">{row.completedCount} مكتملة</span>
                  </div>
                ))}
              </div>
            )}
          </GHSection>
        </>
      )}
    </div>
  );
}
