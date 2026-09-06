Task: read my current cv, read it, its in this obsidian vault at root in index.md - and write a list of suggested keyword/skill/wording/phrasing changes, based on the findings in the previous 3 tasks' notes

Output: in this very note

---

# CV Suggested Changes — Cross-Referenced Against Research Tasks 1–3

Sources: `index.md`, `content/about.md`, `content/experience.md`, `content/projects.md` (the CV). Each suggestion: where → change → why (grounded in Task 1 market list, Task 2 real project usage, Task 3 tiers).

---

## A. `index.md` — "I do frontend" (line 13)

Add these Tier A / evidence-backed keywords:

- **PWA / Service Workers** (Task 3 Tier A; used in projects)
- **Zustand** (Task 3 Tier A; real usage)
- **Shadcn/UI (Radix)** (Task 3 Tier A; real usage)
- **Sass/SCSS** (Task 3 Tier A; real usage)
- **React Native** (Task 3 Tier A; real usage)

Already covered: React, Next.js, TypeScript, MUI, Tailwind, Storybook, micro-frontends, design systems. TanStack Query appears as "React Query" in Fuse project — fine.

## B. `index.md` — "I do backend" (line 16)

**The single biggest gap in the whole CV: no database product keywords at all.**
- **PostgreSQL** — Tier A's #1 database, *completely absent from CV* (Task 2 ranks it #1 in usage)
- **MongoDB** (Task 3 Tier A; wcheck backend runs mongoose/mongodb@3.7.3)
- **Prisma ORM** (Task 3 Tier A; bank stack)
- **Express.js** (Task 3 Tier A)
- **WebSockets** (Task 3 Tier A)
- **gRPC** (Task 3 Tier A; added to Task 3)
- **Fastify** (Task 3 Tier A)
- **Kafka / Event-Driven Architecture** (Task 3 Tier A; verified in bank repo diffs — absent from CV despite being a flagship differentiator)
- **Apollo / GraphQL Federation** — MBH says only "Federated GraphQL"; make Apollo explicit (Task 2: Apollo Server / Federation / Gateway)

## C. `index.md` — "I do AI" (line 19)

Wording is distinctive (agent orchestration, context engineering, agent skill design) — keep it. But it lacks market-recognized keywords. Add:

- **RAG pipelines** (Task 3 Tier A)
- **Vector databases / embeddings** (Task 3 Tier A)
- **LLM API integration (OpenAI, DeepSeek)** (Task 3 Tier A)
- **Prompt engineering** (Task 3 Tier A)
- **AI observability & evaluation** (Task 3 Tier A)

## D. `index.md` — "I do ops & tooling" (line 22)

- **nginx** (Task 3 Tier A; verified on 5+ WP sites: mariskaetterem, bbpro, rapidlog, welovetiszato, tiszafuredszabadstrand)
- **GitLab CI** (GitLab verified in bank repos; Task 1 lists it)
- **Kubernetes** — optional; Task 2 explicitly says "basics", so only add if honest (recommend: add with "basics" nuance or omit)

## E. New "I do testing" line

Testing keywords are entirely absent from the homepage. Add a dedicated line (recommended) mirroring the existing pattern:

- Jest, Vitest, Playwright, @testing-library (Task 3 Tier A / Task 1 Testing category)

Alternative: fold into "I do frontend" — viable but weaker for ATS scanning.

## F. `content/about.md` (line 9)

Current: "Frontend-heavy Full-Stack Developer with 15 years of experience, specialising in React since 2017."

"Frontend-heavy" undersells 15 years incl. Backend Developer (2012–2013), Full Stack (2013–2017) and current AI/agentic freelance work. **Balanced (recommended):**

> "Full-Stack Developer with 15 years of experience — React specialist since 2017, now building full-stack and AI/agentic systems."

Alternatives:
- (a) Full-stack + AI only: "Full-Stack Developer with 15 years of experience across frontend, backend and AI/agentic systems."
- (b) Keep current line unchanged.

## G. `content/projects.md` — tech-line additions

- **BBPro 2024** (line 40): add `WooCommerce` — it's an e-commerce site (Task 3 Tier A CMS)
- **MBH Vault** (line 20): add `Kafka` `PostgreSQL` `Prisma` — verified bank stack (Task 2: NestJS + GraphQL federation + Kafka + Prisma). Also add `Playwright`/`Jest` if accurate (bank repos had testing)
- **WCheck** (line 62): add `PostgreSQL`/`MongoDB` (Strapi backend storage), `Jest`/`Playwright`
- **Fizz** (line 52): add `Jira` (large SCRUM team; Task 3 Tier A), testing keywords
- **Tackl** (line 92): add `WebSockets` — live multiplayer betting — **verify first** before adding
- **WELOVETISZATO / Tackl**: keep Gatsby. Task 3 says Gatsby is maintenance-mode → project-history-only, *never* a headline keyword. Already correctly placed. ✓

## H. Tools & collaboration gap

- **Jira** — Task 3 Tier A; used in every scrum team you've been in; absent from CV. Add to a relevant project tech line (Fizz) or the homepage tools mention.
- Optional low-cost: ESLint, Prettier (Task 3 Tier A; real usage).

## I. Deliberate omissions (logic documented)

- **Astro, Azure, GCP, Terraform** — Task 3 "Gap-Filling Targets": strong in market but not evidenced in projects → do NOT put on CV; these are aim-for skills.
- **Gatsby** — maintenance mode (Netlify acquisition 2023, plugin ecosystem stale). Keep in project history only.
- **Kubernetes** — only if "basics" nuance is honest (Task 2).
- **Jira** — kept out of homepage unless a project tech line supports it (recommend: Fizz).
