"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SPRING } from "@/lib/motion";
import { QrCode, KeyRound, CheckCircle2, XCircle, Loader2, ChevronLeft, AlertCircle, Users, Sparkles } from "lucide-react";

type ScanResult = {
  id: string;
  success: boolean;
  message: string;
  attendee_name?: string;
  registration_code?: string;
  code: string;
  timestamp: Date;
};

type ScanState = "idle" | "scanning" | "success" | "error";

export default function ScannerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const id = params?.id as string;

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [manualCode, setManualCode] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [tab, setTab] = useState<"camera" | "manual">("camera");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || !["admin", "moderator", "organizer"].includes(user.role))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const processCheckIn = useCallback(async (code: string, isQRToken: boolean) => {
    const now = Date.now();
    if (code === lastScannedRef.current && now - lastScannedTimeRef.current < 2000) return;
    lastScannedRef.current = code;
    lastScannedTimeRef.current = now;

    setScanState("scanning");

    const payload = isQRToken
      ? { token: code }
      : { registration_code: code };

    try {
      const res = await api.checkIn(id, payload);
      const result: ScanResult = {
        id: Date.now().toString(),
        success: true,
        message: res.message || "Checked in!",
        attendee_name: res.attendee_name,
        registration_code: res.registration_code,
        code,
        timestamp: new Date(),
      };
      if (isMounted.current) {
        setLastResult(result);
        setScanState("success");
        setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(100);
      }
    } catch (e: any) {
      const result: ScanResult = {
        id: Date.now().toString(),
        success: false,
        message: e.message || "Check-in failed",
        code,
        timestamp: new Date(),
      };
      if (isMounted.current) {
        setLastResult(result);
        setScanState("error");
        setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setTimeout(() => {
        if (isMounted.current) setScanState("idle");
      }, 2500);
    }
  }, [id]);

  useEffect(() => {
    if (tab !== "camera") return;

    let active = true;

    const startCamera = async () => {
      if (!("BarcodeDetector" in window)) {
        setCameraError("BarcodeDetector not supported in this browser. Use manual code entry.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScannerReady(true);
        }

        // @ts-ignore
        const detector = new BarcodeDetector({ formats: ["qr_code"] });

        const scan = async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              const isJWT = raw.includes(".");
              await processCheckIn(raw, isJWT);
            }
          } catch { /* frame drop */ }
          if (active) rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } catch {
        if (active) setCameraError("Camera access denied or unavailable. Use manual code entry.");
      }
    };

    startCamera();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setScannerReady(false);
    };
  }, [tab, processCheckIn]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setManualLoading(true);
    await processCheckIn(code, false);
    setManualCode("");
    setManualLoading(false);
  };

  const scanBg = scanState === "success" ? "bg-green-500/10" : scanState === "error" ? "bg-red-500/10" : "bg-transparent";

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/admin/events/${id}`} className="min-h-[44px] flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to Event
          </Link>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" /> Check-in Scanner
          </h1>
          <div className="w-16" />
        </div>

        {/* Tab Switch */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 mb-6">
          <button
            onClick={() => setTab("camera")}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "camera" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}
          >
            <QrCode className="w-4 h-4" /> Camera Scan
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "manual" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}
          >
            <KeyRound className="w-4 h-4" /> Manual Code
          </button>
        </div>

        {/* Spring Scan Result Banner */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={lastResult.id}
              initial={{ opacity: 0, scale: 0.85, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={SPRING.bouncy}
              className={`mb-6 p-5 rounded-2xl border flex items-center gap-4 transition-all shadow-xl ${
                lastResult.success
                  ? "bg-emerald-950/40 border-emerald-500/40 shadow-emerald-500/10"
                  : "bg-rose-950/40 border-rose-500/40 shadow-rose-500/10"
              }`}
            >
              {lastResult.success ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-7 h-7 text-rose-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-base ${lastResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                  {lastResult.success ? "Check-in Confirmed!" : "Check-in Failed"}
                </p>
                <p className="text-sm font-medium text-slate-200 mt-0.5 truncate">{lastResult.attendee_name || lastResult.message}</p>
                {lastResult.registration_code && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{lastResult.registration_code}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === "camera" && (
          <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-colors ${scanBg}`}>
            {cameraError ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-300 text-sm">{cameraError}</p>
                <button onClick={() => setTab("manual")} className="min-h-[44px] mt-3 inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium underline">
                  Use manual entry
                </button>
              </div>
            ) : (
              <div className="relative">
                <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
                {!scannerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 relative rounded-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-xl" />

                    {/* Laser Scan Sweep in Viewfinder */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-scan-line" />

                    {scanState === "scanning" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="p-3 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">Point camera at attendee QR code or digital pass</p>
            </div>
          </div>
        )}

        {tab === "manual" && (
          <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-6 transition-colors ${scanBg}`}>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Registration Code
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HQ26-ABCD1234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase tracking-widest text-center"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={manualLoading || !manualCode.trim()}
                className="min-h-[44px] w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {manualLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : "Confirm Check In"}
              </button>
            </form>
          </div>
        )}

        {recentScans.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" /> Recent Scans ({recentScans.length})
            </h2>
            <div className="space-y-2">
              {recentScans.map((scan) => (
                <div key={scan.id} className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${scan.success ? "bg-emerald-950/20 border-emerald-500/20" : "bg-rose-950/20 border-rose-500/20"}`}>
                  {scan.success
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{scan.attendee_name || scan.message}</p>
                    <p className="text-xs text-slate-400 font-mono">{scan.registration_code || scan.code.slice(0, 20)}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 font-mono">
                    {scan.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}