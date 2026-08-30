import { supabase } from "./supabase";

export type Announcement = { id: string; message: string; linkUrl: string | null };

/** Public, no token — same pattern as launch_markets (safe marketing text). */
export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("site_announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r["id"]),
    message: String(r["message"] ?? ""),
    linkUrl: (r["link_url"] as string | null) ?? null,
  }));
}

export type AdminAnnouncement = Announcement & { isActive: boolean; createdAt: string };

function rpcError(error: { message?: string }): never {
  throw new Error(error.message?.includes("رمز الدخول") ? "رمز الدخول غير صحيح أو الحساب غير مفعّل" : (error.message || "حصل خطأ."));
}

export async function adminListAnnouncements(token: string): Promise<AdminAnnouncement[]> {
  const { data, error } = await supabase.rpc("admin_list_announcements", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r["id"]),
    message: String(r["message"] ?? ""),
    linkUrl: (r["link_url"] as string | null) ?? null,
    isActive: r["is_active"] === true,
    createdAt: String(r["created_at"] ?? ""),
  }));
}

export async function adminCreateAnnouncement(token: string, message: string, linkUrl: string | null) {
  const { error } = await supabase.rpc("admin_create_announcement", {
    p_access_token: token, p_message: message, p_link_url: linkUrl,
  });
  if (error) rpcError(error);
}

export async function adminSetAnnouncementActive(token: string, id: string, isActive: boolean) {
  const { error } = await supabase.rpc("admin_set_announcement_active", { p_access_token: token, p_id: id, p_is_active: isActive });
  if (error) rpcError(error);
}

export async function adminDeleteAnnouncement(token: string, id: string) {
  const { error } = await supabase.rpc("admin_delete_announcement", { p_access_token: token, p_id: id });
  if (error) rpcError(error);
}
