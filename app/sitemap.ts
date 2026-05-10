import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const now = new Date();

  return [
    {
      url: `${origin}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${origin}/create`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${origin}/help`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${origin}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${origin}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    }
  ];
}
