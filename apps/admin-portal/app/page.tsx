"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordsEntered = mode === "sign-up" && password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = passwordsEntered && password === confirmPassword;

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
    if (mode === "sign-up" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: fullName,
                username,
                phone,
                member_number: memberNumber,
              },
            },
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
        <div className="panel form auth-card">
          <div className="auth-card-brand">
            <span className="mark">D</span>
            <div>
              <strong>De-Blossom</strong>
              <span>Cooperative Society</span>
            </div>
          </div>
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
          <div className="auth-form-heading">
            <p className="kicker">
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
                : "Set up your member details to get started."}
            </p>
          </div>
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
                  className={passwordsEntered ? (passwordsMatch ? "password-match" : "password-mismatch") : ""}
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
            {mode === "sign-up" && <>
              <label>Confirm password<div className="password-field"><input className={passwordsEntered ? (passwordsMatch ? "password-match" : "password-mismatch") : ""} type={showConfirmPassword ? "text" : "password"} minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /><button className="password-toggle" type="button" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{passwordsEntered && <span className={passwordsMatch ? "password-feedback match" : "password-feedback mismatch"}>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>}</label>
              <div className="signup-fields-heading"><span>Member details</span><small>These appear on your dashboard</small></div>
              <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
              <label>Username<input value={username} onChange={(event) => setUsername(event.target.value.replace(/\s/g, "").toLowerCase())} placeholder="e.g. amina.yusuf" required /></label>
              <label>WhatsApp number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="e.g. +234 803 000 0000" required /></label>
              <label>Member ID / number<input value={memberNumber} onChange={(event) => setMemberNumber(event.target.value.toUpperCase())} placeholder="e.g. DB-001" required /><span className="field-help">Use the number assigned by De-Blossom.</span></label>
            </>}
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
            <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
              />
              <path
                fill="#34A853"
                d="M12 21.72c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.27v2.53A9.74 9.74 0 0 0 12 21.72Z"
              />
              <path
                fill="#FBBC05"
                d="M6.51 13.8a5.85 5.85 0 0 1 0-3.6V7.67H3.27a9.77 9.77 0 0 0 0 8.66l3.24-2.53Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.17c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.27 14.63 2.28 12 2.28a9.74 9.74 0 0 0-8.73 5.39l3.24 2.53C7.29 7.89 9.45 6.17 12 6.17Z"
              />
            </svg>
            Continue with Google
          </button>
          <p className="auth-footer">
            By continuing, you agree to use De-Blossom for cooperative records
            only.
          </p>
        </div>
      </section>
    </main>
  );
}
