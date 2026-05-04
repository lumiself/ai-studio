# AI Studio — Claude Rules

## Project Overview
Next.js 14 App Router standalone AI photo editor. Supabase for auth + DB, Replicate for AI models, Sharp for compositing, shared hosting for file storage.

## Architecture Constraints

### Storage
- Originals → `{STORAGE_BASE_URL}uploads/{filename}`
- Results → `{STORAGE_BASE_URL}results/{filename}`
- Files are uploaded via POST to `STORAGE_UPLOAD_URL` (PHP script on shared hosting)
- Never store files in Vercel — it's serverless with no persistent disk
- Include `folder: 'uploads'|'results'` in every storage upload call

### Replicate / Webhooks
- Never poll Replicate from the browser. Browser polls Supabase jobs table.
- Always create Replicate predictions with `webhook` and `webhook_events_filter: ['completed']`
- Verify Replicate webhook signature in `/api/webhook/replicate` using `REPLICATE_WEBHOOK_SECRET`
- The webhook handler is responsible for: downloading output → uploading to results/ → updating job row

### Tokens
- Token balance is checked and deducted server-side in `/api/process` BEFORE calling Replicate
- Never trust token counts from the client
- Use `lib/tokens.ts` functions — never write raw Supabase token queries inline

### Auth
- `/editor` and `/admin/*` routes require a valid Supabase session (enforced in `middleware.ts`)
- Admin routes additionally require `is_admin: true` on the user_tokens row
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser — it's server-only

## File Conventions

### Adding a New Action
1. Create `lib/actions/{action-name}.ts` exporting a default `Action` object
2. Import it in `lib/actions/index.ts` and add to the `ACTIONS` array
3. That's all — categories auto-generate, UI picks it up immediately

### Adding a New Pipeline
1. Create `lib/pipelines/{pipeline-name}.ts` exporting a default `Pipeline` object
2. Import it in `lib/pipelines/index.ts` and add to the `PIPELINES` array
3. Multi-step pipelines use the `steps` array — each step has `model`, `buildInput`, `processOutput`
4. Use `model: null` for local Sharp compositing steps (no Replicate call)

### API Routes
- All routes in `app/api/` use Next.js Route Handlers (not pages/api)
- Always return `NextResponse.json({ error: '...' }, { status: N })` for errors
- Auth check at top of every route: use `createServerClient` from `lib/supabase.ts`
- Admin routes: additionally check `is_admin` flag before any data mutation

## CSS Rules
- **Critical**: All `@media (max-width: 780px)` overrides MUST be at the very end of `styles/editor.css`
  — base rules and media query rules share equal specificity; later-in-file wins
- Mobile layout uses `.aipe-panel--mobile-active` to show the active panel; all others are `display: none`
- Never add mobile overrides before the base component rules in the file

## State Management
- Editor state uses `useReducer` in `app/editor/page.tsx` — add new action types there
- All image status transitions go through `UPDATE_IMAGE_STATUS` dispatch
- Job tracking: store `jobId` on the `QueuedImage` so the polling loop can match Supabase rows to images

## What NOT to Do
- Don't poll Replicate from the browser or API routes — webhooks handle completion
- Don't call Replicate from the browser — always go through `/api/process`
- Don't use `any` type — use proper types from `lib/types.ts`
- Don't put business logic in React components — it belongs in `lib/`
- Don't use `mockProcess()` in production code — it must be removed when wiring real API
- Don't commit `.env.local` — use `.env.example` for documentation
- Don't add error handling for impossible cases — only validate at system boundaries
- Don't add comments explaining what code does — only add comments for non-obvious WHY

## Naming Conventions
- Pipeline IDs: `snake_case` string (e.g., `remove_bg`, `replace_bg`, `upscale`)
- Action IDs: `snake_case` string (e.g., `remove_background`, `upscale_2x`)
- Job IDs: UUID from `crypto.randomUUID()`
- DB column names: `snake_case`
- TypeScript interfaces: `PascalCase`
- React components: `PascalCase` in `components/` or `app/` directories
