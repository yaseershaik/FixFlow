import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getfixflow.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/*",
          "/about",
          "/contact",
          "/help",
          "/consumer-rights",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/dashboard",
          "/issues",
          "/settings",
          "/search",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
