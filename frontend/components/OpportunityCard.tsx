"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { OpportunityListItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api } from "@/lib/api";
import {
  Bookmark,
  Calendar,
  DollarSign,
  Globe,
  MapPin,
  Building,
} from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cardInteractive } from "@/lib/motion";

interface Props {
  opportunity: OpportunityListItem;
  isSavedInitial?: boolean;
  onSaveChange?: (saved: boolean) => void;
}

export default function OpportunityCard({
  opportunity,
  isSavedInitial = false,
  onSaveChange,
}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [saving, setSaving] = useState(false);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please log in to save opportunities.");
      return;
    }

    setSaving(true);
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (onSaveChange) onSaveChange(nextState);

    try {
      if (nextState) {
        await api.saveOpportunity(opportunity.id);
        toast.success("Saved to bookmarks");
      } else {
        await api.unsaveOpportunity(opportunity.id);
        toast.info("Removed from bookmarks");
      }
    } catch {
      setIsSaved(!nextState);
      if (onSaveChange) onSaveChange(!nextState);
      toast.error("Failed to update bookmark.");
    } finally {
      setSaving(false);
    }
  };

  const formatDeadline = (dateStr?: string | null, rolling?: boolean) => {
    if (rolling) return "Rolling deadline";
    if (!dateStr) return "Ongoing";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Closed";
    if (diffDays === 0) return "Ends today";
    if (diffDays === 1) return "Ends tomorrow";
    if (diffDays <= 7) return `Ends in ${diffDays} days`;
    return `Deadline: ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const getCompensationText = () => {
    if (opportunity.compensation_type === "unpaid") return "Unpaid";
    if (opportunity.compensation_min || opportunity.compensation_max) {
      const cur = opportunity.compensation_currency || "$";
      if (opportunity.compensation_min && opportunity.compensation_max) {
        return `${cur}${Number(opportunity.compensation_min).toLocaleString()} - ${cur}${Number(opportunity.compensation_max).toLocaleString()}`;
      }
      return `${cur}${Number(opportunity.compensation_min || opportunity.compensation_max).toLocaleString()}`;
    }
    if (opportunity.compensation_note) return opportunity.compensation_note;
    return opportunity.compensation_type.toUpperCase();
  };

  return (
    <motion.div
      whileHover={cardInteractive.whileHover}
      className="group relative rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/85 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/90 hover:border-violet-300 dark:hover:border-slate-700/80 backdrop-blur-sm transition-colors duration-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-lg dark:hover:shadow-brand-950/20"
    >
      <div>
        {/* Top Header: Org info + Trust Badge + Save */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={opportunity.organization.logo_url}
              name={opportunity.organization.name}
              size="md"
              shape="rounded"
              className="border border-slate-200 dark:border-slate-750 text-[#424C63] dark:text-slate-400 bg-slate-50 dark:bg-slate-900"
              fallback={<Building className="w-5 h-5" />}
            />
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-300 line-clamp-1">
                {opportunity.organization.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TrustBadge
                  score={opportunity.trust_score}
                  status={opportunity.verification_status}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bookmark button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={toggleSave}
              disabled={saving}
              aria-label={isSaved ? "Remove from bookmarks" : "Save opportunity"}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isSaved
                  ? "text-brand-600 dark:text-brand-400 bg-violet-50 dark:bg-brand-950/80 border border-violet-200 dark:border-brand-800"
                  : "text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
            </motion.button>
          </div>
        </div>

        {/* Title */}
        <Link href={`/opportunities/${opportunity.slug}`} className="block group-hover:underline">
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1.5">
            {opportunity.title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {opportunity.summary || "No summary provided. Click to view requirements, dates, and application details."}
        </p>
      </div>

      <div>
        {/* Meta Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Badge variant="brand" size="sm">
            {opportunity.type.toUpperCase()}
          </Badge>

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-[11px]">
            {opportunity.location_type === "remote" ? (
              <Globe className="w-3 h-3 text-sky-500 dark:text-sky-400" />
            ) : (
              <MapPin className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            )}
            {opportunity.location_text || opportunity.location_type || "Remote"}
          </span>

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-300 text-[11px]">
            <DollarSign className="w-3 h-3" />
            {getCompensationText()}
          </span>
        </div>

        {/* Footer: Tags + Deadline + View link */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {formatDeadline(opportunity.deadline_at, opportunity.is_rolling)}
          </span>

          <Link
            href={`/opportunities/${opportunity.slug}`}
            className="text-violet-600 hover:text-violet-700 dark:text-brand-400 dark:hover:text-brand-300 font-semibold transition"
          >
            View details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export { OpportunityCard };
