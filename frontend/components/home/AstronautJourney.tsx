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

export interface JourneyStage {
  id: string;
  tag: string;
  title: string;
  progress: number;
  range: [number, number, number, number];
  xPercent: number;
  yPercent: number;
  side: "left" | "right";
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "stage-discover",
    tag: "DISCOVER",
    title: "Step into a universe of opportunities.",
    progress: 0.04,
    range: [0.005, 0.03, 0.12, 0.15],
    xPercent: 5,
    yPercent: 3,
    side: "left",
  },
  {
    id: "stage-explore",
    tag: "EXPLORE",
    title: "Find hackathons, fellowships and more.",
    progress: 0.22,
    range: [0.16, 0.19, 0.28, 0.32],
    xPercent: 91,
    yPercent: 21,
    side: "right",
  },
  {
    id: "stage-apply",
    tag: "APPLY",
    title: "Pick what fits and go for it.",
    progress: 0.38,
    range: [0.33, 0.36, 0.44, 0.48],
    xPercent: 6,
    yPercent: 37,
    side: "left",
  },
  {
    id: "stage-connect",
    tag: "CONNECT",
    title: "Find your squad.",
    progress: 0.54,
    range: [0.49, 0.52, 0.60, 0.64],
    xPercent: 90,
    yPercent: 53,
    side: "right",
  },
  {
    id: "stage-build",
    tag: "BUILD",
    title: "Ship something real.",
    progress: 0.70,
    range: [0.65, 0.68, 0.76, 0.80],
    xPercent: 6,
    yPercent: 69,
    side: "left",
  },
  {
    id: "stage-launch",
    tag: "LAUNCH",
    title: "Launch your trajectory into orbit.",
    progress: 0.94,
    range: [0.88, 0.92, 0.98, 1.0],
    xPercent: 86,
    yPercent: 94,
    side: "right",
  },
];

function StageCaption({
  stage,
  progress,
}: {
  stage: JourneyStage;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, stage.range, [0, 1, 1, 0]);
  const scale = useTransform(progress, stage.range, [0.88, 1, 1, 0.88]);
  const yOffset = useTransform(progress, stage.range, [12, 0, 0, -12]);

  const isLeft = stage.side === "left";

  return (
    <motion.div
      style={{ opacity, scale, y: yOffset }}
      className={`absolute top-1/2 -translate-y-1/2 pointer-events-none w-56 sm:w-64 z-30 ${
        isLeft ? "left-full ml-3 sm:ml-4 text-left" : "right-full mr-3 sm:mr-4 text-right"
      }`}
    >
      <div className="glass-card rounded-xl p-3 border border-violet-500/35 backdrop-blur-md shadow-2xl shadow-black/60 bg-[#09091b]/90">
        <div
          className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1 ${
            isLeft ? "justify-start" : "justify-end"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>STAGE // {stage.tag}</span>
        </div>
        <p className="text-xs font-semibold text-white leading-snug">
          {stage.title}
        </p>
      </div>
    </motion.div>
  );
}

function ProgressRail({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => setCurrentProgress(v));
  }, [scrollYProgress]);

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
      aria-label="Storyline Navigation Rail"
      className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3.5 py-4 px-2 rounded-full glass-card border border-violet-500/25 bg-[#050510]/80 backdrop-blur-md shadow-xl shadow-black/50"
    >
      <span className="text-[9px] font-mono text-slate-400 font-bold -rotate-90 my-2 select-none tracking-widest">
        ORBIT
      </span>

      <div className="flex flex-col items-center gap-3 relative">
        {JOURNEY_STAGES.map((s) => {
          const isActive = currentProgress >= s.progress - 0.06;
          const isCurrent =
            currentProgress >= s.range[0] && currentProgress <= s.range[3];

          return (
            <button
              key={s.id}
              onClick={() => handleScrollTo(s.id)}
              className="group relative flex items-center justify-center p-1 focus:outline-none"
              title={`${s.tag}: ${s.title}`}
              aria-label={`Scroll to stage ${s.tag}`}
            >
              {/* Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "bg-cyan-400 ring-4 ring-cyan-400/30 scale-125"
                    : isActive
                    ? "bg-violet-400 ring-2 ring-violet-400/20"
                    : "bg-slate-700 hover:bg-slate-500"
                }`}
              />

              {/* Tooltip on Hover */}
              <span className="absolute right-full mr-3 px-2.5 py-1 rounded-md bg-slate-900/95 border border-violet-500/30 text-[10px] font-mono text-cyan-300 uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
                {s.tag}
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

  // Astronaut X position (alternating between left margin ~5% and right margin ~91%)
  const posX = useTransform(
    smoothProgress,
    [0, 0.04, 0.22, 0.38, 0.54, 0.70, 0.94, 1.0],
    ["5%", "5%", "91%", "6%", "90%", "6%", "86%", "86%"]
  );

  // Astronaut Y position (travels down the full wrapper height 0% to ~96%)
  const posY = useTransform(
    smoothProgress,
    [0, 0.04, 0.22, 0.38, 0.54, 0.70, 0.94, 1.0],
    ["1%", "3%", "21%", "37%", "53%", "69%", "94%", "96%"]
  );

  // Gentle orientation tilt following motion direction and scroll velocity
  const dirTilt = useTransform(
    smoothProgress,
    [0, 0.12, 0.22, 0.30, 0.38, 0.46, 0.54, 0.62, 0.70, 0.82, 0.94, 1.0],
    [0, 9, 3, -9, -3, 9, 3, -9, -3, 10, 0, 0]
  );
  const velTilt = useTransform(smoothVelocity, [-0.4, 0, 0.4], [-10, 0, 10]);

  // Combined rotation
  const rotCombined = useTransform(
    [dirTilt, velTilt],
    ([d, v]: any[]) => (d || 0) + (v || 0)
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Progress Rail (Fixed right edge, visible strictly while inside this wrapper) */}
      <ProgressRail scrollYProgress={scrollYProgress} />

      {/* SVG S-Curve Glowing Trail (Desktop only) */}
      {!shouldReduceMotion && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none hidden md:block z-10"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="journeyTrailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#C084FC" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#A78BFA" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.95" />
            </linearGradient>
            <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint Guide Trail */}
          <path
            d="M 5,3 C 5,12 91,12 91,21 C 91,30 6,29 6,37 C 6,45 90,45 90,53 C 90,61 6,61 6,69 C 6,80 86,82 86,94"
            fill="none"
            stroke="rgba(167, 139, 250, 0.12)"
            strokeWidth="0.3"
            strokeDasharray="0.8 1.4"
          />

          {/* Active Animated Trail */}
          <motion.path
            d="M 5,3 C 5,12 91,12 91,21 C 91,30 6,29 6,37 C 6,45 90,45 90,53 C 90,61 6,61 6,69 C 6,80 86,82 86,94"
            fill="none"
            stroke="url(#journeyTrailGrad)"
            strokeWidth="0.45"
            filter="url(#trailGlow)"
            style={{ pathLength: smoothProgress }}
          />
        </svg>
      )}

      {/* Floating Astronaut and Captions (Desktop only) */}
      {!shouldReduceMotion && (
        <motion.div
          style={{
            left: posX,
            top: posY,
            rotate: rotCombined,
            willChange: "transform",
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:block"
        >
          {/* Subtle Zero-G Idle Float */}
          <motion.div
            animate={{
              y: [-6, 6, -6],
              rotate: [-2, 2, -2],
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
              className="w-24 sm:w-28 h-auto select-none pointer-events-none drop-shadow-[0_0_24px_rgba(167,139,250,0.55)]"
            />
          </motion.div>

          {/* Stage Captions (Only one visible at a time) */}
          {JOURNEY_STAGES.map((stage) => (
            <StageCaption
              key={stage.id}
              stage={stage}
              progress={smoothProgress}
            />
          ))}
        </motion.div>
      )}

      {/* Content wrapper: all sections 3 through 9+ render here */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
