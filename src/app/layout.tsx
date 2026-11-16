import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ViewModeProvider } from "@/lib/view-mode-context";

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
        <ViewModeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
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
              <div className="footer-links">
                <Link href="/about">About</Link>
                <Link href="/how-it-works">How it works</Link>
                <Link href="/opportunities">Opportunities</Link>
                <Link href="/skills">Skills</Link>
                <Link href="/hubs">Hubs</Link>
                <Link href="/employers">For Employers</Link>
                <Link href="/contact">Contact</Link>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} UTARE ZEM AI</span>
              <span>Zimbabwe Economic Mobility &amp; Remote Bridge</span>
            </div>
          </footer>
        </ViewModeProvider>
      </body>
    </html>
  );
}
