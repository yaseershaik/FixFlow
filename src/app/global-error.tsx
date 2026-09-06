"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-900 flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 font-bold text-xl">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Application Error</h1>
            <p className="text-sm text-slate-500">
              A critical error occurred. Please refresh or try again.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Refresh FixFlow
          </button>
        </div>
      </body>
    </html>
  );
}
