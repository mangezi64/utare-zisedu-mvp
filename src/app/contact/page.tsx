"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    inquiryType: "Candidate Support",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          inquiryType: "Candidate Support",
          message: "",
        });
      } else {
        setErrorMessage(
          data.error || "Unable to submit your message. Please try again."
        );
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Faith & Amanda's Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">CONTACT UTARE</span>
        <h1>Let&apos;s start a conversation.</h1>
        <p>
          Reach out about the platform, an employer or innovation hub
          partnership, or how to take your next step on the UTARE economic
          mobility bridge.
        </p>
      </section>

      {/* Contact Grid */}
      <section className="content-section contact-grid">
        <div className="contact-info">
          <div className="section-heading">
            <span className="eyebrow">GET IN TOUCH</span>
            <h2>We&apos;d like to hear from you</h2>
            <p>
              Zimbabwe · Regional Innovation Hub Network &amp; Ecosystem
              Coordination
            </p>
          </div>

          <div className="contact-detail">
            <span className="icon-tile">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <b>Harare Flagship Node</b>
              <span>142 Kwame Nkrumah Ave, Avenues, Harare</span>
            </div>
          </div>

          <div className="contact-detail">
            <span className="icon-tile">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <b>Bulawayo &amp; Mutare Regional Nodes</b>
              <span>
                88 Fife St, Bulawayo · 24 Herbert Chitepo St, Mutare
              </span>
            </div>
          </div>

          <div className="contact-detail">
            <span className="icon-tile">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <b>Phone &amp; WhatsApp Support</b>
              <span>
                <a
                  href="tel:+263786113799"
                  className="hover:text-[#08785f] underline-offset-2 hover:underline"
                >
                  +263 78 611 3799
                </a>{" "}
                · Mon–Fri, 08:00–17:00 CAT
              </span>
            </div>
          </div>

          <div className="contact-detail">
            <span className="icon-tile">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <b>Email</b>
              <span>
                <a
                  href="mailto:utarezemai@gmail.com"
                  className="hover:text-[#08785f] underline-offset-2 hover:underline"
                >
                  utarezemai@gmail.com
                </a>
              </span>
            </div>
          </div>

          <div className="contact-detail">
            <span className="icon-tile">
              <HelpCircle className="h-5 w-5" />
            </span>
            <div>
              <b>Frequently Asked Questions</b>
              <span>
                Instant answers on login, passwords, hubs, CV Studio, scam
                reporting, and data privacy:{" "}
                <Link
                  href="/faq"
                  className="font-semibold text-[#08785f] underline underline-offset-2"
                >
                  Browse the FAQ Help Center →
                </Link>
              </span>
            </div>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="form-card">
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f5ef] text-[#08785f]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3
                className="text-lg font-bold"
                style={{ color: "var(--navy)", fontFamily: "var(--heading)" }}
              >
                Thank you for getting in touch!
              </h3>
              <p className="text-xs text-[#667085] max-w-sm mx-auto leading-relaxed">
                Your message has been saved to our PostgreSQL database. An
                ecosystem coordinator will reply within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="button button-green"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-stack">
              <span className="eyebrow">DIRECT ENQUIRY FORM</span>

              {errorMessage && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
                  ✕ {errorMessage}
                </div>
              )}

              <label className="field">
                <span>Your name *</span>
                <input
                  type="text"
                  required
                  placeholder="Full name (e.g. Tendai Moyo)"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </label>

              <label className="field">
                <span>Email address *</span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span>What would you like to discuss?</span>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) =>
                      setFormData({ ...formData, inquiryType: e.target.value })
                    }
                  >
                    <option value="Candidate Support">
                      Career support &amp; intake
                    </option>
                    <option value="Safety / Scam Report">
                      Safety concern / scam report (Stewart Mangezi)
                    </option>
                    <option value="AI Decision / Appeal Review">
                      AI decision appeal / human review (Bheki Ndlovu)
                    </option>
                    <option value="Data Erasure / Privacy Request">
                      Data privacy / special-circumstance erasure (Stewart Mangezi)
                    </option>
                    <option value="Employer Hiring">
                      Employer partnership
                    </option>
                    <option value="Partner Hub Onboarding">
                      Innovation hub partnership
                    </option>
                    <option value="Industry Mentor">
                      Mentor / coaching application
                    </option>
                    <option value="General">General enquiry</option>
                  </select>
                </label>

                <label className="field">
                  <span>Subject</span>
                  <input
                    type="text"
                    placeholder="e.g. Hub partnership in Gweru"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Message *</span>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your message..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </label>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="button button-green"
                >
                  {submitting ? "Sending..." : "Send message"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="content-disclaimer" style={{ marginTop: "4px" }}>
                Connected to our live PostgreSQL database (`contact_inquiries`
                table).
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
