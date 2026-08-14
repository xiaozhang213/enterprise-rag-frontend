# Enterprise Knowledge Base Q&A — Frontend (Day 2)

Next.js + TypeScript + Tailwind chat UI for the RAG backend built on Day 1.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the backend URL:
   ```bash
   cp .env.local.example .env.local
   ```
   Make sure `NEXT_PUBLIC_API_BASE_URL` points at your running backend
   (default: `http://localhost:8000`).

3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

**Important**: the Day 1 backend must be running (`uvicorn app.main:app --reload`)
for the chat to work.

## Structure

```
app/
  layout.tsx     Root layout, global metadata
  page.tsx        Home page, renders ChatWindow
  globals.css     Tailwind imports + base styles
components/
  ChatWindow.tsx  Main chat UI: message list, input, file upload
  MessageBubble.tsx  Single message rendering (user/assistant/error)
  SourceList.tsx   Renders cited source chunks under an answer
lib/
  api.ts          Fetch wrappers for /ingest and /query
```

## Deployment (Day 2 target)

1. Push this folder to GitHub (as its own repo, or a subfolder of a monorepo).
2. Import into Vercel, set the root directory if it's a subfolder.
3. Add environment variable `NEXT_PUBLIC_API_BASE_URL` in Vercel's dashboard,
   pointing to your deployed backend (e.g. on Render).
4. Deploy — Vercel auto-builds on every push.

## Design notes

- All backend calls are isolated in `lib/api.ts` — if the API contract
  changes, only this file needs updating.
- Errors from the backend are caught and shown as a distinct (red) message
  bubble instead of failing silently — small thing, but it's the kind of
  UX polish interviewers notice.
- File upload and chat share the same screen so the whole ingest → ask
  loop is demoable in one continuous flow.
