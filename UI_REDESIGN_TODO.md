# BetterMind — World-Class UI Redesign TODO
## Design Philosophy: Calm · Safe · Healing · Trustworthy · Modern

---

## THE CORE PROBLEM
Current design: Cyberpunk/hacker aesthetic — black backgrounds, neon glows, glassmorphism.
Mental health context demands: Calm, warmth, safety, trust, hope, clarity, openness.
A user in emotional distress opening this app should feel SAFE and HELD — not like they're in a sci-fi movie.

---

## PHASE 1 — New Design System Foundation
> Every page inherits these. Get this right and everything else follows.

### 1.1 Color Palette (Replace entire dark system)

**Primary Brand — Indigo (Trust, Calm, Depth)**
- `--brand-50:  #eef2ff`
- `--brand-100: #e0e7ff`
- `--brand-200: #c7d2fe`
- `--brand-400: #818cf8`
- `--brand-500: #6366f1`  ← Primary CTA
- `--brand-600: #4f46e5`
- `--brand-700: #4338ca`

**Secondary — Mint/Emerald (Growth, Healing, Health)**
- `--mint-50:  #ecfdf5`
- `--mint-100: #d1fae5`
- `--mint-400: #34d399`
- `--mint-500: #10b981`  ← Success states, progress
- `--mint-600: #059669`

**Warmth — Peach/Rose (Compassion, Support)**
- `--warm-50:  #fff7ed`
- `--warm-100: #ffedd5`
- `--warm-400: #fb923c`
- `--warm-500: #f97316`  ← Warnings, streaks

**Calm — Lavender (Serenity, Reflection)**
- `--calm-50:  #f5f3ff`
- `--calm-100: #ede9fe`
- `--calm-200: #ddd6fe`
- `--calm-400: #a78bfa`
- `--calm-500: #8b5cf6`

**Neutrals (Light-theme base)**
- `--bg:        #fafbff`  ← Page background (off-white, slight blue tint)
- `--surface:   #ffffff`  ← Cards, panels
- `--surface-2: #f8fafc`  ← Secondary surfaces
- `--border:    #e8edf5`  ← Borders, dividers
- `--text-1:    #0f172a`  ← Primary text (near-black slate)
- `--text-2:    #475569`  ← Secondary text
- `--text-3:    #94a3b8`  ← Tertiary/placeholder

### 1.2 Typography Refinement

**Font Stack (keep Space Grotesk — it's rounded and friendly):**
- Headings: Space Grotesk, 600/700 weight
- Body: Inter, 400/500, line-height 1.7 (generous for readability)
- Mono: JetBrains Mono (only for codes/scores)

**Type Scale:**
- `text-xs`:  11px / 0.07em tracking
- `text-sm`:  13px
- `text-base`:14px (body default — slightly smaller for clean feel)
- `text-lg`:  16px
- `text-xl`:  18px
- `text-2xl`: 22px
- `text-3xl`: 28px
- `text-4xl`: 36px
- `text-5xl`: 48px
- `text-6xl`: 60px (hero only)

**Rules:**
- Never use font-weight 900 (too aggressive)
- Heading color: `--text-1` NOT pure black
- Body: `--text-2` for comfortable reading
- Never center-align body text blocks

### 1.3 Elevation / Shadow System (No more glow)

```
--shadow-xs:  0 1px 2px rgba(15,23,42,0.04)
--shadow-sm:  0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)
--shadow-md:  0 4px 16px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)
--shadow-lg:  0 8px 32px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.04)
--shadow-xl:  0 16px 48px rgba(15,23,42,0.12), 0 8px 16px rgba(15,23,42,0.06)

--shadow-brand: 0 8px 32px rgba(99,102,241,0.20)   ← CTA buttons only
--shadow-mint:  0 8px 24px rgba(16,185,129,0.16)   ← Success/progress
```

### 1.4 Border Radius System

```
--radius-sm:  6px
--radius-md:  10px
--radius-lg:  16px   ← cards
--radius-xl:  20px   ← large cards
--radius-2xl: 28px   ← hero sections, feature cards
--radius-full: 9999px  ← pills, badges, buttons
```

### 1.5 Card Component (replace glassmorphism entirely)

```css
.card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8edf5;
  box-shadow: 0 4px 16px rgba(15,23,42,0.08);
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(15,23,42,0.12);
}
```

### 1.6 Button System

**Primary (CTA — brand gradient, pill shape):**
```css
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 9999px;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(99,102,241,0.30);
  border: none;
}
.btn-primary:hover { box-shadow: 0 6px 24px rgba(99,102,241,0.40); transform: translateY(-1px); }
```

**Secondary (outlined — ghost):**
```css
.btn-secondary {
  background: transparent;
  border: 1.5px solid #e0e7ff;
  color: #6366f1;
  border-radius: 9999px;
  padding: 9px 22px;
}
.btn-secondary:hover { background: #eef2ff; border-color: #818cf8; }
```

**Soft (for less prominent actions):**
```css
.btn-soft {
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 9999px;
  padding: 8px 20px;
  border: none;
}
```

### 1.7 Input System

```css
.input {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 16px;
  font-size: 14px;
  color: #0f172a;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  outline: none;
  border-color: #818cf8;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.input::placeholder { color: #94a3b8; }
```

### 1.8 Background Decoration System

Replace dark aurora orbs with soft pastel blobs:
```css
.blob-1 {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
  top: -200px; right: -200px;
  pointer-events: none;
}
.blob-2 {
  background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
  bottom: -150px; left: -150px;
}
.blob-3 {
  background: radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%);
  top: 40%; left: 40%;
  width: 400px; height: 400px;
}
```

### 1.9 Animation Principles (Therapeutic, not flashy)

```css
/* Slower, gentler than current */
--ease-calm: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* Natural deceleration */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);    /* Gentle spring (not snap) */

/* Durations */
--duration-fast:   150ms   /* State changes (active, hover) */
--duration-normal: 250ms   /* Page transitions, reveal */
--duration-slow:   400ms   /* Hero reveals, important modals */
--duration-breath: 4000ms  /* Breathing/ambient animations */
```

**Framer Motion defaults for wellness:**
```js
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
const scaleIn = { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 } }
// Hover: whileHover={{ y: -2, transition: { duration: 0.2 } }} — SUBTLE, not dramatic
```

---

## PHASE 2 — Landing Page (/) — "Make a Recruiter Stop Scrolling"

### 2.1 Navbar
- White background with `border-bottom: 1px solid #f1f5f9`
- Logo: BetterMind wordmark + brain icon (indigo gradient)
- Nav links: `#475569`, hover `#6366f1` with soft underline
- CTA button: pill gradient "Get Started" with shadow
- Scroll behavior: very subtle shadow appears on scroll (no color change)
- Mobile: slide-in from right (not full overlay)

### 2.2 Hero Section
**Layout:** Split screen — text left, visual right
**Left:**
- Eyebrow pill badge: "🧠 AI-Powered Mental Health Platform" — soft indigo background
- H1: "Your mental health journey starts here" — bold, 60px, `#0f172a`
  - "mental health" = indigo gradient text clip
- Subtitle: 18px, `#64748b`, line-height 1.7, max-width 480px
- Two CTAs side by side: "Get Started Free" (primary) + "View Demo" (ghost)
- Trust strip below: "Trusted by 12,000+ users · 500+ verified doctors · 98% satisfaction"
  - Each metric: small dot separator, `#94a3b8` color

**Right (the WOW visual):**
- Floating 3D-ish card cluster — NOT a brain icon
- A mock dashboard card floating with a slight tilt (perspective transform)
- Stack of 3 cards: mood log, assessment result, appointment card
- Each card has a gentle float animation (staggered, different speeds)
- Soft indigo glow behind the cluster
- Small floating badges: "🎯 7-day streak!", "📈 Mood improved 32%", "✅ Appointment confirmed"
- These badges float and drift slowly

**Background:**
- Base: `#fafbff`
- Top-right blob: `rgba(99,102,241,0.06)` large soft circle
- Bottom-left blob: `rgba(16,185,129,0.05)`
- Subtle dot grid pattern: `rgba(99,102,241,0.04)` 20px grid

### 2.3 Social Proof Bar (below hero)
- Full-width band: `#f8fafc` background
- 5 logos or doctor profile pictures in a row
- Text: "Join thousands who've improved their mental wellness"
- Stats: animated count-up on scroll enter

### 2.4 Features Section
**Layout:** alternating left/right or 3-column grid
**Each feature card:**
- White card, 24px border-radius
- Icon: 48x48 rounded square, soft pastel background matching feature color
  - Mood: indigo icon on `#eef2ff` bg
  - Assessment: mint icon on `#ecfdf5` bg
  - Chat AI: violet icon on `#f5f3ff` bg
  - Doctors: blue icon on `#eff6ff` bg
  - Resources: orange icon on `#fff7ed` bg
  - Appointments: green icon on `#f0fdf4` bg
- H3: 20px, `#0f172a`
- Description: 14px, `#64748b`
- Small "Learn more →" link in feature color
- Hover: card lifts 4px, icon bg brightens slightly

### 2.5 "How It Works" Section
- 3 steps with large numbered circles (gradient fill 1/2/3)
- Horizontal connector line between them
- Each step has an icon, title, short description
- Step 1: "Take a quick assessment" — 5 min
- Step 2: "Get personalized insights" — AI-powered
- Step 3: "Connect with professionals" — 500+ doctors

### 2.6 Testimonials
- 3 cards in a row (or carousel on mobile)
- Each card: white, soft shadow
- Avatar: colored initial circle (no real photos)
- Stars: amber, 5-star
- Quote: 15px italic, `#374151`
- Name + role: "Sarah M., Anxiety Recovery"
- Soft indigo quote mark (large, decorative, behind text)

### 2.7 "Mental Health Stats" Section
- Dark-ish section (the ONLY dark section — use `#1e293b` not black)
- Full bleed with soft wave SVG top/bottom
- 4 large stats: animated count-up
- White text on dark slate — this creates contrast emphasis

### 2.8 CTA Banner
- Gradient: `#6366f1` to `#8b5cf6` (or to mint `#10b981`)
- Rounded 28px corners (card-style, not full-bleed)
- White text
- Two buttons: "Start Free" (white bg, indigo text) + "Talk to a Doctor" (transparent, white border)
- Decorative floating circles in the gradient background

---

## PHASE 3 — Dashboard (/dashboard) — "The Command Center"

### 3.1 Page Layout
- White/off-white background (`#fafbff`)
- Left sidebar (hidden on mobile) with nav links — OR top nav tabs
- Main content area with generous padding

### 3.2 Greeting Header
- "Good morning, Harsh 👋" — large, warm
- Date + day name in `#94a3b8`
- Quick mood check-in nudge: "How are you feeling today?" with 5 emoji quick-select
- If mood logged: "Great! You've logged your mood today ✓" in mint

### 3.3 Stat Cards Row (4 cards)
Each card should have its OWN color identity:

**Card 1 — Mood Score** (Indigo)
- Background: white
- Icon area: soft indigo circle on `#eef2ff` bg
- Number: large, bold, `#4f46e5`
- Trend: "+0.8 this week" in mint if positive, rose if negative
- Mini sparkline chart (tiny, 60px wide)

**Card 2 — Assessment** (Mint/Green)
- PHQ-9 score, severity badge
- Color-coded badge: "Minimal" = green, "Mild" = yellow, etc.

**Card 3 — Streak** (Orange/Warm)
- "🔥 7 day streak!"
- Progress ring showing days toward next milestone

**Card 4 — Upcoming** (Purple/Calm)
- Next appointment
- Doctor name + date
- "In 3 days" countdown

### 3.4 Charts Section
- Tab switcher: "Mood", "Assessment", "Activity" — pill-style tabs (NOT dark)
- Active tab: gradient background, white text
- Inactive: `#f1f5f9` background, `#64748b` text

**Chart Styling:**
- White card background
- Grid lines: `#f1f5f9` (barely visible)
- Axis text: `#94a3b8`
- Line/area: indigo gradient fill (top to bottom, NOT dark)
- Tooltip: white card, soft shadow (NOT dark glass)
- PHQ-9 line: indigo
- GAD-7 line: rose/pink
- Area fill: gradient from brand color at 15% opacity to 0%

### 3.5 Quick Actions
- "Record Today's Mood" — indigo pill button
- "Take Assessment" — mint pill button  
- "Find a Doctor" — soft purple pill button
- "Read Resources" — orange pill button
- These should feel like friendly nudges, not dashboard buttons

---

## PHASE 4 — Mood Tracker (/mood) — "The Daily Check-in"

### 4.1 The Mood Entry Card
This should feel like a calming ritual, not a form.

**Visual Mood Selector:**
- 10 large emoji circles in a horizontal row
- Each emoji on its own pill: background color shifts from red (1) through yellow (5) to green (10)
- Selected emoji: bounces gently with a scale animation
- Color gradient track UNDER the row showing the color spectrum
- No traditional range slider — just click the emoji

**OR: Arc Slider (premium feel)**
- A semicircular arc slider from 1-10
- The thumb is a large emoji that changes as you drag
- The arc fills with a gradient color matching the current mood
- Feels like a speedometer for your emotional state

**Notes area:**
- Placeholder: "What's on your mind today? (optional)"
- Soft background `#f8fafc`, focus ring indigo
- Below: character count, subtle

**Activity selection:**
- "How did you spend your time?" (friendly framing)
- Chips/pills in a wrap grid
- Unselected: `#f1f5f9` bg, `#64748b` text
- Selected: indigo soft bg, indigo text, with checkmark
- "+" to add custom

**Submit CTA:**
- Large, full-width, indigo gradient pill
- "Save My Mood" with heart icon
- On submit: gentle success animation (checkmark with scale pop)
- Confetti if it's a streak milestone

### 4.2 History Section
- "Your Mood Journey" heading
- Timeframe tabs: 7D / 30D / 90D
- Chart: white card, mint-to-transparent area fill
- Recent entries: timeline-style list with emoji, color, date, activity chips

---

## PHASE 5 — Assessment (/assessment) — "The Typeform Experience"

### 5.1 Redesign Concept
One question at a time. Full-screen, distraction-free. Like a meditation practice.

**Progress:**
- Top: thin progress bar (indigo, animated fill)
- "Question 3 of 16" in small text
- Phase indicator: "🔵 Depression (PHQ-9) → ○ Anxiety (GAD-7) → ○ Results"

**Question Card:**
- Full-width, centered
- White card with very soft shadow OR just centered on the bg
- Question number: large indigo "03" in background (decorative, low opacity)
- Question text: 24px, `#0f172a`, max-width 600px, centered
- Context hint: "Over the past 2 weeks..." in `#94a3b8`

**Answer Options:**
- 4 large pill buttons in a 2x2 grid or vertical stack
- Unselected: white card, `#e2e8f0` border, `#374151` text
- Hover: `#eef2ff` background, `#818cf8` border
- Selected: `linear-gradient(135deg, #6366f1, #8b5cf6)` background, white text, pop animation
- Auto-advance on selection (300ms delay so user sees selection)

**Navigation:**
- Back arrow: left, subtle gray
- Keyboard accessible (1/2/3/4 keys for answers)

### 5.2 Results Screen
- Celebration header: "Assessment Complete 🎉"
- Two score gauge/donut charts side by side
  - PHQ-9 gauge: color changes from green (low) to red (high)
  - GAD-7 gauge: same
- Severity badges: pill-shaped, color-coded
- Recommendations: clean list with checkmark icons
- CTAs: "Talk to a Doctor" + "Track My Mood"
- Crisis alert (if needed): rose-tinted card, prominent, with phone number

---

## PHASE 6 — AI Chat (/chat) — "The Safe Space"

### 6.1 Layout
- Clean white chat interface
- Very subtle dot grid background on the message area
- Bot avatar: soft indigo circle with brain icon (not scary)

### 6.2 Message Bubbles
**User messages:**
- Indigo gradient (`#6366f1` to `#8b5cf6`), white text
- Right-aligned, pill-shaped (20px radius)
- Sender: "You" label small above

**Bot messages:**
- White card with `border: 1px solid #e8edf5`
- Left-aligned
- Bot name: "MindCare AI" with verified badge
- Soft indigo left border accent (4px)
- Text: `#0f172a`, 14px

### 6.3 Typing Indicator
- 3 dots in soft indigo bubbles, animated
- "MindCare is thinking..." text alongside

### 6.4 Input Area
- White background
- Rounded pill input: `#f8fafc` bg, `#e2e8f0` border
- Send button: indigo gradient circle
- Quick symptom chips above input (scrollable horizontal)
- Max height with scroll for long message history

### 6.5 Empty State
- Illustration (or large emoji cluster): 🧠💬🌿
- "Hi, I'm here to help" heading
- "Tell me how you're feeling..." subtitle
- 3 quick start prompts as clickable cards:
  - "I'm feeling anxious lately"
  - "I can't sleep well"
  - "I feel overwhelmed at work"

---

## PHASE 7 — Find Doctors (/doctors) — "Trust & Credibility"

### 7.1 Page Header
- Soft gradient banner: `#f8faff` to white
- "Mental Health Professionals" — H1
- Search bar: prominent, full-width on mobile
- Filter pills: All / Psychiatrist / Therapist / Psychologist / Counselor

### 7.2 Doctor Cards (redesign)

**Card structure (white, 20px radius, soft shadow):**
```
┌─────────────────────────────────────┐
│  [Avatar]  Dr. Sarah Johnson        │
│  [72px]    Psychiatrist             │
│  Initials  ★★★★★ 4.9 (127 reviews) │
│                                     │
│  "Specializing in anxiety and       │
│   trauma-informed care..."          │
│                                     │
│  🎓 15 years exp  👥 2,400 patients │
│                                     │
│  [Availability badge]  [Book Now →] │
└─────────────────────────────────────┘
```

**Avatar:** 72px circle, colored by specialty:
- Psychiatrist: indigo
- Therapist: mint
- Psychologist: violet
- Counselor: warm orange

**Availability badge:**
- "Available Today" = mint background, green text
- "Next: Tomorrow" = amber background
- "Verified ✓" badge: small, bottom-left of avatar

**Star ratings:** amber stars, NOT gray
**Book button:** indigo pill, "Book Appointment →"

**Hover effect:**
- Card lifts 4px
- Subtle indigo glow on shadow
- Avatar has a ring animation

---

## PHASE 8 — Appointments (/appointments) — "Clarity & Organization"

### 8.1 Upcoming Appointments
- Timeline-style vertical layout
- Each appointment: white card, left border in status color
- Date header before each group: "Today · June 20" (sticky-ish)

**Card internals:**
- Left: date circle (month + day in indigo)
- Middle: doctor name, specialty, time, type
- Right: status badge + action buttons
- Status colors: confirmed=mint, pending=amber, cancelled=rose

**Status badges:** pill-shaped with soft background

### 8.2 Empty State (Great illustration opportunity)
- Calendar illustration (or emoji 📅)
- "No appointments yet"
- "Find a doctor who's right for you" CTA
- Large, centered, friendly

### 8.3 Booking Flow
- Step indicator (1: Doctor → 2: Date → 3: Confirm)
- Date picker: custom calendar component (not native)
  - Calendar grid: white cells, selected=indigo, today=mint ring
- Time slots: pill buttons in a 4-column grid
  - Available: white with `#e2e8f0` border
  - Selected: indigo gradient
  - Unavailable: `#f1f5f9` with strikethrough

---

## PHASE 9 — Resources (/resources) — "The Knowledge Hub"

THIS PAGE NEEDS THE MOST WORK — it's mentioned as looking bad.

### 9.1 Page Hero
- Soft gradient banner (indigo `#eef2ff` to white)
- "Mental Health Resources" + search bar prominently centered
- Category filter pills horizontally scrollable

### 9.2 Resource Cards — Masonry Grid
**Each card (white, 16px radius):**
- Color accent bar at top (4px, different per category)
  - Articles: indigo
  - Videos: violet
  - Exercises: mint
  - Crisis: rose
  - Tools: orange
- Category badge: pill, soft pastel matching accent
- Title: 16px, `#0f172a`, line-clamp-2
- Description: 13px, `#64748b`, line-clamp-3
- Read time: "5 min read" + icon
- Save button: bookmark icon, right-aligned
- Hover: lift + accent bar glows slightly

### 9.3 Featured/Crisis Resources
- TOP of page after hero
- Crisis card: rose gradient banner, phone number, PROMINENT
- Featured this week: 3 highlighted cards with image-like gradient header

### 9.4 Categories Section
- Horizontal scroll of category cards (pill shape, icon + label)
- "Anxiety" (indigo) / "Depression" (violet) / "Sleep" (deep blue) / "Stress" (orange) / "Relationships" (rose)

---

## PHASE 10 — Settings/Security (/settings/security)

### 10.1 Settings Layout
- Left sidebar: account / security / notifications / privacy (future)
- Right: active content area
- Both on white, clean grid

### 10.2 Security Card
- "Two-Factor Authentication" section
- Status indicator: green dot "Enabled" / gray dot "Disabled"
- Setup flow: step indicator inside the card
- QR code in a white rounded square with subtle shadow
- Secret key: monospace, copyable, styled nicely
- Recovery codes: grid of code chips (mint background, dark mono text)

---

## PHASE 11 — Signup & Login

### 11.1 Login Page
- Left: white form panel
- Right: soft gradient panel with floating testimonials/stats
- Form: clean with label ABOVE field (not placeholder-only)
- Social proof: "Join 12,000+ users" with tiny avatar stack

### 11.2 Signup
- Multi-step with progress indicator
- Each step feels like a conversation, not a form

---

## PHASE 12 — Doctor Dashboard (/doctor/dashboard)

### 12.1 Stats Cards
- Each card: white with colored left border accent
- Upcoming: indigo
- Patients: mint
- Reviews: amber
- Rating: violet

### 12.2 Appointment List
- Clean table on white card
- Avatar circles for patients
- Status badges
- Quick action: "Confirm" / "Reschedule" buttons

---

## PHASE 13 — Micro-interactions Pass (FINAL PHASE)

Apply to EVERY interactive element:

### Buttons
- All: `whileHover={{ y: -1, scale: 1.01 }}` — subtle lift
- Primary: shadow intensifies on hover
- Click: `whileTap={{ scale: 0.98 }}`

### Cards
- All: `whileHover={{ y: -3 }}` — gentle float
- Shadow deepens
- No dramatic scale

### Form inputs
- Focus ring: smooth 150ms
- Label: slides up when focused (floating label pattern)
- Error: shake animation + rose border

### Page transitions
- Every page: `initial={{ opacity: 0, y: 12 }}` → `animate={{ opacity: 1, y: 0 }}`
- Stagger children: 0.07s delay per card

### Loading states
- Skeleton: soft `#f1f5f9` shimmer
- Spinner: indigo, smooth
- Progress bars: animated with gradient

### Toast notifications
- Bottom-right, slide up
- Success: mint left border
- Error: rose left border
- Info: indigo left border
- 4 second auto-dismiss

### Empty states (all pages need them)
- Large icon (48px) in pastel circle
- Friendly heading
- Helpful CTA
- Never just blank

---

## PHASE 14 — Responsive Polish

### Mobile (< 640px)
- Single column everything
- Bottom navigation bar (5 icons: Home/Mood/Chat/Doctors/Profile)
- Modal sheets slide up from bottom
- Tap targets: minimum 44x44px

### Tablet (640–1024px)
- 2-column grids
- Sidebar hidden, hamburger reveals

### Desktop (> 1024px)
- Full layouts as designed
- Max-width: 1280px, centered

---

## EXECUTION ORDER

```
[ ] 1. tailwind.config.js — New color system
[ ] 2. globals.css — New CSS variables + utilities (card, btn-primary, input, blob)
[ ] 3. layout.js — Background color update
[ ] 4. Navbar — Light version
[ ] 5. Footer — Light version
[ ] 6. Landing page (/) — Full hero + sections
[ ] 7. Dashboard + all charts — Light recharts theme
[ ] 8. Mood page — Arc/emoji selector redesign
[ ] 9. Assessment — Typeform style
[ ] 10. Chat — Clean chat bubbles
[ ] 11. Doctors — Trust-focused cards
[ ] 12. Appointments — Timeline + booking flow
[ ] 13. Resources — Masonry grid (this is the most broken one)
[ ] 14. Settings/Security — Clean settings layout
[ ] 15. Doctor dashboard
[ ] 16. Login / Signup
[ ] 17. Micro-interactions pass
[ ] 18. Mobile responsive pass
[ ] 19. Build check + fix
[ ] 20. DONE
```

---

## KEY PRINCIPLES TO NEVER FORGET

1. **No pure black backgrounds** — `#1e293b` at darkest, and only for 1 section
2. **Shadows not glows** — soft gray shadows, not colored neon
3. **Whitespace is free** — use generous padding (32px+)
4. **Colors are soft** — every color used at 10-20% opacity for backgrounds
5. **Borders are subtle** — `1px solid #e8edf5`, never heavy
6. **Animation is calm** — slow (400-500ms), gentle easing, small movement
7. **Typography breathes** — line-height 1.6-1.7, never cramped
8. **Every state matters** — loading, empty, error, success — all designed
9. **Mobile is not an afterthought** — design mobile-first
10. **Trust signals everywhere** — verified badges, security notices, stats

---

This is what separates a resume-winning project from a student project.
The dark version looks like a developer made it. 
The light version looks like a product team shipped it.
