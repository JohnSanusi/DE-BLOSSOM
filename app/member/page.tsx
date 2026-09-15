import { redirect } from "next/navigation";
import CooperativePortal from "@/components/cooperative-portal";
import { createClient } from "@/lib/supabase/server";
import { resolveRouteFromRole } from "@/lib/auth/route-guards";

export default async function MemberPage() {
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (resolveRouteFromRole(profile?.role) !== "member") {
    redirect("/admin");
  }

  return <CooperativePortal />;
}
