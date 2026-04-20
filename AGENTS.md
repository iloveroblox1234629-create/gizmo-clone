# Gizmo - Knowledge Distillation Engine

Product: Automated study tool with flashcard generation, spaced repetition, AI grading, and gamification.

## Commands

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build
npm run start   # Start production server
npm run lint     # ESLint check (includes TypeScript validation)
```

## Key Quirks

- **Hydration**: Store uses `loadingState` placeholder until localStorage hydrates—required to avoid "NaN" attribute errors
- **PDF extraction**: Uses python3 subprocess via `child_process.spawn`, not native JS libraries (Next.js worker bundling incompatibility)

## Key Files

- `src/app/page.tsx` - Landing page (account creation/login)
- `src/app/dashboard/page.tsx` - Dashboard (create decks, view your decks)
- `src/app/quiz/[id]/page.tsx` - Quiz/study mode
- `src/app/quiz/[id]/summary/page.tsx` - Results summary
- `src/app/quiz/[id]/gameover/page.tsx` - Game over screen
- `src/app/api/generate/route.ts` - Flashcard generation endpoint
- `src/app/api/tutor/route.ts` - AI tutor grading endpoint
- `src/app/api/extract-pdf/route.ts` - PDF text extraction
- `src/app/api/extract-pptx/route.ts` - PowerPoint text extraction
- `src/app/api/youtube/route.ts` - YouTube transcript + AI summary
- `src/lib/store.tsx` - State management
- `src/lib/srs.ts` - SM-2 spaced repetition algorithm

## Architecture

- Path alias: `@/*` → `./src/*`
- AI SDK: @ai-sdk/google and @ai-sdk/openai (v3)
- State: React context in `src/lib/store.tsx`
- Next.js 16.2.4 with React 19 (note breaking changes)
- Tailwind v4 (configured via CSS, no tailwind.config.js)

## Environment

Required env vars in `.env.local`:
- `GEMINI_API_KEY` - Google AI key (preferred)
- `OPENAI_API_KEY` - OpenAI fallback
- `YOUTUBE_API_KEY` - Optional, for fetching video titles

Keys can also be entered via UI settings menu.
