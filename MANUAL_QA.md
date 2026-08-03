# Supreme Talkies — Manual QA checklist

Run after deploying additive SQL migrations under `supabase/migrations/`. Prefer a hard refresh on every authenticated page.

## Deploy prerequisites

- [ ] Run `20260803_verified_and_notifications.sql` in Supabase SQL Editor
- [ ] Run `20260804_films_credit_columns.sql` if present
- [ ] Deploy edge function `ban-user` (and redeploy `on-room-completed` without verify side-effect)
- [ ] Enable Realtime on `notifications` (migration attempts this)

## Session / auth

- [ ] Log in with a user that already has a production role (e.g. writer)
- [ ] Hard refresh `/dashboard` five times — same name, same role, no “ROLE NOT CONFIGURED”
- [ ] Last active role remembered after refresh
- [ ] Close the tab, reopen — session restores to the same profile
- [ ] Log out → log in — same profile and roles
- [ ] New signup (name + email + password only) → `/role-select` → dashboard with first-actions strip
- [ ] Google OAuth → `/auth/callback` → dashboard or casting as appropriate

## SUPR Verified (profile completeness only)

- [ ] Fresh account is NOT verified after login alone
- [ ] Profile checklist shows progress (e.g. 2/6)
- [ ] Completing name, phone, age, avatar, role, and niche/social/note → stamp appears after save
- [ ] Technician needs niche + skills or portfolio
- [ ] Clearing a required field and saving clears verification
- [ ] Completing a project room does NOT grant verification
- [ ] SUPR-ID is large on profile with working COPY ID

## Notifications (in-app only)

- [ ] Nav bell visible when logged in
- [ ] Admin moves a script stage → writer gets unread bell + toast
- [ ] Mark Read / Mark All Read clears badge
- [ ] User A never sees User B notifications
- [ ] Collab request notifies receiver; accept/decline notifies sender

## Public site

- [ ] `/` hero shows “Vijayawada · Telugu / Tamil shorts · Join the set”
- [ ] Mobile home feels lighter (less Ken Burns / corner accents)
- [ ] `/film/:id` — primary **Watch on YouTube** CTA above credits
- [ ] `/about` contact notes “We’ll reply within 48 hours”
- [ ] Nav sign-out returns cleanly

## Casting / roles

- [ ] Role cards show Do / Get copy; Amplifier labeled MEMBER with share-audience language
- [ ] Presenter card does not promise unfinished analytics
- [ ] Cards are simple; logos not stretched
- [ ] Two-click confirm still works

## Role dashboards

### Writer
- [ ] Save as Draft (title only) → status draft, not visible to producers
- [ ] Launch script needs DNA + PDF; enters inbox
- [ ] Status timeline visible on cards
- [ ] First-actions scroll to scripts/briefs
- [ ] Empty state has one CTA
- [ ] Notification when admin moves stage

### Technician
- [ ] Name search for collab (not only SUPR-ID)
- [ ] Availability toggle + portfolio save
- [ ] Empty collab CTA

### Producer
- [ ] Create brief; see interests
- [ ] Browse non-draft scripts + fire reaction
- [ ] Empty-state CTAs

### Marketing
- [ ] Join campaign; Copy kit copies captions/hashtags/drive link
- [ ] Sticky idea board works

### Amplifier (MEMBER)
- [ ] Share streak shows “Logged by you”
- [ ] Shoutout wall post/like/delete

### Presenter
- [ ] Submit screening; status badge clear
- [ ] Empty CTA; list of own presentations

### Admin
- [ ] NEEDS YOUR EYES inbox counts + jumps to tabs
- [ ] Kanban move notifies writer
- [ ] Film CRUD saves full credit fields; film detail shows them
- [ ] Crew BAN via `ban-user` — banned user cannot log back in
- [ ] `/crew` search/filter still works

### Profile
- [ ] Identity / production / account tabs save without wiping roles
- [ ] Note to team field saves and counts toward verify flavor

## Sign-off

| Area | Pass / Fail | Notes |
|------|-------------|-------|
| Session refresh | | |
| SUPR Verified | | |
| Notifications | | |
| Writer | | |
| Technician | | |
| Producer | | |
| Marketing | | |
| Amplifier | | |
| Presenter | | |
| Admin + ban | | |
| Public pages | | |

Tester: _______________  Date: _______________
