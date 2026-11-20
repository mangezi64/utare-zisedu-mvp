// =============================================================================
// UTARE ZEM AI — Shared Additive Database Schema Definition
// =============================================================================
// Mirrors supabase/additive-schema.sql so runtime serverless auto-migrations
// in src/lib/db.ts always have the complete 14-table non-destructive DDL without
// depending on filesystem paths inside Next.js standalone bundles.
// =============================================================================

export const EXPECTED_TABLES = [
  "auth_users",
  "innovation_hubs",
  "coaches",
  "candidate_profiles",
  "skills_assessments",
  "ai_career_pathways",
  "remote_jobs",
  "job_applications",
  "employer_registrations",
  "skills_courses",
  "contact_messages",
  "candidate_documents",
  "candidate_cv_artifacts",
  "audit_logs",
] as const;

export const ADDITIVE_SCHEMA_DDL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'employer', 'admin', 'superuser')),
  password_hash TEXT NOT NULL,
  email_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmation_token TEXT,
  employer_id TEXT,
  org_role TEXT CHECK (org_role IN ('org_admin', 'org_member')),
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.innovation_hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  has_solar_backup BOOLEAN NOT NULL DEFAULT true,
  internet_provider TEXT NOT NULL DEFAULT 'Starlink + Liquid Fiber',
  avg_speed_mbps INTEGER NOT NULL DEFAULT 100,
  available_workstations INTEGER NOT NULL DEFAULT 15,
  laptop_loan_available BOOLEAN NOT NULL DEFAULT false,
  daily_pass_usd NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  utare_partner_subsidized BOOLEAN NOT NULL DEFAULT true,
  contact_phone TEXT,
  contact_email TEXT,
  operating_hours TEXT NOT NULL DEFAULT '08:00 - 18:00 (Mon-Sat)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  specialty_track TEXT NOT NULL,
  bio TEXT NOT NULL,
  city TEXT NOT NULL,
  available_slots_weekly INTEGER NOT NULL DEFAULT 5,
  cal_booking_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT NOT NULL DEFAULT 'Harare',
  highest_qualification TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  years_experience INTEGER NOT NULL DEFAULT 0,
  employment_status TEXT NOT NULL,
  monthly_income_bracket TEXT NOT NULL,
  has_dedicated_laptop BOOLEAN NOT NULL DEFAULT false,
  primary_device TEXT NOT NULL DEFAULT 'Smartphone Only',
  internet_access_type TEXT NOT NULL DEFAULT 'Mobile Data Bundles',
  power_reliability_hours INTEGER NOT NULL DEFAULT 6,
  has_global_payment_rail BOOLEAN NOT NULL DEFAULT false,
  primary_goal TEXT NOT NULL DEFAULT 'International Remote Work',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skills_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  domain_competency_score INTEGER NOT NULL CHECK (domain_competency_score BETWEEN 0 AND 100),
  digital_readiness_score INTEGER NOT NULL CHECK (digital_readiness_score BETWEEN 0 AND 100),
  remote_work_literacy_score INTEGER NOT NULL CHECK (remote_work_literacy_score BETWEEN 0 AND 100),
  infrastructure_index_score INTEGER NOT NULL CHECK (infrastructure_index_score BETWEEN 0 AND 100),
  overall_readiness_tier TEXT NOT NULL,
  verified_skills TEXT[] NOT NULL DEFAULT '{}',
  diagnostic_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_career_pathways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.skills_assessments(id) ON DELETE SET NULL,
  recommended_track TEXT NOT NULL,
  executive_diagnosis TEXT NOT NULL,
  infrastructure_bridge_plan TEXT NOT NULL,
  recommended_hub_id UUID REFERENCES public.innovation_hubs(id) ON DELETE SET NULL,
  assigned_coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  upskilling_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_remote_roles TEXT[] NOT NULL DEFAULT '{}',
  payment_rail_guidance TEXT NOT NULL,
  tailored_resume_summary TEXT NOT NULL,
  coaching_status TEXT NOT NULL DEFAULT 'Pending First Session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.remote_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  employer_id TEXT,
  employer_email TEXT,
  category TEXT NOT NULL,
  compensation_usd_monthly TEXT NOT NULL,
  supported_payment_rails TEXT[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  min_readiness_tier TEXT NOT NULL DEFAULT 'Bridge-Ready',
  is_async_friendly BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  application_url TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending_review', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_city TEXT,
  candidate_qualification TEXT,
  candidate_field_of_study TEXT,
  candidate_skills TEXT[] DEFAULT '{}',
  candidate_readiness_tier TEXT,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  employer_id TEXT,
  tailored_resume_pitch TEXT,
  generated_cv JSONB,
  generated_cover_letter JSONB,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'rejected', 'hired')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employer_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  industry TEXT NOT NULL DEFAULT 'Technology & SaaS',
  roles_interested TEXT[] NOT NULL DEFAULT '{}',
  hiring_model TEXT NOT NULL DEFAULT '100% Remote Contract',
  estimated_hires INTEGER NOT NULL DEFAULT 1,
  timezone_overlap_needed TEXT NOT NULL DEFAULT 'CAT (GMT+2) / UK-EU overlap',
  additional_notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skills_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  provider TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  cost_type TEXT NOT NULL DEFAULT '100% Free / Subsidized',
  skills_taught TEXT[] NOT NULL DEFAULT '{}',
  level TEXT NOT NULL DEFAULT 'Beginner to Intermediate',
  course_url TEXT NOT NULL DEFAULT '#',
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  candidate_id TEXT,
  candidate_email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'certificate',
  title TEXT NOT NULL,
  issuer TEXT,
  issue_year TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  data_url TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidate_cv_artifacts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  candidate_id TEXT,
  candidate_email TEXT NOT NULL,
  job_id TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  generated_cv JSONB NOT NULL,
  generated_cover_letter JSONB NOT NULL,
  source_details JSONB,
  avatar_data_url TEXT,
  include_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS avatar_data_url TEXT;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS inactivity_notices_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS last_inactivity_notice_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS remain_confirmed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS data_policy_accepted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS data_policy_version TEXT;

ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS avatar_data_url TEXT;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS include_photo_on_cv BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS can_work_remotely BOOLEAN;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS hub_support_need TEXT;

ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS external_role_url TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS attachment_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS reports JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS reported_reason TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS attached_document_ids TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS shared_with_employer BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS employer_feedback_note TEXT;

ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS career_page_url TEXT;
ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS shared_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS updated_by TEXT;

CREATE INDEX IF NOT EXISTS idx_candidate_documents_email ON public.candidate_documents (LOWER(candidate_email));
CREATE INDEX IF NOT EXISTS idx_candidate_cv_artifacts_email ON public.candidate_cv_artifacts (LOWER(candidate_email));
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employer_registrations_email_lookup ON public.employer_registrations (LOWER(email));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'employer_registrations'
      AND indexname = 'idx_employer_registrations_email'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.employer_registrations
      GROUP BY email
      HAVING COUNT(*) > 1
    ) THEN
      CREATE UNIQUE INDEX idx_employer_registrations_email ON public.employer_registrations (email);
    END IF;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
`;
