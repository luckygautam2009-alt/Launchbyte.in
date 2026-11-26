"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { CheckCircle2, XCircle, MailCheck, Loader2, ArrowRight, RefreshCw } from "lucide-react";

function getSafeNext(rawNext: string | null): string {
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    return rawNext;
  }
  return "/dashboard";
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const safeNext = getSafeNext(searchParams.get("next"));
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      setLoading(true);
      api
        .confirmEmailVerification({ token })
        .then((res) => {
          setSuccess(true);
          setMessage(res.message || "Your email has been verified successfully!");
          showToast("Email verified!", "success");
          refreshUser();
        })
        .catch((err: any) => {
          setSuccess(false);
          setMessage(err?.message || "Invalid or expired verification token.");
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setMessage("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await api.confirmEmailVerification({ code: cleaned });
      setSuccess(true);
      setMessage(res.message || "Your email has been verified successfully!");
      showToast("Email verified!", "success");
      await refreshUser();
      setTimeout(() => {
        router.push(safeNext);
      }, 600);
    } catch (err: any) {
      setMessage(err?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setMessage("");
    try {
      const res = await api.requestEmailVerification();
      showToast(res.message || "Verification code sent! Check your inbox.", "success");
      setCooldown(60);
    } catch (err: any) {
      const errMsg = err?.message || "Failed to resend verification code.";
      setMessage(errMsg);
      showToast(errMsg, "error");
    } finally {
      setResending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm text-center">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm text-center">
      {loading && token ? (
        <div className="py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
          <p className="text-sm text-slate-400">Please wait while we confirm your token.</p>
        </div>
      ) : success === true || user?.is_email_verified ? (
        <div className="py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-sm text-slate-300">
            {message || "Your email address is verified and ready to go."}
          </p>
          <div className="pt-4">
            <Link
              href={safeNext}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              Continue to LaunchByte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : success === false && token ? (
        <div className="py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
          <p className="text-sm text-rose-300">{message}</p>
          {user && (
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Request New Verification Code"}
            </button>
          )}
          <div className="pt-2">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
              Back to Home
            </Link>
          </div>
        </div>
      ) : !user ? (
        <div className="py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <MailCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign in to verify your email</h2>
          <p className="text-sm text-slate-400">
            Please sign in first so we can verify your 6-digit email OTP code.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent("/verify-email")}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Go to Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="py-4 space-y-5">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <MailCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Enter Verification Code</h2>
            <p className="text-sm text-slate-400">
              We sent a 6-digit code to <span className="text-slate-200 font-medium">{user.email}</span>.
              It expires in 10 minutes.
            </p>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {message}
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              aria-label="6-digit verification code"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 font-medium transition"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-2xl text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
