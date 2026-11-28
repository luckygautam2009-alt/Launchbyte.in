"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="text-center py-6 space-y-4">
        <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">Missing Reset Token</h3>
        <p className="text-sm text-[#424C63] dark:text-slate-400">
          No reset token was found in the link. Please request a new password reset.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#17172B] dark:text-white text-sm font-medium transition"
        >
          Request Reset Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.confirmPasswordReset(token, password);
      setSuccess(true);
      showToast("Password updated successfully! Please sign in.", "success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid or expired reset token.");
    } finally {
      setSubmitting(false);
    }
  };

  return success ? (
    <div className="py-6 space-y-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-[#17172B] dark:text-white">Password Reset Successful</h3>
      <p className="text-sm text-[#2F3A52] dark:text-slate-300">
        Your password has been securely updated. Older sessions have been invalidated.
      </p>
      <div className="pt-4">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          Sign In Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  ) : (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#424C63] dark:text-slate-400 mb-2">
          New Password (8+ characters)
        </label>
        <div className="relative">
          <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[#17172B] dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#424C63] dark:text-slate-400 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[#17172B] dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            Update Password
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#17172B] dark:text-white tracking-tight">
            Create New Password
          </h2>
          <p className="mt-2 text-sm text-[#424C63] dark:text-slate-400">
            Choose a strong, unique password for your account
          </p>
        </div>

        <Suspense fallback={<div className="text-[#424C63] dark:text-slate-400 text-center">Loading reset session...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
