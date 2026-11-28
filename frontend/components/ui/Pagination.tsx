"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={clsx("flex items-center justify-center gap-2 select-none", className)}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous Page"
        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#2F3A52] dark:text-slate-300 hover:text-[#17172B] dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-xs font-mono text-[#424C63] dark:text-slate-400 px-3">
        Page <strong className="text-[#17172B] dark:text-slate-100">{currentPage}</strong> of{" "}
        <strong className="text-[#17172B] dark:text-slate-100">{totalPages}</strong>
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next Page"
        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#2F3A52] dark:text-slate-300 hover:text-[#17172B] dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
