import { NextResponse } from "next/server";
import { hasCompletedMemberProfile } from "@/lib/auth/profile-completion";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role, full_name, username, phone, member_number")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const destination = !profile
    ? "/sign-in"
    : profile.role === "admin"
      ? "/admin"
      : profile.role === "member"
        ? hasCompletedMemberProfile(profile)
          ? "/member"
          : "/onboarding"
        : "/sign-in";

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}