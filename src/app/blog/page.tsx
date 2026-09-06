import { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Scale,
  FileText,
  ShoppingBag,
  Wifi,
  Wrench,
  CheckCircle2,
} from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getfixflow.vercel.app";

export const metadata: Metadata = {
  title: "Consumer Rights & Dispute Resolution Blog | FixFlow",
  description:
    "Authoritative guides, statutory notice templates, and step-by-step consumer court escalation playbooks under the Consumer Protection Act, 2019.",
  keywords: [
    "consumer rights blog india",
    "consumer court notice format",
    "edaakhil filing guide",
    "nch 1915 procedure",
    "flipkart refund delay consumer complaint",
    "airtel broadband outage compensation",
    "consumer protection act 2019 guides",
  ],
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/blog`,
    title: "Consumer Rights & Dispute Resolution Blog | FixFlow",
    description:
      "Actionable legal guides, statutory notice templates, and step-by-step consumer court escalation playbooks for Indian citizens.",
    siteName: "FixFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "Consumer Rights & Dispute Resolution Blog | FixFlow",
    description:
      "Actionable legal guides and consumer dispute escalation playbooks for India.",
  },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Consumer Law": <Scale className="h-3.5 w-3.5" />,
  "E-Commerce": <ShoppingBag className="h-3.5 w-3.5" />,
  "Telecom": <Wifi className="h-3.5 w-3.5" />,
  "Warranty & Tech": <Wrench className="h-3.5 w-3.5" />,
  "Legal Notices": <FileText className="h-3.5 w-3.5" />,
};

export default function BlogIndexPage() {
  const featuredPost = BLOG_POSTS[0];
  const regularPosts = BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Header */}
      <section className="border-b border-slate-200/80 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Official Consumer Advocacy & Legal Playbooks</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Consumer Rights & Legal Grievance Knowledge Base
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
            Statutory rights, step-by-step escalation ladders for NCH 1915 and e-Daakhil, and copy-paste legal notice formats under the Consumer Protection Act, 2019.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Featured Article Hero */}
        {featuredPost && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xs hover:border-indigo-300 transition group">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {CATEGORY_ICONS[featuredPost.category]}
                <span>{featuredPost.category}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{featuredPost.readTime}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{new Date(featuredPost.datePublished).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </span>
            </div>

            <Link href={`/blog/${featuredPost.slug}`} className="block space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                {featuredPost.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                {featuredPost.description}
              </p>
            </Link>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
              <div className="text-xs font-medium text-slate-500">
                By <span className="font-semibold text-slate-800">{featuredPost.author}</span>
              </div>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition"
              >
                <span>Read Complete Guide</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-600" />
            <span>Essential Consumer Guides & Notice Templates</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {regularPosts.map((post) => (
              <div
                key={post.slug}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-sm transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      {CATEGORY_ICONS[post.category]}
                      <span>{post.category}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>

                  <Link href={`/blog/${post.slug}`} className="block space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </Link>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(post.datePublished).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Converting CTA Banner */}
        <div className="rounded-3xl bg-linear-to-br from-indigo-900 via-slate-900 to-slate-950 p-7 sm:p-10 text-white shadow-md relative overflow-hidden space-y-5">
          <div className="relative z-10 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Free Consumer Rights Platform</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Facing an Unresolved Dispute Right Now?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Don't lose track of promises, emails, or statutory deadlines. Use FixFlow to organize your evidence, generate formal notices, and prepare for NCH 1915 or e-Daakhil filing.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-slate-100 transition shadow-sm"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/15 transition"
            >
              <span>Explore Demo Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
