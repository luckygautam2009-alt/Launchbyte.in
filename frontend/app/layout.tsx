import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import GlobalCosmicParticles from "@/components/GlobalCosmicParticles";
import { WarmBackend } from "@/components/WarmBackend";
import { LAUNCHBYTE_SOCIALS } from "@/lib/siteContent";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://launchbyte.io").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "LaunchByte — Verified Hackathons, Internships & Fellowships",
    template: "%s | LaunchByte",
  },
  description:
    "Discover verified hackathons, fellowships, workshops, and internships with complete transparency, verified trust scores, and teammate discovery.",
  keywords: [
    "hackathons",
    "internships",
    "fellowships",
    "developer opportunities",
    "teammates",
    "coding challenges",
    "LaunchByte",
  ],
  authors: [{ name: "LaunchByte Team" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "LaunchByte — Verified Hackathons, Internships & Fellowships",
    description:
      "Discover verified hackathons, fellowships, workshops, and internships with complete transparency, verified organizer trust, and teammate discovery.",
    url: appUrl,
    siteName: "LaunchByte",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/brand/launchbyte-logo.png",
        width: 1024,
        height: 1024,
        alt: "LaunchByte — The High-Trust Platform for Hackathons & Opportunities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchByte — Verified Hackathons, Internships & Fellowships",
    description:
      "Discover verified hackathons, fellowships, workshops, and internships with complete transparency and teammate discovery.",
    images: ["/brand/launchbyte-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#060a14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LaunchByte",
  url: appUrl,
  logo: `${appUrl}/brand/launchbyte-logo.png`,
  email: LAUNCHBYTE_SOCIALS.email,
  sameAs: [LAUNCHBYTE_SOCIALS.linkedin, LAUNCHBYTE_SOCIALS.instagram].filter(Boolean),
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LaunchByte",
  url: appUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${appUrl}/opportunities?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050510] text-slate-100 flex flex-col min-h-screen min-h-[100dvh] antialiased selection:bg-brand-500 selection:text-white pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c"),
          }}
        />
        <AuthProvider>
          <WarmBackend />
          <ToastProvider>
            {/* Global animated particles from top to bottom across the entire page */}
            <GlobalCosmicParticles />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
            <Footer />
            <MobileBottomNav />
            <CommandPalette />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
