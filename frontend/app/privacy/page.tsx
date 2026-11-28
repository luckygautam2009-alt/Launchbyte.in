import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";
import { SITE_CONTENT } from "@/lib/siteContent";

export const metadata: Metadata = buildPublicMetadata(
  "Privacy Policy",
  "How LaunchByte collects, uses and protects your information.",
  "/privacy"
);

export default function PrivacyPage() {
  const email = SITE_CONTENT.socials.email;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17172B] dark:text-white">Privacy Policy</h1>
      <p className="mt-2 text-xs text-[#59647A] dark:text-slate-400">Last updated: 28 November 2026</p>
      <div className="mt-10 space-y-8">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">What we collect</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">When you sign up we collect your name, email address and password (stored only as a one-way hash). You can add optional profile details such as a handle, headline, institution, skills, interests and a profile photo. If you use the platform we also store what you do on it: event registrations, saved opportunities, teams, connections, projects and messages you send in chats.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">How we use it</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">We use your information to run your account, show you opportunities and events, let you form teams and connect with other members, send account emails (such as verification codes, event updates and review notifications) and keep the platform safe. We do not sell your personal information.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Who can see what</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">Your public profile details (name, handle, headline, skills and similar) can be seen by other signed-in members. Your email address is not shown to other members. Chat messages are visible only to the people in that conversation.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Services we rely on</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">We use third-party providers to operate LaunchByte: hosting (Vercel and Render), a database and file storage (Supabase) and an email delivery service (Brevo). They process data on our behalf to provide the service.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Cookies and local storage</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">We use a sign-in token stored in your browser (cookie and local storage) to keep you logged in, and a local setting to remember your theme and that you have seen the intro animation. We do not use these for advertising.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Your choices</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">You can edit your profile at any time. To ask for a copy of your data or to have your account and data deleted, email us at the address below and we will respond as soon as we can.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Changes</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">If we change this policy we will update the date above. Continuing to use LaunchByte after a change means you accept the updated policy.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Contact</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">
            Questions or requests? Write to{" "}
            <a href={`mailto:${email}`} className="underline text-[#7552D9] dark:text-indigo-300">{email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
