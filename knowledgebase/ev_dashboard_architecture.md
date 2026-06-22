# EV Dashboard — Architecture & Technology Decisions

## System Overview

Two-part system. A Python pipeline produces static JSON files from a CSV. A Next.js web app reads those files and renders charts, maps, and interactive tools.

```
inputs/Electric_Vehicle_Population_Data.csv   (285,822 WA EV registrations)
         |
         v
scripts/export_ev_population_data.py          (Python pipeline)
         |
         v
output/api_data/*.json                        (19 JSON files)
         |
         v (copy step)
         v
ev-dashboard/public/data/api_data/*.json      (served statically)
         |
         v
ev-dashboard/  (Next.js app — reads JSON, renders dashboard)
         |
         v
https://ev-bev-dashboard.netlify.app          (deployed, public)
```

---

## Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js | 16.2.7 | App Router, server components, API routes in one repo |
| UI | React | 19.2.4 | Latest — but has breaking changes (see Gotchas) |
| Styling | Tailwind CSS | v4 | Utility-first, consistent design system |
| Charts | plotly.js | 3.6.0 | Rich chart types; used directly (NOT via react-plotly.js wrapper) |
| Maps | Leaflet | 1.9.4 | Lightweight, OSM tiles, no API key |
| Language | TypeScript | 5.x | Strict mode on |
| Data pipeline | Python + pandas | 3.9+ | Data wrangling and aggregation |
| Deployment | Netlify | — | Git-connected, auto-deploys on push to main |

---

## Free API Stack (no keys required)

All external services used in the Trip Planner are free with no registration:

| Service | Purpose | Endpoint |
|---------|---------|---------|
| Nominatim | Geocoding (address → lat/lng) | nominatim.openstreetmap.org |
| OSRM | Driving routes + distance/duration | router.project-osrm.org |
| Overpass API | EV charging station locations | overpass-api.de/api/interpreter |
| OpenStreetMap tiles | Map background rendering | tile.openstreetmap.org (via Leaflet) |

Rate limits: Nominatim allows ~1 req/sec; always include a `User-Agent` header identifying your app.

---

## Key Architectural Decisions

### 1. Static JSON instead of a live database
The dashboard reads pre-computed JSON files rather than querying a database at runtime. This means:
- No database to maintain or secure
- Pages load instantly (data is already aggregated)
- Deploying updated data = regenerate JSONs + copy + push to git
- Tradeoff: data is not real-time — must re-run the pipeline for updates

### 2. No LLM / AI API for the chatbot
The EV chatbot (`ChatWidget`) uses a rule-based intent engine, not an LLM. This was a deliberate choice:
- Zero API cost, zero rate limits
- Works offline / in airgapped environments
- Answers are deterministic and auditable
- To upgrade to a real LLM: add `ANTHROPIC_API_KEY` to `.env.local` and rewrite the `/api/chat` route handler to call the Anthropic API

### 3. plotly.js directly instead of react-plotly.js
`react-plotly.js` v2.6.0 calls `createReactClass` which was removed in React 19. It throws at runtime and produces invisible white chart boxes. The fix: import `plotly.js/dist/plotly-basic.min.js` directly inside a `useEffect` hook. All chart rendering goes through the shared `PlotlyChart` component which encapsulates this pattern.

### 4. Leaflet via useEffect, not react-leaflet
Leaflet directly modifies the DOM and cannot render server-side. `react-leaflet` has similar React version incompatibilities. Solution: load Leaflet as a dynamic import inside `useEffect`, inject the CSS via a `<link>` tag, and manipulate the map container directly. The `RouteMap` component encapsulates this.

### 5. JSON files in public/ for deployment
During local development, `data.ts` reads from `process.cwd() + '/public/data/api_data/'`. On Netlify/Vercel the `public/` directory is bundled into the deployment and accessible via the filesystem. Files outside the project root (`../output/api_data/`) are not accessible in cloud deployments.

---

## Application Structure

```
ev-dashboard/
├── netlify.toml                      # Build config for Netlify
├── next.config.ts                    # allowedDevOrigins for LAN access
├── .env.local                        # Optional API keys (gitignored)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout: Sidebar + ChatWidget on every page
│   │   ├── globals.css               # Tailwind base styles
│   │   ├── page.tsx                  # Overview page (/)
│   │   ├── market/page.tsx           # Market Trends (/market)
│   │   ├── geography/page.tsx        # Geography (/geography)
│   │   ├── vehicles/page.tsx         # Vehicle Analysis (/vehicles)
│   │   ├── recommend/                # Trip Planner (/recommend)
│   │   │   ├── page.tsx              # Server wrapper (metadata + imports)
│   │   │   └── RecommendClient.tsx   # Client component (form, map, results)
│   │   │
│   │   └── api/                      # API route handlers (serverless functions)
│   │       ├── chat/route.ts         # POST /api/chat — rule-based EV chatbot
│   │       ├── recommend/route.ts    # POST /api/recommend — trip planner engine
│   │       ├── ev-kpis/route.ts      # GET /api/ev-kpis
│   │       ├── ev-type-breakdown/    # GET — and so on for each JSON file
│   │       └── ...                   # One route per JSON data file
│   │
│   ├── components/
│   │   ├── Sidebar.tsx               # Left nav (brand + page links)
│   │   ├── KpiCard.tsx               # Metric card with label + value
│   │   ├── PlotlyChart.tsx           # Chart wrapper (all charts use this)
│   │   ├── RouteMap.tsx              # Leaflet map for Trip Planner
│   │   └── ChatWidget.tsx            # Floating chat bubble (bottom-right)
│   │
│   ├── lib/
│   │   └── data.ts                   # readJson() helper — all data reads go here
│   │
│   └── types/
│       └── plotly.d.ts               # Type declaration for plotly dist build
│
└── public/
    └── data/
        └── api_data/                 # 19 JSON files (copied from output/api_data/)
```

---

## Data Flow for Dashboard Pages

```
Server Component (page.tsx)
    └─ calls readJson("ev_kpis.json")
         └─ reads from public/data/api_data/ev_kpis.json (filesystem)
              └─ returns typed object
                   └─ passed as props to client components
                        └─ PlotlyChart renders chart in browser
```

## Data Flow for Trip Planner

```
Client (RecommendClient.tsx)
    └─ POST /api/recommend  { origin, destination, ev_model, preferences }
         └─ Nominatim geocodes origin and destination
         └─ OSRM calculates route (distance, duration, coords)
         └─ Overpass API fetches charging stations at 3 points along route
         └─ buildNarrative() calculates: range check, charging stops, cost
         └─ returns { route_info, charging_stops, recommendation }
              └─ RecommendClient renders map + results
```

---

## Environment Variables

`.env.local` is gitignored. All values are optional — the app works without any keys.

```bash
# Enables real LLM in chatbot (currently rule-based without this)
ANTHROPIC_API_KEY=

# Not used currently — placeholder if switching to Google Maps
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## Deployment

- **Platform:** Netlify, connected to GitHub repo `imamar9/ev-bev-dashboard`
- **Branch:** `main` — every push triggers an automatic redeploy
- **Build command:** `npm run build` (from `netlify.toml`)
- **Publish dir:** `.next`
- **Node version:** 20 (set in `netlify.toml`)

To update data: re-run Python pipeline → copy JSONs → commit → push.
