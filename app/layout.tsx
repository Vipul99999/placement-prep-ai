import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getSiteOrigin, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "education",
  keywords: [
    "placement preparation",
    "interview preparation",
    "company wise placement prep",
    "tier 2 students",
    "tier 3 students",
    "frontend interview questions",
    "placement roadmap"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteOrigin,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  }
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <AuthSessionProvider>
          <ToastProvider>
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
              <SiteHeader />
            </div>
            <main id="main-content">{children}</main>
            <footer className="mx-auto mt-10 max-w-7xl px-4 pb-10 text-sm text-ink/55 sm:px-6">
              <div className="rounded-[1.5rem] bg-white/65 px-5 py-4 ring-1 ring-black/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>{SITE_NAME} builds placement prep packs for students in a safer, structured workflow.</p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/privacy" className="font-semibold text-ink/70">
                      Privacy
                    </Link>
                    <Link href="/terms" className="font-semibold text-ink/70">
                      Terms
                    </Link>
                    <Link href="/help" className="font-semibold text-ink/70">
                      Help
                    </Link>
                    <Link href="/create" className="font-semibold text-ink/70">
                      Start Preparing
                    </Link>
                  </div>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/45">{SITE_TAGLINE}</p>
              </div>
            </footer>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
