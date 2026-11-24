"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useReducedMotion,
  MotionValue,
} from "framer-motion";

export interface JourneyStageDot {
  id: string;
  tag: string;
  label: string;
  progress: number;
}

export const JOURNEY_5_STAGES: JourneyStageDot[] = [
  {
    id: "stage-discover",
    tag: "01",
    label: "Discover",
    progress: 0.05,
  },
  {
    id: "stage-explore",
    tag: "02",
    label: "Explore",
    progress: 0.25,
  },
  {
    id: "stage-connect",
    tag: "03",
    label: "Connect",
    progress: 0.52,
  },
  {
    id: "stage-build",
    tag: "04",
    label: "Build",
    progress: 0.72,
  },
  {
    id: "stage-launch",
    tag: "05",
    label: "Launch",
    progress: 0.94,
  },
];

function LeftProgressRail({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => setCurrentProgress(v));
  }, [scrollYProgress]);

  // Rail strictly appears only after the frozen sections and fades before the footer
  const railOpacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.nav
      style={{ opacity: railOpacity }}
      aria-label="Journey Progress Rail"
      className="hidden xl:flex fixed left-4 2xl:left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-4 py-4 px-2.5 rounded-full glass-card border border-violet-500/30 bg-[#050510]/85 backdrop-blur-md shadow-2xl shadow-black/60"
    >
      <span className="text-[9px] font-mono text-cyan-400 font-bold -rotate-90 my-2 select-none tracking-widest">
        STAGES
      </span>

      {/* Progress track line */}
      <div className="relative flex flex-col items-center gap-4 py-1">
        <div className="absolute top-1 bottom-1 w-0.5 bg-violet-950/80 -z-10 rounded-full" />
        <motion.div
          style={{ height: `${Math.min(Math.max(currentProgress * 100, 0), 100)}%` }}
          className="absolute top-1 w-0.5 bg-gradient-to-b from-cyan-400 via-violet-400 to-indigo-400 -z-10 rounded-full transition-all duration-150"
        />

        {JOURNEY_5_STAGES.map((s) => {
          const isReached = currentProgress >= s.progress - 0.06;
          const isCurrent =
            Math.abs(currentProgress - s.progress) < 0.12 ||
            (s.tag === "01" && currentProgress < 0.15) ||
            (s.tag === "05" && currentProgress > 0.88);

          return (
            <button
              key={s.id}
              onClick={() => handleScrollTo(s.id)}
              className="group relative flex items-center justify-center p-1.5 focus:outline-none"
              title={`${s.tag} // ${s.label}`}
              aria-label={`Jump to stage ${s.label}`}
            >
              {/* Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "bg-cyan-400 ring-4 ring-cyan-400/35 scale-125 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                    : isReached
                    ? "bg-violet-400 ring-2 ring-violet-400/25"
                    : "bg-slate-700 hover:bg-slate-500"
                }`}
              />

              {/* Tooltip on right */}
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-slate-900/95 border border-violet-500/30 text-[10px] font-mono text-cyan-300 uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
                {s.tag} // {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default function AstronautJourney({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll tracking bound strictly to the wrapper container (Sections 3 to 9)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 24,
    restDelta: 0.0005,
  });

  const scrollVelocity = useVelocity(smoothProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 45,
    stiffness: 350,
  });

  // Astronaut X position (confined strictly to side gutters: ~2% left margin and ~96% right margin)
  // This guarantees it never hovers over the 1280px centered content cards
  const posX = useTransform(
    smoothProgress,
    [0, 0.05, 0.25, 0.52, 0.72, 0.94, 1.0],
    ["3%", "3%", "96%", "3.5%", "96%", "95%", "95%"]
  );

  // Astronaut Y position down the page height
  const posY = useTransform(
    smoothProgress,
    [0, 0.05, 0.25, 0.52, 0.72, 0.94, 1.0],
    ["1.5%", "3%", "23%", "50%", "71%", "94%", "96%"]
  );

  // Orientation tilt
  const dirTilt = useTransform(
    smoothProgress,
    [0, 0.15, 0.25, 0.40, 0.52, 0.62, 0.72, 0.85, 0.94, 1.0],
    [0, 8, 2, -8, -2, 8, 2, -8, 0, 0]
  );
  const velTilt = useTransform(smoothVelocity, [-0.4, 0, 0.4], [-8, 0, 8]);

  const rotCombined = useTransform(
    [dirTilt, velTilt],
    ([d, v]: any[]) => (d || 0) + (v || 0)
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Left-edge Progress Rail (Desktop >= 1280px only) */}
      <LeftProgressRail scrollYProgress={scrollYProgress} />

      {/* SVG S-Curve Glowing Trail (Constrained to margins, Desktop >= 1280px only) */}
      {!shouldReduceMotion && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none hidden xl:block z-10"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="journeyTrailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#C084FC" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#A78BFA" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.95" />
            </linearGradient>
            <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.45" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint Guide Trail */}
          <path
            d="M 3,3 C 3,13 96,13 96,23 C 96,37 3.5,37 3.5,50 C 3.5,61 96,61 96,71 C 96,82 95,84 95,94"
            fill="none"
            stroke="rgba(167, 139, 250, 0.1)"
            strokeWidth="0.25"
            strokeDasharray="0.8 1.4"
          />

          {/* Active Animated Trail */}
          <motion.path
            d="M 3,3 C 3,13 96,13 96,23 C 96,37 3.5,37 3.5,50 C 3.5,61 96,61 96,71 C 96,82 95,84 95,94"
            fill="none"
            stroke="url(#journeyTrailGrad)"
            strokeWidth="0.38"
            filter="url(#trailGlow)"
            style={{ pathLength: smoothProgress }}
          />
        </svg>
      )}

      {/* 
        Side-gutter Floating Astronaut (Desktop >= 1280px only, hidden below 1280px)
        No floating captions: nothing floats over content anymore.
      */}
      {!shouldReduceMotion && (
        <motion.div
          style={{
            left: posX,
            top: posY,
            rotate: rotCombined,
            willChange: "transform",
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:block"
        >
          {/* Subtle Zero-G Idle Float */}
          <motion.div
            animate={{
              y: [-5, 5, -5],
              rotate: [-1.5, 1.5, -1.5],
            }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <img
              src="/brand/journey-astronaut.png"
              alt=""
              aria-hidden="true"
              className="w-20 sm:w-24 h-auto select-none pointer-events-none drop-shadow-[0_0_20px_rgba(167,139,250,0.5)]"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Content wrapper: all sections 3 through 9+ render cleanly here */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
