# BEV Fleet Analytics — Team Onboarding Guide

## What This Project Is

A full-stack analytics platform built on Washington State's public EV registration dataset (285,822 vehicles). It has two parts:

| Part | What it does |
|------|--------------|
| **Python pipeline** (`scripts/`) | Reads the raw CSV, computes KPIs, and writes 19 JSON files to `output/api_data/` |
| **Next.js dashboard** (`ev-dashboard/`) | Reads those JSON files and renders interactive charts, a trip planner, and an EV chatbot |

---

## Prerequisites

- Python 3.9+ with `pandas`, `numpy`
- Node.js 20+
- The source CSV in `inputs/Electric_Vehicle_Population_Data.csv`

---

## Local Setup

### 1 — Run the Python pipeline

```bash
cd "ev-use-case"
pip install pandas numpy
python scripts/export_ev_population_data.py
```

This writes all JSON files to `output/api_data/`. Re-run any time the source CSV updates.

> **Important:** After running the pipeline, copy the JSON files into the dashboard's public folder so the web app can read them:
> ```bash
> cp output/api_data/*.json ev-dashboard/public/data/api_data/
> ```

### 2 — Start the dashboard

```bash
cd ev-dashboard
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
ev-use-case/
├── inputs/                        # Raw source data (read-only)
│   └── Electric_Vehicle_Population_Data.csv
├── knowledgebase/                 # Reference standards (read-only)
├── scripts/                       # Python pipeline scripts
│   └── export_ev_population_data.py   ← main data pipeline
├── output/api_data/               # Pipeline output (19 JSON files)
├── testscripts/                   # Validation scripts
│   └── validate_outputs.py            ← run to verify output quality
├── ev-dashboard/                  # Next.js web application
│   ├── src/
│   │   ├── app/                   # Pages + API routes (App Router)
│   │   │   ├── page.tsx           # Overview (home)
│   │   │   ├── market/            # Market Trends page
│   │   │   ├── geography/         # Geography page
│   │   │   ├── vehicles/          # Vehicle Analysis page
│   │   │   └── recommend/         # Trip Planner page
│   │   ├── components/
│   │   │   ├── PlotlyChart.tsx    # Shared chart wrapper (use this, not react-plotly.js)
│   │   │   ├── RouteMap.tsx       # Leaflet map component
│   │   │   └── ChatWidget.tsx     # Floating EV assistant
│   │   └── lib/data.ts            # readJson() helper — use this to read JSON files
│   └── public/data/api_data/      # JSON files served to the app
├── GUARDRAILS.yaml                # Quality standards and folder rules
├── ONBOARDING.md                  # This file
└── .claude/rules/                 # Auto-loaded rules for AI agents
    ├── escalation.md
    └── dashboard-standards.md     ← coding standards for dashboard work
```

---

## Dashboard Pages

| URL | What it shows |
|-----|---------------|
| `/` | KPI summary cards + top-level charts |
| `/market` | Year-over-year trends, top makes, BEV vs PHEV by brand |
| `/geography` | EV distribution by county and city |
| `/vehicles` | Range distribution, CAFV eligibility, utility breakdown |
| `/recommend` | Interactive trip planner with live route + charging stations |

The floating **⚡ chat bubble** (bottom-right) is available on every page.

---

## Key Decisions to Know

| Decision | Why |
|----------|-----|
| No paid APIs | Trip planner uses Nominatim + OSRM + Overpass API (all free, no keys) |
| No LLM in chatbot | Rule-based engine covers 15+ EV topics — works without any API key |
| Direct plotly.js (not react-plotly.js) | react-plotly.js v2.6.0 uses `createReactClass` removed in React 19 |
| JSON in `public/data/api_data/` | Required for Vercel/Netlify deployment — `readFileSync` can't reach `../output/` in production |

---

## Knowledgebase

Four reference documents live in `knowledgebase/` — read before building anything new:

| Document | What it covers |
|----------|---------------|
| [ev_dashboard_architecture.md](knowledgebase/ev_dashboard_architecture.md) | Tech stack, key decisions, system design, deployment |
| [ev_dashboard_data_guide.md](knowledgebase/ev_dashboard_data_guide.md) | Pipeline details, full JSON schema for all 19 files, how to add new metrics |
| [ev_dashboard_component_reference.md](knowledgebase/ev_dashboard_component_reference.md) | PlotlyChart, RouteMap, ChatWidget, Sidebar, data.ts — props and usage |
| [ev_dashboard_feature_guide.md](knowledgebase/ev_dashboard_feature_guide.md) | Step-by-step: new page, new API route, new chatbot topic, new interactive feature |

## Auto-Loaded Rules (Claude reads these on every session)

Four rule files in `.claude/rules/` are automatically loaded into every Claude Code session in this project:

| File | When it applies |
|------|----------------|
| `escalation.md` | Always — when to self-resolve vs. ask vs. block |
| `dashboard-standards.md` | Always — 4 gates: install package, call API, run app, merge feature |
| `security.md` | Always — input validation, secrets, XSS, personal data handling |
| `git-workflow.md` | Always — branch naming, commits, pre-push checklist, rollback procedure |

## Before Adding a Feature

1. Read `knowledgebase/ev_dashboard_feature_guide.md` for the right pattern
2. The `.claude/rules/` files are enforced automatically — Claude will apply them without being asked

---

## Validating Outputs

Run this to verify all pipeline outputs are correct before updating the dashboard:

```bash
python testscripts/validate_outputs.py
```

It checks that all 19 JSON files exist, have the expected structure, and that key metrics are within sensible ranges.

---

## Deployment

The app is deployed on Netlify (connected to the `imamar9/ev-bev-dashboard` GitHub repo). Push to `main` triggers an automatic redeploy.

To update the dashboard data:
1. Run `export_ev_population_data.py` with the new CSV
2. Copy JSON files to `ev-dashboard/public/data/api_data/`
3. Commit and push to `main`
