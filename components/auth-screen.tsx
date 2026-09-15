"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Chrome, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-in. Please try again.",
      );
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      setMessage("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const result = mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });

      const { error, data } = result;

      if (error) {
        setMessage(error.message);
        return;
      }

      if (mode === "sign-up") {
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage("Account created. Check your email to confirm your account before signing in.");
        }
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden rounded-3xl bg-emerald-800 p-10 text-white lg:block">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">
            K
          </div>
          <p className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
            De-Blossom Cooperative Society
          </p>
          <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight">
            Your cooperative records, made simple.
          </h1>
          <p className="mt-5 max-w-md text-emerald-100">
            Check savings, shares, loans, and repayments in one clear place.
          </p>
          <div className="mt-12 grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Users className="size-4" />
              Members see only their own records.
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4" />
              Admins manage records securely.
            </div>
          </div>
        </section>
        <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-8 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 font-bold text-white">
              K
            </div>
            <p className="mt-4 text-sm font-semibold text-emerald-700">
              De-Blossom Cooperative Society
            </p>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            {mode === "sign-in" ? "Welcome back" : "Join De-Blossom"}
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "sign-in"
              ? "Use your email and password."
              : "New accounts start with member access."}
          </p>
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium">
              Email address
              <input
                className="h-11 rounded-xl border border-slate-200 bg-transparent px-3 outline-none focus:border-emerald-600 dark:border-slate-700"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-11 rounded-xl border border-slate-200 bg-transparent px-3 outline-none focus:border-emerald-600 dark:border-slate-700"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
            </label>
            {message && (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            )}
            <Button className="h-11 w-full" type="submit">
              {mode === "sign-in" ? "Sign in" : "Create account"}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <Button
            className="h-11 w-full"
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            <Chrome data-icon="inline-start" />
            Continue with Google
          </Button>
          <button
            className="mt-4 w-full text-sm font-medium text-emerald-700"
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setMessage("");
            }}
          >
            {mode === "sign-in"
              ? "Need an account? Create a member account"
              : "Already have an account? Sign in"}
          </button>
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex items-center gap-2 font-semibold">
              <LockKeyhole className="size-4" />
              Sign in
            </div>
            <p className="mt-1"></p>
          </div>
        </section>
      </div>
    </main>
  );
}
