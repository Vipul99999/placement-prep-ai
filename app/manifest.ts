import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "PlacementPrep",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f2",
    theme_color: "#f97316",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ],
    categories: ["education", "productivity"],
    lang: "en",
    orientation: "portrait",
    shortcuts: [
      {
        name: "Create Prep Pack",
        short_name: "Create",
        description: SITE_TAGLINE,
        url: "/create"
      },
      {
        name: "Open Dashboard",
        short_name: "Dashboard",
        description: "Review saved prep packs and progress.",
        url: "/dashboard"
      }
    ]
  };
}

