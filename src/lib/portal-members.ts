import { supabase } from "./supabase";

// نفس الباك اند لكل من: بوابة شركة النقل (operator) ووكالة السياحة (agency)
// وشريك الطيران (partner). الدوال دي بتتعامل مع جدول portal_members اللي
// بيسجل كل عضو بدور owner أو member.

export type PortalType = "operator" | "agency" | "partner" | "ground_handling" | "rental";

export type PortalMemberRole = "owner" | "member";

export type PortalMember = {
  id: string;
  authEmail: string | null;
  role: PortalMemberRole;
  isActive: boolean;
  createdAt: string;
};

export const PORTAL_MEMBERS_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";

export function isPortalMembersAuthError(error: unknown): boolean {
  return error instanceof Error && error.message === PORTAL_MEMBERS_AUTH_ERROR;
}

function rpcError(error: { message?: string }): never {
  const message = error.message ?? "";
  if (message.includes("رمز الدخول") || message.toLowerCase().includes("token")) {
    throw new Error(PORTAL_MEMBERS_AUTH_ERROR);
  }
  throw new Error(error.message || "حصل خطأ مؤقت. حاول تاني.");
}

function mapMember(row: Record<string, unknown>): PortalMember {
  return {
    id: String(row["id"]),
    authEmail: (row["auth_email"] as string | null) ?? null,
    role: row["role"] === "owner" ? "owner" : "member",
    isActive: Boolean(row["is_active"]),
    createdAt: String(row["created_at"] ?? ""),
  };
}

export async function portalListMembers(
  portalType: PortalType,
  token: string,
): Promise<PortalMember[]> {
  const { data, error } = await supabase.rpc("portal_list_members", {
    p_portal_type: portalType,
    p_access_token: token,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapMember);
}

export async function portalDeactivateMember(
  portalType: PortalType,
  token: string,
  memberId: string,
): Promise<void> {
  const { error } = await supabase.rpc("portal_deactivate_member", {
    p_portal_type: portalType,
    p_access_token: token,
    p_member_id: memberId,
  });
  if (error) rpcError(error);
}

// بينادوا على Edge Function (portal-members) عشان إنشاء/تعديل حساب Supabase Auth
// حقيقي محتاج service_role — ده مش ممكن يتعمل من دالة SQL عادية.
// supabase.functions.invoke بيبعت تلقائي توكن جلسة المستخدم الحالي (JWT) في
// Authorization header، والفانكشن بتتحقق منه وتتأكد إنه عضو مفعّل في البورتال ده
// قبل أي تعديل (وإن كان owner قبل ما يضيف عضو جديد).
async function callPortalMembersFunction(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("portal-members", { body: payload });
  if (error) throw new Error(error.message || "حصل خطأ مؤقت. حاول تاني.");
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function portalInviteMember(params: {
  portalType: PortalType;
  email: string;
  password: string;
  role: PortalMemberRole;
}): Promise<void> {
  await callPortalMembersFunction({
    portal_type: params.portalType,
    action: "invite",
    email: params.email,
    password: params.password,
    role: params.role,
  });
}

// بيستخدمها فريق GoAir (admin) بس، عشان ينشئ أول owner لكيان شريك جديد
// (عنده entity_id بالفعل من غير ما يكون عنده owner مسجّل قبل كده) — بيتحقق
// السيرفر إن الطالب عضو فريق مفعّل في staff_access قبل ما ينفّذ.
export async function adminInvitePortalOwner(params: {
  portalType: PortalType;
  entityId: string;
  email: string;
  password: string;
}): Promise<void> {
  await callPortalMembersFunction({
    portal_type: params.portalType,
    action: "admin_invite",
    entity_id: params.entityId,
    email: params.email,
    password: params.password,
    role: "owner",
  });
}

export async function portalSetMemberPassword(params: {
  portalType: PortalType;
  memberId: string;
  email: string;
  password: string;
}): Promise<void> {
  await callPortalMembersFunction({
    portal_type: params.portalType,
    action: "set_password",
    member_id: params.memberId,
    email: params.email,
    password: params.password,
  });
}
