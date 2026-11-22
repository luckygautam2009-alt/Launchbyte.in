import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CommandPalette } from "@/components/ui/CommandPalette";

export const metadata: Metadata = {
  title: "LaunchByte — The High-Trust Platform for Hackathons & Opportunities",
  description:
    "Discover verified hackathons, fellowships, workshops, and internships with complete transparency, verified trust scores, and algorithmic teammate matching.",
  keywords: [
    "hackathons",
    "internships",
    "fellowships",
    "developer opportunities",
    "teammates",
    "coding challenges",
  ],
  authors: [{ name: "LaunchByte Team" }],
  openGraph: {
    title: "LaunchByte — The High-Trust Platform for Hackathons & Opportunities",
    description:
      "Beat legacy portals on trust, speed of hosting events, and teammate discovery.",
    url: "https://launchbyte.io",
    siteName: "LaunchByte",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchByte — The High-Trust Platform for Hackathons & Opportunities",
    description:
      "Beat legacy portals on trust, speed of hosting events, and teammate discovery.",
  },
};

export const viewport: Viewport = {
  themeColor: "#060a14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-brand-500 selection:text-white pb-16 md:pb-0">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <MobileBottomNav />
            <CommandPalette />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
