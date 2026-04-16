-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Reputation System, Skill Validations & Smart Notifications
-- Date: 2026-04-15
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 1 – SKILL VALIDATIONS
-- Schools officially validate a specific technical skill for a student.
-- Each validation triggers a badge award and notification (via trigger).
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_validations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name  TEXT        NOT NULL,
  notes       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, skill_name, school_id)
);

ALTER TABLE skill_validations ENABLE ROW LEVEL SECURITY;

-- School can insert & view validations for their own students
CREATE POLICY "sv_school_manage" ON skill_validations
  FOR ALL USING (auth.uid() = school_id)
  WITH CHECK (auth.uid() = school_id);

-- Student can read their own validations
CREATE POLICY "sv_student_select" ON skill_validations
  FOR SELECT USING (auth.uid() = student_id);

-- Companies can view validations (for talent evaluation)
CREATE POLICY "sv_empresa_select" ON skill_validations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Empresa')
  );

CREATE INDEX IF NOT EXISTS idx_skill_validations_student ON skill_validations(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_validations_school  ON skill_validations(school_id);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 2 – REPUTATION EVENTS  (immutable ledger)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reputation_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
             CHECK (type IN (
               'skill_validated',    -- school validated a skill          +100
               'internship_review',  -- company left positive review       +150
               'badge_earned',       -- any badge awarded                  +25
               'portfolio_item',     -- portfolio item added               +10
               'applied_accepted'    -- application accepted by company    +50
             )),
  points     INT         NOT NULL DEFAULT 0,
  source_id  UUID,       -- FK varies by type (skill_validation id, badge id…)
  note       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rep_student_select" ON reputation_events
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "rep_empresa_select" ON reputation_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Empresa')
  );

CREATE INDEX IF NOT EXISTS idx_reputation_student ON reputation_events(student_id);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 3 – REPUTATION SCORE on profiles
-- Denormalised sum kept in sync by triggers for O(1) reads.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reputation_score INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_score);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 4 – VERIFIED BADGE CATALOG
-- Seed the authoritative badge definitions for validation-tier badges.
-- Uses INSERT … ON CONFLICT DO NOTHING so it's safe to re-run.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO badges (name, icon, description, requirement) VALUES
  ('Aval Institucional',         'shield-check',  'Respaldado oficialmente por tu institución educativa.',                            'school_backing'),
  ('Habilidad Técnica Validada', 'badge-check',   'Una habilidad técnica tuya ha sido validada por tu colegio.',                     'skill_validated'),
  ('Top Postulante',             'star',          'Tu perfil ha sido seleccionado como candidato destacado por una empresa.',         'application_accepted'),
  ('Primer Portafolio',          'folder-open',   'Has añadido tu primer proyecto al portafolio.',                                   'portfolio_item'),
  ('Racha de 7 Días',            'flame',         'Has iniciado sesión durante 7 días consecutivos.',                                'streak_7'),
  ('Racha de 30 Días',           'zap',           'Has iniciado sesión durante 30 días consecutivos.',                               'streak_30'),
  ('Práctica Completada',        'briefcase',     'Has completado una práctica profesional con evaluación positiva de la empresa.',   'internship_review'),
  ('Perfil Completo',            'user-check',    'Tu perfil alcanzó el 100% de completitud.',                                      'profile_complete')
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 5 – FUNCTION: award_badge_if_missing
-- Idempotent badge award: inserts into user_badges only if not already
-- there, then logs a reputation_events row and updates profiles.reputation_score.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION award_badge_if_missing(
  p_student_id UUID,
  p_badge_name TEXT,
  p_source_id  UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  -- Look up the badge
  SELECT id INTO v_badge_id FROM badges WHERE name = p_badge_name LIMIT 1;
  IF v_badge_id IS NULL THEN RETURN; END IF;

  -- Idempotent insert
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_student_id, v_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  IF NOT FOUND THEN RETURN; END IF; -- already had it, skip points

  -- Log reputation event
  INSERT INTO reputation_events (student_id, type, points, source_id, note)
  VALUES (p_student_id, 'badge_earned', 25, p_source_id, p_badge_name);

  -- Bump denormalised score
  UPDATE profiles SET reputation_score = reputation_score + 25 WHERE id = p_student_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 6 – TRIGGER: auto-award badge + notify on skill validation
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_skill_validation_awarded()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_school_name TEXT;
BEGIN
  -- 1. Award the generic "Habilidad Técnica Validada" badge
  PERFORM award_badge_if_missing(NEW.student_id, 'Habilidad Técnica Validada', NEW.id);

  -- 2. Log the skill_validated reputation event (+100 pts)
  INSERT INTO reputation_events (student_id, type, points, source_id, note)
  VALUES (NEW.student_id, 'skill_validated', 100, NEW.id, NEW.skill_name);

  UPDATE profiles SET reputation_score = reputation_score + 100 WHERE id = NEW.student_id;

  -- 3. Fetch school name for the notification body
  SELECT COALESCE(school_name, name, 'Tu colegio') INTO v_school_name
  FROM profiles WHERE id = NEW.school_id;

  -- 4. Notify the student
  INSERT INTO notifications (user_id, title, body, type, link)
  VALUES (
    NEW.student_id,
    '¡Habilidad validada!',
    v_school_name || ' ha validado tu habilidad: ' || NEW.skill_name || '. Tu reputación aumentó +100 pts.',
    'badge',
    '/profile'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_skill_validation_awarded ON skill_validations;
CREATE TRIGGER trg_skill_validation_awarded
AFTER INSERT ON skill_validations
FOR EACH ROW EXECUTE FUNCTION trg_fn_skill_validation_awarded();


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 7 – TRIGGER: notify student when a company views their profile
-- Rate-limited: max 1 notification per (viewer, viewed) per 24 hours.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_profile_view_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_viewer_role  TEXT;
  v_company_name TEXT;
  v_recent_count INT;
BEGIN
  -- Only notify when the viewer is a company
  SELECT role INTO v_viewer_role FROM profiles WHERE id = NEW.viewer_id;
  IF v_viewer_role IS DISTINCT FROM 'Empresa' THEN RETURN NEW; END IF;

  -- Rate-limit: skip if already notified in the last 24h
  SELECT COUNT(*) INTO v_recent_count
  FROM notifications
  WHERE user_id   = NEW.viewed_id
    AND type      = 'info'
    AND link      = '/profile'
    AND body LIKE '%' || NEW.viewer_id::TEXT || '%'
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_recent_count > 0 THEN RETURN NEW; END IF;

  SELECT COALESCE(company_name, name, 'Una empresa') INTO v_company_name
  FROM profiles WHERE id = NEW.viewer_id;

  INSERT INTO notifications (user_id, title, body, type, link)
  VALUES (
    NEW.viewed_id,
    'Tu perfil fue visto',
    v_company_name || ' (' || NEW.viewer_id::TEXT || ') ha visitado tu perfil. ¡Puede estar interesada en tu talento!',
    'info',
    '/profile'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_view_notify ON profile_views;
CREATE TRIGGER trg_profile_view_notify
AFTER INSERT ON profile_views
FOR EACH ROW EXECUTE FUNCTION trg_fn_profile_view_notify();


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 8 – TRIGGER: notify matching students when a job is posted
-- Notifies students whose specialty matches the job posting specialty.
-- Capped at 50 notifications per job to prevent flooding.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_job_posted_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_student      RECORD;
  v_count        INT := 0;
BEGIN
  -- Only fire for new active postings with a specialty
  IF NEW.specialty IS NULL OR NEW.specialty = '' THEN RETURN NEW; END IF;
  IF NOT NEW.active THEN RETURN NEW; END IF;

  SELECT COALESCE(company_name, name, 'Una empresa') INTO v_company_name
  FROM profiles WHERE id = NEW.company_id;

  FOR v_student IN
    SELECT id FROM profiles
    WHERE role IN ('Estudiante', 'Egresado')
      AND specialty = NEW.specialty
      AND availability = 'Disponible'
    LIMIT 50
  LOOP
    INSERT INTO notifications (user_id, title, body, type, link)
    VALUES (
      v_student.id,
      'Nueva práctica que coincide contigo',
      v_company_name || ' publicó una vacante para ' || NEW.specialty || ': "' || NEW.title || '". ¡Postúlate ahora!',
      'application',
      '/empleos'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_posted_notify ON job_postings;
CREATE TRIGGER trg_job_posted_notify
AFTER INSERT ON job_postings
FOR EACH ROW EXECUTE FUNCTION trg_fn_job_posted_notify();


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 9 – TRIGGER: reputation bump when application is accepted
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_application_accepted_rep()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_applicant_id UUID;
  v_job_title    TEXT;
BEGIN
  -- Only fire on status change to 'accepted'
  IF NEW.status <> 'accepted' OR OLD.status = 'accepted' THEN RETURN NEW; END IF;

  -- Resolve applicant_id (column name may be student_id or applicant_id)
  v_applicant_id := COALESCE(NEW.applicant_id, NEW.student_id);
  IF v_applicant_id IS NULL THEN RETURN NEW; END IF;

  SELECT title INTO v_job_title FROM job_postings WHERE id = NEW.job_id;

  -- Award Top Postulante badge
  PERFORM award_badge_if_missing(v_applicant_id, 'Top Postulante', NEW.id);

  -- Log reputation event (+50)
  INSERT INTO reputation_events (student_id, type, points, source_id, note)
  VALUES (v_applicant_id, 'applied_accepted', 50, NEW.id, v_job_title);

  UPDATE profiles SET reputation_score = reputation_score + 50 WHERE id = v_applicant_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_accepted_rep ON job_applications;
CREATE TRIGGER trg_application_accepted_rep
AFTER UPDATE OF status ON job_applications
FOR EACH ROW EXECUTE FUNCTION trg_fn_application_accepted_rep();


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 10 – RLS on skill_validations already set above.
--              Notify PostgREST to reload its schema cache.
-- ─────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
