import { NextResponse } from "next/server";
import { getSkillsCourses } from "@/lib/store";

export async function GET() {
  const courses = getSkillsCourses();
  return NextResponse.json({ total: courses.length, courses });
}
