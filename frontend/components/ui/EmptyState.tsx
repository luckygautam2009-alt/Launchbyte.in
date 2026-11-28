import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#424C63] dark:text-slate-400 shadow-inner">
        <Icon className="w-7 h-7 text-[#7552D9] dark:text-brand-400" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-[#17172B] dark:text-slate-100">{title}</h3>
        <p className="text-sm text-[#424C63] dark:text-slate-400 max-w-sm leading-relaxed">{description}</p>
      </div>

      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary" size="md">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
