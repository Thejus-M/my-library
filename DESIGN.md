---
name: My Library
description: A personal Movies/Series gallery rendering Apple TV's tvOS grammar on the web.
colors:
  canvas: "#050505"
  surface-raised: "#1c1c1e"
  surface-skeleton: "#191919"
  text-primary: "#f5f5f7"
  text-dim: "#98989d"
  accent: "#f5f5f7"
typography:
  display:
    fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  control: "999px"
  card: "14px"
  modal: "18px"
  input: "10px"
  still: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "32px"
  xxl: "40px"
components:
  tab-pill:
    backgroundColor: "transparent"
    textColor: "{colors.text-dim}"
    rounded: "{rounded.control}"
    padding: "7px 20px"
  tab-pill-active:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    rounded: "{rounded.control}"
    padding: "7px 20px"
  pill-btn-primary:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    rounded: "{rounded.control}"
    padding: "11px 26px"
  pill-btn-secondary:
    backgroundColor: "rgba(255,255,255,0.18)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "11px 26px"
  poster-card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.card}"
    width: "170px"
    height: "auto"
---

# Design System: My Library

## Overview

**Creative North Star: "The Apple TV App, Rendered on the Web"**

My Library refuses the generic dark-mode Netflix-clone template. It is a direct translation of tvOS's own grammar into HTML/CSS/JS: a slim glass utility bar, focus-lift poster shelves that stay static-shadow-free at rest, and full-bleed detail takeovers with a bottom-left title lockup instead of a centered banner card. Nothing in the system is decorative for its own sake; every glass surface, every pill, every lift-on-focus poster exists because the tvOS app it's modeling does the same thing.

The palette is deliberately monochrome: a true near-black canvas, off-white text and controls, zero color accent anywhere. Depth comes from blur and glow, not from color or hard shadow. Confirmed rejection: no static box-shadow on any element at rest (posters, cards, rows) — shadow/glow is exclusively a hover/focus response.

**Key Characteristics:**
- True near-black canvas (`#050505`), not pure black
- Monochrome black/white palette, zero color accent
- SF Pro Display system stack (brand-correct: Apple TV's own face)
- Glass/blur chrome (topbar, all modals, toast) via `backdrop-filter: blur() saturate()`
- Zero-shadow-at-rest poster tiles that lift with scale + translateY + soft glow only on hover/focus
- Pill radius (999px) for every interactive control vs. 14px for media cards — a deliberate, documented split
- Hand-authored inline SVG icon set; no emoji, no icon fonts
- Slow ambient background-drift on hero/detail backdrop art, compositor-only, respects `prefers-reduced-motion`
- View Transitions API drives tab switches and grid-to-detail takeovers, with a no-op fallback

## Colors

Strictly monochrome: near-black canvas, off-white ink, and translucency-over-black for every secondary surface. No hue anywhere in the system.

### Primary
- **Signal White** (`#f5f5f7`): body text, primary pill-button fill (inverted to black text), active-tab fill, all icon strokes/fills. Doubles as the system's only "accent" — used via inversion (white background + black text) rather than a separate accent hue.

### Neutral
- **True Near-Black** (`#050505`): the app canvas, detail-overlay background. Deliberately not pure `#000` — it reads as a real dark material rather than a CSS default.
- **Raised Charcoal** (`#1c1c1e`): poster/episode-still placeholder backgrounds, image containers before load.
- **Skeleton Charcoal** (`#191919`): loading-skeleton base, shimmered against `#26262a`.
- **Dimmed Gray** (`#98989d`): secondary text — subtitles, hints, metadata, season labels.

### Named Rules
**The No Hue Rule.** The palette carries zero chromatic accent. Emphasis is achieved only through value contrast (white-on-black, translucency, blur) and motion, never through introducing a color.

## Typography

**Display Font:** -apple-system, "SF Pro Display" (with Segoe UI, Roboto, Helvetica, Arial fallback)
**Body Font:** same stack — one family for the whole system.

**Character:** A single system-native face used at multiple weights and sizes; no display/body pairing beyond weight and scale, matching Apple TV's own restraint. `font-variant-numeric: tabular-nums` on body keeps metadata rows (ratings, runtimes) from jittering.

### Hierarchy
- **Display** (800, 40px, letter-spacing -0.02em): hero and detail title (`.hero-title`, `.detail-info h1`); drops to 26/32px on mobile.
- **Title** (700, 20px): section row titles ("Movies" / "Series") — plain-weight, no eyebrow, no caps-lock label above it.
- **Body** (400, 15px, line-height 1.5): hero/detail synopsis, clamped to 2 lines in the hero and unclamped in detail, max ~58–62ch.
- **Label** (600, 13–14px): card titles, tab labels, buttons, hints; `.card-sub`/`.episode-sub` drop to 11–12px at dimmed-gray.

### Named Rules
**The No-Eyebrow Rule.** Section and detail titles never carry a kicker, label, or all-caps lead-in above them. tvOS itself doesn't use one; the row title stands alone.

## Layout

Content is edge-padded (32px desktop, 16px mobile) rather than centered in a fixed container — shelves and rows run full-width. Poster shelves use `grid-template-columns: repeat(auto-fill, minmax(170px, 1fr))` with a 28px/20px (row/column) gap; the same pattern drives the loading skeleton so the placeholder and real grid never jump. The hero and detail backdrop hold a 16:7 aspect ratio capped at 55–60vh. Detail content overlaps the backdrop by a fixed `-110px` (`-60px` on mobile) so the poster and title lockup sit visually anchored to the image, not stacked below it. Breakpoint: a single `max-width: 640px` collapse tightens padding, drops the hero to 3:4, and single-clamps the hero synopsis.

## Elevation & Depth

Two distinct depth systems, deliberately not mixed: **glass** for chrome/overlays, **glow** for interactive lift.

- **Glass surfaces** (topbar, Settings/Fix-match modals, toast) use `backdrop-filter: blur() saturate(160%)` over a translucent dark fill, never opaque. This is the system's only "layered" material.
- **Poster/card lift** is the interaction-driven counterpart: flat and shadowless at rest, then on hover/focus gains `scale(1.08) translateY(-4px)` plus the `--glow` token (`0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.65), 0 0 24px rgba(255,255,255,0.06)`).

### Shadow Vocabulary
- **`--glow`** (`0 0 0 1px rgba(255,255,255,.08), 0 20px 40px rgba(0,0,0,.65), 0 0 24px rgba(255,255,255,.06)`): poster/card hover-or-focus lift only. Never present at rest.
- **Modal/toast shadow** (`inset 0 1px 0 rgba(255,255,255,.06), 0 24px 48px rgba(0,0,0,.55)`): paired with the glass fill to seat modals and the toast above the canvas.
- **Detail poster shadow** (`0 20px 40px rgba(0,0,0,.6)`): the one static exception — the detail-view poster thumbnail sits over the backdrop image and needs constant separation from it, unlike grid posters which separate through motion instead.

### Named Rules
**The Zero-Shadow-At-Rest Rule.** Poster tiles in a shelf never carry a shadow or border at rest. Depth is earned only by hover/focus interaction — never applied as an ambient default.

## Shapes

**The Pill/Card Split Rule.** Two radii carry the whole system: `999px` (full pill) for every interactive control — tabs, icon buttons (circular via `50%` at square dimensions), Play/More Info/back/modal-action buttons — and `14px` for media surfaces — poster cards, poster fallback tiles, skeleton cards. Nested surfaces step down: modals at `18px`, inputs at `10px`, episode rows at `10px`, episode stills at `6px`. Nothing in the system uses a sharp (0px) corner.

## Components

### Buttons
- **Shape:** full pill (`999px`), matching tvOS's control language exactly.
- **Primary** (`pill-btn.primary`, `play-btn`, `.tab.active`, `.modal-actions button.primary`): solid white fill, black text, `11–12px / 26–30px` padding.
- **Secondary / Ghost** (`pill-btn.secondary`, `back-btn`, `icon-btn`, `.modal-actions button`): translucent white fill (`rgba(255,255,255,0.1–0.18)`) over glass or plain dark background, white text/icon.
- **Hover / Focus:** primary brightens to `#e5e5e7`; secondary/ghost raises opacity by ~0.1; all controls scale to `0.9–0.96` on `:active`; focus-visible always gets a `2px solid #fff` outline with `2–3px` offset — never suppressed.

### Cards / Containers
- **Corner Style:** `14px` (`--card-radius`), shared by posters, poster fallback tiles, and skeleton placeholders so loading and loaded states align pixel-for-pixel.
- **Background:** raised charcoal (`#1c1c1e`) placeholder behind every poster/still before the image loads.
- **Shadow Strategy:** none at rest; see Elevation & Depth's Zero-Shadow-At-Rest Rule.
- **Internal Padding:** meta block below each poster uses `8px 2px 0`; title truncates to one line with ellipsis, subtitle stays dimmed-gray.

### Inputs / Fields
- **Style:** `10px` radius, `1px solid rgba(255,255,255,.12)` border, near-black translucent fill (`rgba(0,0,0,.3)`) — used in Settings and Fix-match.
- **Focus:** border shifts to solid white, outline suppressed in favor of the border shift (the one control family where focus is a border change, not an outline).

### Navigation
- **Style:** centered pill-tab group (`Movies` / `Series`) inside a slim frosted-glass topbar (`blur(20px) saturate(160%)`, `rgba(20,20,22,.55)` fill, sticky top). Active tab inverts to solid white/black; inactive tabs sit dimmed-gray on transparent. Brand mark left, icon-button actions (rescan, settings) right. Mobile collapses padding/sizing but keeps the same three-zone grid layout — never becomes a hamburger or drawer.

### Detail Takeover (signature component)
Full-bleed 16:7 backdrop image with a slow 26s ambient drift (`scale(1.04→1.11)` + slight translate, compositor-only, disabled under `prefers-reduced-motion`), a bottom-anchored dark gradient, and a title lockup that overlaps the image by a fixed negative margin rather than sitting in a separate centered card below it. This — not a modal, not a banner — is how the app distinguishes itself from the generic streaming-clone template, and it is driven by the View Transitions API when navigating from a poster tile.

## Do's and Don'ts

### Do:
- **Do** keep every interactive control on the `999px` pill radius and every media surface on `14px` — never mix the two.
- **Do** treat `backdrop-filter` glass as the only surface-layering device (topbar, modals, toast); don't introduce opaque panel chrome instead.
- **Do** keep poster/card shadows and lift interaction-only (hover/focus); nothing static.
- **Do** author new icons as inline SVG at the existing single stroke-width/scale-from-font-size convention; never drop in an icon font or emoji glyph.
- **Do** respect `prefers-reduced-motion` for every new animation the way `hero-drift` and `card-in` already do.

### Don't:
- **Don't** introduce a color accent. The system's only emphasis device is value contrast (white/black inversion) plus translucency and motion.
- **Don't** add a kicker, eyebrow, or all-caps label above section or detail titles — the row title stands alone, unlabeled.
- **Don't** center the detail view in a card or banner. The title lockup stays bottom-left, overlapping the backdrop image.
- **Don't** apply a static box-shadow to a poster or grid card at rest; the `--glow` token is a hover/focus response only, not a default treatment.
