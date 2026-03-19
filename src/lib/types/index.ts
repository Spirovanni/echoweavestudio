// Shared TypeScript types for Arcana Co-Author Studio
// Mirrors the Supabase PostgreSQL schema in supabase/migrations/

export type EntityType =
  | "chapter"
  | "song"
  | "image"
  | "conversation"
  | "character"
  | "theme"
  | "note";

// Linkable entity types (entities that can be linked to chapters)
export type LinkableEntityType =
  | "song"
  | "image"
  | "conversation"
  | "character"
  | "theme";

export type ChapterStatus =
  | "idea"
  | "outline"
  | "draft"
  | "revision"
  | "complete"
  | "published";

export type UserRole = "author" | "admin" | "reader";
export type ProjectMemberRole = "author" | "admin";

// --- Core entities ---

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  joined_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  summary: string | null;
  content: Record<string, unknown> | null; // Tiptap JSON
  status: ChapterStatus;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  project_id: string;
  title: string;
  lyrics: string | null;
  audio_url: string | null;
  mood: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  project_id: string;
  title: string;
  image_url: string;
  caption: string | null;
  symbolism: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  symbolism: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterRevision {
  id: string;
  chapter_id: string;
  content: Record<string, unknown> | null; // Tiptap JSON
  title: string;
  summary: string | null;
  edited_by: string;
  created_at: string;
}

// --- Entity Linking (Junction Tables) ---

export interface ChapterSongLink {
  chapter_id: string;
  song_id: string;
  created_at: string;
}

export interface ChapterImageLink {
  chapter_id: string;
  image_id: string;
  created_at: string;
}

export interface ChapterConversationLink {
  chapter_id: string;
  conversation_id: string;
  created_at: string;
}

export interface ChapterCharacterLink {
  chapter_id: string;
  character_id: string;
  created_at: string;
}

export interface ChapterThemeLink {
  chapter_id: string;
  theme_id: string;
  created_at: string;
}

// Generic link interface
export interface EntityLink {
  chapter_id: string;
  entity_id: string;
  entity_type: LinkableEntityType;
  created_at: string;
}

// Mapping from entity type to linked entity data
export type LinkedEntityData = {
  song: Song;
  image: Image;
  conversation: Conversation;
  character: Character;
  theme: Theme;
};

// Mapping from entity type to table name
export const LINK_TABLE_MAP: Record<LinkableEntityType, string> = {
  song: "ews_chapter_songs",
  image: "ews_chapter_images",
  conversation: "ews_chapter_conversations",
  character: "ews_chapter_characters",
  theme: "ews_chapter_themes",
};

// Mapping from entity type to entity table name
export const ENTITY_TABLE_MAP: Record<LinkableEntityType, string> = {
  song: "ews_songs",
  image: "ews_images",
  conversation: "ews_conversations",
  character: "ews_characters",
  theme: "ews_themes",
};

// Mapping from entity type to ID column name in junction table
export const LINK_ID_COLUMN_MAP: Record<LinkableEntityType, string> = {
  song: "song_id",
  image: "image_id",
  conversation: "conversation_id",
  character: "character_id",
  theme: "theme_id",
};

// --- Supabase database type helper ---

export interface Database {
  public: {
    Tables: {
      ews_profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Omit<Profile, "id">> };
      ews_projects: { Row: Project; Insert: Omit<Project, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Project, "id">> };
      ews_project_members: { Row: ProjectMember; Insert: Omit<ProjectMember, "joined_at">; Update: Partial<ProjectMember> };
      ews_chapters: { Row: Chapter; Insert: Omit<Chapter, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Chapter, "id">> };
      ews_conversations: { Row: Conversation; Insert: Omit<Conversation, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Conversation, "id">> };
      ews_songs: { Row: Song; Insert: Omit<Song, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Song, "id">> };
      ews_images: { Row: Image; Insert: Omit<Image, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Image, "id">> };
      ews_characters: { Row: Character; Insert: Omit<Character, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Character, "id">> };
      ews_themes: { Row: Theme; Insert: Omit<Theme, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Theme, "id">> };
      ews_comments: { Row: Comment; Insert: Omit<Comment, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Comment, "id">> };
      ews_chapter_revisions: { Row: ChapterRevision; Insert: Omit<ChapterRevision, "id" | "created_at">; Update: Partial<Omit<ChapterRevision, "id">> };
      // Junction tables
      ews_chapter_songs: { Row: ChapterSongLink; Insert: Omit<ChapterSongLink, "created_at">; Update: never };
      ews_chapter_images: { Row: ChapterImageLink; Insert: Omit<ChapterImageLink, "created_at">; Update: never };
      ews_chapter_conversations: { Row: ChapterConversationLink; Insert: Omit<ChapterConversationLink, "created_at">; Update: never };
      ews_chapter_characters: { Row: ChapterCharacterLink; Insert: Omit<ChapterCharacterLink, "created_at">; Update: never };
      ews_chapter_themes: { Row: ChapterThemeLink; Insert: Omit<ChapterThemeLink, "created_at">; Update: never };
    };
  };
}
