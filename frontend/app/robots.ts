import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://launchbyte.io").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/scanner",
          "/scanner/",
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/me",
          "/me/",
          "/messages",
          "/messages/",
          "/profile/edit",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/saved",
          "/passes",
          "/contributor",
          "/contributor/",
          "/network",
          "/teams/new",
          "/projects/new",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
