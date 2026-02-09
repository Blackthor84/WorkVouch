-- Education and Construction vertical profile extensions.
-- Do not modify intelligence schema.

-- education_profiles: school/district/type/grade levels/subjects/years
CREATE TABLE IF NOT EXISTS education_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_name text,
  district_name text,
  school_type text,
  grade_levels jsonb DEFAULT '[]',
  subjects jsonb DEFAULT '[]',
  years_taught integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_education_profiles_user_id ON education_profiles(user_id);

-- construction_profiles: trade, job site type, license, osha, union
CREATE TABLE IF NOT EXISTS construction_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade text,
  job_site_type text,
  license_number text,
  osha_certified boolean DEFAULT false,
  union_member text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_construction_profiles_user_id ON construction_profiles(user_id);

COMMENT ON TABLE education_profiles IS 'Extended profile for Education industry: school, district, grade levels, subjects.';
COMMENT ON TABLE construction_profiles IS 'Extended profile for Construction industry: trade, job site type, license, OSHA, union.';
