"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import OtpVerifyModal from "@/components/auth/OtpVerifyModal";
import { Plus, ArrowLeft, Users, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";

export default function CreateTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [acceptingRequests, setAcceptingRequests] = useState(true);
  const [maxSize, setMaxSize] = useState(4);
  const [skillsInput, setSkillsInput] = useState("");
  const [eventId, setEventId] = useState("");

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400 text-lg mb-4">
          You need to be logged in to create a team
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
        >
          Log in
        </Link>
      </div>
    );
  }

  async function submitTeamCreation() {
    setLoading(true);
    setError("");
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const team = await api.createTeam({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        visibility,
        accepting_requests: acceptingRequests,
        max_size: maxSize,
        looking_for_skills: skills,
        event_id: eventId.trim() || undefined,
      });
      router.push(`/teams/${team.slug}`);
    } catch (err: any) {
      if (err?.code === "EMAIL_NOT_VERIFIED" || String(err?.message || "").toLowerCase().includes("email verification required")) {
        setShowOtpModal(true);
        return;
      }
      setError(err?.message || "Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 3) {
      setError("Team name must be at least 3 characters.");
      return;
    }

    await submitTeamCreation();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </Link>

      <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
        <Plus className="w-8 h-8 text-brand-400" />
        Create a Team
      </h1>
      <p className="text-slate-400 mb-8">
        Assemble your squad for a hackathon or project
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Team Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Code Crafters"
            maxLength={100}
            required
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Slug{" "}
            <span className="text-slate-500 font-normal">(optional, auto-generated)</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="code-crafters"
            maxLength={50}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is your team working on?"
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            {description.length}/500
          </p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Visibility
          </label>
          <div className="flex gap-3">
            {(
              [
                { value: "public", icon: Eye, label: "Public" },
                { value: "unlisted", icon: EyeOff, label: "Unlisted" },
                { value: "private", icon: Lock, label: "Private" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVisibility(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                  visibility === opt.value
                    ? "bg-brand-600/20 border-brand-500 text-brand-300"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Size + Accept Requests */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Max Team Size
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={maxSize}
              onChange={(e) => setMaxSize(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-brand-500 focus:outline-none transition"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={acceptingRequests}
                onChange={(e) => setAcceptingRequests(e.target.checked)}
                className="accent-brand-500"
              />
              Accept join requests
            </label>
          </div>
        </div>

        {/* Looking for Skills */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Looking for Skills
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="React, Python, UI/UX (comma-separated)"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
          />
        </div>

        {/* Event ID (optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Event ID{" "}
            <span className="text-slate-500 font-normal">(optional — for event-scoped teams)</span>
          </label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Paste event UUID if creating a team for a specific event"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md shadow-brand-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Team"}
        </button>
      </form>

      <OtpVerifyModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={submitTeamCreation}
        title="Verify your email to create a team"
      />
    </div>
  );
}
