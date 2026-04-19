# Gizmo Clone
A self-hosted, open-source clone of [Gizmo.ai](https://gizmo.ai) — an AI-powered flashcard and study tool with spaced repetition, automated quiz generation, and gamification.
> **Disclaimer**: This project is an independent, unofficial clone. We are not affiliated with, endorsed by, or connected to the official Gizmo.ai product in any way. All trademarks and branding belong to their respective owners.
## Features
### 📚 Multiple Import Sources
- **Text**: Paste any notes or study material
- **PDF Upload**: Extract text from PDF documents (robust Python backend)
- **PowerPoint (PPTX)**: Extract text from presentation slides
- **YouTube**: Import video transcripts with optional AI summary
- **Quizlet**: Import tab-separated flashcard decks
- **Anki**: Import CSV exports from Anki
### 🤖 AI-Powered Learning
- **Smart Quiz Generation**: Automatically generates multiple choice, true/false, and written answer questions from your content
- **AI Tutor**: Semantic grading for written/short answer questions using LLMs (OpenAI GPT or Google Gemini)
- **AI Video Summary**: Optional summarization of YouTube transcripts before quiz generation
### 🎯 Spaced Repetition (SRS)
- Full **SM-2 algorithm** implementation for optimal review scheduling
- Automatic card difficulty adjustment based on performance
- Due card tracking for efficient study sessions
### 🎮 Gamification
- **Lives system**: 3 lives, lose one on incorrect answers, gain back for 3 correct in a row
- **Streak tracking**: Daily study streaks with flame indicator
- **XP points**: Earn experience for completing decks
- **Game Over screen**: motivational restart flow
### 📁 Organization
- **Folder system**: Create custom folders with color coding
- **Drag-and-drop** (coming soon): Reorganize decks visually
- **Ungrouped section**: Decks without a folder are easily accessible
### 🎨 UI/UX
- Modern Material Design-inspired interface with glass morphism
- Dark mode optimised with dynamic color theming
- Responsive design for mobile and desktop
- Smooth animations and transitions
## Tech Stack
- **Framework**: Next.js 16.2.4 (App Router)
- **React**: 19.x with TypeScript
- **Styling**: Tailwind CSS v4
- **AI SDK**: @ai-sdk/google, @ai-sdk/openai (v3)
- **State Management**: React Context + localStorage persistence
- **Icons**: Lucide React + custom SVG icons
- **Backend**: Python-based PDF/PPTX extractors (robust subprocess)
## Project Structure
```
gizmo/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── generate/     # AI quiz generation
│   │   │   ├── tutor/        # AI grading endpoint
│   │   │   ├── extract-pdf/  # PDF text extraction
│   │   │   ├── extract-pptx/ # PowerPoint text extraction
│   │   │   └── youtube/      # YouTube transcript + summary
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── quiz/[id]/        # Study mode, summary, gameover
│   │   ├── layout.tsx
│   │   └── page.tsx          # Landing/auth page
│   ├── components/
│   │   └── SettingsMenu.tsx  # Settings dropdown
│   ├── lib/
│   │   ├── store.tsx         # Global state (Context)
│   │   └── srs.ts            # SM-2 algorithm implementation
│   └── ...
├── backend/                  # Python extraction services
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── services/        # Extraction & FSRS logic
│   │   └── database.py      # SQLite setup
│   ├── main.py              # FastAPI server
│   └── requirements.txt
├── scripts/
│   └── extract-pdf.py       # Standalone PDF extraction
├── AGENTS.md                # Instructions for AI assistants
├── CLAUDE.md                # Claude Code configuration
└── package.json
```
## Getting Started
### Prerequisites
- Node.js 18+ 
- Python 3.10+ (for PDF/PPTX extraction)
- API keys for AI features (optional: Gemini or OpenAI)
### Installation
1. **Clone the repository**
```bash
git clone https://github.com/iloveroblox1234629-create/gizmo-clone.git
cd gizmo
```
2. **Install dependencies**
```bash
npm install
```
3. **Install Python dependencies** (for PDF/PPTX extraction)
```bash
cd backend
pip install -r requirements.txt
cd ..
```
4. **Environment Configuration**
Create a `.env.local` file in the project root:
```bash
cp .env.example .env.local  # if example exists
```
Or configure API keys directly in the app settings (Settings → API Keys):
- `GEMINI_API_KEY` — Google AI (preferred)
- `OPENAI_API_KEY` — OpenAI fallback
- `YOUTUBE_API_KEY` — Optional, for video titles
5. **Run the development server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start using Gizmo.
## Usage Guide
### Creating a Deck
1. Log in (account stored locally; no server required)
2. On the Dashboard, choose an import source:
   - **Text**: Paste notes directly
   - **PDF/PPTX**: Upload a file for text extraction
   - **YouTube**: Paste a video URL → fetch transcript → optionally AI-summarize
   - **Quizlet/Anki**: Paste exported content in delimited format
3. (Optional) Assign a folder and give the deck a name
4. Select question types: Mixed, MCQ, True/False, Written, or Short Answer
5. Click **Generate Quiz**
### Studying
- Cards are presented one at a time
- Answer using the on-screen keyboard or input field
- AI grades written/short answers semantically (not exact match)
- Rate your recall: **Again** / **Hard** / **Good** / **Easy**
- SRS algorithm schedules next review automatically
- Streak counter updates daily (midnight UTC)
- Lose a life on wrong answers — 3 correct in a row restores one
### Managing Decks
- **Resume**: Click any deck card to continue where you left off
- **Delete**: × button on deck card (visible on hover)
- **Move to Folder**: 📁 button (visible on hover)
- **Folders**: Create with + New Folder, rename/delete via folder header
### Settings
Access via gear icon (top right):
- Enter API keys (saved to localStorage)
- Change theme color (affects accent throughout app)
- Export/import data (JSON backup)
## Development
### Key Commands
```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check (includes TypeScript)
```
### Architecture Notes
- **Hydration Strategy**: Store uses a `loadingState` placeholder until localStorage hydrates to avoid "NaN" attribute errors.
- **PDF Parsing**: Native JS PDF libraries fail in Next.js due to worker bundling. We use a Python subprocess (`pypdf`) via `child_process.spawn` for reliable extraction.
- **State**: React Context in `src/lib/store.tsx` with localStorage persistence. Decks, folders, SRS data, and user stats all survive page reloads.
- **SM-2**: Custom implementation (`src/lib/srs.ts`) based on the classic SuperMemo algorithm.
- **AI Tutor**: Uses the AI SDK to call OpenAI GPT or Google Gemini for semantic answer grading of written responses.
### Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
Please follow the existing code style and ensure `npm run lint` passes.
## Roadmap
- [ ] **Quizlet/Anki Direct Import**: File upload support (CSV, TXT, APKG)
- [ ] **Image OCR**: Extract text from photos of handwritten notes
- [ ] **Shared Decks**: Public deck library and user sharing
- [ ] **Statistics Dashboard**: Detailed learning analytics
- [ ] **Export/Import**: Full JSON backup and restore
- [ ] **Mobile App**: React Native or Capacitor wrapper
- [ ] **Collaborative Decks**: Multi-user editing
- [ ] **Audio Support**: Voice-input answers and text-to-speech
## Known Limitations
- Requires an internet connection for AI features (quiz generation, tutor grading, YouTube summary)
- Large PDFs may take time to process (Python backend)
- LocalStorage limits may apply (~5-10MB); large decks should use export/import backup
- No real-time sync between devices (local-only storage)
## License
MIT License — feel free to self-host, modify, and distribute.
---
**Note**: This is an educational/personal project. Gizmo.ai is a trademark of its respective owners. This clone is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Gizmo.ai or any of its subsidiaries.
