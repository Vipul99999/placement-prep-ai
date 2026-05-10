export const SITE_NAME = "PlacementPrep AI";
export const SITE_TAGLINE = "Company-wise placement preparation in minutes.";
export const SITE_DESCRIPTION =
  "Structured placement preparation for Tier-2/3 students with company-wise questions, roadmaps, mock interviews, and downloadable prep packs.";

export function getSiteOrigin() {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (!configured) {
    return "http://127.0.0.1:3000";
  }

  try {
    return new URL(configured).origin;
  } catch {
    return "http://127.0.0.1:3000";
  }
}

