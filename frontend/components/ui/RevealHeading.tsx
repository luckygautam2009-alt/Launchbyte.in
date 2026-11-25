"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface RevealHeadingProps {
  children?: React.ReactNode;
  text?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "div";
  className?: string;
  delay?: number;
}

export default function RevealHeading({
  children,
  text,
  as: Component = "h2",
  className = "",
  delay = 0,
}: RevealHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-40px" });
  const shouldReduceMotion = useReducedMotion();

  // If text is provided as string, split by words
  const content = text || (typeof children === "string" ? children : null);

  if (shouldReduceMotion || !content) {
    const Tag = Component as any;
    return (
      <Tag ref={containerRef} className={className}>
        {children || text}
      </Tag>
    );
  }

  const words = content.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const MotionComponent = motion[Component] || motion.h2;

  return (
    <MotionComponent
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-pre">
          <motion.span variants={wordVariants} className="inline-block">
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </MotionComponent>
  );
}
