import { redirect } from "next/navigation";
import { hasCompletedMemberProfile } from "@/lib/auth/profile-completion";
import PortalView from "@/components/portal-view";
import { createClient } from "@/lib/supabase/server";
import { resolveRouteFromRole } from "@/lib/auth/route-guards";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, username, phone, member_number")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/sign-in");
  const role = resolveRouteFromRole(profile.role);
  if (role === "member") {
    redirect(
      hasCompletedMemberProfile(profile) ? "/member" : "/onboarding",
    );
  }
  if (role !== "admin") redirect("/sign-in");

  return <PortalView requiredRole="admin" />;
}
