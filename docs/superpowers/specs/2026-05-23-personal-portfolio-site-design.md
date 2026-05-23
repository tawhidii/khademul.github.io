# Personal Portfolio Site — Design

**Date:** 2026-05-23
**Owner:** Khondoker Khademul Bari (github.com/tawhidii)
**Status:** Approved design, pending implementation plan

## 1. Goal

Build a personal portfolio website that presents the owner's resume in a
developer-themed format. The site is single-page, statically generated, and
deployable to GitHub Pages from a repo named `my-folio`. The intended audience
is recruiters and engineering hiring managers doing a 30-second skim.

Success criteria:
- A visitor lands on the site, sees an animated terminal "boot" introducing
  the owner, then scrolls through About / Experience / Skills / Education /
  Contact in a single column.
- All resume content (Profile, 7 jobs, Skills, Education, Contact) is present
  as real semantic HTML so it is indexed and accessible.
- The site looks like a terminal (dark, monospace, prompt-styled headers) but
  reads like a polished resume.
- Lighthouse a11y ≥ 95, performance ≥ 95 on a static build.

## 2. Tech stack

- **Framework:** Vue 3 + Vite
- **Styling:** Hand-written CSS using CSS variables. No UI framework.
- **Font:** JetBrains Mono (Google Fonts, `display=swap`).
- **Hosting:** GitHub Pages, project site at
  `https://tawhidii.github.io/my-folio/`.
- **CI:** GitHub Actions workflow that builds on push to `main` and publishes
  via `actions/deploy-pages`.

Rejected: React/Next.js (overkill for static content), plain HTML (loses
component reuse), interactive shell emulator as the whole site (bad for
recruiter skim, SEO, and a11y).

## 3. File structure

```
my-folio/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── TerminalHero.vue       # animated boot/typing
│   │   ├── SiteNav.vue            # sticky top nav, anchor links
│   │   ├── SectionHeader.vue      # reusable "$ cat <name>.md" header
│   │   ├── AboutSection.vue
│   │   ├── ExperienceSection.vue
│   │   ├── ExperienceItem.vue
│   │   ├── SkillsSection.vue
│   │   ├── EducationSection.vue
│   │   └── ContactSection.vue
│   ├── data/
│   │   ├── profile.js             # name, role, tagline, contact
│   │   ├── experience.js          # array of 7 jobs
│   │   ├── skills.js              # grouped skill arrays
│   │   └── education.js
│   ├── assets/styles/main.css     # tokens, base styles
│   ├── App.vue
│   └── main.js
├── .github/workflows/deploy.yml
├── index.html
├── vite.config.js                 # base: '/my-folio/'
└── package.json
```

**Why this split:** Each component does one job and fits on one screen.
Resume content lives in `src/data/*.js` as plain JS, so the owner can update
job bullets without reading any Vue code. Implementation can change a
section's internals without breaking the rest of the page.

## 4. Components

### `App.vue`
Mounts `SiteNav`, `TerminalHero`, and the five section components in order.
No other logic.

### `SiteNav.vue`
Sticky top bar (`position: sticky; top: 0`). Anchor links to `#about`,
`#experience`, `#skills`, `#education`, `#contact`. Highlights the currently
visible section using `IntersectionObserver`. Collapses to a single inline
row on mobile (no hamburger — five short links fit).

### `TerminalHero.vue`
Renders a fake shell session that animates on mount.

**Animation script** (each prompt printed instantly, output typed char-by-char
at ~50ms/char with prior lines persisting):

```
visitor@bari.dev:~$ whoami
> Khondoker Khademul Bari
> Software Engineer · Dhaka, Bangladesh

visitor@bari.dev:~$ cat profile.txt
> 4+ years building backend systems in Python, Go, JS.
> Currently @ Techjays (Sep 2025 – Apr 2026).

visitor@bari.dev:~$ ls sections/
> about/  experience/  skills/  education/  contact/

visitor@bari.dev:~$ _
```

**Behaviour:**
- Final `_` is a blinking cursor (CSS animation, 1s cycle).
- Clicking, pressing any key, or scrolling skips the animation to its final
  state immediately.
- Under `prefers-reduced-motion: reduce`, render the final state on mount;
  no animation, just a static blinking cursor.
- The `ls` line is interactive: each section name is a link that scrolls to
  that section. There is no command parser; the trailing prompt is decorative.
- Below the terminal block, a small hint: "↓ scroll" (desktop) or "tap a
  section above" (mobile). The hint fades in after the animation finishes.

### `SectionHeader.vue`
Props: `name` (e.g. `"about"`), `id` (anchor id). Renders:

```
visitor@bari.dev:~$ cat <name>.md
```

The `<name>` text uses `--warn` color so it stands out. The `<section>`
element gets the anchor id.

### `AboutSection.vue`
One paragraph (trimmed from the resume Profile) followed by a row of three
stat chips:
- `4+ yrs experience`
- `Backend focus`
- `Open to remote`

Chips are bordered boxes with `--border` and `--text-dim` label color.

### `ExperienceSection.vue` / `ExperienceItem.vue`
Vertical list of `ExperienceItem` components, one per job, reverse
chronological. The data array order in `src/data/experience.js` is the
display order.

Each item is a bordered card:

```
┌─ <Company> · <Role> ─────────────────┐
│  <date range> · <location>           │
│  > <bullet 1>                        │
│  > <bullet 2>                        │
│  > <bullet 3>                        │
│  [ tag1 · tag2 · tag3 ]              │
└──────────────────────────────────────┘
```

The "card" look is achieved with CSS borders and `--bg-elev`, not literal
box-drawing characters. The header line uses `--prompt` for the company
name and `--warn` for the role. Bullets are prefixed with a `>` glyph
rendered via `::before`, not in the data, so the data stays clean.

Tags are mined per-job and stored as the `tags` field on each entry in
`src/data/experience.js`. Examples:
- Techjays → `[DRF, GCP, Cloud SQL, Docker, CI/CD]`
- Venturas → `[Django, FastAPI, Terraform, Datadog, Bedrock, Pinecone]`
- Strativ → `[AWS, EC2, ECR, SQS, SQL]`
- V2 Technologies → `[AWS Lambda, API Gateway, RDS, Serverless]`
- Syscaves → `[AWS Fargate, API Gateway, SNS, RDS, Microservices]`
- DIU (trainer) → `[Python, Django, Teaching]`
- Belaface → `[Python, JS, HTML]`

### `SkillsSection.vue`
Four labelled groups (data in `src/data/skills.js`):

- **Languages** — Python, Go, JavaScript
- **Backend** — Django REST, FastAPI, Express.js, Microservices
- **Infra & Data** — AWS, GCP, Docker, Serverless, PostgreSQL, Redis, SQL
- **Other** — Vue.js, Machine Learning, RAG, AI Agent Development

Each group has a monospace subhead (`// languages`) and a wrap-flowing row
of chip elements.

### `EducationSection.vue`
A single card for the B.Sc. in Software Engineering, Daffodil International
University, 2015–2019, GPA 3.10. SSC/HSC entries are intentionally omitted —
they do not help a software-engineer site.

### `ContactSection.vue`
Four rows, each rendered as:

```
$ mail   barii.py@gmail.com
$ phone  +880 1616 716072
$ git    github.com/tawhidii
$ link   linkedin.com/in/kkbari
```

The `$` uses `--prompt`. Each row is a real `<a>` element:
- mail → `mailto:barii.py@gmail.com`
- phone → `tel:+8801616716072`
- git → `https://github.com/tawhidii`
- link → `https://linkedin.com/in/kkbari`

No contact form (requires backend, not needed for a portfolio).

## 5. Theme tokens

Defined in `src/assets/styles/main.css`:

```css
:root {
  --bg:       #0d1117;
  --bg-elev:  #161b22;
  --border:   #30363d;
  --text:     #c9d1d9;
  --text-dim: #8b949e;
  --prompt:   #7ee787;  /* green prompt + accents */
  --accent:   #58a6ff;  /* links, focus ring */
  --warn:     #f0883e;  /* role / highlight */
}
```

- **Type scale:** 14 / 16 / 20 / 28 / 40. Body 16px, line-height 1.65.
- **Layout:** max-width 880px content column, centered. 96px vertical
  rhythm between sections. Single column on all viewports.
- **Motion:** restricted to the hero typewriter, blinking cursor, and a
  subtle 200ms fade-up on section enter via `IntersectionObserver`. All
  motion respects `prefers-reduced-motion: reduce`.
- **Focus:** visible 2px outline in `--accent` with 2px offset on all
  interactive elements.
- **No light theme.** Terminal aesthetic is dark-only.

## 6. Data shape

`src/data/experience.js` (illustrative):

```js
export const experience = [
  {
    company: 'Techjays',
    role: 'Software Engineering Associate',
    start: 'Sep 2025',
    end: 'Apr 2026',
    location: 'Remote',
    bullets: [
      'Designed Recall AI Desktop SDK integration...',
      'Built event ingestion pipelines on GCP...',
      // ...
    ],
    tags: ['DRF', 'GCP', 'Cloud SQL', 'Docker', 'CI/CD'],
  },
  // ... 6 more entries
];
```

`src/data/profile.js`:

```js
export const profile = {
  name: 'Khondoker Khademul Bari',
  role: 'Software Engineer',
  location: 'Dhaka, Bangladesh',
  tagline: '4+ years building backend systems in Python, Go, JS.',
  email: 'barii.py@gmail.com',
  phone: '+8801616716072',
  github: 'tawhidii',
  linkedin: 'kkbari',
};
```

`src/data/skills.js`:

```js
export const skills = [
  { group: 'languages',  items: ['Python', 'Go', 'JavaScript'] },
  { group: 'backend',    items: ['Django REST', 'FastAPI', 'Express.js', 'Microservices'] },
  { group: 'infra & data', items: ['AWS', 'GCP', 'Docker', 'Serverless', 'PostgreSQL', 'Redis', 'SQL'] },
  { group: 'other',      items: ['Vue.js', 'Machine Learning', 'RAG', 'AI Agent Development'] },
];
```

## 7. Build & deployment

- Scaffold with `npm create vite@latest my-folio -- --template vue`.
- `vite.config.js` sets `base: '/my-folio/'` for GitHub Pages project-site
  routing.
- `.github/workflows/deploy.yml`:
  - Triggers on push to `main`.
  - Node 20, `npm ci`, `npm run build`.
  - Uploads `dist/` via `actions/upload-pages-artifact` and deploys via
    `actions/deploy-pages`.
- One-time manual step: in the repo's GitHub settings, set Pages source to
  "GitHub Actions".

## 8. Accessibility

- Real semantic landmarks: `<header>` (nav), `<main>`, `<section>` per
  resume section, `<footer>` if any meta info is added.
- All section headers use `<h2>`; sub-groups (Skills) use `<h3>`.
- Color contrast: `--text` on `--bg` is 11.6:1; `--text-dim` on `--bg` is
  6.4:1; both pass WCAG AA.
- Focus ring on every interactive element.
- `prefers-reduced-motion` disables the hero typewriter, the cursor blink,
  and section fade-ups.
- The hero terminal animation has a skip affordance (any key / click /
  scroll) and the post-animation state is identical to the
  reduced-motion state, so screen readers never see partial content.

## 9. Out of scope

The following are explicitly deferred so the first version can ship:

- Projects section (no GitHub repos curated yet).
- Blog / writing.
- Contact form (needs a backend).
- Light theme.
- i18n (Bangla version).
- CMS integration.

Any of these can be added later without restructuring the design.
