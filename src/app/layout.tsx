import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
