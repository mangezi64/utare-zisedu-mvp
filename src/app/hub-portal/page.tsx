"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Sun,
  Wifi,
  Laptop,
  Users,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useViewMode } from "@/lib/view-mode-context";
import { InnovationHub, OrgRole } from "@/types";

interface HubTeamMember {
  id: string;
  name: string;
  email: string;
  orgRole?: OrgRole;
  isActive?: boolean;
  invitedAt?: string;
}

export default function HubPortalPage() {
  const {
    user,
    loading: sessionLoading,
    isHub,
    isAdmin,
    isOrgAdmin,
    isOrgMember,
  } = useViewMode();

  const canManageOrg = isAdmin || isOrgAdmin || !isOrgMember;

  const [hub, setHub] = useState<InnovationHub | null>(null);
  const [loadingHub, setLoadingHub] = useState(true);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Quick Capacity State (org_member & org_admin)
  const [availableWorkstations, setAvailableWorkstations] = useState<number>(0);
  const [laptopLoanAvailable, setLaptopLoanAvailable] = useState<boolean>(false);
  const [savingQuick, setSavingQuick] = useState(false);

  // Full Hub Specs State (org_admin & admin only)
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [specsForm, setSpecsForm] = useState({
    name: "",
    city: "",
    address: "",
    hasSolarBackup: true,
    internetProvider: "",
    avgSpeedMbps: 100,
    dailyPassUsd: 5,
    utarePartnerSubsidized: true,
    contactEmail: "",
    operatingHours: "",
  });

  // Hub Team Management State (org_admin & admin only)
  const [teamMembers, setTeamMembers] = useState<HubTeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    email: "",
    orgRole: "org_member" as OrgRole,
  });
  const [oneTimeLinkBanner, setOneTimeLinkBanner] = useState<{
    label: string;
    url: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const syncFormFromHub = useCallback((h: InnovationHub) => {
    setAvailableWorkstations(h.availableWorkstations ?? 0);
    setLaptopLoanAvailable(Boolean(h.laptopLoanAvailable));
    setSpecsForm({
      name: h.name || "",
      city: h.city || "",
      address: h.address || "",
      hasSolarBackup: Boolean(h.hasSolarBackup),
      internetProvider: h.internetProvider || "",
      avgSpeedMbps: Number(h.avgSpeedMbps) || 0,
      dailyPassUsd: Number(h.dailyPassUsd) || 0,
      utarePartnerSubsidized: Boolean(h.utarePartnerSubsidized),
      contactEmail: h.contactEmail || "",
      operatingHours: h.operatingHours || "",
    });
  }, []);

  const loadHubPortal = useCallback(async () => {
    setLoadingHub(true);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/hub/portal", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error(data.error || "Unable to load hub portal.");
        }
        setHub(null);
        return;
      }
      if (data.hub) {
        setHub(data.hub);
        syncFormFromHub(data.hub);
      } else {
        setHub(null);
      }
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to load hub data.");
    } finally {
      setLoadingHub(false);
    }
  }, [syncFormFromHub]);

  const loadHubTeam = useCallback(async () => {
    if (!canManageOrg) return;
    setLoadingTeam(true);
    try {
      const res = await fetch("/api/hub/team", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setTeamMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      // Ignore fetch error
    } finally {
      setLoadingTeam(false);
    }
  }, [canManageOrg]);

  useEffect(() => {
    if (isHub || isAdmin) {
      loadHubPortal();
      if (canManageOrg) {
        loadHubTeam();
      }
    } else if (!sessionLoading) {
      setLoadingHub(false);
    }
  }, [isHub, isAdmin, canManageOrg, sessionLoading, loadHubPortal, loadHubTeam]);

  async function handleCopyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  }

  async function handleQuickCapacitySave(e: React.FormEvent) {
    e.preventDefault();
    setSavingQuick(true);
    setBannerNotice(null);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/hub/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          availableWorkstations: Number(availableWorkstations),
          laptopLoanAvailable,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update hub capacity.");
      }
      if (data.hub) {
        setHub(data.hub);
        syncFormFromHub(data.hub);
      }
      setBannerNotice("Workstation availability and laptop loan status updated.");
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to update hub capacity.");
    } finally {
      setSavingQuick(false);
    }
  }

  async function handleFullSpecsSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingSpecs(true);
    setBannerNotice(null);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/hub/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...specsForm,
          avgSpeedMbps: Number(specsForm.avgSpeedMbps),
          dailyPassUsd: Number(specsForm.dailyPassUsd),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update hub specifications.");
      }
      if (data.hub) {
        setHub(data.hub);
        syncFormFromHub(data.hub);
      }
      setBannerNotice("Hub specifications, pricing, and operating hours saved.");
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to update hub specifications.");
    } finally {
      setSavingSpecs(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setAddingStaff(true);
    setErrorNotice(null);
    setOneTimeLinkBanner(null);
    try {
      const res = await fetch("/api/hub/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newStaff),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to invite hub staff.");
      }
      if (data.inviteUrl) {
        setOneTimeLinkBanner({
          label: `One-time invite link for ${newStaff.fullName} (${newStaff.email})`,
          url: data.inviteUrl,
        });
      }
      setBannerNotice(`Invited ${newStaff.fullName} to your hub team.`);
      setNewStaff({ fullName: "", email: "", orgRole: "org_member" });
      setShowAddStaff(false);
      await loadHubTeam();
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to invite hub staff.");
    } finally {
      setAddingStaff(false);
    }
  }

  async function handleToggleStaffRole(member: HubTeamMember) {
    const nextRole: OrgRole =
      member.orgRole === "org_admin" ? "org_member" : "org_admin";
    setErrorNotice(null);
    try {
      const res = await fetch("/api/hub/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: member.id,
          email: member.email,
          orgRole: nextRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update staff role.");
      }
      setBannerNotice(
        `Updated ${member.name}'s role to ${
          nextRole === "org_admin" ? "Organization Admin" : "Team Member"
        }.`
      );
      await loadHubTeam();
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to update staff role.");
    }
  }

  async function handleStaffResetLink(member: HubTeamMember) {
    setErrorNotice(null);
    setOneTimeLinkBanner(null);
    try {
      const res = await fetch("/api/hub/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "reset_link",
          userId: member.id,
          email: member.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate reset link.");
      }
      const url = data.resetUrl || data.inviteUrl;
      if (url) {
        setOneTimeLinkBanner({
          label: `One-time reset link for ${member.name} (${member.email})`,
          url,
        });
      }
      setBannerNotice(`Generated one-time reset link for ${member.email}.`);
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to generate reset link.");
    }
  }

  async function handleRemoveStaff(member: HubTeamMember) {
    setErrorNotice(null);
    try {
      const res = await fetch("/api/hub/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: member.id, email: member.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to remove staff member.");
      }
      setBannerNotice(`Removed ${member.name} from hub team.`);
      await loadHubTeam();
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to remove staff member.");
    }
  }

  if (!sessionLoading && !isHub && !isAdmin) {
    return (
      <div className="w-full min-h-screen">
        <PageBreadcrumb current="Hub Portal" />
        <div className="mx-auto max-w-lg py-20 px-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-sm">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hub Partner Portal Access Required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your Innovation Hub partner account to manage live
            workstation capacity, laptop loan availability, and hub staff.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login?redirect=/hub-portal"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition"
            >
              Hub Partner Sign In
            </Link>
            <Link
              href="/hubs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Browse Partner Hubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-16">
      <PageBreadcrumb current="Hub Portal" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-900 px-3 py-1 text-xs font-bold text-white">
                <Building2 className="h-3.5 w-3.5 text-teal-300" />
                Hub Partner Portal
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                  canManageOrg
                    ? "bg-teal-50 border-teal-200 text-teal-900"
                    : "bg-slate-100 border-slate-300 text-slate-700"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {canManageOrg ? "Organization Admin" : "Team Member"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {hub?.name || user?.companyName || "Assigned Innovation Hub"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Keep your hub&apos;s live workstation capacity, solar/connectivity
              specs, and team access up to date for UTARE remote candidates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                loadHubPortal();
                if (canManageOrg) loadHubTeam();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              href="/hubs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              View Public Hubs Directory
            </Link>
          </div>
        </div>

        {bannerNotice && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              {bannerNotice}
            </span>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errorNotice}
            </span>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="text-xs text-rose-700 hover:text-rose-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {oneTimeLinkBanner && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-blue-950">
                {oneTimeLinkBanner.label}
              </p>
              <button
                type="button"
                onClick={() => setOneTimeLinkBanner(null)}
                className="text-blue-700 hover:text-blue-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={oneTimeLinkBanner.url}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(oneTimeLinkBanner.url)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {loadingHub ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
            Loading your hub overview...
          </div>
        ) : !hub ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="text-base font-bold text-slate-900">
              No Innovation Hub Linked Yet
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your account does not have an assigned hub ID yet. Ask a platform
              administrator to link your account to a partner hub.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hub Snapshot Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-700" />
                  Location
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {hub.city}
                </p>
                <p className="text-xs text-slate-500 truncate">{hub.address}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Wifi className="h-3.5 w-3.5 text-teal-700" />
                  Connectivity
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {hub.avgSpeedMbps} Mbps
                </p>
                <p className="text-xs text-slate-500">{hub.internetProvider}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Sun className="h-3.5 w-3.5 text-amber-600" />
                  Power &amp; Pricing
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  ${hub.dailyPassUsd}/day
                </p>
                <p className="text-xs text-slate-500">
                  {hub.hasSolarBackup ? "Solar Backup Active" : "Grid Power"} ·{" "}
                  {hub.utarePartnerSubsidized ? "UTARE Subsidized" : "Standard"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-teal-700" />
                  Operating Hours
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {hub.operatingHours}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {hub.contactEmail}
                </p>
              </div>
            </div>

            {/* Quick Capacity Controls (org_member & org_admin) */}
            <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-teal-700" />
                  Live Capacity &amp; Hardware Availability
                </h2>
                <p className="text-xs text-slate-600">
                  Quick controls available to both Hub Team Members and
                  Organization Admins.
                </p>
              </div>

              <form
                onSubmit={handleQuickCapacitySave}
                className="flex flex-col sm:flex-row sm:items-end gap-4"
              >
                <label className="block text-xs font-semibold text-slate-700 sm:w-56">
                  Available Workstations
                  <input
                    type="number"
                    min={0}
                    required
                    value={availableWorkstations}
                    onChange={(e) =>
                      setAvailableWorkstations(Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laptopLoanAvailable}
                    onChange={(e) => setLaptopLoanAvailable(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Laptop Loan Available for Candidates
                </label>

                <button
                  type="submit"
                  disabled={savingQuick}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 transition"
                >
                  {savingQuick ? "Updating..." : "Update Live Capacity"}
                </button>
              </form>
            </section>

            {/* Full Hub Specs Editor (org_admin / admin only) */}
            {canManageOrg && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Hub Specifications, Pricing &amp; Hours (Admin Only)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update full hub profile details shown on the Partner Hubs
                    directory.
                  </p>
                </div>

                <form
                  onSubmit={handleFullSpecsSave}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <label className="block text-xs font-semibold text-slate-700">
                    Hub Name
                    <input
                      type="text"
                      required
                      value={specsForm.name}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    City
                    <input
                      type="text"
                      required
                      value={specsForm.city}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, city: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Address
                    <input
                      type="text"
                      required
                      value={specsForm.address}
                      onChange={(e) =>
                        setSpecsForm({ ...specsForm, address: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Internet Provider
                    <input
                      type="text"
                      required
                      value={specsForm.internetProvider}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          internetProvider: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Avg Speed (Mbps)
                    <input
                      type="number"
                      min={1}
                      required
                      value={specsForm.avgSpeedMbps}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          avgSpeedMbps: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Daily Pass (USD)
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      required
                      value={specsForm.dailyPassUsd}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          dailyPassUsd: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Contact Email
                    <input
                      type="email"
                      required
                      value={specsForm.contactEmail}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          contactEmail: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                    Operating Hours
                    <input
                      type="text"
                      required
                      value={specsForm.operatingHours}
                      onChange={(e) =>
                        setSpecsForm({
                          ...specsForm,
                          operatingHours: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>

                  <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={specsForm.hasSolarBackup}
                          onChange={(e) =>
                            setSpecsForm({
                              ...specsForm,
                              hasSolarBackup: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300"
                        />
                        Solar Microgrid Backup
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={specsForm.utarePartnerSubsidized}
                          onChange={(e) =>
                            setSpecsForm({
                              ...specsForm,
                              utarePartnerSubsidized: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300"
                        />
                        UTARE Partner Subsidized
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSpecs}
                      className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      {savingSpecs ? "Saving..." : "Save Hub Specifications"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Hub Team Management Panel (org_admin / admin only) */}
            {canManageOrg && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-700" />
                      Hub Team Management ({teamMembers.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Add hub coordinators, toggle admin permissions, or send
                      one-time invite and reset links.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStaff((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {showAddStaff ? "Cancel" : "+ Add Hub Staff"}
                  </button>
                </div>

                {showAddStaff && (
                  <form
                    onSubmit={handleAddStaff}
                    className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 grid gap-3 sm:grid-cols-4 items-end"
                  >
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name *
                      <input
                        type="text"
                        required
                        value={newStaff.fullName}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, fullName: e.target.value })
                        }
                        placeholder="e.g. Tendai Chuma"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Work Email *
                      <input
                        type="email"
                        required
                        value={newStaff.email}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, email: e.target.value })
                        }
                        placeholder="tendai@hub.org.zw"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Role
                      <select
                        value={newStaff.orgRole}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            orgRole: e.target.value as OrgRole,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                      >
                        <option value="org_member">Team Member</option>
                        <option value="org_admin">Organization Admin</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={addingStaff}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {addingStaff ? "Adding..." : "Create Invite Link"}
                    </button>
                  </form>
                )}

                {loadingTeam ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Loading hub staff...
                  </p>
                ) : teamMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No hub staff members listed yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {teamMembers.map((member) => {
                      const isMemberAdmin = member.orgRole === "org_admin";
                      return (
                        <div
                          key={member.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {member.name}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                  isMemberAdmin
                                    ? "bg-teal-50 border-teal-200 text-teal-800"
                                    : "bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                {isMemberAdmin
                                  ? "Organization Admin"
                                  : "Team Member"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffRole(member)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Make {isMemberAdmin ? "Team Member" : "Org Admin"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStaffResetLink(member)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <KeyRound className="h-3 w-3" />
                              Reset Link
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStaff(member)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
