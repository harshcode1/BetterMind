# BetterMind — Complete UI Overhaul TODO

## Design Direction (READ THIS FIRST)

**Theme:** Dark-first, futuristic healthcare. Think Linear meets Vercel meets a medical AI product.

**Color System:**
- Background: `#05050a` (near black), `#0d0d1a` (card surface)
- Primary: Electric Violet `#7c3aed` → `#a78bfa` (gradient)
- Accent: Cyan `#06b6d4`
- Positive: Emerald `#10b981`
- Warning: Amber `#f59e0b`
- Danger: Rose `#f43f5e`
- Text primary: `#f1f5f9`
- Text muted: `#64748b`
- Border: `rgba(255,255,255,0.06)`

**Typography:**
- Headings: `Space Grotesk` (Google Font, variable weight)
- Body: `Inter` (already installed)
- Mono: `JetBrains Mono` (for code/stats)

**Design Motifs:**
- Glassmorphism cards: `backdrop-blur-xl bg-white/5 border border-white/10`
- Glowing elements: `box-shadow: 0 0 40px rgba(124,58,237,0.3)`
- Gradient text: `bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent`
- Subtle grid/dot pattern backgrounds
- Soft animated gradients (aurora effect) on hero

**Libraries to install (DO NOT skip any):**
```
npm install framer-motion @react-three/fiber @react-three/drei three
npm install lenis gsap
npm install lucide-react
npm install recharts
npm install clsx tailwind-merge
```

---

## PHASE 1 — Foundation (Do this before touching any page)

### F1. Tailwind Config Overhaul
**File:** `tailwind.config.js`
- Add custom color palette (violet, cyan, emerald, rose system above)
- Add custom `fontFamily`: Space Grotesk + Inter
- Add custom `animation`: `float`, `glow-pulse`, `aurora`, `shimmer`, `fade-up`
- Add custom `keyframes` for all animations
- Add `backgroundImage`: `gradient-radial`, `gradient-conic`, dot-pattern utility
- Add `boxShadow`: `glow-violet`, `glow-cyan`, `glow-emerald`, `card`
- Add `backdropBlur` extended values

### F2. Global CSS Reset
**File:** `src/app/globals.css`
- Set `background: #05050a` on `html, body`
- Custom scrollbar (thin, violet track)
- Selection color: violet
- Add CSS variables for all colors so they're reusable
- Add `@font-face` for Space Grotesk via Google Fonts import
- Add `.glass` utility class: `backdrop-blur-xl bg-white/5 border border-white/8 rounded-2xl`
- Add `.glow-violet` utility: `shadow-[0_0_40px_rgba(124,58,237,0.35)]`
- Add `.gradient-text` utility
- Add smooth scroll behavior

### F3. Layout Wrapper
**File:** `src/app/layout.js`
- Add Space Grotesk Google Font next to Inter
- Wrap children in Lenis smooth scroll provider
- Add global page transition wrapper (Framer Motion `AnimatePresence`)
- Remove `bg-gray-50` from body (replace with dark bg)
- Update metadata: `BetterMind | AI Mental Health Platform`

### F4. Utility File
**File:** `src/app/lib/utils.js` (NEW)
- `cn()` helper using `clsx` + `tailwind-merge`
- `formatNumber()` — turns 1000 → "1K"
- `getGradientByScore()` — maps score severity to gradient class

---

## PHASE 2 — Navbar (Priority: CRITICAL — seen on every page)

**File:** `src/app/components/Navbar.js`

### Current state: White bar, gray text, no personality

### New design:
- **Frosted glass** navbar: `backdrop-blur-xl bg-black/40 border-b border-white/8`
- Sticky with a subtle border that appears on scroll (Framer Motion scroll listener)
- Logo: Replace image with an SVG brain/spark icon + "BetterMind" in Space Grotesk, violet gradient
- Nav links: Pill-shaped active indicator that **slides** between links (Framer Motion layout animation with `layoutId="nav-indicator"`)
- Active link: Glowing violet pill background
- Profile avatar: Gradient border ring that pulses, initials in gradient text
- Profile dropdown: Glass card with backdrop-blur, smooth slide-down animation
- Login/Signup buttons: "Login" → ghost button with violet border; "Get Started" → gradient fill button with shine effect
- Mobile menu: Full-screen overlay with staggered link animations (not a tiny dropdown)
- Add Framer Motion `motion.nav` with scroll-based opacity

---

## PHASE 3 — Landing Page (Priority: CRITICAL — first thing recruiters see)

**File:** `src/app/page.js`

### Current state: Plain hero text + white feature cards. Forgettable.

### New design — 6 sections:

#### Hero Section
- Full-viewport dark background with **animated aurora gradient** (CSS animation, violet/cyan/indigo blobs that slowly shift)
- Large heading in Space Grotesk: `"Mental Health,\nReimagined with AI"` — "AI" in gradient text
- Subtitle fades up with 200ms delay (Framer Motion)
- Two CTA buttons animate in from bottom
- **3D Brain visualization** (Three.js / @react-three/drei) — rotating low-poly brain mesh, glowing edges, floats slowly. Positioned right side of hero on desktop, centered behind text on mobile
- Floating stat pills animate in: "10K+ Users", "500+ Doctors", "98% Satisfaction" — glass cards that float in from different angles
- Scroll indicator: Animated bouncing arrow

#### Trusted By / Stats Bar
- Dark row with large animated numbers (count up on scroll into view)
- Stats: "12,000+ assessments completed", "500+ verified doctors", "4.9★ avg rating"
- Horizontal scroll marquee on mobile

#### Features Section
- Dark section with subtle dot-grid background
- Section heading fades in on scroll
- 4 feature cards in a **bento grid** layout (not equal columns — mix 2/3 and 1/3)
- Each card: glass morphism, icon that glows in the card's accent color, hover = card lifts + glow intensifies
- Cards animate in with staggered fade-up (Framer Motion `useInView`)
- Feature icons: Lucide React, animated on hover

#### How It Works
- 3-step horizontal timeline
- Each step: large numbered circle (gradient border), connected by animated dashed line that draws itself (SVG stroke-dashoffset animation)
- Steps: "Sign up & take assessment" → "Track mood daily" → "Connect with doctors"
- Steps animate in on scroll

#### Testimonials
- 3 glass cards in a row, each with a quote, name, avatar (gradient circle), star rating
- Cards have subtle parallax shift on mouse move (Framer Motion `useMotionValue`)

#### CTA Footer Banner
- Full-width gradient banner (violet to cyan)
- Bold heading + button
- Animated grid/wave pattern in background

---

## PHASE 4 — Auth Pages

### Login Page
**File:** `src/app/login/page.js`

#### Current state: Standard form on white background

#### New design:
- Split-screen layout: Left = dark glass card with form, Right = animated 3D visual (floating orbs / neural network animation with Three.js or CSS)
- Card: glass card centered, `backdrop-blur-xl bg-white/5 border border-white/10`
- Heading: "Welcome back" in Space Grotesk gradient text
- Input fields: Dark background (`bg-white/5`), violet focus ring that glows, floating labels that animate up on focus
- Password field: Show/hide toggle with Lucide eye icon
- Submit button: Full-width gradient (violet → indigo), shimmer effect on hover, spinner replaces text during loading
- Error message: Rose-tinted glass alert that slides in from top
- "Don't have an account?" link: Hover → underline animates from left to right
- Animated background: Same aurora blobs as hero, slower

### Signup Pages
**File:** `src/app/signup/page.js` + `src/app/signup/doctor/page.js`

- Same glass card layout as login
- Multi-step form with animated step indicator (progress bar + step circles)
- Each step slides in/out with `AnimatePresence` directional slide
- Doctor signup: Extra step for specialty/license with a special "Professional" badge shown after submit
- Success state: Full-screen confetti or particle burst animation

---

## PHASE 5 — Dashboard (Priority: HIGH — this is the "wow" screen)

**File:** `src/app/dashboard/page.js` + chart components

### Current state: Tabs + basic Chart.js charts on white bg

### New design:

#### Header Area
- Greeting: "Good morning, Harsh 👋" with animated typing effect
- Date + weather-style emotional context tag (e.g., "Your week is looking better than last week")
- Quick action pills: "+ Log Mood", "+ Take Assessment" — glass buttons with icons

#### Stats Row (4 cards)
- Glass stat cards with glowing icon backgrounds
- **Animated number count-up** on page load (GSAP or custom hook)
- Stats: Current streak, avg mood this week, assessments taken, doctor appointments
- Trend indicator: Small sparkline chart in each card (Recharts `<Sparkline>`)
- Each card has a unique accent color (violet, cyan, emerald, amber)

#### Charts Area (redesign ALL charts)
- **Mood Trends**: Recharts AreaChart with gradient fill (violet → transparent), smooth curve, animated on mount (`isAnimationActive`)
- **PHQ-9/GAD-7 Trends**: Recharts LineChart with glowing dots, gradient lines
- **Correlation Chart**: Beautiful scatter plot with gradient dots
- **Activity Impact**: Horizontal bar chart with gradient bars
- All charts: Dark background (`#0d0d1a`), white/muted axis labels, custom tooltips (glass cards)

#### Milestone Tracker
- Redesign as a horizontal timeline with glowing dots for achieved milestones
- Unachieved milestones: Dashed circle, muted
- Achieved: Solid violet glow, check animation when newly unlocked

#### Tab Navigation
- Pill tabs with sliding indicator (not just underline)

---

## PHASE 6 — Mood Tracker

**File:** `src/app/mood/page.js`

### Current state: Slider + list of buttons + boring chart

### New design:
- **Mood input**: Large circular arc slider (SVG-based), not a rectangle. Emoji face at center that morphs between expressions (1=😢, 10=😁). Color of the arc gradient shifts from red to violet to green.
- **Mood number**: Large animated counter in center of circle
- Activities: Pill tags with icons (Lucide), selected = glowing violet pill
- Notes: Auto-resizing dark textarea with character counter
- Submit button: Full-width gradient, pops with small scale animation on success
- Success state: Confetti burst + "Mood logged!" with animated checkmark
- **Mood History Chart**: Beautiful Recharts AreaChart (see dashboard style)
- History list: Glass cards for each entry, mood colored left border, expandable notes

---

## PHASE 7 — Chat Page

**File:** `src/app/chat/page.js`

### Current state: Symptom buttons → text display. Not a chat at all.

### New design — full messaging UI:
- Dark chat container, split layout: symptom panel left, messages right (desktop)
- **Messages**: Bubbles — user messages right-aligned (violet gradient bg), bot messages left-aligned (glass bg)
- Bot messages: Typing indicator (3 bouncing dots, staggered animation) while loading
- Message text animates in word by word (Framer Motion stagger)
- Symptom categories: Collapsible sections with animated expand/collapse
- Selected symptoms: Shown as glowing pill tags above input
- Bottom input bar: Dark glass input with send button (Lucide `SendHorizontal` icon), `Enter` to send
- AI indicator: Small "Powered by GPT-4o-mini" badge with a glow
- Crisis alert banner: Rose-tinted glass card that slides in if crisis keywords detected
- Smooth scroll to latest message (`useEffect` + `ref.scrollIntoView`)

---

## PHASE 8 — Assessment

**File:** `src/app/assessment/page.js`

### Current state: Standard form with radio buttons, very clinical

### New design:
- **Question cards**: Full-screen centered card for each question (one at a time, like Typeform)
- Progress bar at top: Animated fill, shows "Question 3 of 9" with percentage
- Question text: Large, Space Grotesk, fades in
- Answer options: 4 glass cards in a row, hover = lift + violet ring, click = filled violet + scale
- Navigation: "Previous" ghost button left, "Next" gradient button right
- Between PHQ-9 and GAD-7: Animated transition screen "Great! Now let's check anxiety"
- Results screen: 
  - Score revealed with a circular arc gauge (animated, fills to score percentage)
  - Severity badge with gradient color (green/yellow/orange/red)
  - Recommendations as animated list items that fade in one by one
  - "View Full Report" button

---

## PHASE 9 — Doctors Listing

**File:** `src/app/doctors/page.js`

### Current state: White cards with name/specialty

### New design:
- Search bar at top: Glass input with Lucide `Search` icon, filter pills below (specialty, availability, rating)
- Doctor cards: Dark glass cards in a **3-column responsive grid**
- Each card:
  - Avatar: Large circle with gradient border ring + initials (or photo)
  - Name in Space Grotesk, specialty in muted cyan
  - Star rating: Animated golden stars (fill animation on hover)
  - Specialty tag: Glowing pill
  - "Available today" badge if slots exist (emerald pulse dot)
  - CTA: "Book Appointment" → gradient button that fills on hover
- Hover state: Card lifts with `translateY(-4px)` + glow
- Skeleton loading: Animated shimmer cards while fetching

---

## PHASE 10 — Appointments Pages

**File:** `src/app/appointments/page.js` + `src/app/appointments/new/page.js`

### Appointments list:
- Timeline view: Vertical line with appointment cards on alternating sides
- Each card: Glass, colored status badge (emerald=confirmed, amber=pending, rose=cancelled), doctor avatar, date/time with countdown "In 2 days"
- Empty state: Animated illustration + "Book your first appointment" CTA

### Book Appointment:
- 3-step wizard with animated progress
- Step 1: Doctor card (pre-selected or pick from list)
- Step 2: Calendar grid (custom styled, dark glass) — available dates glow, unavailable are muted
- Step 3: Time slot picker — pills grid, selected = violet glow
- Confirmation screen: Success animation (checkmark draws itself with SVG stroke)

---

## PHASE 11 — Resources Page

**File:** `src/app/resources/page.js`

### Current state: Long scrollable list of cards. Overwhelming.

### New design:
- Hero section: Gradient banner with search bar
- Category tabs: Horizontally scrolling pill tabs with icons
- Resource cards: Masonry grid layout (different card heights look premium)
- Each card: Glass, tag pills, "Save" bookmark icon (fills on click), external link icon
- Saved resources: Slide-out drawer panel from right
- Personalized section: "Recommended for you" — 3 highlighted cards with glowing border

---

## PHASE 12 — Doctor Dashboard

**File:** `src/app/doctor/dashboard/page.js`

### New design:
- Stats row: 4 glass cards (today's appointments, pending, total patients, rating)
- Appointment list: Timeline style, patient avatars, time slots
- Quick actions panel: Glass card with action buttons
- Rating display: Large star rating visualization
- Status banners (pending/rejected): Already added — style them to match the dark glass aesthetic

---

## PHASE 13 — Settings / Security Page

**File:** `src/app/settings/security/page.js`

### New design:
- Settings layout: Left sidebar with nav items (glass), right = content area
- 2FA section: Glass card with QR code (styled with violet border frame)
- Toggle switches: Custom animated toggle (pill slides, not checkbox)
- Recovery codes: Monospace grid on dark background, copy button with success animation
- Danger zone: Rose-tinted glass section at bottom

---

## PHASE 14 — Footer

**File:** `src/app/components/Footer.js`

### New design:
- Dark background matching global bg
- 4-column grid: About, Features, Resources, Contact
- Social icons: Lucide icons, hover = violet glow
- Bottom bar: Muted text, separator line
- "Powered by GPT-4o-mini" badge + "Built with Next.js 14" badge
- Subtle animated gradient border at the top of the footer

---

## PHASE 15 — Micro-interactions & Polish (Do last)

- [ ] All buttons: `whileHover={{ scale: 1.02 }}` + `whileTap={{ scale: 0.98 }}` (Framer Motion)
- [ ] All cards: `whileHover={{ y: -4 }}` transition
- [ ] Page transitions: `AnimatePresence` with `opacity` + `y: 20 → 0` on every page
- [ ] Form inputs: Floating label animation, glow ring on focus
- [ ] Loading states: Skeleton shimmer on ALL data-fetching sections (not spinners)
- [ ] Empty states: Illustrated (SVG or Lottie) + animated CTA
- [ ] Toast notifications: Replace all `alert()` with custom glass toast (bottom-right, slide in)
- [ ] Success states: Animated checkmark SVG (stroke-dashoffset)
- [ ] Error states: Rose shake animation on form
- [ ] Scroll-triggered animations: All sections fade + slide up on scroll (`useInView`)
- [ ] Custom cursor: (optional but wow factor) — small glowing dot that follows mouse

---

## Package Installation Order

```bash
# Step 1: Animation + 3D
npm install framer-motion @react-three/fiber @react-three/drei three

# Step 2: Smooth scroll
npm install @studio-freight/lenis

# Step 3: Animation utility
npm install gsap

# Step 4: Icons
npm install lucide-react

# Step 5: Better charts
npm install recharts

# Step 6: Utilities
npm install clsx tailwind-merge
```

---

## Execution Order

```
Phase 1: Foundation (tailwind.config, globals.css, layout, utils) ← DO FIRST
Phase 2: Navbar ← Do second (visible everywhere)
Phase 3: Landing page ← Highest recruiter visibility
Phase 4: Auth pages (login, signup)
Phase 5: Dashboard ← Second highest visibility
Phase 6: Mood tracker
Phase 7: Chat
Phase 8: Assessment
Phase 9: Doctors listing
Phase 10: Appointments
Phase 11: Resources
Phase 12: Doctor dashboard
Phase 13: Settings/Security
Phase 14: Footer
Phase 15: Micro-interactions pass (global polish)
```

---

## What Recruiters Will See

When done, every page will have:
- **Dark glass aesthetic** — looks like a $50M startup product
- **Smooth animations** — nothing snaps, everything transitions
- **3D brain visualization** on landing — literally nobody has this
- **Morphing mood emoji** — interactive and memorable  
- **Typeform-style assessment** — feels premium
- **Real AI chat UI** — bubbles, typing indicator, streaming feel
- **Data visualization** — beautiful dark charts, not default Chart.js

Resume bullet: *"Designed and built production-grade UI with Framer Motion animations, Three.js 3D visualization, and glassmorphism design system — from scratch, zero UI libraries."*
