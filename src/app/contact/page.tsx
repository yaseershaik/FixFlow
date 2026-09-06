"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2, ShieldAlert, Phone, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("support");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Offline simulated submission with local acknowledgment
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Get in Touch
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Have questions about tracking a complaint, need technical assistance, or want to suggest a new company workflow?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="space-y-4 md:col-span-1">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mail className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Developer & Support</h2>
            <p className="text-xs text-slate-500">For platform questions and bug reports:</p>
            <span className="text-xs font-semibold text-slate-800 font-mono block">support@fixflow.app</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Phone className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Consumer Helpline</h2>
            <p className="text-xs text-slate-500">Government assistance for disputes:</p>
            <span className="text-xs font-semibold text-slate-800 font-mono block">Toll-free: 1915</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Self-Help Guides</h2>
            <p className="text-xs text-slate-500">Read our guides on filing complaints:</p>
            <Link href="/help" className="text-xs font-semibold text-indigo-600 hover:underline block">
              Visit Knowledge Center →
            </Link>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Message Received!</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Thank you for reaching out, {name || "there"}. Your message has been logged and our team will review it.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                  setSubject("");
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden min-h-[42px]"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-category" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Inquiry Topic
                </label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-hidden min-h-[42px]"
                >
                  <option value="support">Help with a Complaint</option>
                  <option value="bug">Report a Bug / Glitch</option>
                  <option value="feature">Suggest a Feature</option>
                  <option value="legal">Legal & Compliance Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about e-Daakhil export format"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden min-h-[42px]"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your query or feedback in detail..."
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs min-h-[44px]"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
