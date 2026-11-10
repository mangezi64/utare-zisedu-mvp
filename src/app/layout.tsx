import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "UTARE ZISEDU AI — Economic Mobility Bridge for Zimbabwe",
  description:
    "Converting dormant Zimbabwean tertiary talent into productive global & local earners by bridging last-mile hardware, competency verification, AI upskilling, and human coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-800">
                UTARE ZISEDU AI MVP
              </span>{" "}
              — Built with Next.js, Supabase & Google Gemini AI.
            </div>
            <div className="flex flex-wrap gap-4">
              <span>Task #1-2: Intake & Diagnostic</span>
              <span>•</span>
              <span>Task #3: AI Pathway & Coach Pairing</span>
              <span>•</span>
              <span>Task #4: Partner Hub Network</span>
              <span>•</span>
              <span>Task #5: Verified Remote Jobs</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
