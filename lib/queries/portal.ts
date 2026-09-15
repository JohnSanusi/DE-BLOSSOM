import { createClient } from "@/lib/supabase/server";

export type PortalProfile = {
  id: string;
  full_name: string;
  email: string;
  member_number: string;
  role: "member" | "admin";
  phone: string | null;
};

export async function getCurrentProfile(): Promise<PortalProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, member_number, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  return profile as PortalProfile | null;
}

export async function getMemberPortalData() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const [
    { data: profile },
    { data: accounts },
    { data: transactions },
    { data: loans },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, member_number, role, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("savings_accounts").select("*").eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("loans")
      .select("*, loan_payments(*)")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false }),
  ]);

  return {
    profile: profile as PortalProfile | null,
    accounts: accounts ?? [],
    transactions: transactions ?? [],
    loans: loans ?? [],
  };
}

export async function getAdminPortalData() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, member_number, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== "admin") {
    return null;
  }

  const [
    { data: members },
    { data: accounts },
    { data: loans },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, member_number, role, phone")
      .order("member_number"),
    supabase.from("savings_accounts").select("*"),
    supabase.from("loans").select("*"),
    supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false }),
  ]);

  return {
    profile: adminProfile as PortalProfile,
    members: members ?? [],
    accounts: accounts ?? [],
    loans: loans ?? [],
    transactions: transactions ?? [],
  };
}
