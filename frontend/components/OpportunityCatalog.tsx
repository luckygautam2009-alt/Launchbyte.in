"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  CompensationType,
  LocationType,
  OpportunityListItem,
  OpportunityType,
  TagRead,
  VerificationStatus,
} from "@/lib/types";
import OpportunityCard from "./OpportunityCard";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface Props {
  fixedType?: OpportunityType;
  title: string;
  subtitle: string;
  hideHeader?: boolean;
}

const ALL_TYPES: OpportunityType[] = [
  "hackathon",
  "internship",
  "fellowship",
  "scholarship",
  "grant",
  "competition",
  "program",
  "event",
  "other",
];

const ALL_LOCATIONS: LocationType[] = ["remote", "onsite", "hybrid"];
const ALL_COMPENSATIONS: CompensationType[] = [
  "paid",
  "stipend",
  "prize",
  "funded",
  "unpaid",
];

export default function OpportunityCatalog({
  fixedType,
  title,
  subtitle,
  hideHeader = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state
  const qParam = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "deadline";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const locParam = searchParams.get("location_type") || "";
  const compParam = searchParams.get("compensation_type") || "";
  const verParam = searchParams.get("verification_status") || "";
  const openParam = searchParams.get("open_only") === "true";

  // Filter local state
  const [q, setQ] = useState(qParam);
  const [sort, setSort] = useState(sortParam);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    fixedType ? [fixedType] : searchParams.getAll("type")
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.getAll("tag")
  );
  const [locationType, setLocationType] = useState<string>(locParam);
  const [compensationType, setCompensationType] = useState<string>(compParam);
  const [verificationStatus, setVerificationStatus] = useState<string>(verParam);
  const [openOnly, setOpenOnly] = useState<boolean>(openParam);

  // Available tags & counts
  const [availableTags, setAvailableTags] = useState<TagRead[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data
  const [items, setItems] = useState<OpportunityListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const limit = 12;

  // If the backend is waking up (free-tier cold start) tell the user instead of a silent skeleton.
  useEffect(() => {
    if (!loading) {
      setSlowLoad(false);
      return;
    }
    const t = setTimeout(() => setSlowLoad(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  // Load available tags
  useEffect(() => {
    api
      .getTags()
      .then((tags) => setAvailableTags(tags))
      .catch((err) => console.error("Failed to load tags:", err));
  }, []);

  // Fetch opportunities whenever query params change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {
      limit,
      offset: (pageParam - 1) * limit,
      sort: sortParam,
    };

    if (qParam) params.q = qParam;
    if (fixedType) {
      params.type = [fixedType];
    } else {
      const types = searchParams.getAll("type");
      if (types.length > 0) params.type = types;
    }
    const tags = searchParams.getAll("tag");
    if (tags.length > 0) params.tag = tags;
    if (locParam) params.location_type = locParam;
    if (compParam) params.compensation_type = compParam;
    if (verParam) params.verification_status = verParam;
    if (openParam) params.open_only = true;

    api
      .listOpportunities(params)
      .then((res) => {
        if (!cancelled) {
          setItems(res.items || []);
          setTotal(res.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Failed to load opportunities.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    qParam,
    sortParam,
    pageParam,
    locParam,
    compParam,
    verParam,
    openParam,
    fixedType,
    reloadTick,
  ]);

  // Sync to URL
  const applyFilters = (newParams: Record<string, any>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      sp.delete(k);
      if (v !== undefined && v !== null && v !== "") {
        if (Array.isArray(v)) {
          v.forEach((val) => sp.append(k, val));
        } else {
          sp.set(k, String(v));
        }
      }
    });
    // Reset to page 1 on filter changes unless explicitly paging
    if (!newParams.page) {
      sp.set("page", "1");
    }
    startTransition(() => {
      router.push(`?${sp.toString()}`, { scroll: false });
    });
  };

  // Debounced search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q });
  };

  const handleTypeToggle = (t: string) => {
    if (fixedType) return;
    const next = selectedTypes.includes(t)
      ? selectedTypes.filter((x) => x !== t)
      : [...selectedTypes, t];
    setSelectedTypes(next);
    applyFilters({ type: next });
  };

  const handleTagToggle = (slug: string) => {
    const next = selectedTags.includes(slug)
      ? selectedTags.filter((x) => x !== slug)
      : [...selectedTags, slug];
    setSelectedTags(next);
    applyFilters({ tag: next });
  };

  const handleReset = () => {
    setQ("");
    setSelectedTypes(fixedType ? [fixedType] : []);
    setSelectedTags([]);
    setLocationType("");
    setCompensationType("");
    setVerificationStatus("");
    setOpenOnly(false);
    setSort("deadline");
    const sp = new URLSearchParams();
    if (fixedType) sp.set("type", fixedType);
    startTransition(() => {
      router.push(`?${sp.toString()}`, { scroll: false });
    });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-[#17172B] dark:text-white tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[#424C63] dark:text-slate-400 max-w-2xl">{subtitle}</p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, tech, company..."
              aria-label="Search opportunities by title, tech, or company"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-[#17172B] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm dark:shadow-none"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  applyFilters({ q: "" });
                }}
                aria-label="Clear search query"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Main Layout: Filter Drawer / Sidebar + Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex flex-wrap items-center justify-between gap-2 pb-2">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm font-medium text-[#17172B] dark:text-slate-200 shadow-sm dark:shadow-none"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {selectedTypes.length + selectedTags.length > 0 && `(${selectedTypes.length + selectedTags.length})`}
          </button>

          {/* Sort for mobile */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              applyFilters({ sort: e.target.value });
            }}
            aria-label="Sort opportunities"
            className="min-h-[44px] flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-[#17172B] dark:text-slate-200 focus:outline-none shadow-sm dark:shadow-none"
          >
            <option value="deadline">Soonest Deadline</option>
            <option value="newest">Recently Published</option>
            <option value="trust_score">Highest Trust Score</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Sidebar (Desktop) / Mobile Drawer */}
        <aside
          className={`lg:block ${
            mobileFilterOpen ? "block" : "hidden"
          } space-y-6 lg:border-r lg:border-slate-200 dark:lg:border-slate-800/80 lg:pr-6`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#17172B] dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#7552D9] dark:text-brand-400" />
              Filter Postings
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-[#647084] hover:text-[#7552D9] dark:text-slate-400 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          </div>

          {/* Open Only Switch */}
          <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none">
            <span className="text-xs font-semibold text-[#17172B] dark:text-slate-200">
              Open &amp; Active Only
            </span>
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => {
                setOpenOnly(e.target.checked);
                applyFilters({ open_only: e.target.checked });
              }}
              aria-label="Filter open and active opportunities only"
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-500 focus:ring-brand-500"
            />
          </div>

          {/* Type Filter (hidden if fixedType is set) */}
          {!fixedType && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#59647A] dark:text-slate-400">
                Opportunity Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((t) => {
                  const active = selectedTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeToggle(t)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        active
                          ? "bg-violet-100 text-[#7552D9] border-violet-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700 font-semibold"
                          : "bg-white dark:bg-slate-900 text-[#424C63] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#59647A] dark:text-slate-400">
              Location Mode
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LOCATIONS.map((loc) => {
                const active = locationType === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      const next = active ? "" : loc;
                      setLocationType(next);
                      applyFilters({ location_type: next });
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
                      active
                        ? "bg-violet-100 text-[#7552D9] border-violet-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700 font-semibold"
                        : "bg-white dark:bg-slate-900 text-[#424C63] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#59647A] dark:text-slate-400">
              Compensation
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_COMPENSATIONS.map((c) => {
                const active = compensationType === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const next = active ? "" : c;
                      setCompensationType(next);
                      applyFilters({ compensation_type: next });
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
                      active
                        ? "bg-violet-100 text-[#7552D9] border-violet-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700 font-semibold"
                        : "bg-white dark:bg-slate-900 text-[#424C63] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification Status */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#59647A] dark:text-slate-400">
              Verification Badge
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["verified", "unverified", "pending"].map((v) => {
                const active = verificationStatus === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const next = active ? "" : v;
                      setVerificationStatus(next);
                      applyFilters({ verification_status: next });
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
                      active
                        ? "bg-violet-100 text-[#7552D9] border-violet-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700 font-semibold"
                        : "bg-white dark:bg-slate-900 text-[#424C63] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#424C63] dark:text-slate-400">
                Popular Tags
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => handleTagToggle(tag.slug)}
                      className={`px-2 py-0.5 rounded-md text-[11px] border transition ${
                        active
                          ? "bg-violet-100 text-[#7552D9] border-violet-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700 font-semibold"
                          : "bg-white dark:bg-slate-900/60 text-[#424C63] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700"
                      }`}
                    >
                      #{tag.name} {tag.count !== undefined && `(${tag.count})`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Catalog Content (Grid) */}
        <main className="lg:col-span-3 space-y-6">
          {/* Desktop Toolbar (Result Count & Sort) */}
          <div className="hidden lg:flex items-center justify-between text-xs text-[#647084] dark:text-slate-400">
            <span>
              Showing <strong className="text-[#17172B] dark:text-white">{items.length}</strong> of{" "}
              <strong className="text-[#17172B] dark:text-white">{total}</strong> opportunities
            </span>

            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  applyFilters({ sort: e.target.value });
                }}
                aria-label="Sort opportunities"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[#17172B] dark:text-slate-200 focus:outline-none shadow-sm dark:shadow-none"
              >
                <option value="deadline">Soonest Deadline</option>
                <option value="newest">Recently Published</option>
                <option value="trust_score">Highest Trust Score</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={() => setReloadTick((n) => n + 1)}
                className="mr-4 text-xs font-semibold text-rose-700 dark:text-rose-300 underline"
              >
                Retry
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-rose-600 dark:text-rose-400 underline hover:text-rose-900 dark:hover:text-white"
              >
                Clear filters and retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && slowLoad && (
            <p className="text-center text-sm text-[#647084] dark:text-slate-400">
              Waking up the server — the first load can take a few seconds…
            </p>
          )}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-2xl bg-white/60 dark:bg-slate-900/50 animate-pulse border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
          ) : items.length > 0 ? (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-16 rounded-2xl bg-white/80 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-slate-800 text-[#7552D9] dark:text-slate-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17172B] dark:text-white">
                  No matching opportunities found
                </h3>
                <p className="text-xs text-[#647084] dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Try adjusting your keywords, expanding your filter tags, or clearing specific constraints.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-[#17172B] dark:text-white transition"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center gap-2">
              <button
                disabled={pageParam <= 1}
                onClick={() => applyFilters({ page: pageParam - 1 })}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#424C63] dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs text-[#647084] dark:text-slate-400 px-3">
                Page <strong className="text-[#17172B] dark:text-white">{pageParam}</strong> of{" "}
                <strong className="text-[#17172B] dark:text-white">{totalPages}</strong>
              </span>

              <button
                disabled={pageParam >= totalPages}
                onClick={() => applyFilters({ page: pageParam + 1 })}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#424C63] dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
