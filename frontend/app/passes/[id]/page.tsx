"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { QRPass } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { SPRING } from "@/lib/motion";
import {
  Calendar, MapPin, Wifi, QrCode, Download, RefreshCw,
  Loader2, AlertCircle, CheckCircle2, Clock, ArrowLeft, User, Sparkles
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "checked_in")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Checked In</span>;
  if (status === "registered")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-xs font-semibold"><QrCode className="w-3.5 h-3.5" /> Valid Pass</span>;
  if (status === "waitlisted")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Waitlisted</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/30 text-slate-400 rounded-full text-xs font-semibold">{status}</span>;
}

export default function PassPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const id = params?.id as string;

  const [pass, setPass] = useState<QRPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [brightness, setBrightness] = useState(false);
  const [pngUrl, setPngUrl] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchPass = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRegistrationPass(id);
      setPass(data);
      setPngUrl(api.getPassPngUrl(id) + `?t=${Date.now()}`);
    } catch (e: any) {
      setError(e.message || "Failed to load pass");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) fetchPass();
  }, [user, fetchPass]);

  const handleRotate = async () => {
    if (!confirm("Rotating your pass will invalidate the current QR code and generate a new one. Continue?")) return;
    setRotating(true);
    try {
      const data = await api.rotatePass(id);
      setPass(data);
      setPngUrl(api.getPassPngUrl(id) + `?t=${Date.now()}`);
      showToast("Pass rotated successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to rotate pass", "error");
    } finally {
      setRotating(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    const token = api.getToken();
    fetch(api.getPassPngUrl(id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `pass-${id}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      })
      .catch(() => showToast("Failed to download pass", "error"));
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (error || !pass) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-slate-400">{error || "Pass not found"}</p>
      <Link href="/me/registrations" className="text-indigo-400 hover:text-indigo-300 underline text-sm">My Registrations</Link>
    </div>
  );

  const starts = new Date(pass.starts_at);
  const ends = new Date(pass.ends_at);

  return (
    <main className={`min-h-screen transition-colors duration-300 ${brightness ? "bg-white" : "bg-slate-950"}`}>
      <div className="max-w-md mx-auto px-4 py-8">
        {!brightness && (
          <Link href="/me/registrations" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> My Registrations
          </Link>
        )}

        {/* Holographic Pass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={SPRING.bouncy}
          className={`relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 ${
            brightness
              ? "bg-white border-gray-200 shadow-gray-300"
              : "bg-slate-900/90 backdrop-blur-xl border-indigo-500/30 shadow-2xl shadow-indigo-500/10"
          }`}
        >
          {/* Holographic Top Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-accent-300" /> LaunchByte Pass
              </span>
              <StatusBadge status={pass.status} />
            </div>
            <h1 className="relative z-10 text-white font-bold text-xl leading-tight">{pass.event_title}</h1>
          </div>

          <div className={`p-6 space-y-4 ${brightness ? "bg-white" : ""}`}>
            {pass.attendee_name && (
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${brightness ? "bg-gray-100 text-gray-700" : "bg-slate-800 text-brand-400"}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs ${brightness ? "text-gray-500" : "text-slate-400"}`}>Attendee</p>
                  <p className={`font-semibold ${brightness ? "text-gray-900" : "text-white"}`}>{pass.attendee_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${brightness ? "bg-gray-100 text-gray-700" : "bg-slate-800 text-brand-400"}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs ${brightness ? "text-gray-500" : "text-slate-400"}`}>Date & Time</p>
                <p className={`font-medium text-sm ${brightness ? "text-gray-900" : "text-white"}`}>
                  {starts.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className={`text-xs ${brightness ? "text-gray-600" : "text-slate-500"}`}>
                  to {ends.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {pass.venue_text && (
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${brightness ? "bg-gray-100 text-gray-700" : "bg-slate-800 text-brand-400"}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs ${brightness ? "text-gray-500" : "text-slate-400"}`}>Venue</p>
                  <p className={`font-medium text-sm ${brightness ? "text-gray-900" : "text-white"}`}>{pass.venue_text}</p>
                </div>
              </div>
            )}
            {pass.online_url && (
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${brightness ? "bg-gray-100 text-gray-700" : "bg-slate-800 text-brand-400"}`}>
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs ${brightness ? "text-gray-500" : "text-slate-400"}`}>Online Link</p>
                  <a href={pass.online_url} target="_blank" rel="noopener noreferrer"
                    className="text-brand-400 hover:underline text-sm font-medium break-all">
                    Join Event
                  </a>
                </div>
              </div>
            )}

            {/* QR Code Container with Laser Scanline */}
            <div className={`relative overflow-hidden rounded-2xl p-5 flex flex-col items-center gap-3 border ${brightness ? "bg-white border-gray-200" : "bg-slate-950/70 border-slate-800/80 shadow-inner"}`}>
              {/* Animated Laser Sweep Line */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-scan-line pointer-events-none" />

              {pngUrl ? (
                <img
                  src={pngUrl}
                  alt="QR Code"
                  className="w-48 h-48 object-contain rounded-lg"
                  onError={() => setError("Failed to load QR image")}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-slate-700" />
                </div>
              )}
              <div className="text-center">
                <p className={`font-mono text-sm font-bold tracking-widest ${brightness ? "text-gray-800" : "text-brand-300"}`}>{pass.registration_code}</p>
                <p className={`text-xs mt-0.5 ${brightness ? "text-gray-500" : "text-slate-500"}`}>Show this QR code at the check-in desk</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Controls */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <button
            onClick={() => setBrightness(!brightness)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${brightness ? "bg-slate-950 text-white border-slate-700" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white"}`}
          >
            <div className="w-4 h-4 rounded-full border-2 border-current" style={{ background: brightness ? "#000" : "#fff" }} />
            {brightness ? "Dark Mode" : "High Brightness"}
          </button>
          <button
            onClick={handleDownload}
            className="min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleRotate}
            disabled={rotating}
            className="min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            {rotating ? <Loader2 className="w-4 h-4 animate-spin text-brand-400" /> : <RefreshCw className="w-4 h-4" />}
            Rotate Pass
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Rotate pass if you believe your QR code has been compromised. This invalidates the previous QR.
        </p>
      </div>
    </main>
  );
}