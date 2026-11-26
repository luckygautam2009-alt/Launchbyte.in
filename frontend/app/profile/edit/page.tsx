"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { MyProfileRead, ProfileUpdate } from "@/lib/types";
import {
  User,
  Upload,
  Globe,
  Github,
  Linkedin,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
} from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState<number | "">("");
  const [skillsInput, setSkillsInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [openToTeams, setOpenToTeams] = useState(false);
  const [lookingForRolesInput, setLookingForRolesInput] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showLinkedin, setShowLinkedin] = useState(true);
  const [showGithub, setShowGithub] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [handleUpdatedAt, setHandleUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/profile/edit");
      return;
    }
    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data: MyProfileRead = await api.getMyProfile();
      setHandle(data.handle || "");
      setAvatarUrl(data.avatar_url || null);
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setLocation(data.location || "");
      setCountryCode(data.country_code || "");
      setInstitution(data.institution || "");
      setFieldOfStudy(data.field_of_study || "");
      setGraduationYear(data.graduation_year ?? "");
      setSkillsInput(data.skills ? data.skills.join(", ") : "");
      setInterestsInput(data.interests ? data.interests.join(", ") : "");
      setOpenToTeams(Boolean(data.open_to_teams));
      setLookingForRolesInput(data.looking_for_roles ? data.looking_for_roles.join(", ") : "");
      setAvailabilityNote(data.availability_note || "");
      setIsPublic(data.is_public ?? true);
      setShowLinkedin(data.show_linkedin ?? true);
      setShowGithub(data.show_github ?? true);
      setLinkedinUrl(data.linkedin_url || "");
      setGithubUrl(data.github_url || "");
      setPortfolioUrl(data.portfolio_url || "");
      setResumeUrl(data.resume_url || "");
      setHandleUpdatedAt(data.handle_updated_at || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPEG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.uploadAvatar(file);
      const separator = res.avatar_url.includes("?") ? "&" : "?";
      const bustedUrl = `${res.avatar_url}${separator}v=${Date.now()}`;
      setAvatarUrl(bustedUrl);
      await refreshUser();
      setSuccess("Avatar updated successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const interests = interestsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const lookingForRoles = lookingForRolesInput.split(",").map((s) => s.trim()).filter(Boolean);

    const payload: ProfileUpdate = {
      handle: handle.trim() || undefined,
      headline: headline.trim() || null,
      bio: bio.trim() || null,
      location: location.trim() || null,
      country_code: countryCode.trim() || null,
      institution: institution.trim() || null,
      field_of_study: fieldOfStudy.trim() || null,
      graduation_year: graduationYear === "" ? null : Number(graduationYear),
      skills,
      interests,
      open_to_teams: openToTeams,
      looking_for_roles: lookingForRoles,
      availability_note: availabilityNote.trim() || null,
      is_public: isPublic,
      show_linkedin: showLinkedin,
      show_github: showGithub,
      linkedin_url: linkedinUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      portfolio_url: portfolioUrl.trim() || null,
      resume_url: resumeUrl.trim() || null,
    };

    try {
      const updated = await api.updateMyProfile(payload);
      setSuccess("Profile updated successfully!");
      setHandleUpdatedAt(updated.handle_updated_at || null);
    } catch (err: any) {
      setError(err?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your personal info, developer showcase, and teammate matching preferences.
            </p>
          </div>
          {handle && (
            <Link
              href={`/u/${handle}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition"
            >
              <Eye className="w-4 h-4 text-brand-400" />
              View Public Profile
            </Link>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Avatar & Handle */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-brand-400" />
              Identity & Handle
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 text-2xl font-bold">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0) || "U"
                  )}
                </div>
                <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                  <Upload className="w-5 h-5 text-white" />
                  <span className="text-[10px] text-white mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-medium text-slate-200">Profile Photo</p>
                <p className="text-xs text-slate-400">
                  PNG, JPEG, or WebP up to 2MB. Stored securely.
                </p>
                {uploadingAvatar && <p className="text-xs text-brand-400 animate-pulse">Uploading...</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username / Handle</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase())}
                    placeholder="janedoe"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Allowed: letters, numbers, underscores (3–30 chars).
                  {handleUpdatedAt && (
                    <span className="block text-amber-400/90 mt-1">
                      Last updated: {new Date(handleUpdatedAt).toLocaleDateString()}. Handle can only be changed once every 30 days.
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Full-Stack Engineer & AI Enthusiast"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <p className="text-xs text-slate-500 mt-2">A short one-line pitch shown on cards and search results.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your background, recent projects, hackathon wins, or tech interests..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Section: Teammate Discovery & Availability */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Teammate Discovery & Matching
            </h2>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-slate-200">Open to Teaming Up</span>
                <p className="text-xs text-slate-400">
                  Allow other hackers and team leads to find you in the Teammate Discovery directory.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={openToTeams}
                  onChange={(e) => setOpenToTeams(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Technical Skills</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, TypeScript, Python, PyTorch, Docker"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <p className="text-xs text-slate-500 mt-2">Comma-separated list used for smart skill matching.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Roles You Fill</label>
                <input
                  type="text"
                  value={lookingForRolesInput}
                  onChange={(e) => setLookingForRolesInput(e.target.value)}
                  placeholder="Frontend, ML Engineer, UI/UX Designer"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <p className="text-xs text-slate-500 mt-2">Roles you want to play on hackathon teams.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Availability & Hackathon Preferences</label>
              <textarea
                rows={2}
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                placeholder="Available weekends, looking for in-person teams in SF, or building AI agents..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Section: Education & Background */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-400" />
              Education & Background
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">University / College / School</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Stanford University"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Field of Study</label>
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Graduation Year</label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="2026"
                  min="1970"
                  max="2035"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location (City, State)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Links & Showcase */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-400" />
              Links & Portfolio
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Github className="w-4 h-4 text-slate-400" /> GitHub URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Linkedin className="w-4 h-4 text-slate-400" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-400" /> Portfolio Website
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://portfolio.me"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" /> Resume / CV Link
                </label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Privacy Settings */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-400" />
              Privacy & Visibility
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-sm font-medium text-slate-200">Public Profile</span>
                  <p className="text-xs text-slate-400">
                    If disabled, your profile will only be visible to you and organizers of events you join.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-sm font-medium text-slate-200">Show GitHub on Public Profile</span>
                </div>
                <input
                  type="checkbox"
                  checked={showGithub}
                  onChange={(e) => setShowGithub(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-sm font-medium text-slate-200">Show LinkedIn on Public Profile</span>
                </div>
                <input
                  type="checkbox"
                  checked={showLinkedin}
                  onChange={(e) => setShowLinkedin(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition shadow-lg shadow-brand-600/25 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
