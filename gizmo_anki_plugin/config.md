# Gizmo AI Configuration

All settings are accessible through **Tools → Add-ons → Gizmo → Config**.

## Feature Toggles

### AI Generation (`ai_enabled`)
- **Default:** `true`
- Enables the AI-powered flashcard generation button in the editor and import dialog.

### AI Tutor (`tutor_enabled`)
- **Default:** `true`
- Enables semantic grading and feedback during review sessions.

### Gamification (`gamification_enabled`)
- **Default:** `true`
- Enables lives, XP, levels, and streak bonuses.

## API Keys

### `gemini_api_key`
- **Default:** `""` (empty)
- Your Google AI API key for Gemini models.
- Get one at: https://makersuite.google.com

### `openai_api_key`
- **Default:** `""` (empty)
- Your OpenAI API key for GPT models.
- Get one at: https://platform.openai.com

> **Note:** At least one API key must be configured for AI features to work.

### `ai_model`
- **Options:** `gemini`, `gpt-4`, `gpt-3.5-turbo`
- **Default:** `gemini`
- Which AI model to use for flashcard generation.

## Tutor Settings

### `tutor_feedback`
- **Default:** `true`
- Show detailed feedback after each answer (accuracy, completeness, conciseness scores).

## Gamification

### `start_with_lives`
- **Default:** `3`
- Number of lives at the start of each review session (1-10).

### `xp_per_correct`
- **Default:** `10`
- Base XP awarded for correct answers.

### `xp_per_hard`
- **Default:** `5`
- Base XP awarded for hard answers.

### `streak_bonus_multiplier`
- **Default:** `1.5`
- Multiplier applied to XP when on a study streak.
- Formula: `1 + (streak_days - 1) × (multiplier - 1)`

### `overlay_position`
- **Options:** `top-left`, `top-right`, `bottom-left`, `bottom-right`
- **Default:** `top-right`
- Position of the gamification overlay in the reviewer.

---

## Storage

All settings are stored in Anki's add-on configuration system
(`mw.addonManager.getConfig()`), so they sync across your AnkiWeb
if you use a shared profile.

Gamification state (lives, XP, level, streak) is also stored in
the same config and persists between sessions.