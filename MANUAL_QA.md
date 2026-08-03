# Supreme Talkies — Manual QA checklist

Run after the session fix. Prefer a hard refresh on every authenticated page.

## Session / auth (blocker)

- [ ] Log in with a user that already has a production role (e.g. writer)
- [ ] Hard refresh `/dashboard` five times — same name, same role, no “ROLE NOT CONFIGURED”
- [ ] No detour to `/role-select` for users who already chose a role
- [ ] Close the tab, reopen the site — session restores to the same profile
- [ ] Log out → log in — same profile and roles
- [ ] New signup → lands on `/role-select` (“Casting Call”) → `assign_role` → correct dashboard
- [ ] Google OAuth via `/auth` → `/auth/callback` → dashboard or casting as appropriate

## Public site

- [ ] `/` — hero, reel, manifesto, join CTA
- [ ] `/film/:id` — credits, stills, links for each seed film
- [ ] `/about` — team + contact
- [ ] Nav sign-out from an authenticated page returns to public/auth cleanly

## Role dashboards

### Writer
- [ ] Submit script with DNA tags (mood / setting / format)
- [ ] Confirm `scripts` + `script_versions` rows in Supabase
- [ ] Express interest on an open brief
- [ ] Create / delete an inspiration pin
- [ ] Challenges list is visible (entry may be incomplete — known MVP gap)

### Technician
- [ ] Save portfolio / specialization / contact on profile
- [ ] Toggle availability
- [ ] Express interest on a brief
- [ ] Send collab by SUPR-ID; accept / decline / disconnect

### Producer
- [ ] Create a film brief
- [ ] See interest list on the brief
- [ ] Browse non-draft scripts + fire reaction
- [ ] Roster loads from member directory

### Marketing
- [ ] Join a campaign; log a post
- [ ] Add a sticky marketing idea
- [ ] Submit a collab brief

### Amplifier (UI label: MEMBER)
- [ ] Log share streak once per day (second click same day should no-op / guard)
- [ ] Post / like / delete on shoutout wall

### Presenter
- [ ] Submit a screening proposal
- [ ] See own presentations listed
- [ ] Analytics / reaction feed may be missing — OK for MVP

### Admin
- [ ] Kanban move across script stages (optimistic + persists)
- [ ] Film CRUD + image upload to `cinematic_assets`
- [ ] Create project room; add member by SUPR-ID
- [ ] Create campaign / writing challenge
- [ ] Approve or manage a screening
- [ ] Realtime refresh when another tab changes data
- [ ] `/crew` — admin-only; search / filter works
- [ ] Ban deletes profile row only (known gap: `auth.users` remains)

### Profile
- [ ] `/profile` identity / production / account tabs save without wiping roles

## Sign-off

| Area | Pass / Fail | Notes |
|------|-------------|-------|
| Session refresh | | |
| Writer | | |
| Technician | | |
| Producer | | |
| Marketing | | |
| Amplifier | | |
| Presenter | | |
| Admin + Crew | | |
| Public pages | | |

Tester: _______________  Date: _______________
