# Supreme Talkies — Deploy checklist

Do this **after** session QA in [MANUAL_QA.md](./MANUAL_QA.md) passes.

## 1. Rotate leaked Supabase keys (required)

Helper scripts that contained live JWTs were removed from the repo, but those keys may still be valid and exist in git history.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API.
2. **Rotate the `service_role` key** immediately (it bypasses RLS).
3. Rotate the `anon` key as well if it was ever committed.
4. Update local `.env` and all Vercel / edge-function secrets with the new values.
5. Optionally purge the old keys from git history (`git filter-repo` / BFG) if the repo was ever pushed publicly.

## 2. Environment variables

### Vercel (frontend)

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | rotated anon key |

### Supabase Edge Functions (optional for v1 email)

| Name | Value |
|------|--------|
| `SUPABASE_URL` | same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | rotated service_role key |
| `RESEND_API_KEY` | Resend API key |
| `EDGE_FUNCTION_SECRET` | shared webhook secret |
| `ADMIN_EMAILS` | comma-separated ops emails |

If email is not required for launch, skip function deploy and ship the SPA only.

## 3. Supabase Auth URLs

Authentication → URL configuration:

- Site URL = production origin (e.g. `https://supremetalkies.com`)
- Redirect allow list includes `https://<domain>/auth/callback` and local `http://localhost:5173/auth/callback`

## 4. Apply additive SQL (required for Verified + notifications)

In Supabase SQL Editor, run in order (never re-run the eraser in `supabase_master.sql`):

1. `supabase/migrations/20260803_verified_and_notifications.sql`
2. `supabase/migrations/20260804_films_credit_columns.sql` (if present)

Deploy edge functions:

```bash
supabase functions deploy ban-user
supabase functions deploy on-room-completed
```

## 5. Build locally

```bash
cd Supreme_Talkies-main
npm install
npm run build
npm run preview
```

Confirm `/`, login, hard-refresh `/dashboard` still works against production Supabase.

## 6. Deploy to Vercel

1. Push the clean branch to GitHub.
2. Vercel → Import repository → Framework Preset: **Vite**.
3. Set the env vars from section 2.
4. Deploy. `vercel.json` already rewrites SPA routes to `index.html`.
5. Attach custom domain when DNS is ready.

## 7. Production smoke test

- [ ] Hard refresh while logged in — real profile, not casting / ROLE NOT CONFIGURED
- [ ] Complete profile → SUPR Verified stamp
- [ ] Admin Kanban move → writer notification bell
- [ ] One write in Writer (draft + submit)
- [ ] Google OAuth callback on the production domain
- [ ] Follow [MANUAL_QA.md](./MANUAL_QA.md) for full persona matrix

## Warnings

- Do **not** re-run the eraser section of `supabase_master.sql` on production — it drops all tables.
- Ban/delete currently removes `profiles` only; `auth.users` can reappear via upsert on next login (known post-launch fix).
