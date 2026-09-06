import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  BLOG_POSTS,
} from "@/lib/blog-data";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Scale,
  CheckCircle2,
  FileText,
  Copy,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Share2,
} from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getfixflow.vercel.app";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return { title: "Article Not Found | FixFlow" };

  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | FixFlow`,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.title,
      description: post.description,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [post.author],
      section: post.category,
      tags: post.keywords,
      siteName: "FixFlow",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  // 1. Article / BlogPosting Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: post.author,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "FixFlow",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon-512.png`,
      },
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: post.keywords.join(", "),
    articleSection: post.category,
  };

  // 2. Google FAQPage Rich Snippet Schema (Critical for Position #0 Google Rankings)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  // 3. BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Injected Rich Snippet Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Top Breadcrumbs */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Knowledge Base</span>
          </Link>
          <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
            {post.category}
          </span>
        </div>
      </div>

      {/* Article Header */}
      <header className="bg-white border-b border-slate-200/80 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 font-bold text-indigo-700">
              {post.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{post.readTime}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Updated:{" "}
                {new Date(post.dateModified).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {post.headline}
          </p>

          <div className="pt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-600" />
            <span>Authored by {post.author}</span>
          </div>
        </div>
      </header>

      {/* Article Body */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Key Takeaways Card */}
        {post.summary && post.summary.length > 0 && (
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 sm:p-7 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Key Legal Takeaways for Consumers</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-indigo-950">
              {post.summary.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Sections */}
        <article className="space-y-8 text-slate-800 leading-relaxed text-sm sm:text-base">
          {post.sections.map((section, idx) => (
            <section key={idx} className="space-y-3.5 rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5">
                {section.title}
              </h2>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>

              {/* Notice / Letter Template Box */}
              {section.template && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-slate-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Formal Statutory Notice Draft</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Ready to copy & customize</span>
                  </div>
                  <pre className="font-mono text-xs overflow-x-auto p-2 text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {section.template}
                  </pre>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Google FAQPage Accordion Section */}
        {post.faqs && post.faqs.length > 0 && (
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Frequently Asked Legal Questions (FAQs)
              </h2>
            </div>

            <div className="space-y-4">
              {post.faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-2"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                    <span className="text-indigo-600 font-extrabold font-mono">Q.</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Direct Funnel CTA */}
        <div className="rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-7 sm:p-9 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              <span>Track Your Case on FixFlow</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Start Tracking Your Dispute Right Now
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Log phone calls, save technician promises, calculate statutory deadlines under CPA 2019, and generate formal legal notices for free.
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2.5 w-full sm:w-auto">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-slate-100 transition shadow-sm text-center"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition text-center"
            >
              <span>Explore Demo Account</span>
            </Link>
          </div>
        </div>

        {/* Related Guides */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Related Consumer Rights Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rPost) => (
                <Link
                  key={rPost.slug}
                  href={`/blog/${rPost.slug}`}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-indigo-300 transition block space-y-1 group"
                >
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {rPost.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                    {rPost.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {rPost.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
