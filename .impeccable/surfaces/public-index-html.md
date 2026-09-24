---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/style.css","public/app.js"]
---

## Direction contract

THESIS: This is a personal media library reading as if it were Apple's own tvOS app, not a web gallery wearing dark mode. It refuses the generic "Netflix-clone grid bolted under a hero banner" template most AI-built media UIs default to, in favor of tvOS's actual grammar: a slim glass utility bar, focus-lift poster shelves (no static shadows at rest, everything comes alive on focus), and full-bleed detail takeovers with a bottom-left title lockup rather than a centered banner.

OWN-WORLD: True near-black canvas, SF Pro type stack (already brand-correct - Apple TV's own face), poster tiles held at 2:3 with the signature scale + lift + soft white glow on hover/focus, nothing static-shadowed at rest. Pill-shaped translucent controls throughout (nav tabs, Play/More Info, icon buttons). Top chrome is a slim frosted-glass bar, never a sidebar. Section rows carry a plain-weight row title, no eyebrow, no caps-lock label. Detail view is a full-bleed backdrop takeover, title lockup bottom-left over the image, not a centered card. Utility surfaces (Settings, Fix-match, the play-error toast) adopt the same glass-pill, black-canvas grammar rather than breaking into generic web-modal chrome - confirmed with the user: full tvOS everywhere, no screen breaks the illusion.

STORY: The visitor opens their personal Movies/Series library and it reads with the same confidence as a real Apple TV app. They scan a poster shelf; focus lifts the tile they're considering; they open it into a full-bleed detail takeover to read the synopsis and cast context; they press Play and VLC opens the file. Settings and Fix-match feel like they belong to the same app, not a bolted-on admin panel.

FIRST VIEWPORT: Fixed slim glass bar (brand mark left, Movies/Series pill-tabs centered, rescan/settings icon-buttons right). Below it, a full-bleed 16:7 backdrop hero for the top pick: bottom-left title lockup, two-line synopsis clamp, Play (solid white pill) + More Info (translucent glass pill) sitting at the image's bottom-left. Beneath the hero, a plain row title ("Movies" / "Series") then a poster shelf: 2:3 tiles in a responsive grid, generous gaps, each tile lifting with scale + soft glow on hover/focus - never a static border or shadow at rest.

FORM: Brief-pinned world - Apple TV / tvOS app, as rendered on the web (no native tvOS APIs, translating its visual grammar into HTML/CSS/JS). No concept-seed roll: the user named this exact world by name, repeatedly, across the whole session, and this is a precisely specified narrow request on an already Apple-TV-directed personal utility app - the carve-out for a precise request applies, and a user-pinned direction beats the roll per the skill's own rule. No image generation is available this session, so the build is code-led by necessity, not choice. No seed key.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
