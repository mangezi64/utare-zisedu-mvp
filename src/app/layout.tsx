import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ViewModeProvider } from "@/lib/view-mode-context";
import AudioExplainer from "@/components/AudioExplainer";
import AccessibilityControls from "@/components/AccessibilityControls";
import FlowVideoWalkthrough from "@/components/FlowVideoWalkthrough";
import AssistiveToolbar from "@/components/AssistiveToolbar";
import JourneyFaqStrip from "@/components/JourneyFaqStrip";

export const metadata: Metadata = {
  title: "UTARE ZEM AI — Economic Mobility & Remote Bridge",
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
      <body className="min-h-screen flex flex-col antialiased">
        {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>

        <ViewModeProvider>
          <Navbar />
          <AssistiveToolbar variant="top" />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <JourneyFaqStrip />
          <footer className="footer no-print">
            <div className="footer-top">
              <Link
                href="/"
                className="brand brand-light"
                aria-label="UTARE ZEM AI overview"
              >
                <span className="brand-mark">U</span>
                <span>
                  <b>UTARE</b> ZEM AI
                  <small>Zimbabwe Economic Mobility &amp; Remote Bridge</small>
                </span>
              </Link>
              <p>
                Connecting Zimbabwean talent with pathways to sustainable
                economic opportunity through career guidance, human coaching,
                partner innovation hubs, and verified remote work.
              </p>
              <div className="footer-right">
                <div className="footer-links">
                  <Link href="/about">About</Link>
                  <Link href="/how-it-works">How it works</Link>
                  <Link href="/opportunities">Opportunities</Link>
                  <Link href="/skills">Skills</Link>
                  <Link href="/hubs">Hubs</Link>
                  <Link href="/employers">For Employers</Link>
                  <Link href="/faq">FAQ</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/data-policy">Data Policy &amp; Privacy</Link>
                </div>
                <div className="footer-contact">
                  <a href="mailto:utarezemai@gmail.com">
                    <Mail className="h-3.5 w-3.5" />
                    <span>utarezemai@gmail.com</span>
                  </a>
                  <a href="tel:+263786113799">
                    <Phone className="h-3.5 w-3.5" />
                    <span>+263 78 611 3799</span>
                  </a>
                </div>
              </div>
            </div>
            <AssistiveToolbar variant="footer" />
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} UTARE ZEM AI</span>
              <span className="flex flex-wrap items-center gap-4">
                <Link
                  href="/faq"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Frequently Asked Questions (FAQ)
                </Link>
                <Link
                  href="/data-policy"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Data Policy &amp; Privacy (Zimbabwe Cyber &amp; Data Protection Act)
                </Link>
                <span>Zimbabwe Economic Mobility &amp; Remote Bridge</span>
              </span>
            </div>
          </footer>

          {/* Accessibility, Video Walkthrough & Assistive Tech Suite */}
          <AudioExplainer />
          <AccessibilityControls />
          <FlowVideoWalkthrough />
        </ViewModeProvider>
      </body>
    </html>
  );
}
