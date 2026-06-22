# EV Dashboard — Component Reference

Every reusable component in `ev-dashboard/src/components/`. New features should use these — do not bypass them.

---

## PlotlyChart

**File:** `src/components/PlotlyChart.tsx`
**Type:** Client component (`"use client"`)
**Purpose:** Renders any Plotly chart. Encapsulates the React 19 compatibility workaround.

### Why this exists

`react-plotly.js` v2.6.0 calls `createReactClass`, which was removed in React 19. It causes charts to be invisible white boxes at runtime. This component imports `plotly.js/dist/plotly-basic.min.js` (a pre-bundled file) inside a `useEffect`, bypassing the React 19 incompatibility entirely.

**Never import `react-plotly.js` or `plotly.js` directly in page files.** Always use this component.

### Props

```typescript
interface Props {
  data: any[];                    // Plotly trace array
  layout?: Record<string, any>;  // Plotly layout overrides
  config?: Record<string, any>;  // Plotly config overrides
  className?: string;            // Additional CSS classes
}
```

### Usage

```tsx
import PlotlyChart from "@/components/PlotlyChart";

<PlotlyChart
  data={[{
    type: "bar",
    x: topMakes.map((m) => m.make),
    y: topMakes.map((m) => m.count),
    marker: { color: "#00338D" },
  }]}
  layout={{
    title: "Top EV Manufacturers",
    height: 320,
    xaxis: { tickangle: -30 },
  }}
/>
```

### Built-in base styles

The component merges these defaults into every chart — no need to repeat them:

```javascript
paper_bgcolor: "white"
plot_bgcolor: "#F0F4F8"
font: Inter, 12px, #374151
margin: { t: 30, r: 20, b: 50, l: 60 }
gridlines: light gray (#e5e7eb)
responsive: true
displayModeBar: false
```

### Chart height

- Default height: `320px`
- Override with `layout={{ height: 400 }}`
- For fixed-height containers, always set an explicit height

### Available chart types

Uses `plotly-basic` bundle which includes: scatter, bar, pie, histogram, box, heatmap. For advanced types (3D, mapbox, candlestick) you would need to import the full `plotly.js` bundle and handle the `glslify` bundler issue separately.

---

## RouteMap

**File:** `src/components/RouteMap.tsx`
**Type:** Client component (`"use client"`)
**Purpose:** Renders a Leaflet map showing a route with origin, destination, and charging stop pins.

### Why this exists

Leaflet uses browser-only APIs (`window`, `document`). It cannot run server-side. This component loads Leaflet dynamically inside `useEffect` and injects the CSS, making it safe to use in a Next.js app.

**Never import `leaflet` directly in page files.** Always use this component wrapped in `lazy()` + `<Suspense>`.

### Props

```typescript
interface Props {
  originCoords: [number, number];   // [lat, lng] — green pin (A)
  destCoords:   [number, number];   // [lat, lng] — red pin (B)
  routeCoords:  [number, number][]; // array of [lat, lng] — blue polyline
  stops: { name: string; lat: number; lng: number }[]; // amber ⚡ pins
}
```

### Usage

Always use `lazy` + `Suspense` to prevent SSR:

```tsx
import { lazy, Suspense } from "react";

const RouteMap = lazy(() => import("@/components/RouteMap"));

<Suspense fallback={<div className="h-80 flex items-center justify-center text-gray-400">Loading map…</div>}>
  <RouteMap
    originCoords={[47.6062, -122.3321]}
    destCoords={[45.5051, -122.6750]}
    routeCoords={result.route_info.route_coords ?? []}
    stops={result.charging_stops.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }))}
  />
</Suspense>
```

### Pin colors

| Pin | Color | Meaning |
|-----|-------|---------|
| A (origin) | Green | Trip start |
| B (destination) | Red | Trip end |
| ⚡ | Amber | EV charging station |

### Map tiles

Uses OpenStreetMap standard tiles — free, no API key. Auto-fits bounds to all markers on render.

---

## ChatWidget

**File:** `src/components/ChatWidget.tsx`
**Type:** Client component (`"use client"`)
**Purpose:** Floating chat bubble (bottom-right corner) with a rule-based EV knowledge assistant.

### How it works

1. User types a message → `POST /api/chat` with the message history
2. Server matches the message against 15+ intent patterns
3. Returns a plain string response
4. Widget displays it in a chat bubble

No LLM, no API key. Works entirely offline once the app is loaded.

### Already registered in layout

`ChatWidget` is rendered in `src/app/layout.tsx` so it appears on **every page** automatically. Do not add it again in individual pages.

### Complete intent reference

Every topic the chatbot currently handles. Check this before adding a new topic to avoid duplicates.

| Topic | Trigger keywords | What it returns |
|-------|-----------------|-----------------|
| Greeting | hi, hello, hey, good morning/afternoon | Welcome message listing all capabilities |
| Specific model range | any model name from the range table (e.g. "tesla model 3", "nissan leaf") | EPA range, type (BEV/PHEV), real-world tip |
| General range | range, how far, miles per charge | Range bands by category (budget/mid/premium/PHEV) |
| Route planning | route, trip, drive from, road trip, long drive | Trip planning tips, key WA corridors (I-5, I-90, US-2) |
| Charging cost | cost to charge, charging cost, electricity cost | WA rates ($0.10/kWh home, $0.30–0.45 public), annual savings |
| EV vs gas savings | vs gas, save money, savings, cheaper, fuel cost | $/mile comparison, 5-year savings estimate, WA tax exemption |
| Charging networks — Tesla | supercharger, tesla (within network context) | V3 speeds, non-Tesla access, pricing |
| Charging networks — ChargePoint | chargepoint | Location types, pricing, app |
| Charging networks — general | charging network, best network, evgo, blink, electrify america | All major networks compared, PlugShare tip |
| WA incentives | incentive, tax credit, rebate, exemption, wa ev program, federal credit | Sales tax exemption, HOV access, federal $7,500 credit |
| Home charging setup | home charging, level 2, charger installation, home charger, install | Level 1 vs Level 2 comparison, install cost, EVSE brands |
| Range anxiety | range anxiety, worried about range, nervous about range | Reassurance with data, planning tips |
| WA EV stats | how many ev, washington ev population, ev registered, ev stats | 285,822 total, 80% BEV, top make, top county |
| Battery care | battery health, battery life, battery care, charging habit, degradation | 80% rule, avoiding 0%, temperature tips |
| Regenerative braking | regenerative, regen braking, one-pedal | How it works, efficiency benefit, WA mountain tip |
| Utilities | puget sound energy, pse, seattle city light, scl, utility | Managed charging programs, off-peak rates |
| Dashboard data | what does this chart, what does this graph, explain this data | Directs to specific page and explains the metric |
| Fallback | anything not matched above | Lists all capabilities, asks for clarification |

### EV model range table (used by chatbot and Trip Planner)

Both `api/chat/route.ts` and `api/recommend/route.ts` maintain EPA range tables. **If you add a model to one, add it to both.**

| Model | Type | EPA Range (miles) |
|-------|------|------------------|
| Tesla Model S | BEV | 405 |
| Tesla Model 3 | BEV | 358 |
| Tesla Model Y | BEV | 330 |
| Tesla Model X | BEV | 348 |
| Rivian R1T | BEV | 314 |
| Rivian R1S | BEV | 321 |
| Ford F-150 Lightning | BEV | 320 |
| Ford Mustang Mach-E | BEV | 312 |
| Chevrolet Bolt EV | BEV | 259 |
| Hyundai IONIQ 6 | BEV | 361 |
| Hyundai IONIQ 5 | BEV | 303 |
| Kia EV6 | BEV | 310 |
| Volkswagen ID.4 | BEV | 275 |
| Nissan Leaf | BEV | 212 |
| BMW iX | BEV | 324 |
| Toyota bZ4X | BEV | 252 |
| Polestar 2 | BEV | 270 |
| Lucid Air | BEV | 516 |
| Mercedes EQS | BEV | 350 |
| Toyota Prius Prime | PHEV | 44 |
| Ford Escape PHEV | PHEV | 37 |
| Jeep Wrangler 4xe | PHEV | 21 |
| BMW 330e | PHEV | 22 |
| Kia Niro PHEV | PHEV | 26 |

### Extending the chatbot

To add a new topic, edit `src/app/api/chat/route.ts`:

1. Add a new condition in `respondToMessage(t: string)`:

```typescript
if (matchAny(t, "solar", "home charging solar", "panel")) {
  return "You can pair home EV charging with solar panels. A typical home solar setup of 5–7 kW can cover most EV charging needs in WA's milder climate...";
}
```

2. Add the keywords that should trigger it (lowercase).

3. Place it before the fallback `return defaultResponse(t)` at the bottom.

### Known topics (already handled)

- EV range by model (20+ models with exact EPA ranges)
- Charging networks (Tesla Supercharger, DCFC, ChargePoint, EVgo)
- Washington State incentives (tax exemptions, rebates)
- Home charging (Level 1 vs Level 2 speeds and costs)
- Range anxiety
- EV vs gas cost comparison
- WA electricity rates and utilities
- WA population statistics
- EV model recommendations
- Trip planning tips
- Regenerative braking
- Battery care / charging habits

---

## KpiCard

**File:** `src/components/KpiCard.tsx`
**Type:** Server-compatible (no client hooks)
**Purpose:** Displays a single metric with a label, value, and optional change indicator.

### Usage

```tsx
import KpiCard from "@/components/KpiCard";

<KpiCard
  label="Total EVs"
  value="285,822"
  change="+12.4%"
  changePositive={true}
/>
```

### Styling

Uses the standard card pattern: `rounded-xl border-l-4 border-[#00338D] bg-white p-4 shadow-sm`

---

## Sidebar

**File:** `src/components/Sidebar.tsx`
**Type:** Client component (uses `usePathname` for active state)
**Purpose:** Left navigation rail with brand header and page links.

### Adding a new page to navigation

Edit the `NAV` array:

```typescript
const NAV = [
  { href: "/",           label: "Overview",         icon: "⬛" },
  { href: "/market",     label: "Market Trends",    icon: "📈" },
  { href: "/geography",  label: "Geography",        icon: "🗺"  },
  { href: "/vehicles",   label: "Vehicle Analysis", icon: "🚗"  },
  { href: "/recommend",  label: "Trip Planner",     icon: "🧭"  },
  // Add here:
  { href: "/your-page",  label: "Your Page",        icon: "⚡"  },
];
```

### Brand colours

- Background: `#00338D` (Deloitte dark blue)
- Active item: `bg-white/20 text-white`
- Inactive item: `text-blue-200 hover:bg-white/10`

---

## data.ts

**File:** `src/lib/data.ts`
**Type:** Server-only utility (uses `fs` — do not import in client components)
**Purpose:** Single place to read JSON data files.

```typescript
import { readFileSync } from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "public", "data", "api_data");

export function readJson<T = any>(filename: string): T {
  const file = path.join(DATA_DIR, filename);
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}
```

### Usage in a server component

```typescript
// page.tsx (server component — no "use client")
import { readJson } from "@/lib/data";

const kpis = readJson<{ total_evs: number; bev_count: number }>("ev_kpis.json");
```

### Important

- Only import in server components or API route handlers
- If you need data in a client component, pass it as a prop from the server component parent, or fetch it from an API route

---

## safeJson (API route utility)

Not a component, but a critical utility in `src/app/api/recommend/route.ts` that must be copied into any new API route that calls external services.

```typescript
async function safeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${text.slice(0, 120)}`);
  }
  return res.json();
}
```

External APIs (Nominatim, OSRM, Overpass) return HTML error pages when rate-limited or misconfigured. Calling `.json()` directly on those throws a cryptic `SyntaxError: Unexpected token`. `safeJson` checks `Content-Type` first and throws a human-readable error instead.
