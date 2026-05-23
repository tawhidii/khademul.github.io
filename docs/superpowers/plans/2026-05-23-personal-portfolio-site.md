# Personal Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a developer-themed Vue 3 + Vite portfolio site driven by data modules sourced from the owner's resume, deployable to GitHub Pages.

**Architecture:** Single-page Vue 3 app with one component per resume section. Content lives in plain JS data modules under `src/data/` so updates do not touch component code. Hero is an animated fake terminal; the rest is scrollable, accessible HTML with terminal-styled chrome. Tests use Vitest + @vue/test-utils for component logic and data shape; pure styling is verified manually via `npm run dev`.

**Tech Stack:** Vue 3, Vite, Vitest, @vue/test-utils, jsdom, JetBrains Mono (Google Fonts), GitHub Actions for Pages deploy.

**Spec:** [docs/superpowers/specs/2026-05-23-personal-portfolio-site-design.md](../specs/2026-05-23-personal-portfolio-site-design.md)

---

## File Map

**Create:**
- `.gitignore` (from Vite scaffold)
- `package.json` (Vite scaffold + Vitest deps added)
- `vite.config.js` (base path for GH Pages, Vitest config)
- `index.html` (title, meta, favicon link)
- `src/main.js` (Vue app bootstrap, global CSS import)
- `src/App.vue` (page composition)
- `src/assets/styles/main.css` (theme tokens, base styles)
- `src/data/profile.js`
- `src/data/experience.js`
- `src/data/skills.js`
- `src/data/education.js`
- `src/components/SectionHeader.vue`
- `src/components/AboutSection.vue`
- `src/components/ExperienceItem.vue`
- `src/components/ExperienceSection.vue`
- `src/components/SkillsSection.vue`
- `src/components/EducationSection.vue`
- `src/components/ContactSection.vue`
- `src/components/TerminalHero.vue`
- `src/components/SiteNav.vue`
- `src/data/__tests__/*.test.js`
- `src/components/__tests__/*.test.js`
- `public/favicon.svg`
- `.github/workflows/deploy.yml`

**Delete:**
- `gg.txt` (placeholder)

---

## Task 1: Scaffold the project

**Files:**
- Delete: `gg.txt`
- Create: project files via Vite scaffold + extra dev deps

- [ ] **Step 1: Initialize git and remove placeholder**

```powershell
git init
git branch -M main
Remove-Item gg.txt
```

- [ ] **Step 2: Scaffold Vite + Vue into the current directory**

```powershell
npm create vite@latest . -- --template vue
```

If npm asks to confirm overwriting the non-empty directory, accept (only the `docs/` folder is non-Vite content; Vite will not touch it).

- [ ] **Step 3: Install scaffold dependencies plus Vitest stack**

```powershell
npm install
npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 4: Replace `vite.config.js` with the project config**

Overwrite `vite.config.js`:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/my-folio/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 5: Add a `test` script to `package.json`**

Inside `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify dev server boots**

```powershell
npm run dev
```

Expected: Vite prints `Local: http://localhost:5173/my-folio/`. Open the URL, confirm the default Vue welcome page renders. Stop the server with Ctrl+C.

- [ ] **Step 7: Verify tests run (with zero tests)**

```powershell
npm test
```

Expected: Vitest exits 0 with "No test files found, exiting with code 0" or equivalent. (If Vitest complains there are no tests, that's fine — it confirms the runner works.)

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "chore: scaffold vite + vue + vitest"
```

---

## Task 2: Theme tokens and global styles

**Files:**
- Create: `src/assets/styles/main.css`
- Modify: `src/main.js`
- Modify: `index.html` (font preconnect + link)
- Delete: `src/style.css` (scaffold leftover), `src/components/HelloWorld.vue`, `src/assets/vue.svg` if unused

- [ ] **Step 1: Create `src/assets/styles/main.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg:       #0d1117;
  --bg-elev:  #161b22;
  --border:   #30363d;
  --text:     #c9d1d9;
  --text-dim: #8b949e;
  --prompt:   #7ee787;
  --accent:   #58a6ff;
  --warn:     #f0883e;

  --fs-xs: 14px;
  --fs-sm: 16px;
  --fs-md: 20px;
  --fs-lg: 28px;
  --fs-xl: 40px;

  --rhythm: 96px;
  --content-max: 880px;
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--fs-sm);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent);
  text-decoration: none;
}
a:hover { text-decoration: underline; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

h1, h2, h3 { margin: 0; font-weight: 700; }
h2 { font-size: var(--fs-lg); }
h3 { font-size: var(--fs-md); }

main {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 24px;
}

section {
  padding-top: var(--rhythm);
  scroll-margin-top: 80px; /* offset for sticky nav */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Wire it into `src/main.js`**

Replace `src/main.js` contents:

```js
import { createApp } from 'vue';
import App from './App.vue';
import './assets/styles/main.css';

createApp(App).mount('#app');
```

- [ ] **Step 3: Update `index.html` `<head>`**

Replace the `<head>` contents (keep `<!doctype html>` and `<html>` wrapper):

```html
<meta charset="UTF-8" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="Khondoker Khademul Bari — Software Engineer. 4+ years building backend systems in Python, Go, JavaScript." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<title>Khondoker Khademul Bari · Software Engineer</title>
```

- [ ] **Step 4: Replace `src/App.vue` with a minimal shell**

```vue
<script setup></script>

<template>
  <main>
    <p>theme bootstrap ok</p>
  </main>
</template>
```

- [ ] **Step 5: Delete scaffold leftovers**

```powershell
Remove-Item src/style.css -ErrorAction SilentlyContinue
Remove-Item src/components/HelloWorld.vue -ErrorAction SilentlyContinue
Remove-Item src/assets/vue.svg -ErrorAction SilentlyContinue
```

- [ ] **Step 6: Verify in browser**

```powershell
npm run dev
```

Expected: dark background, JetBrains Mono font, the text "theme bootstrap ok" in `--text` color. Stop server.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: theme tokens, base styles, font wiring"
```

---

## Task 3: Profile data module

**Files:**
- Create: `src/data/profile.js`
- Create: `src/data/__tests__/profile.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/profile.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { profile } from '../profile.js';

describe('profile data', () => {
  it('exposes the required identity and contact fields', () => {
    expect(profile.name).toBe('Khondoker Khademul Bari');
    expect(profile.role).toBe('Software Engineer');
    expect(profile.location).toBe('Dhaka, Bangladesh');
    expect(profile.tagline).toMatch(/4\+ years/);
    expect(profile.email).toBe('barii.py@gmail.com');
    expect(profile.phone).toBe('+8801616716072');
    expect(profile.github).toBe('tawhidii');
    expect(profile.linkedin).toBe('kkbari');
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

```powershell
npm test
```

Expected: FAIL with "Cannot find module '../profile.js'".

- [ ] **Step 3: Create `src/data/profile.js`**

```js
export const profile = {
  name: 'Khondoker Khademul Bari',
  role: 'Software Engineer',
  location: 'Dhaka, Bangladesh',
  tagline: '4+ years building backend systems in Python, Go, JavaScript.',
  email: 'barii.py@gmail.com',
  phone: '+8801616716072',
  github: 'tawhidii',
  linkedin: 'kkbari',
};
```

- [ ] **Step 4: Run test, confirm it passes**

```powershell
npm test
```

Expected: 1 test pass.

- [ ] **Step 5: Commit**

```powershell
git add src/data/profile.js src/data/__tests__/profile.test.js
git commit -m "feat(data): profile module"
```

---

## Task 4: Experience data module

**Files:**
- Create: `src/data/experience.js`
- Create: `src/data/__tests__/experience.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/experience.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { experience } from '../experience.js';

describe('experience data', () => {
  it('lists all seven roles in reverse chronological order', () => {
    expect(experience).toHaveLength(7);
    expect(experience[0].company).toBe('Techjays');
    expect(experience[experience.length - 1].company).toBe('Belaface LTD');
  });

  it('each entry has the required shape', () => {
    for (const entry of experience) {
      expect(entry).toMatchObject({
        company: expect.any(String),
        role: expect.any(String),
        start: expect.any(String),
        end: expect.any(String),
        location: expect.any(String),
        bullets: expect.any(Array),
        tags: expect.any(Array),
      });
      expect(entry.bullets.length).toBeGreaterThan(0);
      expect(entry.tags.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

```powershell
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/data/experience.js`**

```js
export const experience = [
  {
    company: 'Techjays',
    role: 'Software Engineering Associate',
    start: 'Sep 2025',
    end: 'Apr 2026',
    location: 'Remote',
    bullets: [
      'Developed and maintained backend services using Django REST Framework, ensuring scalable and high-performance APIs.',
      'Designed and implemented integration with Recall AI Desktop SDK within a desktop application environment.',
      'Managed deployment workflows on Google Cloud Platform (GCP), including configuration and monitoring of services.',
      'Built and maintained event ingestion pipelines for efficient data processing and handling.',
      'Implemented and maintained CI/CD pipelines using GitHub Actions to automate build, test, and deployment processes.',
    ],
    tags: ['DRF', 'GCP', 'Cloud SQL', 'Docker', 'CI/CD'],
  },
  {
    company: 'Venturas LTD',
    role: 'Fullstack Engineer',
    start: 'Jan 2025',
    end: 'Aug 2025',
    location: 'Dhaka, Bangladesh',
    bullets: [
      'Worked on the Dmenu Money financial media platform — fixing backend issues, improving performance, and adding features across Django REST and FastAPI services.',
      'Set up SLOs with Terraform and Datadog to monitor reliability across Django and FastAPI services.',
      'Increased test coverage for Django REST viewsets, serializers, and FastAPI routers and services.',
      'Built a production-ready RAG chatbot pipeline using Pinecone and AWS Bedrock, including embedding ingestion, retrieval logic, and FastAPI orchestration.',
    ],
    tags: ['Django', 'FastAPI', 'Terraform', 'Datadog', 'Bedrock', 'Pinecone'],
  },
  {
    company: 'Strativ AB',
    role: 'Software Engineer I',
    start: 'Feb 2024',
    end: 'Dec 2024',
    location: 'Dhaka, Bangladesh',
    bullets: [
      'Deployed ResPay on AWS EC2 using ECR for containerized applications and integrated SQS for reliable async communication between services.',
      'Optimized SQL queries to improve performance and database design for ResPay.',
      'Developed payment APIs with integrations for Altapay and Klarna, including webhook support for transaction events.',
    ],
    tags: ['AWS', 'EC2', 'ECR', 'SQS', 'SQL', 'Payments'],
  },
  {
    company: 'V2 Technologies LTD',
    role: 'Junior Software Engineer',
    start: 'Nov 2022',
    end: 'Feb 2024',
    location: 'Dhaka, Bangladesh',
    bullets: [
      'Designed and developed AuditAI with an event-driven, serverless microservice architecture on AWS.',
      'Implemented core backend services using AWS Lambda, ECR, API Gateway, Route 53, EC2, and RDS for reliable call verification workflows.',
      'Created and optimized the database schema with indexing and query optimization for large volumes of call data.',
      'Built monitoring and validation mechanisms to analyze brand promoters\' voice calls against fieldwork requirements.',
    ],
    tags: ['AWS Lambda', 'API Gateway', 'RDS', 'Serverless', 'Microservices'],
  },
  {
    company: 'Syscaves',
    role: 'Associate Software Developer (Contract)',
    start: 'Jan 2021',
    end: 'Oct 2022',
    location: 'Remote',
    bullets: [
      'Designed and developed a multivendor e-commerce platform using AWS Fargate, API Gateway, SNS, and RDS within a microservice architecture.',
    ],
    tags: ['AWS Fargate', 'API Gateway', 'SNS', 'RDS', 'Microservices'],
  },
  {
    company: 'Department of Software Engineering, DIU',
    role: 'Python & Django Trainer',
    start: 'Jan 2021',
    end: 'Apr 2021',
    location: 'Dhaka, Bangladesh',
    bullets: [
      'Delivered training programs on Python and the Django web framework.',
      'Developed curriculum, ran interactive sessions, workshops, and hands-on projects.',
      'Mentored students on software development best practices and web application deployment.',
    ],
    tags: ['Python', 'Django', 'Teaching'],
  },
  {
    company: 'Belaface LTD',
    role: 'Software Developer',
    start: 'Jul 2020',
    end: 'Apr 2021',
    location: 'Dhaka, Bangladesh',
    bullets: [
      'Developed two major web applications — an Education System and an E-commerce platform — using Python, HTML, and JavaScript.',
      'Improved the codebase via refactoring and reusable components for easier maintenance.',
    ],
    tags: ['Python', 'JavaScript', 'HTML'],
  },
];
```

- [ ] **Step 4: Run test, confirm it passes**

```powershell
npm test
```

Expected: all profile + experience tests pass (3 total).

- [ ] **Step 5: Commit**

```powershell
git add src/data/experience.js src/data/__tests__/experience.test.js
git commit -m "feat(data): experience module with seven roles"
```

---

## Task 5: Skills and education data modules

**Files:**
- Create: `src/data/skills.js`
- Create: `src/data/education.js`
- Create: `src/data/__tests__/skills.test.js`
- Create: `src/data/__tests__/education.test.js`

- [ ] **Step 1: Write the failing tests**

`src/data/__tests__/skills.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { skills } from '../skills.js';

describe('skills data', () => {
  it('has four groups with non-empty items', () => {
    expect(skills).toHaveLength(4);
    for (const g of skills) {
      expect(typeof g.group).toBe('string');
      expect(Array.isArray(g.items)).toBe(true);
      expect(g.items.length).toBeGreaterThan(0);
    }
    expect(skills.map((g) => g.group)).toEqual([
      'languages',
      'backend',
      'infra & data',
      'other',
    ]);
  });
});
```

`src/data/__tests__/education.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { education } from '../education.js';

describe('education data', () => {
  it('lists the B.Sc. only', () => {
    expect(education).toHaveLength(1);
    expect(education[0].degree).toMatch(/B\.Sc/);
    expect(education[0].school).toBe('Daffodil International University');
    expect(education[0].gpa).toBe('3.10 / 4.00');
  });
});
```

- [ ] **Step 2: Run, confirm failures**

```powershell
npm test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/data/skills.js`**

```js
export const skills = [
  { group: 'languages', items: ['Python', 'Go', 'JavaScript'] },
  { group: 'backend', items: ['Django REST', 'FastAPI', 'Express.js', 'Microservices'] },
  { group: 'infra & data', items: ['AWS', 'GCP', 'Docker', 'Serverless', 'PostgreSQL', 'Redis', 'SQL'] },
  { group: 'other', items: ['Vue.js', 'Machine Learning', 'RAG', 'AI Agent Development'] },
];
```

- [ ] **Step 4: Create `src/data/education.js`**

```js
export const education = [
  {
    degree: 'B.Sc. in Software Engineering',
    school: 'Daffodil International University',
    start: '2015',
    end: '2019',
    location: 'Dhaka, Bangladesh',
    gpa: '3.10 / 4.00',
  },
];
```

- [ ] **Step 5: Run, confirm passes**

```powershell
npm test
```

Expected: all data tests pass (5 total).

- [ ] **Step 6: Commit**

```powershell
git add src/data/skills.js src/data/education.js src/data/__tests__/skills.test.js src/data/__tests__/education.test.js
git commit -m "feat(data): skills and education modules"
```

---

## Task 6: SectionHeader component

**Files:**
- Create: `src/components/SectionHeader.vue`
- Create: `src/components/__tests__/SectionHeader.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionHeader from '../SectionHeader.vue';

describe('SectionHeader', () => {
  it('renders the cat prompt and exposes the anchor id', () => {
    const wrapper = mount(SectionHeader, {
      props: { name: 'about', id: 'about' },
    });
    expect(wrapper.text()).toContain('visitor@bari.dev:~$ cat about.md');
    expect(wrapper.find('h2').attributes('id')).toBe('about');
  });
});
```

- [ ] **Step 2: Run, confirm failure**

```powershell
npm test
```

Expected: FAIL — component not found.

- [ ] **Step 3: Implement `src/components/SectionHeader.vue`**

```vue
<script setup>
defineProps({
  name: { type: String, required: true },
  id: { type: String, required: true },
});
</script>

<template>
  <h2 :id="id" class="section-header">
    <span class="prompt">visitor@bari.dev:~$</span>
    <span class="cmd">cat</span>
    <span class="file">{{ name }}.md</span>
  </h2>
</template>

<style scoped>
.section-header {
  font-size: var(--fs-md);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
  align-items: baseline;
  margin-bottom: 32px;
}
.prompt { color: var(--prompt); }
.cmd    { color: var(--text-dim); }
.file   { color: var(--warn); }
</style>
```

- [ ] **Step 4: Run, confirm pass**

```powershell
npm test
```

Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add src/components/SectionHeader.vue src/components/__tests__/SectionHeader.test.js
git commit -m "feat(ui): SectionHeader component"
```

---

## Task 7: AboutSection component

**Files:**
- Create: `src/components/AboutSection.vue`
- Create: `src/components/__tests__/AboutSection.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AboutSection from '../AboutSection.vue';
import { profile } from '../../data/profile.js';

describe('AboutSection', () => {
  it('renders the tagline and three stat chips', () => {
    const wrapper = mount(AboutSection);
    expect(wrapper.text()).toContain(profile.tagline);
    const chips = wrapper.findAll('.chip');
    expect(chips).toHaveLength(3);
    expect(chips[0].text()).toBe('4+ yrs experience');
    expect(chips[1].text()).toBe('Backend focus');
    expect(chips[2].text()).toBe('Open to remote');
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/AboutSection.vue`**

```vue
<script setup>
import SectionHeader from './SectionHeader.vue';
import { profile } from '../data/profile.js';

const chips = ['4+ yrs experience', 'Backend focus', 'Open to remote'];
</script>

<template>
  <section>
    <SectionHeader name="about" id="about" />
    <p class="about-body">{{ profile.tagline }}</p>
    <p class="about-body">
      Highly motivated software engineer based in {{ profile.location }}, with deep experience
      shipping backend services across Python, Go, and JavaScript stacks. Comfortable from
      Django REST and FastAPI APIs through to AWS/GCP infrastructure and CI/CD pipelines.
    </p>
    <div class="chip-row">
      <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
    </div>
  </section>
</template>

<style scoped>
.about-body {
  margin: 0 0 16px;
  color: var(--text);
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.chip {
  border: 1px solid var(--border);
  color: var(--text-dim);
  background: var(--bg-elev);
  padding: 6px 12px;
  font-size: var(--fs-xs);
  border-radius: 4px;
}
</style>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/AboutSection.vue src/components/__tests__/AboutSection.test.js
git commit -m "feat(ui): AboutSection component"
```

---

## Task 8: ExperienceItem component

**Files:**
- Create: `src/components/ExperienceItem.vue`
- Create: `src/components/__tests__/ExperienceItem.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExperienceItem from '../ExperienceItem.vue';

const sample = {
  company: 'Techjays',
  role: 'Software Engineering Associate',
  start: 'Sep 2025',
  end: 'Apr 2026',
  location: 'Remote',
  bullets: ['First bullet', 'Second bullet'],
  tags: ['DRF', 'GCP'],
};

describe('ExperienceItem', () => {
  it('renders company, role, date range, location, bullets, tags', () => {
    const wrapper = mount(ExperienceItem, { props: { item: sample } });
    const text = wrapper.text();
    expect(text).toContain('Techjays');
    expect(text).toContain('Software Engineering Associate');
    expect(text).toContain('Sep 2025 – Apr 2026');
    expect(text).toContain('Remote');
    expect(wrapper.findAll('li.bullet')).toHaveLength(2);
    expect(wrapper.findAll('.tag')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/ExperienceItem.vue`**

```vue
<script setup>
defineProps({
  item: { type: Object, required: true },
});
</script>

<template>
  <article class="exp-card">
    <header class="exp-head">
      <span class="company">{{ item.company }}</span>
      <span class="sep">·</span>
      <span class="role">{{ item.role }}</span>
    </header>
    <p class="meta">{{ item.start }} – {{ item.end }} · {{ item.location }}</p>
    <ul class="bullets">
      <li v-for="(b, i) in item.bullets" :key="i" class="bullet">{{ b }}</li>
    </ul>
    <div class="tags">
      <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
    </div>
  </article>
</template>

<style scoped>
.exp-card {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  padding: 20px 24px;
  border-radius: 6px;
  margin-bottom: 20px;
}
.exp-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
  font-size: var(--fs-md);
}
.company { color: var(--prompt); font-weight: 700; }
.sep     { color: var(--text-dim); }
.role    { color: var(--warn); }
.meta {
  color: var(--text-dim);
  font-size: var(--fs-xs);
  margin: 4px 0 16px;
}
.bullets {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}
.bullet {
  position: relative;
  padding-left: 1.6ch;
  margin: 6px 0;
  color: var(--text);
}
.bullet::before {
  content: '>';
  position: absolute;
  left: 0;
  color: var(--prompt);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  font-size: var(--fs-xs);
  color: var(--text-dim);
  border: 1px solid var(--border);
  padding: 3px 8px;
  border-radius: 3px;
}
</style>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/ExperienceItem.vue src/components/__tests__/ExperienceItem.test.js
git commit -m "feat(ui): ExperienceItem card"
```

---

## Task 9: ExperienceSection component

**Files:**
- Create: `src/components/ExperienceSection.vue`
- Create: `src/components/__tests__/ExperienceSection.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExperienceSection from '../ExperienceSection.vue';
import { experience } from '../../data/experience.js';

describe('ExperienceSection', () => {
  it('renders one card per entry in data order', () => {
    const wrapper = mount(ExperienceSection);
    const cards = wrapper.findAll('article.exp-card');
    expect(cards).toHaveLength(experience.length);
    expect(cards[0].text()).toContain(experience[0].company);
    expect(cards.at(-1).text()).toContain(experience.at(-1).company);
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/ExperienceSection.vue`**

```vue
<script setup>
import SectionHeader from './SectionHeader.vue';
import ExperienceItem from './ExperienceItem.vue';
import { experience } from '../data/experience.js';
</script>

<template>
  <section>
    <SectionHeader name="experience" id="experience" />
    <ExperienceItem v-for="item in experience" :key="item.company + item.start" :item="item" />
  </section>
</template>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/ExperienceSection.vue src/components/__tests__/ExperienceSection.test.js
git commit -m "feat(ui): ExperienceSection wraps timeline of items"
```

---

## Task 10: SkillsSection component

**Files:**
- Create: `src/components/SkillsSection.vue`
- Create: `src/components/__tests__/SkillsSection.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SkillsSection from '../SkillsSection.vue';
import { skills } from '../../data/skills.js';

describe('SkillsSection', () => {
  it('renders one group block per skills group with all items', () => {
    const wrapper = mount(SkillsSection);
    const groups = wrapper.findAll('.skill-group');
    expect(groups).toHaveLength(skills.length);
    for (let i = 0; i < skills.length; i += 1) {
      const groupEl = groups[i];
      expect(groupEl.find('h3').text()).toBe(`// ${skills[i].group}`);
      const items = groupEl.findAll('.skill');
      expect(items).toHaveLength(skills[i].items.length);
    }
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/SkillsSection.vue`**

```vue
<script setup>
import SectionHeader from './SectionHeader.vue';
import { skills } from '../data/skills.js';
</script>

<template>
  <section>
    <SectionHeader name="skills" id="skills" />
    <div v-for="group in skills" :key="group.group" class="skill-group">
      <h3 class="group-head">// {{ group.group }}</h3>
      <div class="skill-row">
        <span v-for="s in group.items" :key="s" class="skill">{{ s }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skill-group { margin-bottom: 32px; }
.group-head {
  color: var(--text-dim);
  font-size: var(--fs-sm);
  font-weight: 500;
  margin-bottom: 12px;
}
.skill-row { display: flex; flex-wrap: wrap; gap: 8px; }
.skill {
  font-size: var(--fs-xs);
  color: var(--text);
  border: 1px solid var(--border);
  background: var(--bg-elev);
  padding: 6px 12px;
  border-radius: 4px;
}
</style>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/SkillsSection.vue src/components/__tests__/SkillsSection.test.js
git commit -m "feat(ui): SkillsSection grouped chips"
```

---

## Task 11: EducationSection component

**Files:**
- Create: `src/components/EducationSection.vue`
- Create: `src/components/__tests__/EducationSection.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EducationSection from '../EducationSection.vue';

describe('EducationSection', () => {
  it('renders the B.Sc. entry with school, dates, and GPA', () => {
    const wrapper = mount(EducationSection);
    const text = wrapper.text();
    expect(text).toContain('B.Sc. in Software Engineering');
    expect(text).toContain('Daffodil International University');
    expect(text).toContain('2015 – 2019');
    expect(text).toContain('GPA 3.10 / 4.00');
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/EducationSection.vue`**

```vue
<script setup>
import SectionHeader from './SectionHeader.vue';
import { education } from '../data/education.js';
</script>

<template>
  <section>
    <SectionHeader name="education" id="education" />
    <article v-for="e in education" :key="e.degree" class="edu-card">
      <header class="edu-head">{{ e.degree }}</header>
      <p class="meta">{{ e.school }} · {{ e.location }}</p>
      <p class="meta">{{ e.start }} – {{ e.end }} · GPA {{ e.gpa }}</p>
    </article>
  </section>
</template>

<style scoped>
.edu-card {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  padding: 20px 24px;
  border-radius: 6px;
}
.edu-head {
  font-size: var(--fs-md);
  color: var(--warn);
  font-weight: 700;
}
.meta {
  color: var(--text-dim);
  font-size: var(--fs-xs);
  margin: 6px 0 0;
}
</style>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/EducationSection.vue src/components/__tests__/EducationSection.test.js
git commit -m "feat(ui): EducationSection card"
```

---

## Task 12: ContactSection component

**Files:**
- Create: `src/components/ContactSection.vue`
- Create: `src/components/__tests__/ContactSection.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ContactSection from '../ContactSection.vue';

describe('ContactSection', () => {
  it('renders four contact rows with correct hrefs', () => {
    const wrapper = mount(ContactSection);
    const rows = wrapper.findAll('a.contact-row');
    expect(rows).toHaveLength(4);
    const hrefs = rows.map((r) => r.attributes('href'));
    expect(hrefs).toEqual([
      'mailto:barii.py@gmail.com',
      'tel:+8801616716072',
      'https://github.com/tawhidii',
      'https://linkedin.com/in/kkbari',
    ]);
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/ContactSection.vue`**

```vue
<script setup>
import SectionHeader from './SectionHeader.vue';
import { profile } from '../data/profile.js';

const rows = [
  { label: 'mail',  value: profile.email,    href: `mailto:${profile.email}` },
  { label: 'phone', value: profile.phone,    href: `tel:${profile.phone}` },
  { label: 'git',   value: `github.com/${profile.github}`,    href: `https://github.com/${profile.github}` },
  { label: 'link',  value: `linkedin.com/in/${profile.linkedin}`, href: `https://linkedin.com/in/${profile.linkedin}` },
];
</script>

<template>
  <section>
    <SectionHeader name="contact" id="contact" />
    <a
      v-for="r in rows"
      :key="r.label"
      class="contact-row"
      :href="r.href"
      :target="r.href.startsWith('http') ? '_blank' : undefined"
      :rel="r.href.startsWith('http') ? 'noopener' : undefined"
    >
      <span class="prompt">$</span>
      <span class="label">{{ r.label }}</span>
      <span class="value">{{ r.value }}</span>
    </a>
  </section>
</template>

<style scoped>
.contact-row {
  display: grid;
  grid-template-columns: 1.5ch 7ch 1fr;
  gap: 1ch;
  padding: 10px 0;
  font-size: var(--fs-sm);
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--border);
}
.contact-row:last-child { border-bottom: none; }
.contact-row:hover .value { color: var(--accent); }
.prompt { color: var(--prompt); }
.label  { color: var(--text-dim); }
.value  { color: var(--text); }
</style>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/ContactSection.vue src/components/__tests__/ContactSection.test.js
git commit -m "feat(ui): ContactSection rows"
```

---

## Task 13: TerminalHero component (animation logic)

This is the most complex component — covered by real logic tests for the skip, completion, and reduced-motion paths.

**Files:**
- Create: `src/components/TerminalHero.vue`
- Create: `src/components/__tests__/TerminalHero.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TerminalHero from '../TerminalHero.vue';

describe('TerminalHero', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('exposes a skip() that immediately renders the final state', async () => {
    const wrapper = mount(TerminalHero);
    expect(wrapper.text()).not.toContain('ls sections/');
    wrapper.vm.skip();
    await flushPromises();
    expect(wrapper.text()).toContain('whoami');
    expect(wrapper.text()).toContain('cat profile.txt');
    expect(wrapper.text()).toContain('ls sections/');
    expect(wrapper.find('.cursor').exists()).toBe(true);
  });

  it('renders the final state immediately when reduced motion is preferred', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: () => {}, removeEventListener: () => {} });
    const wrapper = mount(TerminalHero);
    await flushPromises();
    expect(wrapper.text()).toContain('ls sections/');
  });

  it('clicking anywhere on the terminal skips the animation', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    const wrapper = mount(TerminalHero);
    await wrapper.find('.terminal').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ls sections/');
  });

  it('renders interactive section links in the ls output', async () => {
    const wrapper = mount(TerminalHero);
    wrapper.vm.skip();
    await flushPromises();
    const links = wrapper.findAll('a.section-link');
    expect(links.length).toBe(5);
    expect(links.map((l) => l.attributes('href'))).toEqual(['#about', '#experience', '#skills', '#education', '#contact']);
  });
});
```

- [ ] **Step 2: Run, confirm failure**

```powershell
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/components/TerminalHero.vue`**

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue';

const lines = [
  { kind: 'prompt', text: 'visitor@bari.dev:~$ whoami' },
  { kind: 'out',    text: '> Khondoker Khademul Bari' },
  { kind: 'out',    text: '> Software Engineer · Dhaka, Bangladesh' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ cat profile.txt' },
  { kind: 'out',    text: '> 4+ years building backend systems in Python, Go, JS.' },
  { kind: 'out',    text: '> Currently @ Techjays (Sep 2025 – Apr 2026).' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ ls sections/' },
  { kind: 'links' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ ' },
];

const sectionLinks = [
  { href: '#about',      label: 'about/' },
  { href: '#experience', label: 'experience/' },
  { href: '#skills',     label: 'skills/' },
  { href: '#education',  label: 'education/' },
  { href: '#contact',    label: 'contact/' },
];

const visibleLines = ref([]);
const done = ref(false);
let lineIdx = 0;   // next line in `lines` to process
let charIdx = 0;   // chars typed so far for the in-progress 'out' line
let timer = null;

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tick() {
  if (lineIdx >= lines.length) {
    done.value = true;
    return;
  }
  const line = lines[lineIdx];

  if (line.kind === 'prompt' || line.kind === 'blank' || line.kind === 'links') {
    visibleLines.value = [...visibleLines.value, { ...line, shown: line.text || '' }];
    lineIdx += 1;
    timer = setTimeout(tick, line.kind === 'blank' ? 60 : 220);
    return;
  }

  // 'out' line: type char-by-char
  charIdx += 1;
  const pending = line.text.slice(0, charIdx);
  const last = visibleLines.value[visibleLines.value.length - 1];
  if (last && last.kind === 'out' && last.fullText === line.text) {
    visibleLines.value = [
      ...visibleLines.value.slice(0, -1),
      { kind: 'out', shown: pending, fullText: line.text },
    ];
  } else {
    visibleLines.value = [...visibleLines.value, { kind: 'out', shown: pending, fullText: line.text }];
  }

  if (charIdx >= line.text.length) {
    lineIdx += 1;
    charIdx = 0;
    timer = setTimeout(tick, 180);
  } else {
    timer = setTimeout(tick, 30);
  }
}

function skip() {
  if (timer) clearTimeout(timer);
  visibleLines.value = lines.map((l) => ({
    ...l,
    shown: l.text || '',
    fullText: l.text || '',
  }));
  lineIdx = lines.length;
  charIdx = 0;
  done.value = true;
}

function onSkipEvent() {
  if (!done.value) skip();
}

onMounted(() => {
  if (reducedMotion()) {
    skip();
    return;
  }
  timer = setTimeout(tick, 200);
  window.addEventListener('keydown', onSkipEvent);
  window.addEventListener('scroll', onSkipEvent, { passive: true });
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  window.removeEventListener('keydown', onSkipEvent);
  window.removeEventListener('scroll', onSkipEvent);
});

defineExpose({ skip });
</script>

<template>
  <header class="terminal" @click="onSkipEvent">
    <div class="window">
      <div class="title-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="title">bash — visitor@bari.dev</span>
      </div>
      <pre class="body"><template v-for="(line, i) in visibleLines" :key="i"><span v-if="line.kind === 'prompt'" class="prompt-line">{{ line.shown }}</span><span v-else-if="line.kind === 'out'" class="out-line">{{ line.shown }}</span><span v-else-if="line.kind === 'links'" class="ls-line"><a v-for="l in sectionLinks" :key="l.href" :href="l.href" class="section-link">{{ l.label }}</a></span><br /></template><span v-if="done" class="cursor">_</span></pre>
    </div>
    <p class="hint" v-if="done">↓ scroll, or pick a section above</p>
  </header>
</template>

<style scoped>
.terminal {
  padding: 64px 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
}
.window {
  width: 100%;
  max-width: 760px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #21262d;
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-xs);
  color: var(--text-dim);
}
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot.red    { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green  { background: #27c93f; }
.title { margin-left: 8px; }
.body {
  margin: 0;
  padding: 20px 24px;
  font-family: inherit;
  font-size: var(--fs-sm);
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}
.prompt-line { color: var(--prompt); }
.out-line    { color: var(--text); }
.ls-line     { display: inline; }
.section-link {
  color: var(--accent);
  margin-right: 1.5ch;
  text-decoration: none;
}
.section-link:hover { text-decoration: underline; }
.cursor {
  display: inline-block;
  width: 1ch;
  background: var(--text);
  color: var(--bg);
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink { to { visibility: hidden; } }
.hint {
  margin-top: 24px;
  color: var(--text-dim);
  font-size: var(--fs-xs);
}
@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; }
}
</style>
```

- [ ] **Step 4: Run, confirm pass**

```powershell
npm test
```

Expected: all 4 TerminalHero tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/components/TerminalHero.vue src/components/__tests__/TerminalHero.test.js
git commit -m "feat(ui): TerminalHero with typewriter, skip, reduced-motion"
```

---

## Task 14: SiteNav component

**Files:**
- Create: `src/components/SiteNav.vue`
- Create: `src/components/__tests__/SiteNav.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SiteNav from '../SiteNav.vue';

describe('SiteNav', () => {
  it('renders five section anchor links', () => {
    const wrapper = mount(SiteNav);
    const links = wrapper.findAll('a');
    expect(links).toHaveLength(5);
    expect(links.map((l) => l.attributes('href'))).toEqual([
      '#about', '#experience', '#skills', '#education', '#contact',
    ]);
  });
});
```

- [ ] **Step 2: Run, confirm failure**

- [ ] **Step 3: Implement `src/components/SiteNav.vue`**

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const sections = [
  { id: 'about',      label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'skills',     label: 'skills' },
  { id: 'education',  label: 'education' },
  { id: 'contact',    label: 'contact' },
];

const active = ref('');
let observer = null;

onMounted(() => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) active.value = e.target.id;
      }
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );
  for (const s of sections) {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  }
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <nav class="site-nav" aria-label="Primary">
    <a
      v-for="s in sections"
      :key="s.id"
      :href="`#${s.id}`"
      :class="['nav-link', { active: active === s.id }]"
    >{{ s.label }}</a>
  </nav>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 14px 16px;
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-xs);
}
.nav-link {
  color: var(--text-dim);
  text-decoration: none;
}
.nav-link:hover, .nav-link.active {
  color: var(--prompt);
}
</style>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```powershell
git add src/components/SiteNav.vue src/components/__tests__/SiteNav.test.js
git commit -m "feat(ui): SiteNav sticky anchors with active highlight"
```

---

## Task 15: Compose `App.vue`

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Replace `src/App.vue`**

```vue
<script setup>
import SiteNav from './components/SiteNav.vue';
import TerminalHero from './components/TerminalHero.vue';
import AboutSection from './components/AboutSection.vue';
import ExperienceSection from './components/ExperienceSection.vue';
import SkillsSection from './components/SkillsSection.vue';
import EducationSection from './components/EducationSection.vue';
import ContactSection from './components/ContactSection.vue';
</script>

<template>
  <SiteNav />
  <TerminalHero />
  <main>
    <AboutSection />
    <ExperienceSection />
    <SkillsSection />
    <EducationSection />
    <ContactSection />
  </main>
  <footer class="site-footer">
    <p>Built with Vue. Source on <a :href="`https://github.com/tawhidii/my-folio`" target="_blank" rel="noopener">github.com/tawhidii/my-folio</a>.</p>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--rhythm);
  padding: 32px 16px 48px;
  text-align: center;
  color: var(--text-dim);
  font-size: var(--fs-xs);
  border-top: 1px solid var(--border);
}
</style>
```

- [ ] **Step 2: Run full test suite**

```powershell
npm test
```

Expected: all tests across data + components pass.

- [ ] **Step 3: Verify in browser**

```powershell
npm run dev
```

Open `http://localhost:5173/my-folio/`. Confirm:
- Nav is sticky at the top with 5 links
- Terminal hero animates (or skips on click)
- About / Experience / Skills / Education / Contact all render with content
- Clicking nav links scrolls to the right section
- Page is dark, monospace, JetBrains Mono

Stop the server.

- [ ] **Step 4: Commit**

```powershell
git add src/App.vue
git commit -m "feat: compose full page in App.vue"
```

---

## Task 16: Favicon and final HTML polish

**Files:**
- Create: `public/favicon.svg`
- Modify: `index.html` (only if needed)

- [ ] **Step 1: Create `public/favicon.svg`**

A simple monogram-on-dark favicon matching the theme:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#0d1117"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="JetBrains Mono, monospace" font-weight="700" font-size="28"
        fill="#7ee787">$_</text>
</svg>
```

- [ ] **Step 2: Verify in browser**

```powershell
npm run dev
```

Confirm the green `$_` favicon appears in the browser tab. Stop the server.

- [ ] **Step 3: Commit**

```powershell
git add public/favicon.svg
git commit -m "feat: monogram favicon"
```

---

## Task 17: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the build runs locally**

```powershell
npm run build
```

Expected: Vite builds to `dist/` with no errors. The `index.html` references assets under `/my-folio/`.

- [ ] **Step 3: Commit**

```powershell
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages deploy workflow"
```

---

## Task 18: Publish and final manual verification

**Files:** none (manual + remote)

- [ ] **Step 1: Create the GitHub repo and push**

On github.com, create a new public repo named exactly `my-folio` under the `tawhidii` account. Do not initialize it with a README.

```powershell
git remote add origin https://github.com/tawhidii/my-folio.git
git push -u origin main
```

- [ ] **Step 2: Enable Pages**

In the repo's GitHub settings → Pages → Source: select **GitHub Actions**.

- [ ] **Step 3: Wait for the Actions run to finish**

Open the Actions tab. The "Deploy to GitHub Pages" workflow should be running. Wait for `build` + `deploy` to go green.

- [ ] **Step 4: Manual verification at the deployed URL**

Visit `https://tawhidii.github.io/my-folio/`. Confirm:
- Terminal animates on first load (or click to skip).
- All 7 experience entries render in order from Techjays → Belaface.
- Skills groups display with correct headings.
- Contact links open mail / phone / external sites correctly.
- Page is fast (Network tab: < 200KB transferred, no console errors).
- Run Lighthouse: a11y ≥ 95, performance ≥ 95.

- [ ] **Step 5: Final commit (if anything was tweaked)**

```powershell
git status
```

Only commit if there's something genuinely different from what was shipped. Otherwise this step is a no-op.

---

## Done

The site is live at `https://tawhidii.github.io/my-folio/`. Future updates: edit the resume content in `src/data/*.js`, push to `main`, and the workflow redeploys automatically.
