import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. IMPORT TOASTER
import { Toaster } from "sonner";

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

const SITE_URL = "https://disruptivesolutionsinc.com";
const SITE_DESCRIPTION =
  "Innovative lighting and smart solutions for modern spaces.";

// --- FULLY UPDATED METADATA ---
export const metadata: Metadata = {
  // Base for resolving every relative OG/Twitter image. Without this Next.js
  // falls back to http://localhost:3000 and social cards render broken.
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Disruptive Solutions Inc.",
    template: "%s | Disruptive Solutions Inc.",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Disruptive Solutions Inc.",
  keywords: [
    "lighting solutions",
    "smart lighting",
    "LED lighting Philippines",
    "architectural lighting",
    "Disruptive Solutions Inc",
  ],
  authors: [{ name: "Disruptive Solutions Inc." }],
  creator: "Disruptive Solutions Inc.",
  alternates: { canonical: "/" },

  // --- ADDED GOOGLE VERIFICATION ---
  verification: {
    google: "YwPOzsVV68RGo2ZSrNyvFSKJZF9cNkAmmluFv-jHkHw",
  },

  // Icon Configuration
  icons: {
    icon: "/images/icon.png",
    shortcut: "/images/icon.png",
    apple: "/images/icon.png",
  },

  // OpenGraph Configuration (Para sa Facebook, LinkedIn, etc.)
  openGraph: {
    title: "Disruptive Solutions Inc.",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Disruptive Solutions Inc.",
    images: [
      {
        url: "/images/icon.png",
        width: 800,
        height: 600,
        alt: "Disruptive Solutions Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter Configuration (Para sa X/Twitter cards)
  twitter: {
    card: "summary_large_image",
    title: "Disruptive Solutions Inc.",
    description: SITE_DESCRIPTION,
    images: ["/images/icon.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. ADD TOASTER COMPONENT */}
        <Toaster position="top-center" richColors closeButton />
        {children}
      </body>
    </html>
  );
}