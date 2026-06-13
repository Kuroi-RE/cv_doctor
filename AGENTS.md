# CV Doctor — Project Context for AI Agents

## Project Overview

**CV Doctor** is an AI-powered resume assessment web application. Users upload CVs (PDF/DOCX), which are parsed and analyzed by OpenAI. The system returns structured scores, highlights, issues, and prioritized recommendations. Admins can monitor usage, manage scoring rules, and view logs.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.3 (App Router) |
| Language | TypeScript 5+ (strict mode) |
| UI | React 19, Tailwind CSS v4, shadcn/ui v4, lucide-react |
| Auth & DB | Supabase (Auth, PostgreSQL, Storage, RLS, SSR via @supabase/ssr v0.12) |
| AI | openai v4+ (GPT-4o-mini) + @google/generative-ai v0.24 (Gemini 2.0 Flash) with provider fallback |
| Parsing | pdf-parse v2.4.5 (named export, class-based API), mammoth v1.12 (DOCX) |
| Validation | Zod v4.4.3 |
| Font | next/font + Geist |

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4o-mini              # optional, defaults to gpt-4o-mini
OPENAI_FALLBACK_MODEL=gpt-4o          # optional, defaults to gpt-4o
GEMINI_API_KEY=<gemini-api-key>       # optional fallback
GEMINI_MODEL=gemini-2.0-flash         # optional, defaults to gemini-2.0-flash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Build & Dev Commands

```bash
npm run dev        # Next.js dev server
npm run build      # Production build (NODE_OPTIONS=--max-old-space-size=4096, --no-lint)
npm run start      # Start production server
npm run lint       # ESLint
```

## Folder Structure

```
src/
├── app/
│   ├── (public)/          # Public pages (landing, login, register)
│   ├── (user)/            # Protected user pages
│   │   ├── dashboard/     # User dashboard
│   │   ├── upload/        # CV upload page (react-dropzone)
│   │   ├── history/       # Analysis history list
│   │   ├── analysis/      # Redirects to history
│   │   │   └── [id]/      # Analysis detail page (scores, recommendations)
│   │   └── layout.tsx     # User layout with Navbar + profile auto-create
│   ├── (admin)/           # Protected admin pages
│   │   ├── admin/         # Dashboard, users, monitoring, logs, scoring rules
│   │   └── layout.tsx     # Admin layout with role check
│   ├── api/               # API routes (health, upload, analysis, history, admin)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # (not used — public route group handles this)
├── components/
│   ├── layout/navbar.tsx  # Neobrutalism navbar with role-based items
│   └── ui/                # shadcn/ui components (button, card, alert, badge, etc.)
├── lib/
│   ├── actions/
│   │   ├── auth.ts        # Login/register/logout server actions
│   │   ├── upload.ts      # CV upload server action (self-contained auth + profile)
│   │   └── analysis.ts    # AI analysis server action
│   ├── ai/index.ts        # OpenAI service (structured JSON output)
│   ├── auth/index.ts      # getOrCreateProfile() + getAuthUser() helpers
│   ├── constants/index.ts # APP_NAME, MAX_FILE_SIZE, CV_STATUS, STORAGE_BUCKET
│   ├── parser/index.ts    # PDF/DOCX text extraction
│   ├── storage/index.ts   # Supabase Storage upload/delete abstraction
│   ├── supabase/
│   │   ├── client.ts      # Browser Supabase client
│   │   ├── server.ts      # Server-side Supabase client (cookies-based)
│   │   └── middleware.ts   # Session refresh + route protection middleware
│   ├── validations/
│   │   ├── auth.ts        # Login/register Zod schemas
│   │   └── upload.ts      # File validation Zod schemas
│   └── utils.ts           # cn() utility (clsx + tailwind-merge)
├── types/index.ts         # All TypeScript interfaces
└── middleware.ts          # Entry point for Supabase middleware

supabase/migrations/
├── 001_initial_schema.sql # Full DB schema + RLS + triggers
└── 002_profiles_insert_policy.sql # RLS INSERT policy for profiles
```

## Database Schema

| Table | Purpose | Key Relations |
|---|---|---|
| `profiles` | User profiles (linked to auth.users) | `auth_user_id` → `auth.users(id)` |
| `cvs` | Uploaded CV records | `user_id` → `profiles(id)` |
| `analysis_results` | AI analysis output (scores, highlights, issues) | `cv_id` → `cvs(id)` |
| `recommendation_items` | Prioritized improvement suggestions | `analysis_result_id` → `analysis_results(id)` |
| `analysis_logs` | Process audit trail | `cv_id` → `cvs(id)`, `user_id` → `profiles(id)` |
| `scoring_rules` | Admin-configurable scoring weights | — |
| `admin_logs` | Admin action audit trail | `admin_user_id` → `profiles(id)` |

### RLS Policies
- **profiles**: SELECT (own), UPDATE (own), INSERT (own — migration 002)
- **cvs**: CRUD (own), admins can read all
- **analysis_results**: SELECT (own), admins can read all
- **recommendation_items**: SELECT (own), admins can read all
- A `handle_new_user` trigger auto-creates profiles on signup (SECURITY DEFINER)

## CV Status Flow

```
uploaded → parsing → analyzing → completed
                              → failed
```

## Design System: Neobrutalism

All UI follows Neobrutalism principles:
- **Thick black borders** (border-4 border-black)
- **Hard offset box-shadows** (shadow-[6px_6px_0px_0px_#000000])
- **Bold typography** (font-black, uppercase tracking)
- **Bright colors**: yellow-300 (primary), cyan-300, red-300, green-300
- **Tactile hover states**: shadow shrinks + translate on hover
- **Active states**: shadow disappears + full translate
- Background: `bg-[#fef9ef]` (warm off-white)

## Key Architecture Patterns

### Auth Flow
1. Middleware (`src/middleware.ts`) refreshes session via `@supabase/ssr`
2. Protected routes redirect unauthenticated users to `/login`
3. Server actions use `getSession()` first (cookie-based, reliable), `getUser()` as fallback
4. Profile auto-created on-demand via `getOrCreateProfile()` in `src/lib/auth/index.ts`

### Server Actions
- All mutations use Next.js Server Actions (not API routes)
- `"use server"` directive at top of action files
- Client pages use `useActionState` + `useTransition` for form handling
- **Critical**: `formAction()` from `useActionState` MUST be called inside `startTransition()`

### CV Upload Pipeline
1. File selected via react-dropzone → validated client-side (type, size)
2. Server action: auth check → profile lookup/create → file validation → Storage upload → DB record → text extraction → AI analysis → revalidate paths

### AI Analysis
- Multi-provider fallback chain: OpenAI → Gemini → OpenAI fallback model
- GPT-4o-mini (default) with structured JSON output (response_format: json_object)
- Gemini 2.0 Flash with structured JSON output (systemInstruction)
- If primary provider fails (auth error, rate limit, 5xx), automatically tries next provider
- System prompt defines analysis criteria and output schema
- Returns: overall score (0-100), 5 aspect scores, highlights, issues, recommendations
- Auto-triggered after upload (no manual step needed)

## Known Pitfalls

| Issue | Cause | Fix |
|---|---|---|
| `pdf-parse` import error | v2 uses named export + class API | `import { PDFParse } from "pdf-parse"`, then `new PDFParse({ data })` |
| Build OOM crash | Native packages bundled by Next.js | Add to `serverExternalPackages` in next.config.ts |
| `useActionState` transition error | Manual `formAction()` outside transition | Wrap in `startTransition(() => formAction(fd))` |
| "User profile not found" | Trigger didn't fire for pre-existing users | Auto-create profile in `getOrCreateProfile()` |
| "You must be logged in" (server action) | `getUser()` unreliable in actions | Use `getSession()` first, `getUser()` as fallback |
| RLS blocks profile INSERT | Missing INSERT policy | Run migration 002 (`CREATE POLICY ... FOR INSERT`) |
| TypeScript check OOM | Heavy types + native modules | Use `NODE_OPTIONS=--max-old-space-size=4096` or skip tsc |

## MVP Status (All Complete)

- [x] MVP #1: Registration/Login (Supabase Auth, Neobrutalism UI)
- [x] MVP #2: Upload CV (PDF/DOCX parsing, Storage, validation)
- [x] MVP #3: CV Analysis (OpenAI, structured output)
- [x] MVP #4: Evaluation Score (overall + 5 aspect scores)
- [x] MVP #5: Recommendations (prioritized: high/medium/low)
- [x] MVP #6: Analysis History (list + detail pages)

## Pending / Not Yet Implemented

- Admin dashboard (pages exist as stubs)
- Admin user management
- Admin monitoring & logs
- Scoring rules CRUD
- Deployment (Vercel)
- Testing (unit, integration, e2e)
