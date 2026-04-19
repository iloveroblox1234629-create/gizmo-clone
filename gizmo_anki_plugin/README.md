# Gizmo AI for Anki

AI-powered flashcard generation, tutoring, and gamification for Anki.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Anki](https://img.shields.io/badge/Anki-2.1.65%2B-green)
![Python](https://img.shields.io/badge/python-3.9%2B-yellow)

## Features

### 1. AI Flashcard Generation
- Select any text in the editor → click ✨ to generate Q&A cards
- Uses GPT-4 or Google Gemini
- Review and edit cards before adding to deck

### 2. AI Tutor
- Semantic grading during review
- Feedback on accuracy, completeness, and conciseness
- Personalized improvement suggestions

### 3. Gamification
- Lives system (lose a life for "Again")
- XP and level progression
- Daily streaks with bonus multipliers
- Optional overlay in reviewer

### 4. Multi-Format Import
Import from:
- Plain text (.txt)
- Quizlet TSV exports
- Anki CSV files
- PDF documents (requires PyMuPDF or pdftotext)
- PowerPoint (.pptx) (requires python-pptx)
- YouTube videos (requires yt-dlp)

## Installation

### From GitHub (Development)

1. Clone or download this repository:
```bash
cd ~/Documents/Anki/addons21  # Or your add-ons folder
git clone https://github.com/anomalyco/gizmo-anki.git gizmo_anki_plugin
cd gizmo_anki_plugin
```

2. Install Python dependencies (in your Anki virtual environment or system):
```bash
# Basic requirements (all required)
pip install openai google-generativeai

# For PDF import (optional)
pip install pymupdf  # OR install system: brew install poppler (macOS)

# For PowerPoint import (optional)
pip install python-pptx

# For YouTube import (optional)
pip install yt-dlp
```

3. Restart Anki.

### Configure
1. Go to **Tools → Add-ons → Gizmo → Config**
2. Enter your API key (Gemini recommended - free quota available)
3. Adjust settings as needed
4. Click OK

## Quick Start

### Generate Flashcards
1. Open any note editor
2. Select some text
3. Click the ✨ button in the toolbar
4. Adjust number of cards
5. Click "Generate Flashcards"
6. Review and edit the generated cards
7. Click "Add to Anki"

### Import from File
1. **Tools → Gizmo AI → Import...**
2. Select format (Text, Quizlet, CSV, etc.)
3. Choose file or paste URL
4. Preview generated cards
5. Confirm import

### AI Tutor
- Just review as normal
- After answering, a feedback popup appears showing:
  - Semantic accuracy score
  - Breakdown: Accuracy / Completeness / Conciseness
  - Personalized feedback text

### Gamification
- Lives shown in top-right overlay (configurable)
- Lose a life for "Again" answers
- Gain XP for correct answers
- Streak bonus multiplies XP
- Overlay updates in real-time

## File Structure

```
gizmo_anki_plugin/
├── __init__.py           # Add-on entry point
├── manifest.json         # Anki metadata
├── config.json           # Default config
├── config.schema.json    # Validation schema
├── config.md             # Configuration docs
├── src/
│   ├── __init__.py
│   ├── config.py         # Config management
│   ├── ai_client.py      # OpenAI & Gemini integration
│   ├── models.py         # Note type & card creation
│   ├── dialog.py         # Generation & config dialogs
│   ├── editor.py         # Toolbar button
│   ├── reviewer.py       # Tutor hooks & gamification
│   ├── gamification.py   # Lives, XP, streaks
│   └── importer.py       # Multi-format import
├── web/
│   └── reviewer_overlay.html  # Gamification overlay UI
└── user_files/           # Storages (empty)
```

## Architecture

### Note Type: "Gizmo-AI"
Fields:
- **Front** - Question/prompt
- **Back** - Answer
- **Type** - Card type (e.g., "Basic", "Cloze", "AI-generated")
- **AIHint** - Optional hint/context

Cards created with this note type are fully compatible with vanilla Anki.
Removing the add-on won't break existing cards.

### Compatibility
- Anki 2.1.65+ (Qt6/PyQt6)
- Python 3.9+
- Modern Anki APIs (mw.col, mw.pm, gui_hooks)

### Dependencies
**Required:**
- `openai` — OpenAI API client
- `google-generativeai` — Google AI SDK

**Optional:**
- `pymupdf` — PDF import (preferred)
- `python-pptx` — PowerPoint import
- `yt-dlp` — YouTube import

## Development

### Local Testing
```bash
# Enable debug logging in Anki
# View console for gizmo logs
```

### Common Issues

**"API key not configured"**
- Open config dialog via Tools → Add-ons → Gizmo → Config
- Enter your API key

**Import fails with missing dependency**
- Install the required package
- For PDF: `brew install poppler` (macOS) or `apt install poppler-utils` (Ubuntu)

**Overlay not showing**
- Gamification must be enabled in config
- Restart Anki if overlay doesn't appear

## Roadmap

- [ ] Cloze deletion support
- [ ] Bulk import from folder
- [ ] Custom card templates
- [ ] AI-generated images
- [ ] Auto-tagging
- [ ] Export statistics
- [ ] Community deck sharing

## License

MIT License - see LICENSE file.

## Support

Report issues: https://github.com/anomalyco/gizmo-anki/issues
Contribute: PRs welcome!

---

Made with ❤️ for the Anki community.