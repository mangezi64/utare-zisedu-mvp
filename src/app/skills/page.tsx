"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  BookOpen,
  Users,
  Mail,
  Check,
  Sparkles,
  Building2,
  ArrowRight,
} from "lucide-react";
import { SkillsCourse } from "@/types";
import { SEED_SKILLS_COURSES } from "@/lib/mock-data";

const PROGRESS_STORAGE_KEY = "utare-demo-course-progress";

export default function SkillsDevelopmentPage() {
  const [courses, setCourses] = useState<SkillsCourse[]>(SEED_SKILLS_COURSES);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [activeCourse, setActiveCourse] = useState<SkillsCourse | null>(null);
  const [enrolledCourseId, setEnrolledCourseId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(PROGRESS_STORAGE_KEY) || "{}"
      );
      if (saved && typeof saved === "object") {
        setProgress(saved);
      }
    } catch {
      // ignore storage errors
    }

    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses);
        }
      })
      .catch(() => {});
  }, []);

  const saveProgress = (next: Record<string, number>) => {
    setProgress(next);
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const advanceLesson = (course: SkillsCourse) => {
    const total = course.lessons?.length || 4;
    const current = progress[course.title] || 0;
    const nextCount = Math.min(total, current + 1);
    saveProgress({ ...progress, [course.title]: nextCount });
  };

  const resetCourseProgress = (course: SkillsCourse) => {
    const next = { ...progress };
    delete next[course.title];
    saveProgress(next);
  };

  const handleEnroll = (course: SkillsCourse) => {
    setEnrolledCourseId(course.id);
    if ((progress[course.title] || 0) === 0) {
      advanceLesson(course);
    }
    setTimeout(() => setEnrolledCourseId(null), 6000);
  };

  const ICONS = [BookOpen, Users, Mail, Check, Sparkles, Building2];

  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="Skills Development" />
      {/* Faith & Amanda's Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">SKILLS DEVELOPMENT</span>
        <h1>Build the skills that help you move forward.</h1>
        <p>
          Explore digital literacy, remote work readiness, professional
          communication, digital productivity, technical skills, and
          entrepreneurship through structured, low-bandwidth learning pathways.
        </p>
      </section>

      {/* Skills Pathways Directory */}
      <section className="content-section">
        <div className="directory-top">
          <div className="section-heading" style={{ marginBottom: 0 }}>
            <span className="eyebrow">LEARNING PATHWAYS</span>
            <h2>Skills development modules</h2>
            <p>
              Open any course below to view its lesson outline, track module
              completion, and link progress with your candidate bridge.
            </p>
          </div>
          <span className="demo-pill">FREE · SUBSIDIZED ACCESS</span>
        </div>

        {enrolledCourseId && (
          <div className="mb-5 rounded-xl border border-[#c2e2d4] bg-[#eaf5f0] p-4 text-xs font-semibold text-[#101a33] flex items-center justify-between">
            <span>
              ✓ Enrolled in course! Module exercises and progress are synced in
              your workspace.
            </span>
            <Link href="/account" className="text-link">
              Open My Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="course-grid">
          {courses.map((c, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            const lessons = c.lessons || [];
            const totalLessons = lessons.length || 4;
            const done = Math.min(totalLessons, progress[c.title] || 0);
            const pct = Math.round((done / totalLessons) * 100);

            return (
              <article key={c.id} className="course-card">
                <div>
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="eyebrow">{c.category}</span>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>

                  {c.skillsTaught && c.skillsTaught.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {c.skillsTaught.map((sk) => (
                        <span
                          key={sk}
                          className="rounded bg-[#f0f5f4] px-2 py-0.5 text-[10.5px] font-semibold text-[#344054]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="course-progress">
                    <div>
                      <span>Module progress</span>
                      <b>
                        {done}/{totalLessons} lessons
                      </b>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="course-foot">
                    <span>
                      {c.durationWeeks} wks · {totalLessons} sample lessons
                    </span>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setActiveCourse(c)}
                    >
                      Course details <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Course Details & Interactive Lesson Modal */}
      {activeCourse && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCourse(null);
          }}
        >
          <div className="simple-modal course-modal">
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => setActiveCourse(null)}
            >
              ×
            </button>

            <span className="eyebrow">{activeCourse.category}</span>
            <h2>{activeCourse.title}</h2>
            <p>{activeCourse.description}</p>

            {(() => {
              const lessons = activeCourse.lessons || [];
              const total = lessons.length || 4;
              const done = Math.min(total, progress[activeCourse.title] || 0);
              const pct = Math.round((done / total) * 100);

              return (
                <>
                  <div className="course-progress">
                    <div>
                      <span>Your module progress</span>
                      <b>
                        {done}/{total} lessons completed
                      </b>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <h3>Module lessons</h3>
                  <ol>
                    {lessons.map((lesson, i) => (
                      <li
                        key={lesson}
                        className={i < done ? "lesson-done" : ""}
                      >
                        {lesson} {i < done ? "✓" : ""}
                      </li>
                    ))}
                  </ol>

                  <div className="flex flex-wrap gap-2.5 mt-4">
                    <button
                      type="button"
                      disabled={done >= total}
                      onClick={() => advanceLesson(activeCourse)}
                      className="button button-green course-advance"
                      style={{ flex: 1 }}
                    >
                      {done >= total
                        ? "All lessons completed ✓"
                        : "Mark next lesson complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnroll(activeCourse)}
                      className="button"
                    >
                      Save to Workspace
                    </button>
                  </div>

                  {done > 0 && (
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        onClick={() => resetCourseProgress(activeCourse)}
                        className="text-button"
                      >
                        Reset lesson progress
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Skills Notice Band */}
      <section className="content-section skills-note">
        <div className="notice-band">
          <Building2 className="h-5 w-5" />
          <div>
            <b>Connected to Partner Innovation Hubs &amp; AI Pathways</b>
            <p>
              All skills modules are accessible offline-first and subsidized at
              partner innovation hubs across Harare, Bulawayo, Mutare, Gweru,
              and Masvingo with solar power and Starlink broadband.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
