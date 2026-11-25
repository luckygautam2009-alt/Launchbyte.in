"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const INTRO_SESSION_KEY = "launchbyte_intro_v1";
const VIDEO_SRC = "/intro/launchbyte-intro.mp4";

// Verified against intro video metadata (4.958s duration, 1920x1080, 24fps):
// 0.00s - 1.80s: Spaceship enters from left & hovers center
// 2.05s - 3.60s: Astronaut turns toward viewer and waves from cockpit
// 3.60s - 4.96s: Thrusters ignite and spaceship departs to right leaving warp wake
const WAVE_SHOW_AT_SEC = 2.05;
const WAVE_HIDE_AT_SEC = 3.6;
const EXIT_BEFORE_END_SEC = 0.52;
const EXIT_FADE_MS = 550;
const LOAD_WATCHDOG_MS = 4000;
const FALLBACK_DWELL_MS = 1800;

type IntroStage = "idle" | "playing" | "fallback" | "exiting" | "done";

declare global {
  interface Window {
    __lbIntroFallbackSeen?: boolean;
  }
}

function hasSeenIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1") {
      return true;
    }
  } catch {
    // Storage unavailable (e.g. strict privacy/sandboxed frame); fall back to in-memory flag
  }
  return Boolean(window.__lbIntroFallbackSeen);
}

function markIntroSeen() {
  if (typeof window === "undefined") return;
  window.__lbIntroFallbackSeen = true;
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // Safe no-op when sessionStorage is blocked
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function LaunchByteIntro() {
  const [stage, setStage] = useState<IntroStage>("idle");
  const [showGreeting, setShowGreeting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedRef = useRef(false);
  const exitingRef = useRef(false);
  const greetingActiveRef = useRef(false);
  const scrollLockRef = useRef<{
    locked: boolean;
    bodyOverflow: string;
    htmlOverflow: string;
  } | null>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearScheduledTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const restoreScroll = useCallback(() => {
    if (!scrollLockRef.current?.locked || typeof document === "undefined") return;
    document.body.style.overflow = scrollLockRef.current.bodyOverflow;
    document.documentElement.style.overflow = scrollLockRef.current.htmlOverflow;
    scrollLockRef.current.locked = false;
  }, []);

  const lockScroll = useCallback(() => {
    if (typeof document === "undefined" || scrollLockRef.current?.locked) return;
    scrollLockRef.current = {
      locked: true,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }, []);

  const cleanupVideoElement = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute("src");
      video.load();
    } catch {
      // Ignore media teardown errors
    }
  }, []);

  const finishImmediately = useCallback(() => {
    exitingRef.current = true;
    clearScheduledTimers();
    cleanupVideoElement();
    restoreScroll();
    setShowGreeting(false);
    setStage("done");
  }, [cleanupVideoElement, clearScheduledTimers, restoreScroll]);

  const handleSkip = useCallback(() => {
    markIntroSeen();
    finishImmediately();
  }, [finishImmediately]);

  const beginSmoothExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    markIntroSeen();
    clearScheduledTimers();
    setShowGreeting(false);
    restoreScroll();
    setStage("exiting");

    const doneTimer = window.setTimeout(() => {
      cleanupVideoElement();
      setStage("done");
    }, EXIT_FADE_MS);
    timersRef.current.push(doneTimer);
  }, [cleanupVideoElement, clearScheduledTimers, restoreScroll]);

  const enterFallback = useCallback(() => {
    if (exitingRef.current) return;
    clearScheduledTimers();
    setStage("fallback");
    setShowGreeting(true);

    const exitTimer = window.setTimeout(() => {
      beginSmoothExit();
    }, FALLBACK_DWELL_MS);
    timersRef.current.push(exitTimer);
  }, [beginSmoothExit, clearScheduledTimers]);

  // Initial client mount: check session state & reduced motion without causing SSR hydration mismatch
  useEffect(() => {
    if (hasSeenIntro()) {
      setStage("done");
      return;
    }

    if (prefersReducedMotion()) {
      markIntroSeen();
      setStage("done");
      return;
    }

    startedRef.current = false;
    exitingRef.current = false;
    greetingActiveRef.current = false;
    lockScroll();
    setStage("playing");

    return () => {
      clearScheduledTimers();
      restoreScroll();
    };
  }, [clearScheduledTimers, lockScroll, restoreScroll]);

  // Allow keyboard Escape to skip intro cleanly while active
  useEffect(() => {
    if (stage !== "playing" && stage !== "fallback") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSkip, stage]);

  // Video lifecycle, playback synchronization, and autoplay/load resilience
  useEffect(() => {
    if (stage !== "playing") return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const syncTimeline = () => {
      if (exitingRef.current) return;
      const t = video.currentTime;
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 4.96;

      const shouldShowGreeting = t >= WAVE_SHOW_AT_SEC && t < WAVE_HIDE_AT_SEC;
      if (shouldShowGreeting !== greetingActiveRef.current) {
        greetingActiveRef.current = shouldShowGreeting;
        setShowGreeting(shouldShowGreeting);
      }

      if (t >= dur - EXIT_BEFORE_END_SEC) {
        beginSmoothExit();
      }
    };

    const tick = () => {
      syncTimeline();
      if (!exitingRef.current && stage === "playing") {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const onPlaying = () => {
      startedRef.current = true;
      markIntroSeen();
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const onTimeUpdate = () => {
      syncTimeline();
    };

    const onEnded = () => {
      beginSmoothExit();
    };

    const onError = () => {
      if (!exitingRef.current) {
        enterFallback();
      }
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    // Watchdog prevents indefinite wait if media network request hangs or stalls before playing
    const watchdog = window.setTimeout(() => {
      if (!startedRef.current && !exitingRef.current) {
        enterFallback();
      }
    }, LOAD_WATCHDOG_MS);
    timersRef.current.push(watchdog);

    const startPlayback = async () => {
      try {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          await playPromise;
        }
      } catch {
        // Autoplay blocked or media error -> present graceful cosmic welcome fallback
        if (!startedRef.current && !exitingRef.current) {
          enterFallback();
        }
      }
    };

    void startPlayback();

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      window.clearTimeout(watchdog);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [beginSmoothExit, enterFallback, stage]);

  if (stage === "idle" || stage === "done" || typeof document === "undefined") {
    return null;
  }

  const isExiting = stage === "exiting";

  return createPortal(
    <div
      id="launchbyte-intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="LaunchByte welcome intro"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050510] select-none transition-opacity duration-[550ms] ease-out ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient Deep-Space Cosmic Glow Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(79,70,229,0.16)_0%,_rgba(5,5,16,0.92)_62%,_#050510_100%)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-violet-600/15 blur-[130px]" />
      </div>

      {/* Native HTML5 Video Presentation */}
      {stage === "playing" || stage === "exiting" ? (
        <div className="relative z-0 w-full h-[64svh] sm:h-[76svh] md:h-full flex items-center justify-center max-md:[mask-image:linear-gradient(to_bottom,transparent_0%,black_22%,black_78%,transparent_100%)] max-md:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_22%,black_78%,transparent_100%)]">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            autoPlay
            playsInline
            preload="auto"
            aria-hidden="true"
            className="w-full h-full object-cover object-[51%_48%] md:object-center"
          />
        </div>
      ) : null}

      {/* Synchronized Welcome Greeting Typography (No cards or speech bubbles) */}
      <div
        aria-live="polite"
        className={`pointer-events-none absolute inset-x-0 z-10 px-6 text-center transition-all duration-500 ease-out ${
          stage === "fallback"
            ? "top-1/2 -translate-y-1/2"
            : "top-[10%] sm:top-[12%] md:top-[10.5%]"
        } ${
          showGreeting
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-[0.98]"
        }`}
      >
        <p className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_0_24px_rgba(139,92,246,0.55)]">
          Hey, Explorer!
        </p>
        <p
          style={{ transitionDelay: showGreeting ? "120ms" : "0ms" }}
          className="mt-2 sm:mt-2.5 text-2xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight text-white drop-shadow-[0_0_32px_rgba(139,92,246,0.55)] transition-all duration-500 ease-out"
        >
          Welcome to{" "}
          <span className="bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(167,139,250,0.65)]">
            LaunchByte.
          </span>
        </p>
      </div>

      {/* Skip Intro Button (Always visible immediately in top-right corner with iOS safe-area support) */}
      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip Intro"
        className="fixed top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-violet-400/35 bg-[#09091B]/75 px-4 py-2 text-xs sm:text-sm font-medium tracking-wide text-slate-100 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.22)] transition-all duration-200 hover:border-violet-300/70 hover:bg-violet-500/20 hover:text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.45)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <span>Skip Intro</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>,
    document.body
  );
}
