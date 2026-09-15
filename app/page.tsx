import { redirect } from "next/navigation";
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = resolveRouteFromRole(profile?.role);

  if (role === "admin") redirect("/admin");
  if (role === "member") redirect("/member");

  redirect("/sign-in");
}
