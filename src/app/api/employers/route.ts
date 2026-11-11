import { NextRequest, NextResponse } from "next/server";
import { getEmployerRegistrations, saveEmployerRegistration } from "@/lib/store";

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

  const employers = getEmployerRegistrations();
  return NextResponse.json({ total: employers.length, employers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      website,
      industry,
      rolesInterested,
      hiringModel,
      estimatedHires,
      timezoneOverlapNeeded,
      additionalNotes,
    } = body;

    if (!companyName || !contactPerson || !email) {
      return NextResponse.json(
        { error: "Company name, contact person, and work email are required." },
        { status: 400 }
      );
    }

    const reg = saveEmployerRegistration({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      website: (website || "").trim(),
      industry: (industry || "Technology").trim(),
      rolesInterested: Array.isArray(rolesInterested)
        ? rolesInterested
        : typeof rolesInterested === "string"
        ? rolesInterested.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Digital Operations", "Data Analytics"],
      hiringModel: hiringModel || "100% Remote Contract",
      estimatedHires: Number(estimatedHires) || 1,
      timezoneOverlapNeeded: timezoneOverlapNeeded || "CAT (GMT+2) / UK-EU overlap",
      additionalNotes: (additionalNotes || "").trim(),
    });

    return NextResponse.json({
      success: true,
      registration: reg,
      message: `Employer interest registered for "${reg.companyName}". Our talent partnerships lead will reach out within 24 hours.`,
    });
  } catch (err: any) {
    console.error("[API /api/employers Error]:", err);
    return NextResponse.json(
      { error: "Failed to submit employer registration." },
      { status: 500 }
    );
  }
}
