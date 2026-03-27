-- ─────────────────────────────────────────────────────────────
-- ClassLink – Supabase Database Schema  (idempotent – safe to re-run)
-- Paste this entire file into the Supabase SQL Editor and click Run:
-- https://supabase.com/dashboard/project/<your-project-id>/sql/new
-- ─────────────────────────────────────────────────────────────

-- ── 1. Profiles (extends auth.users) ─────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT  NOT NULL,
  name      TEXT  NOT NULL,
  role      TEXT  NOT NULL DEFAULT 'Estudiante'
                  CHECK (role IN ('Estudiante', 'Egresado', 'Empresa', 'Colegio')),
  avatar    TEXT  NOT NULL DEFAULT '',
  bio       TEXT  NOT NULL DEFAULT '',
  location  TEXT  NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT  NOT NULL,
  description    TEXT  NOT NULL DEFAULT '',
  content        TEXT  NOT NULL DEFAULT '',
  author_id      UUID  REFERENCES profiles(id) ON DELETE SET NULL,
  image          TEXT  NOT NULL DEFAULT '',
  tag            TEXT  NOT NULL DEFAULT '',
  likes_count    INT   NOT NULL DEFAULT 0,
  comments_count INT   NOT NULL DEFAULT 0,
  category       TEXT  NOT NULL DEFAULT 'publicacion'
                       CHECK (category IN ('publicacion', 'portafolio')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Post likes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ── 4. Row Level Security ────────────────────────────────────

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (makes this script re-runnable)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "posts_select"    ON posts;
DROP POLICY IF EXISTS "posts_insert"    ON posts;
DROP POLICY IF EXISTS "posts_update"    ON posts;
DROP POLICY IF EXISTS "posts_delete"    ON posts;
DROP POLICY IF EXISTS "likes_select"    ON post_likes;
DROP POLICY IF EXISTS "likes_insert"    ON post_likes;
DROP POLICY IF EXISTS "likes_delete"    ON post_likes;

-- Profiles: everyone can read; owners can write their own row
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: everyone can read; logged-in users can create; owners can update/delete
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Post likes: everyone can read; users manage their own likes
CREATE POLICY "likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- ── 5. Trigger: keep likes_count in sync ─────────────────────

CREATE OR REPLACE FUNCTION sync_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_likes ON post_likes;
CREATE TRIGGER trg_sync_likes
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION sync_likes_count();

-- ── 6. Trigger: auto-create profile on sign-up ───────────────
-- Reads name + role from the auth.users metadata set during signUp().
-- SECURITY DEFINER lets this run as the DB owner, bypassing RLS.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Estudiante')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
