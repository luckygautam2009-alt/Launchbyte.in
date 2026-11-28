"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#252642] dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-[#424C63] dark:text-slate-400 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              "w-full h-11 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-[#17172B] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500",
              "transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 pointer-events-none text-[#424C63] dark:text-slate-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
