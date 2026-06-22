# EV Dashboard — Troubleshooting Guide

Every significant bug this project hit, its exact error message, root cause, and fix. Read this before spending more than 15 minutes debugging any issue.

---

## Charts

### Problem: Charts show as blank white boxes — no error in console

**Exact symptom:** `PlotlyChart` renders a white rectangle. No error. Page loads normally.

**Root cause:** `react-plotly.js` v2.6.0 internally calls `createReactClass`, which was removed in React 19. The import succeeds but the component silently fails to render.

**Fix applied:** Removed `react-plotly.js` entirely. Rewrote `PlotlyChart` to import `plotly.js/dist/plotly-basic.min.js` directly inside a `useEffect` hook:

```typescript
useEffect(() => {
  import("plotly.js/dist/plotly-basic.min.js").then((mod) => {
    const Plotly = (mod as any).default ?? mod;
    Plotly.react(el, data, mergedLayout, config);
  });
}, []);
```

**Prevention:** Never install or import `react-plotly.js`. Always use the `PlotlyChart` component in `src/components/PlotlyChart.tsx`.

---

### Problem: Build fails with `Module not found: Error: Can't resolve 'glslify'`

**Exact error:**
```
Module not found: Error: Can't resolve 'glslify'
Import trace:
  ./node_modules/plotly.js/src/...
```

**Root cause:** The full `plotly.js` source (imported as `import Plotly from "plotly.js"`) includes WebGL and GLSL shaders that require `glslify` as a build-time transform. Turbopack (Next.js 16's bundler) cannot process this.

**Fix applied:** Switch from the source import to the pre-built bundle:

```typescript
// BAD — triggers glslify
import("plotly.js")

// GOOD — pre-bundled, no glslify needed
import("plotly.js/dist/plotly-basic.min.js")
```

Also required creating `src/types/plotly.d.ts`:
```typescript
declare module "plotly.js/dist/plotly-basic.min.js";
```

**Prevention:** Always use `plotly.js/dist/plotly-basic.min.js`. Never import the source `plotly.js` package directly.

---

## API and External Services

### Problem: Trip Planner throws `Unexpected token 'Y', "You must s"... is not valid JSON`

**Exact error:**
```
SyntaxError: Unexpected token 'Y', "You must supply an API key..." is not valid JSON
```

**Root cause:** OpenChargeMap began requiring an API key for all requests. Without a key, it returns a plain text error string instead of JSON. Calling `.json()` directly on that response caused the parse error.

**Fix applied:**
1. Replaced OpenChargeMap with the Overpass API (OpenStreetMap) — fully free, no key
2. Added `safeJson()` helper that checks `Content-Type` before parsing:

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

**Prevention:** Always use `safeJson()` for every external API response. Never call `.json()` directly on a `fetch` response from a third-party service.

---

### Problem: Charging stations not showing on map — `No charging stations found`

**Exact symptom:** Trip Planner completes successfully but the charging station list is empty and no amber pins appear on the map.

**Root cause (before fix):** OpenChargeMap was silently returning an empty array or an error string when the API key was missing or the rate limit was hit. The `safeJson` fallback returned `[]` correctly, but no stations were found.

**Fix applied:** Switched data source from OpenChargeMap to the Overpass API, which queries OpenStreetMap's `amenity=charging_station` nodes — free, no key, better coverage.

```typescript
const query = `[out:json][timeout:10];node[amenity=charging_station](around:25000,${lat},${lng});out body;`;
const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
```

Searches within 25 km of 3 points: origin, midpoint, destination.

**If stations are still not showing:** The Overpass API can be slow (~3–5 sec) or temporarily down. Check `https://overpass-api.de/api/status` — if it returns an error, wait and retry.

---

## React and TypeScript Errors

### Problem: `Module not found: Can't resolve 'ai/react'`

**Exact error:**
```
Module not found: Can't resolve 'ai/react'
```

**Root cause:** The `ai` SDK v6 removed the `ai/react` subpath export and the `useChat` hook. Code written for ai v3/v4 breaks silently on upgrade.

**Fix applied:** Removed all imports from `ai/react`. Rewrote `ChatWidget` using plain React state + `fetch`:

```typescript
// Instead of useChat from ai/react:
const [messages, setMessages] = useState<Message[]>([]);
const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages }) });
```

**Prevention:** Do not use `useChat`, `useCompletion`, or any hook from `ai/react`. The chatbot uses a plain fetch-based pattern.

---

### Problem: TypeScript error on `React.FormEvent`

**Exact error:**
```
Property 'FormEvent' does not exist on type 'typeof React'
```

**Root cause:** `React.FormEvent` was deprecated and removed in React 19.

**Fix applied:**
```typescript
// BAD (React 19 throws)
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

// GOOD
async function handleSubmit(e: { preventDefault(): void }) {
```

**Prevention:** Never use `React.FormEvent`. Use `{ preventDefault(): void }` for all form submit handlers.

---

### Problem: `maxTokens is not a valid option` when calling the AI SDK

**Exact error:**
```
Error: maxTokens is not a valid option for this provider
```

**Root cause:** The `ai` SDK v6 renamed `maxTokens` to `maxOutputTokens`.

**Fix:** Use `maxOutputTokens` instead of `maxTokens` in any AI SDK call.

---

## UI and Styling

### Problem: Text in input fields is invisible (white text on white background)

**Exact symptom:** Users type into form fields but see nothing — the text is there but invisible.

**Root cause:** Tailwind CSS v4 no longer inherits text color by default for form elements. Without an explicit color, input text renders white.

**Fix applied:** Added explicit color classes to every form element:
```html
<input className="... text-gray-900 bg-white placeholder-gray-400" />
<select className="... text-gray-900 bg-white" />
```

**Prevention:** Every `<input>`, `<select>`, and `<textarea>` must have `text-gray-900 bg-white placeholder-gray-400`. This is enforced in `dashboard-standards.md` Gate 4.

---

## Geolocation

### Problem: "Use my location" button does nothing / silently fails

**Exact symptom:** Clicking the location button shows a spinner briefly then nothing happens, or shows "Could not get your location."

**Root cause:** Browsers enforce a **Secure Context** policy — `navigator.geolocation` is blocked on any HTTP origin that isn't `localhost` or `127.0.0.1`. When the app is accessed via `http://192.168.1.x:3000` (LAN IP), geolocation is silently unavailable.

**Fix applied:** Added a secure-context check before calling the geolocation API:

```typescript
const isSecure = window.location.protocol === "https:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if (!isSecure) {
  setError("Location requires HTTPS. Please type your address instead.");
  return;
}
```

**When it works:** On the deployed Netlify site (HTTPS), geolocation works normally. On `http://localhost:3000`, it works. On `http://192.168.1.x`, it is blocked by the browser — this is expected and cannot be worked around without HTTPS.

**If geolocation is still blocked on HTTPS:** The user's browser has denied location permission for the site. Fix: click the lock icon in the address bar → find Location → set to Allow → refresh.

---

## Development Server

### Problem: `⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr`

**Exact warning:**
```
⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from '192.168.1.3'
```

**Root cause:** When accessing the dev server from another device on the local network, Next.js blocks Hot Module Replacement (HMR) cross-origin requests by default.

**Fix applied:** Added the LAN IP to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.3"],
};
```

Replace `192.168.1.3` with your machine's actual LAN IP if it differs. This warning is harmless (HMR still works) but adding the origin silences it.

---

## Deployment

### Problem: Netlify deploy fails with `MissingBlobsEnvironmentError`

**Exact error:**
```
Error properties
  { name: 'MissingBlobsEnvironmentError' }
Error: Error while running build
```

**Root cause:** When running `netlify deploy --build` locally, the `@netlify/plugin-nextjs` tries to initialize Netlify Blobs storage (used for Next.js caching features). The required environment variables for Blobs only exist inside Netlify's cloud build environment, not in the local CLI.

**Fix applied:** Do not use `netlify deploy --build` for this project. Instead:
1. Push code to the `main` branch on GitHub
2. Let Netlify's cloud CI build and deploy automatically
3. Netlify's cloud environment has all required variables pre-configured

**If you must deploy manually:** Build locally first (`npm run build`), then use `netlify deploy --dir=.next --no-build`. However, this may not correctly handle server-side routes.

---

### Problem: Vercel deploy fails with HTTP 402 `Team exceeded fair use limits`

**Exact error:**
```
Error: Your Team exceeded our fair use limits and has been blocked. (402)
```

**Root cause:** The Vercel team account (`Amar Shukla's projects`) had prior usage that exceeded Vercel's free tier fair use policy.

**Fix applied:** Switched to Netlify. The app is deployed at `https://ev-bev-dashboard.netlify.app`.

**Alternative:** Use a personal Vercel account (not a team) with `npx vercel --scope personal-username`.

---

### Problem: `git push origin main` fails with `src refspec main does not match any`

**Exact error:**
```
error: src refspec main does not match any
error: failed to push some refs to 'https://github.com/...'
```

**Root cause:** `git init` creates a branch named `master` by default on older Git versions, not `main`.

**Fix:**
```bash
git branch -M main    # rename local branch to main
git push -u origin main
```

---

## Data Pipeline

### Problem: Dashboard shows stale data after running the pipeline

**Symptom:** The Python script ran successfully and `output/api_data/` has new files, but the dashboard still shows old data.

**Root cause:** The pipeline writes to `output/api_data/` but the dashboard reads from `ev-dashboard/public/data/api_data/`. These are two separate directories — changes to one do not automatically appear in the other.

**Fix:**
```bash
cp output/api_data/*.json ev-dashboard/public/data/api_data/
```

Then run the build or restart the dev server. Run `python testscripts/validate_outputs.py` to confirm both directories are in sync.

**Prevention:** The validation script checks sync status and warns if dashboard files are older than pipeline output.
