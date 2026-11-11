"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SkillsCourse } from "@/types";
import { SEED_SKILLS_COURSES } from "@/lib/mock-data";

export default function SkillsDevelopmentPage() {
  const [courses, setCourses] = useState<SkillsCourse[]>(SEED_SKILLS_COURSES);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>("course-01");
  const [enrolledCourseId, setEnrolledCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses);
        }
      })
      .catch(() => {});
  }, []);

  function handleEnroll(id: string) {
    setEnrolledCourseId(id);
    setTimeout(() => setEnrolledCourseId(null), 6000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
          <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
          Practical Competency Upskilling
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Skills Development Pathways & Free Modules
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 leading-relaxed">
          Target the exact missing skills identified in your readiness diagnostic.
          All courses are low-bandwidth friendly, fully subsidized for Zimbabwean youth,
          and paired with partner innovation hub workstations.
        </p>
      </div>

      {enrolledCourseId && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm flex items-center justify-between">
          <span>✓ Enrolled successfully! Course materials and exercises are ready in your candidate workspace.</span>
          <Link href="/account" className="text-xs text-emerald-700 underline font-bold">
            View in My Workspace →
          </Link>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const isExpanded = expandedCourseId === c.id;
          return (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                    {c.category}
                  </span>
                  <span className="text-emerald-700 font-extrabold text-[11px]">
                    {c.costType}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.provider}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.description}
                </p>

                {/* Skills Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Skills Covered:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skillsTaught.map((sk) => (
                      <span
                        key={sk}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lesson Outline Toggle */}
                {c.lessons && c.lessons.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-emerald-700"
                    >
                      <span>Lesson Outline ({c.lessons.length} modules)</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {isExpanded && (
                      <ol className="mt-2 space-y-1 text-xs text-slate-600 list-decimal list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {c.lessons.map((lesson, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {lesson}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {c.durationWeeks} weeks
                </span>
                <button
                  type="button"
                  onClick={() => handleEnroll(c.id)}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Start Course Free
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
