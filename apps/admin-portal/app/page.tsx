"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void redirectExistingSession();
  }, []);

  async function redirectExistingSession() {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await redirectByRole(user.id);
  }

  async function redirectByRole(userId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role === "admin") {
      window.location.replace("/admin");
      return;
    }
    window.location.replace(profile?.username ? "/member" : "/onboarding");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = getSupabaseBrowserClient();

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/` },
          });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage(
        "Account created. Check your email to confirm your account, then sign in.",
      );
      setLoading(false);
      return;
    }

    if (result.data.user) await redirectByRole(result.data.user.id);
  }

  async function googleSignIn() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="page auth-page">
      <section className="auth-layout">
        <div className="intro auth-intro">
          <div className="auth-brand"><span className="mark">D</span><span>De-Blossom</span></div>
          <p className="kicker">De-Blossom Cooperative Society</p>
          <h1>Your cooperative records, made simple.</h1>
          <p className="intro-copy">
            Create an account or sign in to view your savings, shares, loans,
            and repayments.
          </p>
          <div className="auth-highlights"><div><span>01</span><p>See every contribution and balance in one place.</p></div><div><span>02</span><p>Follow loans, repayments, and statements with clarity.</p></div></div>
          <div className="trust-note">
            <LockKeyhole size={16} />
            <span>Secure member access</span>
          </div>
        </div>
        <div className="panel form auth-card">
          <div className="mobile-auth-brand"><span className="mark small">D</span><strong>De-Blossom</strong></div>
          <div
            className="auth-switch"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              className={mode === "sign-in" ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "sign-in"}
              onClick={() => {
                setMode("sign-in");
                setMessage("");
              }}
            >
              Sign in
            </button>
            <button
              className={mode === "sign-up" ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "sign-up"}
              onClick={() => {
                setMode("sign-up");
                setMessage("");
              }}
            >
              Create account
            </button>
          </div>
          <div className="auth-form-heading"><p className="kicker">
            {mode === "sign-in" ? "Welcome back" : "Join De-Blossom"}
          </p>
          <h2>
            {mode === "sign-in"
              ? "Sign in to your account"
              : "Create your account"}
          </h2>
          <p className="muted">
            {mode === "sign-in"
              ? "Enter your details to continue."
              : "Your new account starts with member access."}
              </p></div>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {message && <p className="error">{message}</p>}
            <button className="primary-action" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
          <div className="divider">
            <span>or continue with</span>
          </div>
          <button
            className="secondary"
            type="button"
            onClick={googleSignIn}
            disabled={loading}
          >
            <span className="google-glyph">G</span>Continue with Google
          </button>
          <p className="auth-footer">By continuing, you agree to use De-Blossom for cooperative records only.</p>
        </div>
      </section>
    </main>
  );
}
