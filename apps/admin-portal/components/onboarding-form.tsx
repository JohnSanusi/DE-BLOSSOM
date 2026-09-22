"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import LoadingScreen from "./loading-screen";

export default function OnboardingForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadUser();
  }, []);

  async function loadUser() {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, username, phone, member_number, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      router.replace("/admin");
      return;
    }

    setFullName(profile?.full_name ?? "");
    setEmail(profile?.email ?? user.email ?? "");
    setUsername(profile?.username ?? "");
    setPhone(profile?.phone ?? "");
    setMemberNumber(profile?.member_number ?? "");
    setLoading(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.rpc("complete_member_profile", {
      p_full_name: fullName,
      p_username: username,
      p_phone: phone,
      p_member_number: memberNumber,
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { full_name: fullName, username, phone },
    });

    router.replace("/member");
  }

  if (loading) return <LoadingScreen label="Preparing your member profile" />;

  return (
    <main className="page">
      <section className="onboarding-layout">
        <div className="intro">
          <span className="mark">D</span>
          <p className="kicker">Complete your membership</p>
          <h1>Let&apos;s set up your cooperative profile.</h1>
          <p className="intro-copy">
            These details connect your account to the records your administrator
            uploads for you.
          </p>
        </div>
        <form className="panel form onboarding-form" onSubmit={submit}>
          <p className="kicker">Member details</p>
          <h2>Your profile</h2>
          <p className="muted">
            Your email is linked to your account and cannot be changed here.
          </p>
          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label>
            Username
            <input
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.replace(/\s/g, "").toLowerCase())
              }
              placeholder="e.g. amina.yusuf"
              required
            />
          </label>
          <label>
            WhatsApp number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. +234 803 000 0000"
              required
            />
          </label>
          <label>
            Member ID / number
            <input
              value={memberNumber}
              onChange={(event) =>
                setMemberNumber(event.target.value.toUpperCase())
              }
              placeholder="e.g. DB-001"
              required
            />
            <span className="field-help">
              Use the member number assigned by De-Blossom.
            </span>
          </label>
          <label>
            Email
            <input value={email} readOnly />
          </label>
          {message && <p className="error">{message}</p>}
          <button type="submit" disabled={saving}>
            {saving ? "Saving profile..." : "Continue to dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
