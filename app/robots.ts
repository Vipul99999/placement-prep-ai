import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/create", "/help", "/privacy", "/terms"],
      disallow: ["/account", "/admin", "/api", "/dashboard", "/prep", "/login", "/signup"]
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin
  };
}
