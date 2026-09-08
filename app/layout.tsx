import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/AppShell";
import { profile } from "@/lib/data/profile";
import { site, siteUrl } from "@/lib/data/site";
import "./globals.css";

/**
 * Fonts are self-hosted and subset by next/font, so there is no third-party
 * request and no layout shift on swap. ScrollTrigger is refreshed once
 * document.fonts.ready resolves — see ScrollProvider.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
  // Preloaded, because it now IS above the fold: the hero's second statement
  // line is set in it. The previous reasoning — that this face might never
  // appear on first screen — held only while nothing used it at all, and a
  // swap on the largest line in the hero is worse than the preload it saves.
  preload: true,
});

export const metadata: Metadata = {
  /**
   * metadataBase makes every relative URL below resolve to an absolute one,
   * which Open Graph and Twitter both require. Without it Next warns at
   * build time and social scrapers get relative paths they cannot fetch.
   */
  metadataBase: new URL(siteUrl),

  title: {
    default: site.title,
    template: `%s — ${profile.name}`,
  },
  description: site.description,

  applicationName: profile.name,
  authors: [{ name: profile.name }],
  creator: profile.name,
  publisher: profile.name,

  /**
   * Deliberately restrained. These describe the disciplines the site
   * actually covers — no seniority, no achievements, no stuffing.
   */
  keywords: [
    "creative developer",
    "software development",
    "3D",
    "VFX",
    "XR",
    "AI",
    "data",
    "graphic design",
    "UI/UX",
    "cybersecurity",
  ],

  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.name,
    title: site.title,
    description: site.description,
    locale: site.locale,
  },

  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Prevents iOS Safari from linkifying the email address into a control
  // that fights the real mailto link in Hire Me.
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom — it is an accessibility affordance, not a
  // layout inconvenience.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
