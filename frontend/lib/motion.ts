/**
 * LaunchByte Motion System
 * Performance-safe Framer Motion primitives respecting prefers-reduced-motion.
 * Only animates transform and opacity.
 */

export const DURATION = {
  fast: 0.12,
  normal: 0.2,
  smooth: 0.32,
  slow: 0.5,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.4, 0, 0.2, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
} as const;

export const SPRING = {
  bouncy: { type: "spring", stiffness: 450, damping: 22 },
  smooth: { type: "spring", stiffness: 280, damping: 26 },
  gentle: { type: "spring", stiffness: 180, damping: 24 },
} as const;

// Common Framer Motion Variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.normal, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.out } },
};

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.smooth, ease: EASE.out } },
  exit: { opacity: 0, y: 8, transition: { duration: DURATION.fast, ease: EASE.out } },
};

export const slideDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.smooth, ease: EASE.out } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE.out } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.normal, ease: EASE.out } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: DURATION.fast, ease: EASE.out } },
};

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0.02) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const cardInteractive = {
  whileHover: { y: -4, transition: { duration: DURATION.normal, ease: EASE.out } },
  whileTap: { scale: 0.98, transition: { duration: DURATION.fast } },
};

export const buttonPress = {
  whileTap: { scale: 0.97, transition: { duration: DURATION.fast } },
  whileHover: { scale: 1.02, transition: { duration: DURATION.fast } },
};
