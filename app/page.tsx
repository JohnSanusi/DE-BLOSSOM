import { redirect } from "next/navigation";
import { hasCompletedMemberProfile } from "@/lib/auth/profile-completion";
import { createClient } from "@/lib/supabase/server";
import { resolveRouteFromRole } from "@/lib/auth/route-guards";

export default async function Page() {
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

  const role = resolveRouteFromRole(profile?.role);

  if (role === "admin") redirect("/admin");
  if (hasCompletedMemberProfile(profile)) redirect("/member");
  if (role === "member") redirect("/onboarding");

  redirect("/sign-in");
}
