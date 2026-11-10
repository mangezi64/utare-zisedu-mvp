import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { addHubToStore, readStore } from "@/lib/store";

export async function GET() {
  const state = readStore();
  const activeCandidate =
    state.candidates.find((c) => c.id === state.activeCandidateId) ||
    state.candidates[0] ||
    null;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("innovation_hubs")
      .select("*")
      .order("city", { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        hubs: data,
        activeCandidate,
        source: "supabase",
      });
    }
  }

  return NextResponse.json({
    hubs: state.hubs,
    activeCandidate,
    source: "connected-store",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.city || !body.address) {
      return NextResponse.json(
        { error: "Hub name, city, and address are required." },
        { status: 400 }
      );
    }

    const newHub = addHubToStore({
      id: `hub-${Date.now()}`,
      name: body.name,
      city: body.city,
      address: body.address,
      hasSolarBackup: Boolean(body.hasSolarBackup ?? true),
      internetProvider: body.internetProvider || "Starlink + Fiber Backup",
      avgSpeedMbps: Number(body.avgSpeedMbps || 120),
      availableWorkstations: Number(body.availableWorkstations || 10),
      laptopLoanAvailable: Boolean(body.laptopLoanAvailable ?? false),
      dailyPassUsd: Number(body.dailyPassUsd || 0),
      utarePartnerSubsidized: true,
      contactEmail: body.contactEmail || "partners@utare-zimedu.org",
      operatingHours: body.operatingHours || "08:00 - 18:00 (Mon - Sat)",
    });

    return NextResponse.json({ hub: newHub, status: "enlisted" });
  } catch (error) {
    console.error("[API /api/hubs POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to enlist innovation hub." },
      { status: 500 }
    );
  }
}
