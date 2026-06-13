# BR2049 Terminal Portfolio — Revamp Design

Date: 2026-06-13
Status: Approved

## Goal

Revamp the public portfolio (`khademul.github.io`) so the homepage shows only an
interactive terminal. Each portfolio section (about, experience, skills,
education, contact) becomes its own routed page. Apply a Blade Runner 2049
"teal/cyan LA", full-atmospheric visual theme. The authenticated `/my-zone`
notes app is out of scope and stays untouched.

## Decisions (locked)

- Routing: add `vue-router@4`, history mode.
- Terminal navigation: BOTH clickable links AND typed commands.
- Theme intensity: full atmospheric (fog, scanlines, flicker, glitch, neon glow).
- Palette: teal/cyan LA base, amber as sparing accent/glow.
- Inner-page navigation: back-to-terminal only (no persistent nav bar).
- Pages: all five existing sections become pages, reusing existing components.
- my-zone: leave untouched.
- Display font: Rajdhani (Google font). Body/terminal stays JetBrains Mono.
- `SiteNav` retired from public site; replaced by a return-to-terminal link.

## 1. Routing

Add `vue-router@4`. Routes:

| Path | View |
|------|------|
| `/` | `TerminalHome` (terminal only) |
| `/about` | About page |
| `/experience` | Experience page |
| `/skills` | Skills page |
| `/education` | Education page |
| `/contact` | Contact page |
| `/my-zone`, `/my-zone/` | existing `MyZoneApp` (untouched) |

`main.js`:
- Keep the existing `/my-zone` branch mounting `MyZoneApp` directly (no router).
- For all other paths, mount `App.vue` which renders `<router-view>`.
- The GitHub Pages SPA restore (reading `spa-redirect-path` from
  `sessionStorage` and `history.replaceState`) MUST run before the router is
  created, so the router reads the correct deep-link path.

GitHub Pages compatibility:
- `public/404.html` already stashes the full path and redirects to `/`.
- `main.js` restore + history-mode router resolves deep links correctly.
- `CNAME` = custom domain; `vite.config.js` `base: '/'` stays.

## 2. Terminal homepage (`/`)

Component: `TerminalHome.vue` (evolves from current `TerminalHero.vue` logic).

- Reuse typewriter boot sequence, skip-on-interaction, and reduced-motion skip.
- `ls sections/` output renders section names as clickable links that call
  `router.push('/about')` etc. (replaces the old `#about` anchor hrefs).
- Typed-command mode: an input/prompt line is active after boot. A pure parser
  function maps input to actions:
  - `cd <section>`, `open <section>`, or bare `<section>` → navigate to page.
  - `ls` → reprint section list.
  - `help` → list available commands.
  - `clear` → clear output.
  - `whoami`, `cat profile.txt` → replay corresponding boot output.
  - unknown input → `command not found: <input>`.
- The command parser is a pure function (input string → action descriptor) so it
  is unit-testable without the DOM.
- Mobile: links are always tappable; typed input is optional with a visible hint.

## 3. Theme — BR2049 teal/cyan LA, full atmospheric

New CSS custom properties in `src/assets/styles/main.css` (values indicative,
tune during build):

```
--bg:        #05080d;   /* blue-black */
--bg-elev:   #0a1018;
--border:    #15303a;
--text:      #b8d4dd;
--text-dim:  #5f7d88;
--cyan:      #5ef2ff;   /* primary */
--holo:      #2b6cff;   /* holographic blue */
--amber:     #ff9d3c;   /* sparing accent / glow */
--danger:    #ff3b6b;   /* magenta */
```

Fonts:
- Body + terminal: JetBrains Mono (existing).
- Page headings/display: Rajdhani (add Google Fonts import).

Atmospheric layer — a fixed, full-viewport element behind content with
`pointer-events: none`:
- Animated fog/haze gradient that slowly drifts.
- CRT scanline overlay with subtle flicker.
- Neon glow on headings and borders (`text-shadow` / `box-shadow`).
- Glitch-on-hover effect for links and headings.

Accessibility:
- All motion FX (fog, flicker, glitch, animated drift) gated behind
  `prefers-reduced-motion: reduce`. The static palette and glow remain; motion
  stops. Contrast must stay readable (verify text vs bg).

## 4. Section pages

- Each route is a thin page wrapper that reuses the existing section component
  (`AboutSection`, `ExperienceSection`, `SkillsSection`, `EducationSection`,
  `ContactSection`), restyled to the new theme.
- Navigation is back-to-terminal only: each page renders a
  `> return to terminal` router-link to `/`. No persistent nav bar.
- `SiteNav.vue` is retired from the public site (removed from `App.vue`); its
  responsibility collapses into the per-page return link.
- Page entry uses a light boot/scanline transition (reduced-motion: none).

## 5. Testing

Vitest + @vue/test-utils already configured.

- Command parser: unit tests on the pure function (each command, unknown input).
- `TerminalHome`: renders section links, link click triggers navigation,
  reduced-motion path skips animation.
- Each section page: mounts and renders its underlying section component plus
  the return-to-terminal link.
- Router: deep-link path resolves to the correct view.
- Use TDD for the parser and router glue.

## 6. Out of scope

- `/my-zone` notes app (login, editor, services) — untouched.
- No backend / Appwrite changes.
- No content rewrites to profile data unless required by layout.
