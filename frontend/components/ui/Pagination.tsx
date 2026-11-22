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
        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-xs font-mono text-slate-400 px-3">
        Page <strong className="text-slate-100">{currentPage}</strong> of{" "}
        <strong className="text-slate-100">{totalPages}</strong>
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next Page"
        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
