"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { MailCheck, Loader2, RefreshCw, X } from "lucide-react";

interface OtpVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
}

export default function OtpVerifyModal({
  open,
  onClose,
  onVerified,
  title = "Verify your email",
  subtitle = "Enter the 6-digit verification code sent to your email address to continue.",
}: OtpVerifyModalProps) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCode("");
    // Automatically request an OTP when modal opens if user is unverified
    if (user && !user.is_email_verified) {
      api
        .requestEmailVerification()
        .then(() => setCooldown(60))
        .catch(() => {
          // Cooldown may already be active from register/login
        });
    }
  }, [open, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!open) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setError("Please enter a valid 6-digit numeric code.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.confirmEmailVerification({ code: cleaned });
      await refreshUser();
      showToast("Email verified!", "success");
      onClose();
      await onVerified();
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await api.requestEmailVerification();
      showToast(res.message || "Verification code sent!", "success");
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || "Please wait before requesting another code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close verification modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <MailCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {user?.email && <p className="text-xs text-slate-400">{user.email}</p>}
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{subtitle}</p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </button>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Didn&apos;t receive a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 font-medium transition"
          >
            {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
