import { NextRequest, NextResponse } from "next/server";
import { addHubToStore, deleteHubFromStore, readStore } from "@/lib/store";
import { InnovationHub } from "@/types";

function isAuthorizedAdmin(req: NextRequest): boolean {
  const role =
    req.headers.get("x-utare-role") || req.nextUrl.searchParams.get("role");
  const email =
    req.headers.get("x-utare-email") || req.nextUrl.searchParams.get("email");
  return (
    role === "admin" ||
    Boolean(email && email.toLowerCase().includes("admin@utare.co.zw"))
  );
}

export async function GET() {
  const state = readStore();
  return NextResponse.json({
    total: state.hubs.length,
    hubs: state.hubs,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin/Facilitator privileges required." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const {
      name,
      city,
      address,
      hasSolarBackup,
      internetProvider,
      avgSpeedMbps,
      availableWorkstations,
      laptopLoanAvailable,
      dailyPassUsd,
      utarePartnerSubsidized,
      contactEmail,
      operatingHours,
    } = body;

    if (!name || !city || !address) {
      return NextResponse.json(
        { error: "Hub name, city, and physical address are required." },
        { status: 400 }
      );
    }

    const hubId =
      body.id ||
      `hub-${city.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 3)}-${Date.now().toString().slice(-4)}`;

    const newHub: InnovationHub = {
      id: hubId,
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      hasSolarBackup: Boolean(hasSolarBackup ?? true),
      internetProvider: (internetProvider || "Starlink Business + Local Fiber").trim(),
      avgSpeedMbps: Number(avgSpeedMbps) || 150,
      availableWorkstations: Number(availableWorkstations) || 20,
      laptopLoanAvailable: Boolean(laptopLoanAvailable ?? true),
      dailyPassUsd: Number(dailyPassUsd) || 0,
      utarePartnerSubsidized: Boolean(utarePartnerSubsidized ?? true),
      contactEmail: (contactEmail || `${city.toLowerCase()}@utare-zisedu.org`).trim(),
      operatingHours: (operatingHours || "08:00 - 18:00 (Mon - Sat)").trim(),
    };

    const saved = addHubToStore(newHub);
    return NextResponse.json({
      success: true,
      hub: saved,
      message: `Partner Hub "${saved.name}" successfully enlisted.`,
    });
  } catch (error) {
    console.error("[API /api/admin/hubs POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to enlist partner hub." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin/Facilitator privileges required." },
      { status: 401 }
    );
  }
  try {
    const hubId = req.nextUrl.searchParams.get("id");
    if (!hubId) {
      return NextResponse.json(
        { error: "hubId parameter is required." },
        { status: 400 }
      );
    }

    const removed = deleteHubFromStore(hubId);
    if (!removed) {
      return NextResponse.json(
        { error: "Partner hub not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Partner hub successfully unlisted.",
    });
  } catch (error) {
    console.error("[API /api/admin/hubs DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to remove partner hub." },
      { status: 500 }
    );
  }
}
