import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ViewModeProvider } from "@/lib/view-mode-context";

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
        <ViewModeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-8 mt-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="text-center md:text-left">
                <span className="font-semibold text-slate-800">
                  UTARE ZISEDU AI
                </span>{" "}
                — Zimbabwe Economic Mobility & Remote Bridge
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
                <Link href="/about" className="hover:text-emerald-700">About Us</Link>
                <span>•</span>
                <Link href="/how-it-works" className="hover:text-emerald-700">How It Works</Link>
                <span>•</span>
                <Link href="/opportunities" className="hover:text-emerald-700">Opportunities</Link>
                <span>•</span>
                <Link href="/skills" className="hover:text-emerald-700">Skills Courses</Link>
                <span>•</span>
                <Link href="/employers" className="hover:text-emerald-700">For Employers</Link>
                <span>•</span>
                <Link href="/contact" className="hover:text-emerald-700">Contact</Link>
              </div>
            </div>
          </footer>
        </ViewModeProvider>
      </body>
    </html>
  );
}
