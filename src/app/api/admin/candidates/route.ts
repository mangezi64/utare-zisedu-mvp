import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET() {
  const state = readStore();
  return NextResponse.json({
    total: state.candidates.length,
    candidates: state.candidates,
    applications: state.applications,
  });
}
