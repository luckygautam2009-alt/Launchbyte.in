# LaunchByte Design System Spec & Inventory

## 1. Overview & Philosophy
LaunchByte is an engineering-first, high-trust platform designed to outperform competitors (Devfolio, Unstop, Hack2skill) on speed, clarity, trustworthiness, and developer delight.

The design system provides:
- **Visual Polish**: Premium dark-mode first aesthetic with subtle mesh gradients, neon accents (`#6366f1` Indigo, `#06b6d4` Cyan, `#10b981` Emerald), and glassmorphic depth (`backdrop-blur-xl`).
- **Performance-First Motion**: Micro-interactions powered by Framer Motion restricted strictly to hardware-accelerated properties (`transform` and `opacity`) with strict adherence to `prefers-reduced-motion: reduce`.
- **High-Trust Indicators**: Prominent trust scores, verification rings, cryptographic QR check-in states, and real-time attendance telemetry.
- **Mobile-First Ergonomics**: Native-like bottom bar navigation, minimum 44px tap targets, thumb-accessible drawers, and swipeable sheet menus.

---

## 2. Token Specification

### 2.1 Color Palette
Configured in `frontend/tailwind.config.js` and CSS variables in `frontend/app/globals.css`.

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `brand-50` to `brand-400` | `#eef2ff` - `#818cf8` | Highlight text, light brand accents, active states |
| `brand-500` / `brand-600` | `#6366f1` / `#4f46e5` | Primary brand CTA, active links, glow highlights |
| `brand-900` / `brand-950` | `#312e81` / `#1e1b4b` | Deep brand surfaces, glow shadows |
| `accent-400` / `accent-500` | `#22d3ee` / `#06b6d4` | Laser scanlines, holographic tags, cyber accents |
| `emerald-400` / `emerald-500`| `#34d399` / `#10b981` | High trust score (>=80), verified check-ins, success |
| `amber-400` / `amber-500`  | `#fbbf24` / `#f59e0b` | Medium trust score (60-79), pending review, waitlist |
| `rose-400` / `rose-500`   | `#f87171` / `#ef4444` | Flagged / unverified, registration deadline warning |
| `surface-900` / `surface-950`| `#0f172a` / `#080d1a` | Base backdrop, modals, cards, floating navigations |

### 2.2 Typography
- **Headings & Brand**: `Plus Jakarta Sans`, `Space Grotesk`, `-apple-system`, `sans-serif`
  - High geometric precision, tight letter-spacing for headlines (`tracking-tight`).
- **Body & UI**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
  - Clean readability across high-density tabular data and detail cards.
- **Data & Codes**: `JetBrains Mono`, `Fira Code`, `ui-monospace`
  - Fixed-width alignment for registration codes (`HQ26-XXXX`), timers, trust scores, and JSON telemetry.

### 2.3 Radii & Elevation
- **Card Radius**: `rounded-2xl` (16px) or `rounded-3xl` (24px) for hero dialogs.
- **Interactive Pill**: `rounded-full` for badges, filter chips, and bottom bar floating pills.
- **Shadows**:
  - `shadow-glow`: `0 0 25px -5px rgba(99, 102, 241, 0.35)`
  - `shadow-glow-accent`: `0 0 25px -5px rgba(6, 182, 212, 0.35)`
  - `shadow-glow-emerald`: `0 0 25px -5px rgba(16, 185, 129, 0.35)`

---

## 3. Motion System & Physics (`frontend/lib/motion.ts`)

### 3.1 Timing Curves & Spring Presets
- **Spring Bouncy**: `{ type: "spring", stiffness: 400, damping: 25 }` (modal popups, scanner checkmarks, badge expansion)
- **Spring Smooth**: `{ type: "spring", stiffness: 300, damping: 30 }` (card hover elevation, tabs floating pill)
- **Spring Gentle**: `{ type: "spring", stiffness: 200, damping: 28 }` (sheet drawers, dropdown accordions)
- **Easings**:
  - `EASE.out`: `[0.16, 1, 0.3, 1]` (quintic deceleration)
  - `EASE.inOut`: `[0.65, 0, 0.35, 1]`

### 3.2 Signature Micro-Interactions
1. **Laser QR Scanline**: Linear vertical laser beam (`animate-scan-line`) passing continuously over attendee QR passes and the live camera viewfinder.
2. **Registration Confetti**: Multi-burst particle explosion triggered upon successful hackathon registration via `triggerConfetti()`.
3. **Card Lift**: Hover elevation `whileHover: { y: -4, transition: { duration: 0.2 } }` across all opportunity and event cards.
4. **Interactive Tab Indicator**: Floating highlight pill with `layoutId="activeTabPill"` providing seamless continuous transitions across category switches.
5. **Spring Scanner Reaction**: Instant visual spring pop (`<CheckCircle2>` / `<XCircle>`) + haptic vibration (`navigator.vibrate`) on pass validation.

### 3.3 Accessibility & Reduced Motion
Any user with `prefers-reduced-motion: reduce` configured at the OS level automatically disables all Framer Motion springs and CSS keyframe animations via standard media query overrides in `globals.css` and `framer-motion` variant clamps.

---

## 4. Component Inventory (`frontend/components/ui/`)

| Component | Props / Features | Accessibility Features |
| :--- | :--- | :--- |
| `Button` | Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `accent`. Sizes: `sm`, `md`, `lg`. | Minimum 44px tap target on mobile, `aria-busy` for spinner, visible focus ring. |
| `Input` | Left/right icon slots, clear button, error text, helper text. | Associated `<label>` via `htmlFor`, `aria-invalid`, `aria-describedby`. |
| `TrustBadge` | Score `0-100`, status `verified\|pending\|unverified\|flagged`, ring colors. | Tooltip triggerable by keyboard focus and hover, screen-reader status label. |
| `Badge` | Variants: `brand`, `accent`, `emerald`, `amber`, `rose`, `slate`, `purple`. | Semantic contrast ratio >= 4.5:1 against dark backgrounds. |
| `Card` | Glassmorphic border, gradient overlay, interactive elevation. | Proper card grouping, accessible hover state. |
| `Tabs` | Horizontal tab list with floating `layoutId` pill. | `role="tablist"`, `role="tab"`, `aria-selected`, arrow-key navigation. |
| `Dialog` | Backdrop blur, animated entrance, header, body, footer. | `role="dialog"`, `aria-modal="true"`, focus trap, Escape key dismiss, body scroll lock. |
| `Drawer` | Bottom sheet on mobile, touch drag handle. | Accessible sheet landmarks, Escape key listener. |
| `Skeleton` | Shimmer pulse placeholder for cards, avatars, and text lines. | `aria-hidden="true"`, high contrast placeholder. |
| `Countdown` | Flip-card style countdown (days, hours, minutes, seconds). | Monospace tabular figures, `aria-live="polite"` status updates. |
| `ProgressBar` | Gradient capacity bar with percentage and remaining slots. | `role="progressbar"`, `aria-valuenow`, `aria-valuemax`. |
| `CommandPalette` | Global modal search (`Cmd+K` / `Ctrl+K`), quick navigation. | Keyboard navigation (`↑`, `↓`, `Enter`, `Esc`), live results filtering. |
| `MobileBottomNav` | 5 thumb-friendly items (Home, Explore, Events, Teams, Profile). | `aria-label="Mobile Bottom Navigation"`, active state indicators. |

---

## 5. Engineering Do's and Don'ts

### Do:
- Always enforce min `44px` height/width on interactive touch targets (`min-h-[44px]`).
- Use `tabular-nums` or `font-mono` whenever rendering numbers, dates, or countdown digits to prevent layout jitter.
- Animate only `transform` and `opacity` properties to prevent costly browser layout thrashing.
- Always check that modals and drawers trap keyboard focus and restore focus on dismiss.

### Don't:
- Never animate `width`, `height`, `margin`, or `padding` directly in loops or transitions.
- Never use non-semantic `div` for clickable buttons without `role="button"` and `tabIndex={0}`.
- Never remove focus rings without providing an accessible `:focus-visible` replacement.
- Never rely solely on color to communicate trust status (always include icons and text labels).
