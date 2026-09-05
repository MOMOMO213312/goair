import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useAdminToken } from "@/lib/admin-session";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminListContactMessages,
  adminListCustomRequests,
  adminUpdateContactMessageStatus,
  adminUpdateCustomRequestStatus,
  contactMessageStatusLabel,
  customRequestStatusLabel,
  isAdminAuthError,
  type ContactMessageRow,
  type CustomRequestRow,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [{ title: "الطلبات والتواصل — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["admin-custom-requests", token],
    queryFn: () => adminListCustomRequests(token),
    retry: false,
    enabled: Boolean(token),
  });
  const messagesQuery = useQuery({
    queryKey: ["admin-contact-messages", token],
    queryFn: () => adminListContactMessages(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (requestsQuery.isPending || messagesQuery.isPending) return <AdminLoading />;
  if (requestsQuery.isError || messagesQuery.isError) {
    const err = requestsQuery.error ?? messagesQuery.error;
    return isAdminAuthError(err) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const requests = requestsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const openRequests = requests.filter((r) => r.status === "pending");
  const openMessages = messages.filter((m) => m.status === "new");

  return (
    <div className="space-y-8">
      <Section title={`طلبات رحلات مخصصة — مفيش خط جاهز (${openRequests.length} جديد)`}>
        {requests.length === 0 ? (
          <Empty text="مفيش طلبات لسه." />
        ) : (
          requests.map((request) => (
            <CustomRequestCard
              key={request.id}
              request={request}
              token={token}
              onDone={() => queryClient.invalidateQueries({ queryKey: ["admin-custom-requests", token] })}
            />
          ))
        )}
      </Section>

      <Section title={`رسائل "تواصل معنا" (${openMessages.length} جديدة)`}>
        {messages.length === 0 ? (
          <Empty text="مفيش رسائل لسه." />
        ) : (
          messages.map((message) => (
            <ContactMessageCard
              key={message.id}
              message={message}
              token={token}
              onDone={() => queryClient.invalidateQueries({ queryKey: ["admin-contact-messages", token] })}
            />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-extrabold text-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </Card>
  );
}

function CustomRequestCard({
  request,
  token,
  onDone,
}: {
  request: CustomRequestRow;
  token: string;
  onDone: () => void;
}) {
  async function setStatus(status: string) {
    try {
      await adminUpdateCustomRequestStatus(token, request.id, status);
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {request.passengerName} — {request.phone}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {request.country} · {request.routeName} · {request.pax} راكب
          {request.preferredDate ? ` · ${request.preferredDate}` : ""}
          {request.preferredTimeNote ? ` · ${request.preferredTimeNote}` : ""}
        </p>
        <p className="mt-1 text-xs font-bold text-accent">{customRequestStatusLabel(request.status)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {request.status !== "contacted" ? (
          <Button size="sm" onClick={() => setStatus("contacted")} className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            تم التواصل
          </Button>
        ) : null}
        {request.status !== "closed" ? (
          <Button size="sm" variant="outline" onClick={() => setStatus("closed")}>
            إغلاق
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function ContactMessageCard({
  message,
  token,
  onDone,
}: {
  message: ContactMessageRow;
  token: string;
  onDone: () => void;
}) {
  async function setStatus(status: string) {
    try {
      await adminUpdateContactMessageStatus(token, message.id, status);
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">{message.fullName}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {message.phoneNumber ?? "—"} {message.email ? `· ${message.email}` : ""}
        </p>
        <p className="mt-2 text-sm text-primary">{message.message}</p>
        <p className="mt-1 text-xs font-bold text-accent">{contactMessageStatusLabel(message.status)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {message.status !== "read" && message.status !== "replied" ? (
          <Button size="sm" variant="outline" onClick={() => setStatus("read")}>
            علّم كمقروءة
          </Button>
        ) : null}
        {message.status !== "replied" ? (
          <Button size="sm" onClick={() => setStatus("replied")} className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            تم الرد
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
