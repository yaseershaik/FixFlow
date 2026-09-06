import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FixFlow — Personal Service-Issue & Follow-up Tracker",
  description:
    "Converts messy real-world communications into structured service issues, tracks promises, and surfaces overdue follow-ups.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans bg-[#F8FAFC] text-slate-900 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] pb-24 md:pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
