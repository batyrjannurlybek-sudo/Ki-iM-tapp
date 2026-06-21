"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

type Mode = "signin" | "signup" | "reset";
type Notice = { type: "error" | "success" | "info"; text: string } | null;

function localizeError(message: string, t: Dict): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.errCredentials;
  if (m.includes("email not confirmed")) return t.errNotConfirmed;
  if (m.includes("already registered") || m.includes("already been registered")) return t.errRegistered;
  if (m.includes("password should be at least")) return t.errShortPw;
  if (m.includes("unable to validate email") || m.includes("invalid email")) return t.errInvalidEmail;
  return message;
}

export default function LoginPage() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  // If already signed in, go straight to the dashboard.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.assign("/dashboard");
    });
  }, []);

  function originUrl() {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  async function signInWithGoogle() {
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${originUrl()}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setBusy(false);
      setNotice({ type: "error", text: localizeError(error.message, t) });
    }
    // On success the browser redirects to Google.
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const supabase = createClient();

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${originUrl()}/auth/callback?next=/dashboard/reset`,
      });
      setBusy(false);
      if (error) return setNotice({ type: "error", text: localizeError(error.message, t) });
      return setNotice({ type: "success", text: t.resetSent });
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) return setNotice({ type: "error", text: localizeError(error.message, t) });
      if (!data.session) {
        setNotice({ type: "info", text: t.signupOk });
        setMode("signin");
        setBusy(false);
      } else {
        window.location.assign("/dashboard");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      return setNotice({ type: "error", text: localizeError(error.message, t) });
    }
    // Hard navigation so the server immediately sees the new session cookie.
    window.location.assign("/dashboard");
  }

  const noticeStyles = {
    error: "bg-destructive/10 text-destructive",
    success: "bg-green-50 text-green-700",
    info: "bg-muted text-muted-foreground",
  };

  const title = mode === "signin" ? t.loginTitleIn : mode === "signup" ? t.loginTitleUp : t.resetTitle;
  const subtitle = mode === "signin" ? t.loginSubIn : mode === "signup" ? t.loginSubUp : t.resetSub;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center space-y-6 py-10">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {mode !== "reset" && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <GoogleIcon />
            {t.continueWithGoogle}
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.orDivider}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">{t.email}</label>
          <Input id="email" type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {mode !== "reset" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="password">{t.password}</label>
              {mode === "signin" && (
                <button type="button" onClick={() => { setMode("reset"); setNotice(null); }}
                  className="text-xs text-muted-foreground hover:underline">
                  {t.forgotPassword}
                </button>
              )}
            </div>
            <div className="relative">
              <Input id="password" type={showPw ? "text" : "password"} placeholder={t.passwordHint}
                value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required
                className="pr-10" />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? t.hidePassword : t.showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full" size="lg">
          {busy ? t.wait : mode === "signin" ? t.signIn : mode === "signup" ? t.signUp : t.resetSubmit}
        </Button>
      </form>

      {notice && <p className={`rounded-lg px-4 py-3 text-sm ${noticeStyles[notice.type]}`}>{notice.text}</p>}

      <div className="text-center text-sm text-muted-foreground">
        {mode === "reset" ? (
          <button type="button" onClick={() => { setMode("signin"); setNotice(null); }}
            className="font-medium text-foreground hover:underline">
            {t.backToLogin}
          </button>
        ) : (
          <>
            {mode === "signin" ? t.noAccount : t.haveAccount}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}
              className="font-medium text-foreground hover:underline">
              {mode === "signin" ? t.signUp : t.signIn}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
