import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { CheckCircle2, PhoneCall, ExternalLink, ShieldCheck, Scale } from "lucide-react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getfixflow.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FixFlow — Consumer Grievance & Dispute Tracker",
    template: "%s | FixFlow",
  },
  description:
    "Organize service complaints, track promises, calculate statutory deadlines under the Consumer Protection Act 2019, and generate legal notices for NCH 1915 & e-Daakhil.",
  keywords: [
    "consumer rights",
    "complaint tracker",
    "consumer forum India",
    "NCH 1915",
    "e-Daakhil",
    "Consumer Protection Act 2019",
    "legal escalation letter",
    "statutory deadline tracker",
  ],
  authors: [{ name: "FixFlow Team" }],
  creator: "FixFlow",
  applicationName: "FixFlow",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: "FixFlow — Consumer Grievance & Dispute Tracker",
    description:
      "Empowering Indian consumers to hold service providers accountable with structured dispute timelines, statutory notice drafts, and NCH/e-Daakhil escalation assistance.",
    siteName: "FixFlow",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "FixFlow Consumer Rights Tracker",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "FixFlow — Consumer Grievance & Dispute Tracker",
    description:
      "Empowering Indian consumers with structured dispute timelines and statutory notice drafts.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4F46E5",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FixFlow",
  url: siteUrl,
  description:
    "Organize consumer complaints, track statutory deadlines under the Consumer Protection Act 2019, and generate formal legal notices.",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#F8FAFC] text-slate-900 antialiased min-h-screen selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
        <AuthProvider>
          <div>
            <Navbar />
            <main className="min-h-[calc(100vh-8rem)] pb-24 sm:pb-12">
              {children}
            </main>
          </div>

        {/* Global Consumer Protection Footer - Multi-device responsive */}
        <footer className="border-t border-slate-200/90 bg-white text-slate-600 print:hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-32 sm:pb-12">
            {/* Top Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
              
              {/* Brand & Statutory Assistance Card (Full width on mobile, 6 cols on md tablet, 5 cols on lg) */}
              <div className="md:col-span-6 lg:col-span-5 space-y-4">
                <Link href="/" className="inline-flex items-center gap-2.5 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs group-hover:bg-slate-800 transition">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                      FixFlow
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 tracking-wide block">
                      Consumer Grievance & Timeline Tracker
                    </span>
                  </div>
                </Link>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">
                  Independent dispute resolution organizer built for Indian consumers under the Consumer Protection Act, 2019. Track grievance timelines, monitor statutory deadlines, and draft legal notices.
                </p>

                {/* National Consumer Helpline Card - Mobile & Tablet Optimized */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50/70 p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          National Consumer Helpline
                        </span>
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Toll-Free 1915
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Dept. of Consumer Affairs official helpline (9:30 AM – 5:30 PM, Mon–Sat).
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href="tel:1915"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition min-h-[36px]"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span>Tap to Call 1915</span>
                        </a>
                        <a
                          href="https://edaakhil.nic.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition min-h-[36px]"
                        >
                          <span>e-Daakhil</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Columns (2 Columns on Mobile, Tablet & Desktop) */}
              <div className="md:col-span-6 lg:col-span-7 grid grid-cols-2 gap-6 sm:gap-8 lg:pl-6">
                
                {/* Column 1: Consumer Resources */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Consumer Rights</span>
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/consumer-rights"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        Consumer Rights Guide
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        Blog & Guides
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/help"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        Help & FAQs
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/about"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        About FixFlow
                      </Link>
                    </li>
                    <li>
                      <a
                        href="https://consumerhelpline.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition py-1 min-h-[36px]"
                      >
                        <span>NCH Portal</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Legal & Support */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Legal & Privacy</span>
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/contact"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        Support & Contact
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/privacy"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terms"
                        className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-600 font-medium transition py-1 min-h-[36px]"
                      >
                        Terms of Service
                      </Link>
                    </li>
                    <li className="pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium border border-emerald-100">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Private & Secure</span>
                      </span>
                    </li>
                  </ul>
                </div>

              </div>

            </div>

            {/* Bottom Section: Badges & Statutory Disclaimer */}
            <div className="mt-8 sm:mt-10 border-t border-slate-200/70 pt-6 space-y-3">
              {/* Badges and Copyright */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Consumer Protection Act 2019
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    National Consumer Helpline 1915
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    e-Daakhil Filing Support
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  © {new Date().getFullYear()} FixFlow. Built for Indian consumers.
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-500">Statutory Notice:</span> FixFlow is an independent grievance tracking utility and is not an official portal of the National Consumer Disputes Redressal Commission (NCDRC) or state consumer commissions. To initiate formal court litigation or statutory dispute redressal, file with NCH (Dial 1915) or e-Daakhil (edaakhil.nic.in).
              </p>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
