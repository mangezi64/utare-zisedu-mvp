-- =============================================================================
-- UTARE ZIMEDU AI — Supabase / PostgreSQL Database Schema
-- =============================================================================
-- Run this script in your Supabase SQL Editor to initialize all tables,
-- indexes, and initial seed records for the MVP.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. INNOVATION HUBS (Task #4: Infrastructure Partner Network - Munashe)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.innovation_hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL, -- e.g. 'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo'
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

-- -----------------------------------------------------------------------------
-- 2. HUMAN COACHES & MENTORS (Task #3: Human Coaching Pairing - Stewart)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  specialty_track TEXT NOT NULL, -- 'Remote Tech & Data', 'Digital Operations & VA', 'Grassroots Agribusiness & SME', 'Fintech & Global Payments'
  bio TEXT NOT NULL,
  city TEXT NOT NULL,
  available_slots_weekly INTEGER NOT NULL DEFAULT 5,
  cal_booking_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. CANDIDATE PROFILES (Task #1 & #3: Smart Intake & Infrastructure Constraints)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE, -- Links to auth.users(id) when Supabase Auth is active
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT NOT NULL DEFAULT 'Harare',
  
  -- Academic & Employment Reality (Addresses the 82.6% degreed / 84.6% misaligned paradox)
  highest_qualification TEXT NOT NULL, -- 'Bachelors Degree', 'Masters Degree', 'HND / Diploma', 'Certificate'
  field_of_study TEXT NOT NULL,
  years_experience INTEGER NOT NULL DEFAULT 0,
  employment_status TEXT NOT NULL, -- 'Unemployed', 'Survival Gig (Misaligned)', 'Partially Aligned', 'Aligned Role', 'Self-Employed Venture'
  monthly_income_bracket TEXT NOT NULL, -- '$0 (Zero Income)', '$1 - $150', '$151 - $300', '$300+'
  
  -- Critical Infrastructure Constraints (Addresses 73.9% broadband & 100% SME laptop deficit)
  has_dedicated_laptop BOOLEAN NOT NULL DEFAULT false,
  primary_device TEXT NOT NULL DEFAULT 'Smartphone Only', -- 'Smartphone Only', 'Shared Family PC', 'Dedicated Laptop'
  internet_access_type TEXT NOT NULL DEFAULT 'Mobile Data Bundles', -- 'Mobile Data Bundles', 'Fiber / Wi-Fi', 'Starlink', 'None / Intermittent'
  power_reliability_hours INTEGER NOT NULL DEFAULT 6, -- Hours of reliable electricity per day
  has_global_payment_rail BOOLEAN NOT NULL DEFAULT false, -- Addresses 86.4% payment rail lockout
  
  primary_goal TEXT NOT NULL DEFAULT 'International Remote Work', -- 'International Remote Work', 'Local Formal Career', 'Scale Grassroots Business'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. SKILLS & READINESS ASSESSMENTS (Task #2 & #3: Diagnostic Evaluation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  domain_competency_score INTEGER NOT NULL CHECK (domain_competency_score BETWEEN 0 AND 100),
  digital_readiness_score INTEGER NOT NULL CHECK (digital_readiness_score BETWEEN 0 AND 100),
  remote_work_literacy_score INTEGER NOT NULL CHECK (remote_work_literacy_score BETWEEN 0 AND 100),
  infrastructure_index_score INTEGER NOT NULL CHECK (infrastructure_index_score BETWEEN 0 AND 100),
  overall_readiness_tier TEXT NOT NULL, -- 'Market-Ready (Direct Placement)', 'Bridge-Ready (Needs Hub + Rapid Upskilling)', 'Foundation Track (Intensive Coaching + Hardware Access)'
  verified_skills TEXT[] NOT NULL DEFAULT '{}',
  diagnostic_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. AI CAREER PATHWAYS & COACHING PAIRING (Task #3: Gemini AI + Coach Bridge)
-- -----------------------------------------------------------------------------
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
  coaching_status TEXT NOT NULL DEFAULT 'Pending First Session', -- 'Pending First Session', 'Scheduled', 'In Progress', 'Completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. CURATED REMOTE JOBS (Task #5: Verified Zimbabwe-Accessible Remote Feed)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.remote_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  compensation_usd_monthly TEXT NOT NULL,
  supported_payment_rails TEXT[] NOT NULL DEFAULT '{}', -- e.g. {'Deel', 'Payoneer', 'Wise', 'Crypto/USDC'}
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  min_readiness_tier TEXT NOT NULL DEFAULT 'Bridge-Ready',
  is_async_friendly BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  application_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA: Zimbabwe Innovation Hubs, Coaches, and Verified Remote Roles
-- =============================================================================

INSERT INTO public.innovation_hubs (name, city, address, has_solar_backup, internet_provider, avg_speed_mbps, available_workstations, laptop_loan_available, daily_pass_usd, utare_partner_subsidized, contact_email)
VALUES
  ('Impact Hub Harare / Utare Node', 'Harare', '142 Kwame Nkrumah Ave, Avenues, Harare', true, 'Starlink Business + Liquid Fiber', 180, 28, true, 0.00, true, 'harare-hub@utare-zimedu.org'),
  ('Bulawayo Digital Innovation Centre', 'Bulawayo', '88 Fife Street, CBD, Bulawayo', true, 'Starlink + TelOne Fiber', 140, 20, true, 0.00, true, 'byo-hub@utare-zimedu.org'),
  ('Manicaland Tech & Enterprise Hub', 'Mutare', '24 Herbert Chitepo St, Mutare', true, 'Starlink High-Performance', 150, 14, true, 0.00, true, 'mutare-hub@utare-zimedu.org'),
  ('Midlands Graduate Co-Working Lab', 'Gweru', '11 Seventh Street, Gweru', true, 'Liquid Home Fiber + Solar Microgrid', 95, 12, false, 0.00, true, 'gweru-hub@utare-zimedu.org')
ON CONFLICT DO NOTHING;

INSERT INTO public.coaches (full_name, title, organization, specialty_track, bio, city, available_slots_weekly, cal_booking_link)
VALUES
  ('Tariro Moyo', 'Senior Global Remote Operations Lead', 'GitLab / ZimRemote Collective', 'Digital Operations & VA', 'Helped 120+ Zimbabwean humanities and commerce graduates transition from survival gigs into $1,200+/mo international remote operations roles.', 'Harare', 8, 'https://cal.com/utare-tariro'),
  ('Eng. Farai Ncube', 'Principal Full-Stack & AI Architect', 'Diaspora Tech Bridge', 'Remote Tech & Data', 'Specializes in bridging CS, Engineering, and Maths graduates into global contract engineering and AI data annotation pipelines.', 'Bulawayo', 6, 'https://cal.com/utare-farai'),
  ('Rudo Chikwanda', 'Cross-Border Fintech & Freelance Strategist', 'AfriPay Advisory', 'Fintech & Global Payments', 'Guides Zimbabwean freelancers and graduates on compliant international invoicing, Deel/Payoneer onboarding, and foreign currency retention.', 'Harare', 10, 'https://cal.com/utare-rudo'),
  ('Tendai Mutasa', 'SME Digitization & Venture Coach', 'Mutare Enterprise Foundry', 'Grassroots Agribusiness & SME', 'Works with smartphone-first self-employed entrepreneurs to digitize bookkeeping, access hub workstations, and unlock micro-working capital.', 'Mutare', 7, 'https://cal.com/utare-tendai')
ON CONFLICT DO NOTHING;
