"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight, RefreshCw } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      api
        .confirmEmailVerification(token)
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

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await api.requestEmailVerification();
      showToast(res.message || "Verification link sent! Check your inbox.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to resend verification email.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm text-center">
      {loading ? (
        <div className="py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
          <p className="text-sm text-slate-400">Please wait while we confirm your token.</p>
        </div>
      ) : success === true ? (
        <div className="py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-sm text-slate-300">{message}</p>
          <div className="pt-4">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              Explore Opportunities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : success === false ? (
        <div className="py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
          <p className="text-sm text-rose-300">{message}</p>
          {user && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Request New Verification Link
            </button>
          )}
          <div className="pt-2">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check Your Inbox</h2>
          <p className="text-sm text-slate-300">
            We sent a verification link to your email address. Click the link in the email to activate your account.
          </p>
          {user && !user.is_email_verified && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Resend Verification Email
            </button>
          )}
          <div className="pt-2">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-slate-400">Loading verification...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
