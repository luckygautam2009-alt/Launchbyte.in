"use client";

import confetti from "canvas-confetti";

export function triggerConfetti() {
  // Check if reduced motion is preferred
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // Dual canon burst
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#6366f1", "#4f46e5", "#06b6d4"],
  });

  fire(0.2, {
    spread: 60,
    colors: ["#10b981", "#3b82f6", "#f59e0b"],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ["#ec4899", "#8b5cf6"],
  });
}
