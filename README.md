# AI Interview Assistant (React + Redux + Ant Design)

A local-first, production-grade SaaS-style web app for AI-powered coding interviews.

## Features
- Candidate: Upload resume (PDF or DOCX), AI-generated interview (6 questions with timers), auto-submit on timeout, final scoring and summary.
- Recruiter: Dashboard with sortable/searchable candidates, drawer with profile, resume preview, transcript, per-answer scores, and summary.
- Local persistence: redux-persist with IndexedDB via localForage. Welcome back modal and pause/resume support.
- UI: Ant Design, clean light theme with purple accent.
- AI: Gemini API wrapper with structured JSON prompts, retries, and fallback question/scoring when API is unavailable.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy `.env.example` to `.env.local` and set `VITE_GEMINI_API_KEY` (optional for fallback behavior).

3. Run the app

```bash
npm run dev
```

Open http://localhost:5173

## Notes
- PDF parsing uses pdfjs-dist; in some environments, worker loading from CDN may need CORS allowances. For production, consider bundling a local worker path.
- This project is client-side only for demo. For a real SaaS, add a backend for auth, storage, and billing.
