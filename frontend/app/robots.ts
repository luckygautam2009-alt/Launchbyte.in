import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://launchbyte.io";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/scanner/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}