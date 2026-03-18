-- =============================================================================
-- Arcana Co-Author Studio — Row Level Security Policies
-- Enforces project-scoped access: users can only access data within projects
-- they are a member of.
-- =============================================================================

-- Helper: check if the current user is a member of the given project
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM ews_project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if the current user is an admin of the given project
CREATE OR REPLACE FUNCTION public.is_project_admin(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM ews_project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- ews_profiles
-- Users can read any profile, update only their own
-- =============================================================================

CREATE POLICY "Profiles are viewable by authenticated users"
  ON ews_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON ews_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profile insert handled by trigger (SECURITY DEFINER), no direct policy needed

-- =============================================================================
-- ews_projects
-- Members can read their projects; creators can insert; admins can update/delete
-- =============================================================================

CREATE POLICY "Project members can view projects"
  ON ews_projects FOR SELECT
  TO authenticated
  USING (public.is_project_member(id));

CREATE POLICY "Authenticated users can create projects"
  ON ews_projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project admins can update projects"
  ON ews_projects FOR UPDATE
  TO authenticated
  USING (public.is_project_admin(id))
  WITH CHECK (public.is_project_admin(id));

CREATE POLICY "Project admins can delete projects"
  ON ews_projects FOR DELETE
  TO authenticated
  USING (public.is_project_admin(id));

-- =============================================================================
-- ews_project_members
-- Members can view memberships; admins can manage them
-- =============================================================================

CREATE POLICY "Project members can view memberships"
  ON ews_project_members FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project admins can add members"
  ON ews_project_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_project_admin(project_id));

CREATE POLICY "Project admins can update members"
  ON ews_project_members FOR UPDATE
  TO authenticated
  USING (public.is_project_admin(project_id))
  WITH CHECK (public.is_project_admin(project_id));

CREATE POLICY "Project admins can remove members"
  ON ews_project_members FOR DELETE
  TO authenticated
  USING (public.is_project_admin(project_id));

-- Allow project creator to self-insert as first member
CREATE POLICY "Project creators can add themselves as member"
  ON ews_project_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Content tables: chapters, conversations, songs, images, characters, themes
-- All follow the same pattern: project members can CRUD within their projects
-- =============================================================================

-- ews_chapters
CREATE POLICY "Project members can view chapters"
  ON ews_chapters FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can create chapters"
  ON ews_chapters FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update chapters"
  ON ews_chapters FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete chapters"
  ON ews_chapters FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id));

-- ews_conversations
CREATE POLICY "Project members can view conversations"
  ON ews_conversations FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can create conversations"
  ON ews_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update conversations"
  ON ews_conversations FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete conversations"
  ON ews_conversations FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id));

-- ews_songs
CREATE POLICY "Project members can view songs"
  ON ews_songs FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can create songs"
  ON ews_songs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update songs"
  ON ews_songs FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete songs"
  ON ews_songs FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id));

-- ews_images
CREATE POLICY "Project members can view images"
  ON ews_images FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can create images"
  ON ews_images FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update images"
  ON ews_images FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete images"
  ON ews_images FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id));

-- ews_characters
CREATE POLICY "Project members can view characters"
  ON ews_characters FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can create characters"
  ON ews_characters FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update characters"
  ON ews_characters FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete characters"
  ON ews_characters FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id));

-- ews_themes
CREATE POLICY "Project members can view themes"
  ON ews_themes FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can create themes"
  ON ews_themes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update themes"
  ON ews_themes FOR UPDATE
  TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete themes"
  ON ews_themes FOR DELETE
  TO authenticated
  USING (public.is_project_member(project_id));
