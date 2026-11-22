"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { clsx } from "clsx";

export interface CountdownProps {
  targetDate: string | Date;
  label?: string;
  className?: string;
}

export function Countdown({ targetDate, label = "Ends in", className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    function calculate() {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div className={clsx("inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold", className)}>
        <Clock className="w-3.5 h-3.5" />
        <span>Event Ended</span>
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-100">
        <div className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700/80">
          {String(timeLeft.days).padStart(2, "0")}d
        </div>
        <span className="text-slate-500">:</span>
        <div className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700/80">
          {String(timeLeft.hours).padStart(2, "0")}h
        </div>
        <span className="text-slate-500">:</span>
        <div className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700/80">
          {String(timeLeft.minutes).padStart(2, "0")}m
        </div>
        <span className="text-slate-500">:</span>
        <div className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-brand-400">
          {String(timeLeft.seconds).padStart(2, "0")}s
        </div>
      </div>
    </div>
  );
}
