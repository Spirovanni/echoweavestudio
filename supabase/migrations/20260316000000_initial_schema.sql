-- =============================================================================
-- Echo Weave Studio — Core Schema
-- PRD sections 14.1 (core tables)
-- =============================================================================

-- Use Supabase Auth's auth.users for authentication.
-- This profiles table stores app-specific user data and references auth.users.

-- ews_profiles (maps to PRD "users" table)
CREATE TABLE ews_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'admin', 'reader')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ews_profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ews_projects
CREATE TABLE ews_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES ews_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project members (supports the two co-author model + future collaborators)
CREATE TABLE ews_project_members (
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ews_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'admin')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ews_chapters
CREATE TABLE ews_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'outline', 'draft', 'revision', 'complete', 'published')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES ews_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ews_conversations
CREATE TABLE ews_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES ews_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ews_songs
CREATE TABLE ews_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lyrics TEXT,
  audio_url TEXT,
  mood TEXT,
  created_by UUID NOT NULL REFERENCES ews_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ews_images
CREATE TABLE ews_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  symbolism TEXT,
  created_by UUID NOT NULL REFERENCES ews_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ews_characters
CREATE TABLE ews_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  symbolism TEXT,
  created_by UUID NOT NULL REFERENCES ews_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ews_themes
CREATE TABLE ews_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ews_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES ews_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes for common query patterns
-- =============================================================================

CREATE INDEX idx_chapters_project ON ews_chapters(project_id);
CREATE INDEX idx_chapters_status ON ews_chapters(project_id, status);
CREATE INDEX idx_conversations_project ON ews_conversations(project_id);
CREATE INDEX idx_songs_project ON ews_songs(project_id);
CREATE INDEX idx_images_project ON ews_images(project_id);
CREATE INDEX idx_characters_project ON ews_characters(project_id);
CREATE INDEX idx_themes_project ON ews_themes(project_id);
CREATE INDEX idx_project_members_user ON ews_project_members(user_id);

-- =============================================================================
-- updated_at auto-refresh trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_songs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_characters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ews_themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- Row Level Security — enabled here, policies defined in a separate migration
-- =============================================================================

ALTER TABLE ews_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_themes ENABLE ROW LEVEL SECURITY;
