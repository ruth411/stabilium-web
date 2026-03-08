# Stabilium Web

The Next.js frontend for [Stabilium](https://stabilium.ruthwikdovala.com) — a platform for benchmarking and tracking AI agent stability.

Backend engine repo: [ruth411/Stabilium](https://github.com/ruth411/Stabilium)

---

## What it does

- **Landing page** — explains ASE, live demo with configurable case count and model/provider picker
- **Auth** — signup (name + company + email + password) and login, session stored in an HTTPOnly cookie
- **Dashboard** — submit benchmark evaluation jobs, view real-time progress bar per job, open formatted reports
- **Report viewer** — ASI gauge, domain breakdown bars, confidence interval, download as PDF
- **Dark theme** — `#08090f` background, `#00d68f` brand green, `#5b7cf7` accent blue

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel |
| Backend | FastAPI on Railway (`ruth411/Stabilium`) |

---

## Local setup

```bash
npm install
cp .env.local.example .env.local   # set BACKEND_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `BACKEND_URL` | URL of the FastAPI backend, e.g. `https://your-app.railway.app` |

In development, `BACKEND_URL` defaults to `http://localhost:8000` if not set.

---

## Key pages & routes

| Route | Description |
|---|---|
| `/` | Landing page with hero, features, how-it-works, pricing, live demo |
| `/app` | Auth panel (sign in / sign up) + dashboard after login |
| `/api/auth/login` | Next.js proxy → FastAPI `/auth/login`, sets HTTPOnly session cookie |
| `/api/auth/register` | Next.js proxy → FastAPI `/auth/register` |
| `/api/auth/me` | Next.js proxy → FastAPI `/auth/me` |
| `/api/auth/logout` | Clears session cookie |
| `/api/jobs` | Proxy for job list and job creation |
| `/api/jobs/[id]/report` | Proxy for report JSON |
| `/api/evaluate` | Proxy for the synchronous live demo endpoint |

---

## User registration fields

When a user signs up, the following are collected and stored:

| Field | Description |
|---|---|
| Full name | Personal name (e.g. Jane Smith) |
| Company / project name | Organisation or project the user represents |
| Email | Used for login |
| Password | Hashed with PBKDF2-SHA256 on the backend, never stored in plain text |

---

## Dashboard features

- **Run new evaluation** — choose provider (OpenAI / Anthropic), enter model name, API key (not stored), run count, max cases, seed
- **Your evaluations table** — live status (queued → running → completed), ASI score, case count
- **Progress bar** — running jobs show a green filled bar with `X of Y cases complete · Z%`, updated every 2.5 s
- **Report panel** — click "View report" on a completed job to see:
  - Circular ASI gauge with glow (green ≥ 0.85, amber ≥ 0.70, red < 0.70)
  - 95% confidence interval bar
  - Domain breakdown (reasoning, coding, safety, planning, …)
  - Download PDF button (`window.print()` with print-only CSS)

---

## Development commands

```bash
npm run dev      # local dev server
npm run build    # production build (also type-checks)
npm run lint     # ESLint
```
