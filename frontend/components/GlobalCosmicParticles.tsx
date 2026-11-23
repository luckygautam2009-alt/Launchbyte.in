"use client";

import React, { useEffect, useState, useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

interface Mote {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export default function GlobalCosmicParticles() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const particles: Particle[] = useMemo(() => {
    if (!mounted) return [];
    const count = isMobile ? 40 : 90;
    const colors = ["#FFFFFF", "#DDD6FE", "#BAE6FD", "#C084FC", "#A78BFA"];
    const items: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const s1 = ((i * 9301 + 49297) % 233280) / 233280;
      const s2 = ((i * 49297 + 9301) % 233280) / 233280;
      const s3 = ((i * 12345 + 67891) % 233280) / 233280;
      const s4 = ((i * 54321 + 19876) % 233280) / 233280;

      items.push({
        id: i,
        x: Math.round(s1 * 98 + 1), // 1% to 99%
        y: Math.round(s2 * 98 + 1), // 1% to 99%
        size: s3 > 0.88 ? 2.5 : s3 > 0.5 ? 1.8 : 1.1,
        duration: 2.5 + s4 * 3.5, // 2.5s to 6.0s
        delay: s1 * 4, // 0 to 4s
        opacity: 0.35 + s3 * 0.45,
        color: colors[Math.floor(s4 * colors.length)],
      });
    }
    return items;
  }, [mounted, isMobile]);

  const motes: Mote[] = useMemo(() => {
    if (!mounted || isMobile) return [];
    return [
      { id: 1, x: 12, y: 80, size: 3.5, duration: 14, delay: 0, color: "#8B5CF6" },
      { id: 2, x: 28, y: 88, size: 2.5, duration: 18, delay: 2, color: "#22D3EE" },
      { id: 3, x: 48, y: 75, size: 3.0, duration: 16, delay: 5, color: "#C084FC" },
      { id: 4, x: 68, y: 85, size: 3.2, duration: 15, delay: 1, color: "#818CF8" },
      { id: 5, x: 84, y: 78, size: 2.8, duration: 17, delay: 4, color: "#A78BFA" },
      { id: 6, x: 92, y: 92, size: 3.0, duration: 19, delay: 3, color: "#38BDF8" },
    ];
  }, [mounted, isMobile]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
    >
      {/* Ambient background stars */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `star-twinkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Floating upward cosmic dust motes */}
      {motes.map((m) => (
        <div
          key={m.id}
          className="absolute rounded-full blur-[0.5px]"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            backgroundColor: m.color,
            boxShadow: `0 0 12px ${m.color}`,
            animation: `float-up ${m.duration}s ease-in-out ${m.delay}s infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-160px) scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
