"use client";

import { useEffect, useState } from "react";
import { SEED_INNOVATION_HUBS } from "@/lib/mock-data";
import { InnovationHub } from "@/types";
import { StoredCandidateRecord } from "@/lib/store";
import {
  Wifi,
  Zap,
  Laptop,
  MapPin,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

export default function HubsDirectoryPage() {
  const [hubs, setHubs] = useState<InnovationHub[]>(SEED_INNOVATION_HUBS);
  const [activeCandidate, setActiveCandidate] =
    useState<StoredCandidateRecord | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [showEnlistForm, setShowEnlistForm] = useState(false);
  const [bookingHubId, setBookingHubId] = useState<string | null>(null);

  const [newHub, setNewHub] = useState({
    name: "",
    city: "Harare",
    address: "",
    internetProvider: "Starlink Business + Fiber",
    avgSpeedMbps: 150,
    availableWorkstations: 15,
    laptopLoanAvailable: true,
    contactEmail: "",
  });

  useEffect(() => {
    fetch("/api/hubs")
      .then((r) => r.json())
      .then((data) => {
        if (data.hubs) setHubs(data.hubs);
        if (data.activeCandidate) setActiveCandidate(data.activeCandidate);
      })
      .catch(() => {});
  }, []);

  const cities = ["All", "Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo"];
  const filteredHubs =
    selectedCity === "All"
      ? hubs
      : hubs.filter((h) => h.city.toLowerCase() === selectedCity.toLowerCase());

  async function handleEnlistHub(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/hubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newHub),
    });
    const data = await res.json();
    if (data.hub) {
      setHubs([data.hub, ...hubs]);
      setShowEnlistForm(false);
      setNewHub({
        name: "",
        city: "Harare",
        address: "",
        internetProvider: "Starlink Business + Fiber",
        avgSpeedMbps: 150,
        availableWorkstations: 15,
        laptopLoanAvailable: true,
        contactEmail: "",
      });
    }
  }

  async function handleReserveWorkstation(hubId: string) {
    setBookingHubId(hubId);
    try {
      const res = await fetch("/api/pathway", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookHubId: hubId }),
      });
      const data = await res.json();
      if (data.record) {
        setActiveCandidate(data.record);
      }
    } finally {
      setBookingHubId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Task #4 — Infrastructure Partner Network (Lead: Munashe)
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Partner Innovation & Co-Working Hub Directory
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Solving the <strong>73.9% broadband deficit</strong> and{" "}
            <strong>100% SME laptop bottleneck</strong> by connecting Utare
            candidates with verified local hubs featuring solar backup,
            high-speed Starlink/Fiber, and workstation access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowEnlistForm(!showEnlistForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
        >
          <PlusCircle className="h-4 w-4" />
          {showEnlistForm ? "Close Enlistment Form" : "Enlist New Partner Hub"}
        </button>
      </div>

      {/* Active Candidate Hub Match Banner */}
      {activeCandidate && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-700">
            <span className="font-bold text-emerald-900">
              Active Candidate ({activeCandidate.profile.fullName} —{" "}
              {activeCandidate.profile.city}):
            </span>{" "}
            Matched to{" "}
            <strong>{activeCandidate.pathway.recommendedHub.name}</strong> for
            solar power & high-speed connectivity.
          </div>
          {activeCandidate.bookedHubDesk && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
              <CheckCircle2 className="h-3.5 w-3.5" /> Desk Reserved at{" "}
              {activeCandidate.bookedHubDesk.hubName}
            </span>
          )}
        </div>
      )}

      {/* Enlistment Form Modal/Drawer */}
      {showEnlistForm && (
        <form
          onSubmit={handleEnlistHub}
          className="rounded-2xl border-2 border-emerald-600/30 bg-white p-6 shadow-md space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900">
            Enlist a Zimbabwean Co-Working Space or Innovation Hub
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hub Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Masvingo Tech Hub"
                value={newHub.name}
                onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City
              </label>
              <select
                value={newHub.city}
                onChange={(e) => setNewHub({ ...newHub, city: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Harare">Harare</option>
                <option value="Bulawayo">Bulawayo</option>
                <option value="Mutare">Mutare</option>
                <option value="Gweru">Gweru</option>
                <option value="Masvingo">Masvingo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Address
              </label>
              <input
                type="text"
                required
                placeholder="Street address & suburb"
                value={newHub.address}
                onChange={(e) =>
                  setNewHub({ ...newHub, address: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internet Provider
              </label>
              <input
                type="text"
                value={newHub.internetProvider}
                onChange={(e) =>
                  setNewHub({ ...newHub, internetProvider: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Avg Speed (Mbps)
              </label>
              <input
                type="number"
                value={newHub.avgSpeedMbps}
                onChange={(e) =>
                  setNewHub({
                    ...newHub,
                    avgSpeedMbps: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Workstations
              </label>
              <input
                type="number"
                value={newHub.availableWorkstations}
                onChange={(e) =>
                  setNewHub({
                    ...newHub,
                    availableWorkstations: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newHub.laptopLoanAvailable}
                onChange={(e) =>
                  setNewHub({
                    ...newHub,
                    laptopLoanAvailable: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-emerald-600"
              />
              Hub provides on-site PC / Laptop loan desks for smartphone-only
              candidates
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Save & Publish Partner Hub
            </button>
          </div>
        </form>
      )}

      {/* City Filter */}
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCity(c)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              selectedCity === c
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Hub Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredHubs.map((hub) => {
          const isRecommended =
            activeCandidate?.pathway.recommendedHub.id === hub.id;
          const isBooked = activeCandidate?.bookedHubDesk?.hubId === hub.id;

          return (
            <div
              key={hub.id}
              className={`rounded-2xl border bg-white p-6 shadow-sm space-y-4 ${
                isRecommended
                  ? "border-2 border-emerald-600"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <MapPin className="h-3.5 w-3.5" /> {hub.city}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {hub.name}
                  </h3>
                  <p className="text-xs text-slate-500">{hub.address}</p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                  {isRecommended ? "Recommended for You" : "Utare Partner Pass"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Wifi className="h-4 w-4 text-emerald-600" />
                    {hub.avgSpeedMbps} Mbps
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {hub.internetProvider}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Zap className="h-4 w-4 text-amber-600" />
                    {hub.hasSolarBackup ? "100% Solar" : "Grid Only"}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Uninterrupted Power
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Laptop className="h-4 w-4 text-blue-600" />
                    {hub.availableWorkstations} Desks
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {hub.laptopLoanAvailable
                      ? "PC Loan Available"
                      : "Bring Own Device"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Hours: {hub.operatingHours}</span>
                {activeCandidate && (
                  <button
                    type="button"
                    disabled={isBooked || bookingHubId === hub.id}
                    onClick={() => handleReserveWorkstation(hub.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isBooked
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {isBooked
                      ? "✓ Workstation Reserved"
                      : "Reserve Workstation Desk"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
