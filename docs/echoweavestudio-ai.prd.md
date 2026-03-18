# EchoWeave Studio - AI Creative Engine & Publishing PRD

## Architecture
- LLM Integrations: OpenAI/Anthropic APIs for text generation.
- Media APIs: Midjourney/DALL-E for images, Suno/Udio for audio.
- Database: `ews_ai_prompts`, `ews_ai_generations`.

## Modules
- **AI Creative Engine**: The Muse (Copilot chat), AI-assisted chapter writing, Character/Theme tracking.
- **Publishing System**: Public landing page, multimedia reader UI with auto-playing music and inline art.

## Feature Sets
- Copilot interface for brainstorming and querying lore.
- Inline text synthesis and tone suggestions.
- Generate and gallery-view AI images based on project context.
- Generate and library-view AI mood music.
- Public URL generation and multimedia reading experience.

## Implementation Tasks
- Integrate LLM endpoints and build helper utilities.
- Build "The Muse" chat interface.
- Add AI text generation to Chapter editor.
- Integrate image and audio generation APIs.
- Build reader-facing public site.
- Implement multimedia playback in reader.
