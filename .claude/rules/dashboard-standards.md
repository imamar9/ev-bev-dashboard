# Dashboard Development Standards

Standards for all work on `ev-dashboard/`. Apply these rules before adding any feature, fixing any bug, or refactoring any component. Gates marked **HARD BLOCK** must pass — work cannot proceed until they do.

---

## Gate 1 — Before Installing Any Package

Run this check before `npm install <package>`:

```bash
npm info <package> peerDependencies
```

**Must verify all four before installing:**

- [ ] **React 19 compatible** — package does not list `createReactClass`, does not require React < 19, peer dep allows `^19`
- [ ] **No paid API dependency** — package must not require an API key or a paid service account to function
- [ ] **Bundle size acceptable** — run `npx bundlephobia <package>` — reject if gzip size > 100 KB unless there is no alternative
- [ ] **No conflicting peer deps** — `npm install` must produce zero `ERESOLVE` or peer conflict warnings

**HARD BLOCK — do not install if any check fails.** Document the rejection reason in a code comment instead of finding a workaround.

### Known incompatible packages (do not install)

| Package | Reason |
|---------|--------|
| `react-plotly.js` any version | Uses `createReactClass` — removed in React 19 → blank charts |
| `react-leaflet` | React 19 incompatibility — use raw `leaflet` via `useEffect` |
| `@ai-sdk/react` / `ai/react` `useChat` | Removed in ai v6 — use plain `fetch` + React state |
| Any Google Maps SDK | Requires paid key — use Nominatim + OSRM + Overpass instead |

---

## Gate 2 — Before Calling Any External API

Every new external API call must pass all checks before the code is written:

- [ ] **Free and keyless** — no registration or payment required (or key is truly optional for basic use)
- [ ] **Returns JSON** — confirmed by reading the API docs; not just assumed
- [ ] **Has a User-Agent policy** — check terms of service; add `User-Agent: EV-Dashboard-Demo/1.0 (educational project)` header to every request
- [ ] **Rate limit documented** — add a comment with the known rate limit next to the fetch call
- [ ] **Failure mode handled** — API must return `[]` or `{}` on failure, never throw to the client; wrap with `safeJson()` and a `try/catch` that returns a safe fallback

**Permitted services:**

| Service | Purpose | Rate limit |
|---------|---------|-----------|
| Nominatim (openstreetmap.org) | Geocoding | 1 req/sec |
| OSRM (router.project-osrm.org) | Routing | No hard limit (fair use) |
| Overpass API (overpass-api.de) | EV charging stations | ~10k req/day |
| OpenStreetMap tiles | Map background | Fair use per tile policy |

**HARD BLOCK — do not add a call to any service not on this list without explicit approval.** To propose a new service, document it in `knowledgebase/ev_dashboard_architecture.md` under the Free API Stack section first.

### Required wrapper for every external fetch

```typescript
const UA = "EV-Dashboard-Demo/1.0 (educational project)";

async function safeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${text.slice(0, 120)}`);
  }
  return res.json();
}

// Usage
const res = await fetch(url, { headers: { "User-Agent": UA } });
let data: unknown;
try { data = await safeJson(res); } catch { return []; }  // safe fallback
```

---

## Gate 3 — Before Running / Starting the App

Run these checks in order before `npm run dev` or `npm run build`:

```bash
# 1. Confirm data files exist and are valid
python testscripts/validate_outputs.py

# 2. Confirm dashboard public folder is in sync with pipeline output
#    (validate_outputs.py reports this — check the sync section)

# 3. TypeScript check (faster than full build)
npx tsc --noEmit

# 4. Full production build (catches bundler + route errors)
npm run build
```

**HARD BLOCK — do not push to main or demo the app until `npm run build` exits with code 0.**

### Pre-run environment checklist

- [ ] `ev-dashboard/public/data/api_data/` contains all 19 JSON files
- [ ] `.env.local` exists (even if empty) — copy from `.env.local.example` if missing
- [ ] No `ANTHROPIC_API_KEY` or other secret is hardcoded in any `.ts` or `.tsx` file
- [ ] `node_modules/` exists — run `npm install` if missing
- [ ] Node.js version is 20+ (`node --version`)

---

## Gate 4 — Before Merging Any Feature

Full pre-merge checklist. Every item must be checked:

### Code quality
- [ ] `npm run build` passes with **zero** TypeScript errors and zero warnings about missing modules
- [ ] No `@ts-ignore` added — fix the type properly instead
- [ ] No `console.log` left in production code — use them only during development, remove before merge
- [ ] No hardcoded coordinates, prices, or rates — all constants must be named variables with a comment explaining the source

### Components
- [ ] Charts use `PlotlyChart` — never `react-plotly.js` or raw `Plotly` in page files
- [ ] Maps use `RouteMap` via `lazy()` + `<Suspense>` — never bare `import leaflet`
- [ ] New client components have `"use client"` at line 1 — server components have no directive
- [ ] `ChatWidget` is NOT added to individual pages — it is already in `layout.tsx`

### Forms and UI
- [ ] All `<input>`, `<select>`, `<textarea>` have: `text-gray-900 bg-white placeholder-gray-400`
- [ ] Submit buttons show a loading spinner while `loading === true`
- [ ] Error states display a user-readable message — never `JSON.stringify(err)`
- [ ] Geolocation usage checks for HTTPS context before calling `navigator.geolocation`

### Data
- [ ] New data reads use `readJson()` from `src/lib/data.ts` — never raw `fs.readFileSync`
- [ ] If pipeline was re-run: JSONs copied to `ev-dashboard/public/data/api_data/` and `validate_outputs.py` passes
- [ ] New JSON file added to `EXPECTED_FILES` in `testscripts/validate_outputs.py`

### API routes
- [ ] All external `fetch` calls wrapped with `safeJson()` + `try/catch` fallback
- [ ] All routes return `NextResponse.json({ error: "..." }, { status: 4xx })` on failure — never throw unhandled
- [ ] Input validation at the top of every POST handler — reject missing required fields with 400
- [ ] No route imports from `ai/react` or calls `useChat` — use plain `fetch` in client components

### Navigation
- [ ] New page added to `Sidebar.tsx` NAV array (if user-facing)
- [ ] New API route follows naming: `src/app/api/kebab-case-name/route.ts`

### Deployment
- [ ] No secrets committed — `git diff --staged` shows no `.env` files, no API keys
- [ ] `netlify.toml` not modified unless intentional (changing it affects production build)

---

## Component Rules

### Charts
- **Always use `PlotlyChart`** (`src/components/PlotlyChart.tsx`)
- Pass `data` and `layout` as plain objects; `PlotlyChart` merges base styles
- Set explicit `layout.height` on charts inside fixed-height containers

### Maps
- **Always use `RouteMap`** (`src/components/RouteMap.tsx`)
- Always wrap with `lazy(() => import(...))` + `<Suspense>`

### Forms
- All fields: `text-gray-900 bg-white placeholder-gray-400`
- Disabled buttons: `disabled:opacity-50` or `disabled:opacity-60`
- Loading states: spinner required — never a frozen UI

---

## TypeScript Rules

- **Strict mode is on** — no `@ts-ignore`, no implicit `any`
- `eslint-disable @typescript-eslint/no-explicit-any` permitted only for Plotly data arrays and third-party interop
- React event handlers: `{ preventDefault(): void }` — not `React.FormEvent` (React 19 deprecation)

---

## Styling Rules

- Tailwind utility classes only — no inline `style={}` except for dynamic numeric values (heights, widths from data)
- Brand colours: `#00338D` (primary blue), `#86BC25` (green), `#F59E0B` (amber/charging)
- Card: `rounded-xl bg-white p-5 shadow-sm`
- KPI card: `rounded-xl border-l-4 border-[#00338D] bg-white p-4 shadow-sm`

---

## React 19 Compatibility

These patterns are broken in React 19 — never use them:

| Broken | Use instead |
|--------|-------------|
| `import Plot from 'react-plotly.js'` | `import("plotly.js/dist/plotly-basic.min.js")` in `useEffect` |
| `React.FormEvent<HTMLFormElement>` | `{ preventDefault(): void }` |
| `createReactClass` (any source) | Check React 19 compat before installing any UI package |
| `useChat` from `ai/react` | Plain `fetch` + `useState` |

---

## Deployment Checklist

Before pushing to `main`:
1. `npm run build` exits 0
2. `python testscripts/validate_outputs.py` passes (if data changed)
3. `git diff --staged` — confirm no `.env` files, no secrets
4. JSON files in `public/data/api_data/` match pipeline output
