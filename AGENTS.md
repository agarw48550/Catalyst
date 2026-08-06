## Learned User Preferences

- Prefer plain, non-technical English when explaining the product or features for non-engineering audiences.
- After login or sign-in, send users to the job applications dashboard, not the marketing start page.
- Treat job applications as the product hub: users add resume, job title, company, language, and job description, then open per-application AI tools (resume tailor and live interview).
- Support English, Hindi, Marathi, and Odia; let users choose language when creating an application and still change it inside AI features and their dashboards.
- Live interviews should feel human: occasional compliments (not every turn), clear duration/progress and remaining-question cues, easy/normal/hard difficulty, and a post-interview text report covering what was discussed, strengths, gaps, and improvements.
- Keep marketing and UI copy aligned with what is actually shipped; do not advertise removed or disabled features.
- Prefer a text-model fallback chain for non-live AI (Gemma 31B → Gemma 26B → Gemini Flash Lite) when the primary model fails.
- For production readiness, expect thorough testing and attention to privacy/consent (custom domain for production Clerk, data protection, signup consent).
- After finishing work, commit and push to GitHub so Vercel can deploy; do not leave deployable changes only on the local machine.

## Learned Workspace Facts

- Catalyst is an AI career platform focused on India, built with Next.js App Router, Clerk auth, Supabase data (Clerk JWT + RLS), and Google Gemini/Gemma.
- Protected app routes use Clerk via `proxy.ts` (not `middleware.ts`); legacy Supabase Auth UI remains but dashboard/API auth is Clerk `user_id`.
- Core persisted user data includes Supabase `job_applications` and `interview_sessions`; SQL migrations live under `config/migrations/`.
- Default text/resume model is `gemma-4-31b-it`; live voice interview uses Gemini Live; company research uses Tavily with DuckDuckGo fallback.
- Outbound email uses Mailgun with Resend failover in `lib/mailers`.
- Deploy target is Vercel; inactivity cleanup runs daily via `/api/cron/inactivity-cleanup` (warning around day 23, delete stored app data at day 30; Clerk accounts are retained).
