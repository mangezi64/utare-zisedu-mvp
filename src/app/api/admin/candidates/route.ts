import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedResponse } from "@/lib/auth-guard";
import { readStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  const state = readStore();
  return NextResponse.json({
    total: state.candidates.length,
    candidates: state.candidates,
    applications: state.applications,
  });
}
