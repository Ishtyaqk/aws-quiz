-- Question uploads: versioned question bank + upload audit trail
-- (Separate from 001_create_quiz_results.sql which is only for quiz scores)

-- Questions versioning table
CREATE TABLE IF NOT EXISTS public.questions_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INTEGER NOT NULL UNIQUE,
  questions JSONB NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  md_file_path TEXT,
  total_questions INTEGER NOT NULL,
  notes TEXT
);

-- Audit log table
CREATE TABLE IF NOT EXISTS public.upload_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  new_questions_added INTEGER NOT NULL,
  total_questions_after INTEGER NOT NULL,
  version_number INTEGER NOT NULL REFERENCES public.questions_versions(version_number),
  status TEXT DEFAULT 'success',
  error_message TEXT
);

ALTER TABLE public.questions_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select versions" ON public.questions_versions;
DROP POLICY IF EXISTS "Allow public select audit" ON public.upload_audit_log;
DROP POLICY IF EXISTS "Allow public insert versions" ON public.questions_versions;
DROP POLICY IF EXISTS "Allow public insert audit" ON public.upload_audit_log;

CREATE POLICY "Allow public select versions" ON public.questions_versions FOR SELECT USING (true);
CREATE POLICY "Allow public select audit" ON public.upload_audit_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert versions" ON public.questions_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert audit" ON public.upload_audit_log FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_questions_versions_uploaded_at ON public.questions_versions(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_versions_version_number ON public.questions_versions(version_number DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_uploaded_by ON public.upload_audit_log(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.upload_audit_log(upload_timestamp DESC);
