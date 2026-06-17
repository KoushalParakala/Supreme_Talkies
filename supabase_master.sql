-- ═══════════════════════════════════════════════════════════════
-- SUPREME TALKIES — MASTER DATABASE SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- SECTION 1: ERASER — drop everything cleanly
-- ────────────────────────────────────────────────────────────────

-- Storage policies
DROP POLICY IF EXISTS "Avatar public read"              ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated upload"    ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated update"    ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated delete"    ON storage.objects;
DROP POLICY IF EXISTS "Cinematic assets public read"   ON storage.objects;
DROP POLICY IF EXISTS "Cinematic assets admin upload"  ON storage.objects;
DROP POLICY IF EXISTS "Public Access"                  ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Drop as TABLE first (old scripts created them as tables), then as VIEW
DROP TABLE IF EXISTS public.campaign_leaderboard CASCADE;
DROP VIEW  IF EXISTS public.campaign_leaderboard CASCADE;
DROP TABLE IF EXISTS public.member_directory    CASCADE;
DROP VIEW  IF EXISTS public.member_directory    CASCADE;

-- Tables (child → parent order)
DROP TABLE IF EXISTS public.presentation_reactions    CASCADE;
DROP TABLE IF EXISTS public.presentations             CASCADE;
DROP TABLE IF EXISTS public.audience_reactions        CASCADE;
DROP TABLE IF EXISTS public.challenge_submissions     CASCADE;
DROP TABLE IF EXISTS public.writing_challenges        CASCADE;
DROP TABLE IF EXISTS public.inspiration_pins          CASCADE;
DROP TABLE IF EXISTS public.brief_interests           CASCADE;
DROP TABLE IF EXISTS public.collab_requests           CASCADE;
DROP TABLE IF EXISTS public.film_briefs               CASCADE;
DROP TABLE IF EXISTS public.script_versions           CASCADE;
DROP TABLE IF EXISTS public.scripts                   CASCADE;
DROP TABLE IF EXISTS public.project_room_members      CASCADE;
DROP TABLE IF EXISTS public.project_rooms             CASCADE;
DROP TABLE IF EXISTS public.campaign_assignments      CASCADE;
DROP TABLE IF EXISTS public.campaigns                 CASCADE;
DROP TABLE IF EXISTS public.shoutout_wall             CASCADE;
DROP TABLE IF EXISTS public.amplifier_groups          CASCADE;
DROP TABLE IF EXISTS public.submissions               CASCADE;
DROP TABLE IF EXISTS public.admin_templates           CASCADE;
DROP TABLE IF EXISTS public.films                     CASCADE;
DROP TABLE IF EXISTS public.profiles                  CASCADE;

-- ────────────────────────────────────────────────────────────────
-- SECTION 2: EXTENSIONS
-- ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────────
-- SECTION 3: STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cinematic_assets', 'cinematic_assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ────────────────────────────────────────────────────────────────
-- SECTION 4: CORE TABLES
-- ────────────────────────────────────────────────────────────────

-- 4.1 PROFILES (central user record)
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT,
  full_name         TEXT,
  age               INT,
  phone             TEXT,
  avatar_url        TEXT,
  avatar_symbol     TEXT DEFAULT '🎬',
  role              TEXT DEFAULT 'member',
  roles             TEXT[] DEFAULT '{}',
  st_id             TEXT UNIQUE,
  st_verified       BOOLEAN DEFAULT FALSE,
  is_early_access   BOOLEAN DEFAULT FALSE,
  availability      BOOLEAN DEFAULT TRUE,
  share_streak      INT DEFAULT 0,
  last_share_at     TIMESTAMPTZ,
  niche             TEXT,
  experience        TEXT,
  portfolio_url     TEXT,
  skills            TEXT[] DEFAULT '{}',
  contact           TEXT,
  social_handle     TEXT,
  note_to_team      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 FILMS (admin managed)
CREATE TABLE public.films (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  logline       TEXT,
  synopsis      TEXT,
  director      TEXT,
  producer      TEXT,
  cast_members  TEXT,
  rating        TEXT DEFAULT 'UA',
  duration      TEXT,
  color         TEXT DEFAULT '#0a0a0a',
  special_note  TEXT,
  video_link    TEXT,
  reel_image    TEXT,
  poster_image  TEXT,
  stills        TEXT[] DEFAULT '{}',
  coming_soon   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 SUBMISSIONS (general inbox, all types)
CREATE TABLE public.submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- 'script','portfolio','film','collab','producer_interest'
  data        JSONB DEFAULT '{}',
  status      TEXT DEFAULT 'submitted', -- submitted, under_review, accepted, archived
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 SCRIPTS (writer submissions)
CREATE TABLE public.scripts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  logline        TEXT,
  pdf_url        TEXT,                  -- Google Drive / PDF link
  dna_mood       TEXT[] DEFAULT '{}',
  dna_setting    TEXT[] DEFAULT '{}',
  dna_format     TEXT,
  status         TEXT DEFAULT 'submitted',
  kanban_stage   TEXT DEFAULT 'inbox',  -- inbox, under_review, shortlisted, accepted, rejected, archived
  version_number INT DEFAULT 1,
  version_notes  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 SCRIPT VERSIONS (revision history)
CREATE TABLE public.script_versions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id      UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title          TEXT,
  logline        TEXT,
  pdf_url        TEXT,                  -- Google Drive / PDF link
  version_notes  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4.6 WRITING CHALLENGES
CREATE TABLE public.writing_challenges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  prompt      TEXT,
  prize       TEXT,
  deadline    TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4.7 CHALLENGE SUBMISSIONS
CREATE TABLE public.challenge_submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.writing_challenges(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  script_id    UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- 4.8 INSPIRATION PINS (writer pinboard)
CREATE TABLE public.inspiration_pins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  url        TEXT,
  note       TEXT,
  type       TEXT DEFAULT 'LINK',       -- LINK, QUOTE, FILM REF
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.9 FILM BRIEFS (producer posts)
CREATE TABLE public.film_briefs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producer_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  genre        TEXT[] DEFAULT '{}',
  budget_range TEXT,
  timeline     TEXT,
  looking_for  TEXT[] DEFAULT '{}',
  is_open      BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4.10 BRIEF INTERESTS (writers/technicians → producers)
CREATE TABLE public.brief_interests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id   UUID REFERENCES public.film_briefs(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brief_id, user_id)
);

-- 4.11 COLLAB REQUESTS (peer-to-peer)
CREATE TABLE public.collab_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_title TEXT,
  message       TEXT,
  status        TEXT DEFAULT 'pending',  -- pending, accepted, declined
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4.12 PROJECT ROOMS (admin collaboration spaces)
CREATE TABLE public.project_rooms (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                    TEXT NOT NULL,
  script_id                UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  notes                    TEXT,
  status                   TEXT DEFAULT 'active',  -- active, completed, archived
  created_by               UUID REFERENCES public.profiles(id),
  member_ids               UUID[] DEFAULT '{}',
  completion_badge_awarded BOOLEAN DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 4.13 PROJECT ROOM MEMBERS (normalized join, optional)
CREATE TABLE public.project_room_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID REFERENCES public.project_rooms(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(room_id, user_id)
);

-- 4.14 CAMPAIGNS (marketing + admin)
CREATE TABLE public.campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  goal          TEXT,
  platform      TEXT[] DEFAULT '{}',
  niche         TEXT,
  start_date    DATE,
  end_date      DATE,
  deadline      TIMESTAMPTZ,
  reach_target  TEXT,
  actual_reach  INT DEFAULT 0,
  status        TEXT DEFAULT 'active',   -- active, completed
  kit_captions  TEXT,
  kit_hashtags  TEXT,
  kit_drive_link TEXT,
  group_sync_at TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4.15 CAMPAIGN ASSIGNMENTS
CREATE TABLE public.campaign_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  points      INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  reach       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- 4.16 SHOUTOUT WALL (amplifier)
CREATE TABLE public.shoutout_wall (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  link       TEXT,
  likes      INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.17 AMPLIFIER GROUPS
CREATE TABLE public.amplifier_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES public.profiles(id),
  member_ids  UUID[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4.18 PRESENTATIONS (presenter screenings)
CREATE TABLE public.presentations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  synopsis        TEXT,
  screening_date  TIMESTAMPTZ NOT NULL,
  territory       TEXT,
  expected_reach  TEXT,
  actual_reach    INT DEFAULT 0,
  status          TEXT DEFAULT 'submitted',  -- submitted, approved, screened
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4.19 PRESENTATION REACTIONS
CREATE TABLE public.presentation_reactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction        TEXT NOT NULL,  -- '🔥','👏','😮','❤️'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4.20 AUDIENCE REACTIONS (on scripts, used by producer)
CREATE TABLE public.audience_reactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction      TEXT NOT NULL,  -- 'fire'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id, reaction)
);

-- 4.21 ADMIN TEMPLATES
CREATE TABLE public.admin_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label      TEXT NOT NULL,
  type       TEXT DEFAULT 'REPLY',  -- REPLY, ANNOUNCEMENT
  subject    TEXT,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- SECTION 5: VIEWS
-- ────────────────────────────────────────────────────────────────

-- 5.1 member_directory (used by many dashboards via directory.ts)
CREATE OR REPLACE VIEW public.member_directory AS
SELECT
  id,
  full_name,
  avatar_url,
  avatar_symbol,
  role,
  roles,
  st_id,
  st_verified,
  niche,
  experience,
  portfolio_url,
  skills,
  contact,
  social_handle,
  note_to_team,
  availability,
  is_early_access,
  share_streak,
  created_at
FROM public.profiles;

-- 5.2 campaign_leaderboard (marketing dashboard)
CREATE OR REPLACE VIEW public.campaign_leaderboard AS
SELECT
  user_id,
  SUM(points)      AS points,
  SUM(posts_count) AS posts_count,
  SUM(reach)       AS reach
FROM public.campaign_assignments
GROUP BY user_id;

-- ────────────────────────────────────────────────────────────────
-- SECTION 6: AUTO ST_ID TRIGGER
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_st_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.st_id IS NULL THEN
    NEW.st_id := 'SUPR-' || LPAD((floor(random() * 90000) + 10000)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_st_id ON public.profiles;
CREATE TRIGGER trg_assign_st_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_st_id();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_symbol, role, roles, st_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    '🎬',
    'member',
    ARRAY['member'],
    'SUPR-' || LPAD((floor(random() * 90000) + 10000)::TEXT, 5, '0')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- SECTION 7: RLS
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_versions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_challenges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_pins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_briefs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_interests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_room_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoutout_wall         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amplifier_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_templates       ENABLE ROW LEVEL SECURITY;

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  -- Fast-path JWT check: avoids database queries for predefined admin emails
  IF auth.jwt() ->> 'email' IN ('admin@supremetalkies.com', 'koushal.sub@gmail.com') THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND ('admin' = ANY(roles) OR role = 'admin')
  );
END;
$$;

-- ── PROFILES ──
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own"  ON public.profiles FOR DELETE  TO authenticated USING (auth.uid() = id);

-- ── MEMBER DIRECTORY VIEW (public read) ──
-- Views inherit RLS from underlying table but we grant select explicitly
GRANT SELECT ON public.member_directory TO authenticated, anon;

-- ── FILMS (public read, admin write) ──
CREATE POLICY "films_public_read"    ON public.films FOR SELECT  USING (true);
CREATE POLICY "films_admin_write"    ON public.films FOR ALL     TO authenticated USING (public.is_admin());

-- ── SUBMISSIONS ──
CREATE POLICY "submissions_own"      ON public.submissions FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "submissions_insert"   ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── SCRIPTS ──
CREATE POLICY "scripts_own"          ON public.scripts FOR SELECT  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "scripts_public_read"  ON public.scripts FOR SELECT  USING (status != 'draft');
CREATE POLICY "scripts_insert"       ON public.scripts FOR INSERT  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scripts_update"       ON public.scripts FOR UPDATE  TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "scripts_admin_kanban" ON public.scripts FOR UPDATE  TO authenticated USING (public.is_admin());

-- ── SCRIPT VERSIONS ──
CREATE POLICY "script_versions_own"  ON public.script_versions FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "script_versions_ins"  ON public.script_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── WRITING CHALLENGES (public read, admin write) ──
CREATE POLICY "challenges_read"      ON public.writing_challenges FOR SELECT USING (true);
CREATE POLICY "challenges_admin"     ON public.writing_challenges FOR ALL   TO authenticated USING (public.is_admin());

-- ── CHALLENGE SUBMISSIONS ──
CREATE POLICY "chsub_own"            ON public.challenge_submissions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chsub_insert"         ON public.challenge_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── INSPIRATION PINS ──
CREATE POLICY "pins_own"             ON public.inspiration_pins FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pins_insert"          ON public.inspiration_pins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── FILM BRIEFS ──
CREATE POLICY "briefs_public_read"   ON public.film_briefs FOR SELECT USING (is_open = true OR auth.uid() = producer_id OR public.is_admin());
CREATE POLICY "briefs_producer"      ON public.film_briefs FOR ALL   TO authenticated USING (auth.uid() = producer_id OR public.is_admin());
CREATE POLICY "briefs_insert"        ON public.film_briefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = producer_id);

-- ── BRIEF INTERESTS ──
CREATE POLICY "bint_own_or_producer" ON public.brief_interests FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.film_briefs WHERE id = brief_id AND producer_id = auth.uid()) OR
  public.is_admin()
);
CREATE POLICY "bint_insert"          ON public.brief_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── COLLAB REQUESTS ──
CREATE POLICY "collab_parties"       ON public.collab_requests FOR ALL TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "collab_insert"        ON public.collab_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- ── PROJECT ROOMS ──
CREATE POLICY "rooms_member_or_admin" ON public.project_rooms FOR SELECT USING (auth.uid() = ANY(member_ids) OR public.is_admin());
CREATE POLICY "rooms_admin_write"     ON public.project_rooms FOR ALL   TO authenticated USING (public.is_admin());
CREATE POLICY "rooms_insert"          ON public.project_rooms FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ── CAMPAIGNS ──
CREATE POLICY "campaigns_read"       ON public.campaigns FOR SELECT USING (status = 'active' OR auth.uid() = created_by OR public.is_admin());
CREATE POLICY "campaigns_write"      ON public.campaigns FOR ALL   TO authenticated USING (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "campaigns_insert"     ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR public.is_admin());

-- ── CAMPAIGN ASSIGNMENTS ──
CREATE POLICY "cassign_own"          ON public.campaign_assignments FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "cassign_view_board"   ON public.campaign_assignments FOR SELECT USING (true);

-- ── SHOUTOUT WALL ──
CREATE POLICY "shoutout_public_read" ON public.shoutout_wall FOR SELECT USING (true);
CREATE POLICY "shoutout_own"         ON public.shoutout_wall FOR ALL   TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "shoutout_insert"      ON public.shoutout_wall FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── AMPLIFIER GROUPS ──
CREATE POLICY "groups_member"        ON public.amplifier_groups FOR SELECT USING (auth.uid() = ANY(member_ids));
CREATE POLICY "groups_write"         ON public.amplifier_groups FOR ALL   TO authenticated USING (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "groups_insert"        ON public.amplifier_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- ── PRESENTATIONS ──
CREATE POLICY "pres_own"             ON public.presentations FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "pres_insert"          ON public.presentations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── PRESENTATION REACTIONS ──
CREATE POLICY "preact_public_read"   ON public.presentation_reactions FOR SELECT USING (true);
CREATE POLICY "preact_own"           ON public.presentation_reactions FOR ALL   TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "preact_insert"        ON public.presentation_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── AUDIENCE REACTIONS ──
CREATE POLICY "areact_public_read"   ON public.audience_reactions FOR SELECT USING (true);
CREATE POLICY "areact_own"           ON public.audience_reactions FOR ALL   TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "areact_insert"        ON public.audience_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── ADMIN TEMPLATES ──
CREATE POLICY "atpl_admin"           ON public.admin_templates FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "atpl_read"            ON public.admin_templates FOR SELECT USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- SECTION 8: STORAGE POLICIES
-- ────────────────────────────────────────────────────────────────

-- AVATARS: path must be {uid}/filename
CREATE POLICY "Avatar public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CINEMATIC ASSETS: public read, admin write
CREATE POLICY "Cinematic assets public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'cinematic_assets');

CREATE POLICY "Cinematic assets admin upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cinematic_assets' AND public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- SECTION 9: INDEXES
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scripts_user_id      ON public.scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_kanban        ON public.scripts(kanban_stage);
CREATE INDEX IF NOT EXISTS idx_script_ver_script_id  ON public.script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id   ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_briefs_producer_id    ON public.film_briefs(producer_id);
CREATE INDEX IF NOT EXISTS idx_briefs_open           ON public.film_briefs(is_open);
CREATE INDEX IF NOT EXISTS idx_collab_sender         ON public.collab_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_collab_receiver       ON public.collab_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status      ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_shoutout_created      ON public.shoutout_wall(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON public.presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_st_id        ON public.profiles(st_id);

-- ────────────────────────────────────────────────────────────────
-- SECTION 10: SEED — backfill existing users with SUPR IDs
-- ────────────────────────────────────────────────────────────────
UPDATE public.profiles
SET st_id = 'SUPR-' || LPAD((floor(random() * 90000) + 10000)::TEXT, 5, '0')
WHERE st_id IS NULL;

-- Make koushal.sub@gmail.com admin (adjust email if needed)
UPDATE public.profiles
SET role = 'admin', roles = array_append(COALESCE(roles, '{}'), 'admin')
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'koushal.sub@gmail.com'
)
AND NOT ('admin' = ANY(COALESCE(roles, '{}')));
