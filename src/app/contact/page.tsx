"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Send, Building2, CheckCircle2 } from "lucide-react";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          inquiryType: "Candidate Support",
          message: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
          <Mail className="h-3.5 w-3.5 text-emerald-700" />
          Connect With Us
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Contact UTARE ZISEDU AI
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
          Whether you are a Zimbabwean graduate seeking remote work, an innovation hub
          wanting to partner, or an employer hiring talent, reach out to our team.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Contact Info (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Partner Node Contacts</h2>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Harare Flagship Node</span>
                  <span>142 Kwame Nkrumah Ave, Avenues, Harare</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Bulawayo Digital Innovation Centre</span>
                  <span>88 Fife Street, CBD, Bulawayo</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Mutare Tech & Enterprise Hub</span>
                  <span>24 Herbert Chitepo St, Mutare</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-slate-800">contact@utare-zisedu.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>+263 77 210 9876 / WhatsApp Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Thank you for getting in touch!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your message has been saved to the database. An ecosystem coordinator will reply within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tendai Moyo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="tendai@example.co.zw"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Inquiry Type</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="Candidate Support">Candidate Support & Intake</option>
                      <option value="Partner Hub Onboarding">Innovation Hub Partnership</option>
                      <option value="Industry Mentor">Mentor / Coaching Application</option>
                      <option value="Employer Hiring">Employer Hiring Remote Talent</option>
                      <option value="General">General Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Hub partnership in Gweru"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we assist your remote career or partnership?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submitting ? "Sending..." : "Submit Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
