import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  },
  twitter: {
    title: SITE_NAME,
    description: SITE_TAGLINE
  }
};

export default function HomePage() {
  return <LandingPage />;
}
