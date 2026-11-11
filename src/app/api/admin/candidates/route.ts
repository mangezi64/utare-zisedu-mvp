import { NextRequest, NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const roleHeader =
    req.headers.get("x-utare-role") || req.nextUrl.searchParams.get("role");
  const emailHeader =
    req.headers.get("x-utare-email") || req.nextUrl.searchParams.get("email");

  const isAuthorizedAdmin =
    roleHeader === "admin" ||
    (emailHeader && emailHeader.toLowerCase().includes("admin@utare.co.zw"));

  if (!isAuthorizedAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin/Facilitator privileges required." },
      { status: 401 }
    );
  }

  const state = readStore();
  return NextResponse.json({
    total: state.candidates.length,
    candidates: state.candidates,
    applications: state.applications,
  });
}
