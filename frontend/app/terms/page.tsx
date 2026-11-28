import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";
import { SITE_CONTENT } from "@/lib/siteContent";

export const metadata: Metadata = buildPublicMetadata(
  "Terms of Use",
  "The rules for using LaunchByte.",
  "/terms"
);

export default function TermsPage() {
  const email = SITE_CONTENT.socials.email;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17172B] dark:text-white">Terms of Use</h1>
      <p className="mt-2 text-xs text-[#59647A] dark:text-slate-400">Last updated: 28 November 2026</p>
      <div className="mt-10 space-y-8">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Using LaunchByte</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">LaunchByte helps students and builders discover hackathons, internships and events, form teams and connect with each other. By creating an account you confirm the information you give is accurate and that you will keep your login details private.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Your conduct</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">Be respectful. Do not post unlawful, hateful, harassing, misleading or spam content, do not impersonate others, do not upload files you do not have the right to share, and do not try to break, scrape or overload the service or access other people’s accounts.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Your content</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">You keep ownership of what you post (profile details, projects, messages, images). You give LaunchByte permission to store and display it as needed to run the service. You are responsible for what you share.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Opportunities and events</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">Listings are provided for information. We try to verify them, but we cannot guarantee any opportunity, prize, selection or outcome, and registration or applications are subject to the organiser’s own rules. Please check the official details before you commit.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Moderation and accounts</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">We may remove content or suspend accounts that break these terms or put others at risk. You can stop using LaunchByte at any time and may ask us to delete your account.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Availability and liability</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">We work to keep LaunchByte running smoothly, but the service is provided as is and may change or be unavailable at times. To the extent the law allows, LaunchByte is not liable for indirect or consequential losses arising from your use of the service.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#17172B] dark:text-white">Changes</h2>
          <p className="text-sm leading-relaxed text-[#424C63] dark:text-slate-300">We may update these terms. If we do, we will update the date above; continuing to use LaunchByte means you accept the new terms.</p>
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
