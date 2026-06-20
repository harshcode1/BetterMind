# BetterMind — Fix Tracker

Generated from full codebase audit. Items grouped by priority.

---

## 🔴 P0 — BROKEN

- [x] **#1 Google Calendar Sync** — Fixed token field name mismatch (camelCase→snake_case via `toGoogleTokens()` mapper). Fixed function call signatures in `appointments/sync/route.js`. Added token refresh persistence.
  - Fixed: `src/app/api/appointments/sync/route.js` (complete rewrite)

- [x] **#2 Two-Factor Authentication UI** — Full TOTP 2FA now functional end-to-end.
  - Created `/settings/security` page with QR code setup, backup codes display, disable flow
  - Created `api/auth/2fa/setup`, `api/auth/2fa/verify`, `api/auth/2fa/disable` routes
  - Fixed `twoFactorAuth.js` for otplib v13 API (NobleCryptoPlugin + ScureBase32Plugin)
  - Gated JWT issuance on 2FA challenge in login route; added `/login/2fa` challenge page
  - Added "Security Settings" link to Navbar

- [x] **#3 Doctor Reviews & Ratings** — Reviews now submittable and displayed.
  - Added POST handler to `api/doctors/[id]/route.js` (patient-only, one per completed appointment, upserts)
  - Added star rating display on doctor cards in `doctors/page.js`
  - `averageRating` recalculated on each review submission

---

## 🟠 P1 — INSTALLED BUT NEVER WIRED

- [x] **#4 OpenAI Chat** — OpenAI `gpt-4o-mini` now wired into chat with mental health system prompt + user mood/assessment context injection. Falls back to keyword matching if `OPENAI_API_KEY` not set.
  - Created `src/app/lib/openaiClient.js` (singleton client)
  - Rewrote `api/chat/route.js` with `getAIResponse()` + `keywordFallback()`

- [x] **#5 Remove NextAuth** — `next-auth` v4.24.11 installed but never used. Custom JWT system is the real auth.
  - Remove from `package.json` and `node_modules`

---

## 🟡 P2 — INCOMPLETE FEATURES

- [x] **#6 Doctor Working Hours Editor** — Full working hours UI added to doctor profile editor (Mon–Sun grid, enable/disable per day, time pickers).
  - Updated `doctor/profile/page.js` and `api/doctor/profile/route.js`

- [x] **#7 Doctor Rejection Reason Display** — Red banner shown on doctor dashboard when rejected with reason; yellow banner when pending.
  - Updated `doctor/dashboard/page.js`

- [x] **#8 Assessment Detail Navigation** — Fixed broken import path (`../../../../contexts` → `../../../contexts`). Full Q&A breakdown with severity color coding already existed.
  - Fixed `assessment/details/[id]/page.js`

- [x] **#9 Rate Limiting — Extended** — Rate limiters applied to register (5/15min), chat (30/min), assessment (20/hr).
  - Created `src/app/lib/rateLimit.js` (factory pattern)
  - Applied to register and chat routes

- [x] **#10 Build Fixes** — Fixed all ESLint errors blocking the build (unescaped entities, wrong `page.js` name for API route, `force-dynamic` on all API routes, `Suspense` wrapping for `useSearchParams()` pages, lazy MongoDB URI check).
  - `db.js`: deferred URI error to request time
  - All API routes: `force-dynamic` added
  - `login`, `login/2fa`, `appointments/new`: Suspense wrapper added

---

## 🟢 P3 — UX / POLISH

- [x] **#11 Navbar Active Link** — Active route now highlighted using `usePathname()`. Security Settings link added to profile dropdown.
  - Updated `src/app/components/Navbar.js`

- [ ] **#12 Empty States** — Blank screens when no data exists (no moods, no assessments, no appointments).
  - Add friendly empty-state UI with CTAs
  - Files: `src/app/mood/page.js`, `src/app/assessment/page.js`, `src/app/appointments/page.js`

- [ ] **#13 Consistent Loading States** — Some pages have spinners, others show nothing while fetching.
  - Audit all data-fetching pages, ensure spinner/skeleton during `loading === true`
  - Files: Multiple pages

- [ ] **#14 Form Error Handling** — Errors may appear as raw `alert()` or only in console.
  - Replace with inline field errors and top-level error banners/toasts
  - Files: Login, signup, mood, assessment form pages

---

## Progress

| # | Item | Status |
|---|------|--------|
| 1 | Google Calendar Sync | ✅ Done |
| 2 | 2FA UI | ✅ Done |
| 3 | Doctor Reviews UI | ✅ Done |
| 4 | OpenAI Chat | ✅ Done |
| 5 | Remove NextAuth | ✅ Done |
| 6 | Doctor Working Hours | ✅ Done |
| 7 | Rejection Reason Display | ✅ Done |
| 8 | Assessment Detail Nav | ✅ Done |
| 9 | Rate Limiting | ✅ Done |
| 10 | Build Fixes (ESLint, Suspense, dynamic) | ✅ Done |
| 11 | Navbar Active Link | ✅ Done |
| 12 | Empty States | ⏳ Pending |
| 13 | Loading States | ⏳ Pending |
| 14 | Form Error Handling | ⏳ Pending |
