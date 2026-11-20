import { NextRequest, NextResponse } from "next/server";
import { requireRoles, unauthorizedResponse } from "@/lib/auth-guard";
import { SessionPayload } from "@/lib/auth-session";
import {
  findHubById,
  findHubByOwnerEmail,
  recordAuditLog,
  updateHubInStore,
} from "@/lib/store";
import { InnovationHub, OrgRole } from "@/types";

export const runtime = "nodejs";

function resolveEffectiveOrgRole(session: SessionPayload): OrgRole {
  if (session.role === "admin" || session.role === "superuser") {
    return "org_admin";
  }
  return session.orgRole || "org_admin";
}

function resolveHubForSession(
  session: SessionPayload,
  requestedHubId?: string | null
): InnovationHub | null {
  const isPlatformAdmin =
    session.role === "admin" || session.role === "superuser";
  if (isPlatformAdmin && requestedHubId) {
    return findHubById(requestedHubId);
  }
  return (
    (session.hubId ? findHubById(session.hubId) : null) ||
    findHubByOwnerEmail(session.email)
  );
}

const ADMIN_ONLY_HUB_FIELDS = [
  "name",
  "city",
  "address",
  "hasSolarBackup",
  "internetProvider",
  "avgSpeedMbps",
  "dailyPassUsd",
  "utarePartnerSubsidized",
  "contactEmail",
  "operatingHours",
  "orgName",
] as const;

export async function GET(req: NextRequest) {
  const session = await requireRoles(req, ["hub", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Hub Partner authentication required.");
  }

  const orgRole = resolveEffectiveOrgRole(session);
  const requestedHubId = req.nextUrl.searchParams.get("hubId");
  const hub = resolveHubForSession(session, requestedHubId);

  if (!hub) {
    return NextResponse.json(
      { error: "No Innovation Hub is linked to your account." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    hub,
    orgRole,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await requireRoles(req, ["hub", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Hub Partner authentication required.");
  }

  try {
    const body = await req.json();
    const orgRole = resolveEffectiveOrgRole(session);
    const hub = resolveHubForSession(
      session,
      body.hubId ? String(body.hubId) : null
    );

    if (!hub) {
      return NextResponse.json(
        { error: "No Innovation Hub is linked to your account." },
        { status: 404 }
      );
    }

    if (orgRole !== "org_admin") {
      const attemptedAdminField = ADMIN_ONLY_HUB_FIELDS.find(
        (field) => body[field] !== undefined
      );
      if (attemptedAdminField) {
        return NextResponse.json(
          {
            error:
              "Only Hub Admins can edit hub specifications, pricing, or operating hours. Team members may update workstation availability and laptop loan status.",
          },
          { status: 403 }
        );
      }
    }

    const patch: Partial<Omit<InnovationHub, "id">> = {};

    if (body.availableWorkstations !== undefined) {
      const seats = Number(body.availableWorkstations);
      if (Number.isNaN(seats) || seats < 0) {
        return NextResponse.json(
          { error: "availableWorkstations must be a non-negative number." },
          { status: 400 }
        );
      }
      patch.availableWorkstations = seats;
    }

    if (body.laptopLoanAvailable !== undefined) {
      patch.laptopLoanAvailable = Boolean(body.laptopLoanAvailable);
    }

    if (orgRole === "org_admin") {
      if (body.name !== undefined) patch.name = String(body.name).trim();
      if (body.city !== undefined) patch.city = String(body.city).trim();
      if (body.address !== undefined) patch.address = String(body.address).trim();
      if (body.hasSolarBackup !== undefined) {
        patch.hasSolarBackup = Boolean(body.hasSolarBackup);
      }
      if (body.internetProvider !== undefined) {
        patch.internetProvider = String(body.internetProvider).trim();
      }
      if (body.avgSpeedMbps !== undefined) {
        patch.avgSpeedMbps = Number(body.avgSpeedMbps) || hub.avgSpeedMbps;
      }
      if (body.dailyPassUsd !== undefined) {
        patch.dailyPassUsd = Number(body.dailyPassUsd) || 0;
      }
      if (body.utarePartnerSubsidized !== undefined) {
        patch.utarePartnerSubsidized = Boolean(body.utarePartnerSubsidized);
      }
      if (body.contactEmail !== undefined) {
        patch.contactEmail = String(body.contactEmail).trim();
      }
      if (body.operatingHours !== undefined) {
        patch.operatingHours = String(body.operatingHours).trim();
      }
      if (body.orgName !== undefined) {
        patch.orgName = String(body.orgName).trim() || undefined;
      }
    }

    const updated = updateHubInStore(hub.id, patch);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update Innovation Hub." },
        { status: 500 }
      );
    }

    recordAuditLog({
      entityType: "hub",
      entityId: updated.id,
      action: "hub_portal_updated",
      actorEmail: session.email,
      actorRole: session.role,
      summary: `Updated hub "${updated.name}" (${Object.keys(patch).join(", ") || "no-op"}).`,
    });

    return NextResponse.json({
      success: true,
      hub: updated,
      orgRole,
    });
  } catch (error) {
    console.error("[API /api/hub/portal PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update Innovation Hub." },
      { status: 500 }
    );
  }
}
