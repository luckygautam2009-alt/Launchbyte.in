import type { Metadata } from "next";

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://launchbyte.io").replace(/\/$/, "");
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export function buildPublicMetadata(
  title: string,
  description: string,
  canonicalPath: string,
  imageUrl?: string | null
): Metadata {
  const ogImage = imageUrl || "/brand/launchbyte-logo.png";
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | LaunchByte`,
      description,
      url: canonicalPath,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | LaunchByte`,
      description,
      images: [ogImage],
    },
  };
}

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
