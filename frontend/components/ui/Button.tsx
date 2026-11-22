"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import { buttonPress } from "@/lib/motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      icon,
      iconRight,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const sizeStyles = {
      sm: "h-9 min-w-[36px] px-3 text-xs gap-1.5",
      md: "h-11 min-w-[44px] px-4 text-sm gap-2",
      lg: "h-12 min-w-[48px] px-6 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 border border-brand-500/30",
      accent:
        "bg-accent-500 hover:bg-accent-400 text-slate-950 font-semibold shadow-lg shadow-accent-500/25 border border-accent-400/40",
      secondary:
        "bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750/80 hover:text-white",
      outline:
        "bg-transparent hover:bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/80",
      ghost:
        "bg-transparent hover:bg-slate-850/60 text-slate-300 hover:text-white border border-transparent",
      danger:
        "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 border border-red-500/30",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || loading ? undefined : buttonPress.whileHover}
        whileTap={disabled || loading ? undefined : buttonPress.whileTap}
        disabled={disabled || loading}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
