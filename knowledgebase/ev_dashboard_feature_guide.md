# EV Dashboard — Feature Development Guide

Step-by-step patterns for the four most common extension tasks.

---

## Pattern 1: Add a New Dashboard Page with Charts

### Example: Add a "Charging Infrastructure" page at `/charging`

**Step 1 — Create the page file**

```
ev-dashboard/src/app/charging/page.tsx
```

```tsx
// Server component — no "use client"
import { readJson } from "@/lib/data";
import PlotlyChart from "@/components/PlotlyChart";

export default function ChargingPage() {
  const utilityData = readJson<{ utility: string; count: number }[]>("utility_distribution.json");

  const barData = [{
    type: "bar" as const,
    x: utilityData.map((u) => u.utility),
    y: utilityData.map((u) => u.count),
    marker: { color: "#00338D" },
  }];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Charging Infrastructure</h1>
        <p className="mt-1 text-sm text-gray-500">
          Electric utility coverage across Washington State EV registrations
        </p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">EVs by Utility Provider</h2>
        <PlotlyChart
          data={barData}
          layout={{ height: 360, xaxis: { tickangle: -30 } }}
        />
      </div>
    </div>
  );
}
```

**Step 2 — Add to Sidebar navigation**

Edit `src/components/Sidebar.tsx`:

```typescript
const NAV = [
  // ... existing entries
  { href: "/charging", label: "Charging", icon: "⚡" },
];
```

**Step 3 — Verify**

```bash
npm run build   # must pass with zero errors
```

---

## Pattern 2: Add a New API Route (Data Endpoint)

### Example: Expose `utility_distribution.json` as a REST endpoint

Create `ev-dashboard/src/app/api/utility-distribution/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { readJson } from "@/lib/data";

export async function GET() {
  try {
    const data = readJson("utility_distribution.json");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read data" },
      { status: 500 }
    );
  }
}
```

The endpoint is now live at `GET /api/utility-distribution`.

### If the route calls an external API

Always use `safeJson`. Copy this pattern from `src/app/api/recommend/route.ts`:

```typescript
import { NextResponse } from "next/server";

const UA = "EV-Dashboard-Demo/1.0 (educational project)";

async function safeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${text.slice(0, 120)}`);
  }
  return res.json();
}

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://external-api.com/endpoint?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": UA },
    });
    const data = await safeJson(res);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "External API failed" },
      { status: 500 }
    );
  }
}
```

---

## Pattern 3: Add a New Chatbot Topic

The chatbot handles messages in `src/app/api/chat/route.ts` inside `respondToMessage()`.

### Step 1 — Find where to insert

Open `route.ts`. Find the section of `if/else if` blocks that handle intents. Add your new block **before** the final `return defaultResponse(t)` line:

```typescript
// Add BEFORE defaultResponse
if (matchAny(t, "solar", "solar panel", "home solar")) {
  return `You can pair home EV charging with solar panels. 
A typical 5–7 kW residential solar system in Washington can offset most or all of your EV charging costs. 
Washington averages 4.2 peak sun hours per day, making solar a viable pairing.
A Level 2 charger (7.2 kW) draws roughly 7–8 kWh for a 1-hour charge session.
Programs like PSE's Solar Choice or SCL's Green Up allow EV owners to buy renewable energy directly.`;
}
```

### Step 2 — Test in the browser

Open the chat widget and type a message containing one of your trigger words (e.g. "Tell me about solar panels for EV charging").

### Guidelines for intent handlers

- Return a `string` (no HTML, no markdown — plain text with line breaks is fine)
- Keep responses to 3–5 sentences for readability in the chat bubble
- Use `matchAny(t, "keyword1", "keyword2")` to match multiple phrasings
- Check that your keywords don't accidentally match existing intents
- Add range/price data in present tense (data may go stale)

---

## Pattern 4: Add an Interactive Feature (Client Form + API)

### Example: Add a "Range Calculator" page where the user enters a city pair and sees if their EV can make it

**Step 1 — Create the client component**

`ev-dashboard/src/app/range-check/RangeCheckClient.tsx`:

```tsx
"use client";
import { useState } from "react";

const EV_MODELS = ["Tesla Model 3", "Tesla Model Y", "Chevrolet Bolt EV", "Nissan Leaf"];

export default function RangeCheckClient() {
  const [from, setFrom]     = useState("");
  const [to, setTo]         = useState("");
  const [model, setModel]   = useState("");
  const [result, setResult] = useState<{ feasible: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/range-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input
              value={from} onChange={(e) => setFrom(e.target.value)} required
              placeholder="e.g. Seattle, WA"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <input
              value={to} onChange={(e) => setTo(e.target.value)} required
              placeholder="e.g. Spokane, WA"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">EV Model</label>
            <select
              value={model} onChange={(e) => setModel(e.target.value)} required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]"
            >
              <option value="">Select model…</option>
              {EV_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading}
          className="rounded-lg bg-[#00338D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002670] disabled:opacity-60 transition-colors">
          {loading ? "Checking…" : "Check Range"}
        </button>
      </form>

      {result && (
        <div className={`mt-6 rounded-lg p-4 ${result.feasible ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
          <p className="text-sm font-medium">{result.message}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2 — Create the page wrapper**

`ev-dashboard/src/app/range-check/page.tsx`:

```tsx
import RangeCheckClient from "./RangeCheckClient";

export default function RangeCheckPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Range Calculator</h1>
        <p className="mt-1 text-sm text-gray-500">Check if your EV can complete a trip on a single charge</p>
      </div>
      <RangeCheckClient />
    </div>
  );
}
```

**Step 3 — Create the API route**

`ev-dashboard/src/app/api/range-check/route.ts`:

```typescript
import { NextResponse } from "next/server";

const UA = "EV-Dashboard-Demo/1.0 (educational project)";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM      = "https://router.project-osrm.org";

const EV_RANGES: Record<string, number> = {
  "Tesla Model 3": 358, "Tesla Model Y": 330,
  "Chevrolet Bolt EV": 259, "Nissan Leaf": 212,
};

async function safeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    throw new Error(`Unexpected response: ${(await res.text()).slice(0, 120)}`);
  }
  return res.json();
}

export async function POST(req: Request) {
  const { from, to, model } = await req.json();
  if (!from || !to || !model) {
    return NextResponse.json({ error: "from, to, and model are required" }, { status: 400 });
  }

  try {
    const [fromRes, toRes] = await Promise.all([
      fetch(`${NOMINATIM}/search?q=${encodeURIComponent(from)}&format=json&limit=1`, { headers: { "User-Agent": UA } }),
      fetch(`${NOMINATIM}/search?q=${encodeURIComponent(to)}&format=json&limit=1`,   { headers: { "User-Agent": UA } }),
    ]);
    const [fromData, toData] = await Promise.all([safeJson(fromRes), safeJson(toRes)]) as any[][];
    if (!fromData.length) throw new Error(`Could not find: ${from}`);
    if (!toData.length)   throw new Error(`Could not find: ${to}`);

    const routeRes = await fetch(
      `${OSRM}/route/v1/driving/${fromData[0].lon},${fromData[0].lat};${toData[0].lon},${toData[0].lat}`,
      { headers: { "User-Agent": UA } }
    );
    const routeData = await safeJson(routeRes) as any;
    const distMi = routeData.routes[0].distance / 1609.34;

    const range       = EV_RANGES[model] ?? 250;
    const usableRange = range * 0.8;
    const feasible    = distMi <= usableRange;

    return NextResponse.json({
      feasible,
      message: feasible
        ? `Yes — ${distMi.toFixed(0)} miles fits within your ${model}'s ${usableRange.toFixed(0)}-mile usable range.`
        : `No — ${distMi.toFixed(0)} miles exceeds your ${model}'s ${usableRange.toFixed(0)}-mile usable range by ${(distMi - usableRange).toFixed(0)} miles. You will need at least one charging stop.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "An error occurred" }, { status: 500 });
  }
}
```

**Step 4 — Add to Sidebar and build**

```typescript
{ href: "/range-check", label: "Range Check", icon: "🔋" }
```

```bash
npm run build
```

---

## Common Gotchas

| Situation | What goes wrong | Fix |
|-----------|----------------|-----|
| Added a chart but it's a blank white box | Imported `react-plotly.js` instead of using `PlotlyChart` | Use `PlotlyChart` component |
| Text in an input field is invisible | Missing `text-gray-900 bg-white` on the input element | Add those classes |
| Map crashes with "window is not defined" | Imported `leaflet` directly without `lazy` + `useEffect` | Wrap in `lazy()` + `<Suspense>` |
| External API returns "Unexpected token '<'" | Called `.json()` on an HTML error response | Use `safeJson()` helper |
| New page not visible in nav | Forgot to add to `Sidebar.tsx` NAV array | Add the entry |
| New JSON data not showing in dashboard | Forgot to copy from `output/` to `public/data/api_data/` | Run the copy command |
| TypeScript error on `React.FormEvent` | Deprecated in React 19 | Use `{ preventDefault(): void }` instead |
| Build fails with `createReactClass` error | A new UI package uses React class components | Check the package's React 19 compatibility before installing |
