# AI Studio — Implementation Plan

## Status Legend
- ✅ Done
- 🔄 In progress
- ⬜ Not started

---

## Completed
- ✅ Next.js 14 project scaffold
- ✅ 3-panel editor UI (Upload / Templates / Results)
- ✅ Mobile tabbed layout with bottom tab bar
- ✅ Bulk upload + virtualized queue
- ✅ Concurrent batch processor (mock)
- ✅ Modular actions (`lib/actions/` — one file per action)
- ✅ Delete/Clear results UI
- ✅ Preset system (`lib/presets.ts`)

---

## Remaining Tasks

### 1. Modular Pipeline System ✅
- ✅ `Pipeline` type + `StepContext` added to `lib/types.ts`
- ✅ `lib/pipelines/remove-bg.ts` — lucataco/remove-bg
- ✅ `lib/pipelines/replace-bg.ts` — 2-step: remove bg → SDXL background gen → Sharp composite
- ✅ `lib/pipelines/upscale.ts` — Real-ESRGAN with scale + face_enhance
- ✅ `lib/pipelines/gfpgan.ts` — TencentARC GFPGAN
- ✅ `lib/pipelines/portrait-retouch.ts` — 2-step: GFPGAN → ESRGAN 2×
- ✅ `lib/pipelines/index.ts` — registry + `getPipeline()` + `resolveModel()` with DB overrides

### 2. Install Missing Dependencies ✅
- ✅ Added to `package.json`: `@supabase/supabase-js`, `@supabase/ssr`, `replicate`, `sharp`
- ⚠️ **User must run `npm install` from their terminal** (Node.js not accessible in Claude's env)

### 3. Supabase Setup ✅
- ✅ `supabase/schema.sql` — user_tokens, jobs, custom_presets, settings + RLS policies
- ✅ `supabase/functions.sql` — `deduct_tokens` and `adjust_balance` RPC functions
- ✅ `lib/supabase.ts` — browser, server, and service-role clients

### 4. Core Library Layer ✅
- ✅ `lib/replicate.ts` — createPrediction, verifyWebhookSignature, getModelOverrides, invalidateReplicateClient
- ✅ `lib/tokens.ts` — getBalance, deductTokens, assignTokens, adjustBalance
- ✅ `lib/composite.ts` — Sharp: fetch foreground + background, resize + alpha-composite → JPEG buffer
- ✅ `lib/storage.ts` — uploadToStorage, downloadAndStore, filename helpers

### 5. API Routes ✅
- ✅ `app/api/upload/route.ts` — POST: receive file, upload to shared hosting `uploads/`
- ✅ `app/api/process/route.ts` — POST: check tokens, deduct, create Replicate prediction, insert job
- ✅ `app/api/webhook/replicate/route.ts` — POST: verify signature, handle multi-step chaining, save result
- ✅ `app/api/jobs/route.ts` — GET: poll job statuses from Supabase (not Replicate)
- ✅ `app/api/download/route.ts` — POST: stream ZIP of selected results
- ✅ `app/api/presets/route.ts` — GET/POST/DELETE: custom presets
- ✅ `app/api/admin/tokens/route.ts` — GET/POST: token management
- ✅ `app/api/admin/settings/route.ts` — GET/POST: Replicate key + model overrides

### 6. Auth ✅
- ✅ `middleware.ts` — protects /editor and /admin, redirects to /login
- ✅ `app/(auth)/login/page.tsx`
- ✅ `app/(auth)/register/page.tsx`

### 7. Wire Editor to Real Backend ✅
- ✅ Removed `mockProcess()`
- ✅ Real flow: upload → /api/process → poll /api/jobs every 4s → update UI on completion
- ✅ Real token balance from Supabase shown in header
- ✅ ZIP download via /api/download

### 8. Admin Pages ✅
- ✅ `app/admin/layout.tsx` — sidebar nav with admin guard
- ✅ `app/admin/tokens/page.tsx` — user list + assign/adjust form
- ✅ `app/admin/presets/page.tsx` — create/delete custom presets
- ✅ `app/admin/settings/page.tsx` — API key + model version overrides

### 9. Shared Hosting Storage ✅
- ✅ `hosting/upload.php` — validates secret, sanitizes filename, saves to uploads/ or results/
- ✅ `hosting/README.md` — deployment instructions
- ✅ `.env.example` — all required environment variables documented

### 10. Deploy ⬜ (User action required)
- ⬜ Run `npm install` in studio-web/
- ⬜ Create Supabase project, run `supabase/schema.sql` then `supabase/functions.sql`
- ⬜ Upload `hosting/upload.php` to shared hosting, create `uploads/` and `results/` folders
- ⬜ Create `.env.local` from `.env.example` with real values
- ⬜ Push to GitHub, connect Vercel, add env vars in Vercel dashboard
- ⬜ Set Replicate webhook URL to `https://your-app.vercel.app` after deploy

---

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REPLICATE_API_KEY=
REPLICATE_WEBHOOK_SECRET=
STORAGE_UPLOAD_URL=https://yoursite.com/ai-uploads/upload.php
STORAGE_SECRET_TOKEN=
STORAGE_BASE_URL=https://yoursite.com/ai-uploads/
```

---

## Architecture Reference

```
Browser → POST /api/upload  → shared hosting uploads/
Browser → POST /api/process → Replicate (prediction + webhook URL)
Replicate → POST /api/webhook/replicate → download output → shared hosting results/ → update Supabase job
Browser → GET /api/jobs?ids=... (polls Supabase every 4s) → update UI
```
