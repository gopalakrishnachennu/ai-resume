# AI Resume Builder — Consolidated Docs

Next.js app for AI-powered resume generation with a pipeline + plugin core, in-memory prompt system, Firebase backend, and a full guest/admin experience. This README merges the previous Markdown docs into a single reference.

## Quick start
- Install deps: `npm install`
- Run dev server: `npm run dev` → http://localhost:3000
- Build/export: `npm run build` (static export enabled)
- Env: set your Firebase config (`NEXT_PUBLIC_FIREBASE_*`) and API keys for OpenAI/Claude/Gemini.

## Architecture snapshot
- **Core engine:** Pipeline manager plus plugin registry. Pipelines: Auth, API Key, Profile, Resume. Plugins: Cache (localStorage/TTL), Firebase CRUD, OpenAI, Claude, Gemini.
- **LLM Black Box:** In-memory prompt registry with Jinja-style templating, caching, token optimization, and multi-provider routing. Supports JSON helpers and debug stats.
- **Data layer:** Firebase Auth/Firestore for users, resumes, cache, usage, config, admins. Caching covers job analyses, resume sections, ATS scores, suggestions (85%+ hit rate expected).
- **Frontend:** Next.js + React with Monaco editor, ATS dashboard, settings modal, toasts, PDF/DOCX export, admin dashboard.
- **Deploy:** Firebase Hosting CI/CD (GitHub Actions), static export, CDN + HTTPS.

### LLM Black Box usage
```ts
import { LLMBlackBox } from '@/lib/llm-black-box';

const result = await LLMBlackBox.execute(
  'phase2',           // pipeline phase
  'resumeGenerator',  // prompt key
  vars,               // template variables
  { provider: 'gemini', apiKey }
);
// result.content, result.tokensUsed, result.optimization
```

## Feature highlights
- **Resume editor:** ATS-friendly defaults (black text, Times New Roman option, tight spacing), full settings panel (fonts, spacing, dividers, bullets, density modes), custom section button, skills display fixed, personal info flow corrected, toasts on all actions, PDF/DOCX downloads with divider fix.
- **Content generation:** Job parsing/keyword extraction, resume batch generation, ATS scoring, suggestions, job-title auto-generation, enhanced summaries/experience/skills prompts, multi-LLM with caching and rollback/error handling.
- **Guest & auth:** Anonymous signup with usage limits/reset, upgrade prompts (Email/Google), data migration on upgrade, usage counter, gated actions.
- **Admin panel:** Dashboards for users/analytics, guest settings, config editor, pipeline/plugin/system monitor design, secure admin login via Firestore `admins/{uid}`.
- **Deployment & ops:** Firebase Hosting workflow, static export config, GitHub secrets for Firebase + env, service account driven deploys.

## Setup notes
- **Firebase admin access:** Add your UID to `admins/{uid}` with `isAdmin: true`; store app config under `config/app` (matches `lib/config/appConfig.ts`). Firestore rules restrict writes to admins.
- **Hosting CI/CD:** `firebase.json` targets `out`; workflow builds on push, deploys with `FIREBASE_SERVICE_ACCOUNT` and project/config secrets.
- **Indexes:** Create Firestore index for `appliedResumes` on `userId (asc), createdAt (desc), __name__ (desc)` if prompted.

## Current status & roadmap
- Core pipelines/plugins shipped; LLM Black Box, caching, resume/job pipelines, guest system, admin UI, toasts, settings, DOCX/PDF exports, and UX fixes are in place.
- Remaining focus areas: wire any legacy UI calls to the new pipelines (`updateApiKey`, `updateProfile`, `generateResume`, `authenticateUser`), keep applying settings consistently to preview/export when adding new fields, and add integration/regression tests around pipelines and template validation.

## Historical milestones (previous docs collapsed)
- **Architecture:** Enterprise pipeline/plugin redesign, hybrid in-memory prompt system with template engine and cache, multi-LLM router.
- **Pipelines:** Phase 1 LLM core, Phase 2 job processing + cache stats, Phase 3 resume generation/ATS scoring; V2 summary tracked 4/4 pipelines and 5/5 plugins at 80%+ overall completion before integration.
- **UX/Editor:** Settings implementation, density modes, custom sections, black text, divider fixes, job-title generation, enhanced summary/experience/skills outputs, personal info mapping fix.
- **Reliability:** Toast coverage for key actions, template validation fixes, Firebase index guidance, rollback/retry/error messaging baked into pipelines.
- **Access & control:** Guest auth + upgrade flows, admin dashboard/analytics/users/settings pages, corporate UX and dashboard improvements.
