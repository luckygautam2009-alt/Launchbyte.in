"use client";

import React, { useEffect, useState, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789//<>[]!*#@+~";

interface DecodeTextProps {
  text: string;
  className?: string;
  duration?: number; // total duration in ms, default ~700ms
  delay?: number;
}

export default function DecodeText({
  text,
  className = "",
  duration = 700,
  delay = 0,
}: DecodeTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-20px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayText(text);
      return;
    }

    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const timeoutId = setTimeout(() => {
      const step = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate how many characters are resolved from left to right
        const resolvedCount = Math.floor(progress * text.length);

        let scrambled = "";
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === " " || char === "/" || i < resolvedCount) {
            scrambled += char;
          } else {
            scrambled += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }

        setDisplayText(scrambled);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayText(text);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, text, duration, delay, shouldReduceMotion]);

  return (
    <span ref={containerRef} className={`font-mono ${className}`}>
      {displayText}
    </span>
  );
}
