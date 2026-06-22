# Security Standards

Apply to all work on `ev-dashboard/`. The app is publicly deployed on Netlify and accepts user input — these rules are not optional.

---

## Gate: Before Writing Any Code That Handles User Input

User input enters the app in two places:
- Trip Planner form: `origin`, `destination`, `ev_model`, `preferences`
- Chatbot: free-text message

Any new feature that accepts input from the browser must pass all checks below.

---

## Input Validation Rules

### Every POST API route must validate inputs at the top

```typescript
export async function POST(req: Request) {
  const body = await req.json();
  const { origin, destination } = body;

  // Validate presence
  if (!origin || typeof origin !== "string") {
    return NextResponse.json({ error: "origin is required and must be a string" }, { status: 400 });
  }
  if (!destination || typeof destination !== "string") {
    return NextResponse.json({ error: "destination is required and must be a string" }, { status: 400 });
  }

  // Validate length — prevent oversized payloads
  if (origin.length > 200 || destination.length > 200) {
    return NextResponse.json({ error: "Input too long (max 200 characters)" }, { status: 400 });
  }
  // ... rest of handler
}
```

**HARD BLOCK — never pass unvalidated user input to an external API call or file path.**

### Length limits for all input fields

| Field | Max length |
|-------|-----------|
| Address / location | 200 characters |
| Chat message | 500 characters |
| Preferences / free text | 300 characters |
| Any other string input | 500 characters |

Enforce on both client (HTML `maxLength` attribute) and server (API route check).

### Do not reflect user input back as HTML

React escapes string values rendered via JSX — this is safe:
```tsx
<p>{userInput}</p>   // safe — React escapes this
```

This is NOT safe and must never be used:
```tsx
<p dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS risk — NEVER
```

**Rule: `dangerouslySetInnerHTML` is banned. If you need to render formatted text, use a whitelist-based markdown renderer.**

---

## Secrets and Environment Variables

### What must NEVER appear in source code

- API keys of any kind
- Passwords, tokens, credentials
- Internal URLs, service endpoints not intended to be public
- Personal data from test runs

### Rules for `.env.local`

- `.env.local` is gitignored — confirm with `git status` before every commit
- Variables prefixed `NEXT_PUBLIC_` are **embedded in the client bundle** and visible to anyone — only use for truly public, non-sensitive config
- Variables without `NEXT_PUBLIC_` are server-only — safe for API keys
- Every variable in `.env.local` must have a comment explaining what service it is for

### Pre-commit secrets check

Before every `git commit`, run:
```bash
git diff --staged | grep -iE "(api_key|secret|password|token|private_key)" 
```
If anything matches, stop and remove the secret before committing.

---

## Personal Data Handling

The Trip Planner receives origin and destination addresses — these are **personal location data**.

Rules:
- Do not log trip origins/destinations to any persistent store (files, databases, analytics)
- Do not include location data in error messages returned to the client
- Do not cache trip results with location identifiers
- API call logs (Nominatim, OSRM, Overpass) are made from the server — the user's IP is not exposed to those services

---

## External API Security

### Never forward raw user input to external APIs without sanitization

```typescript
// BAD — user could inject special characters into a URL
const url = `${NOMINATIM}/search?q=${userInput}`;

// GOOD — always encode
const url = `${NOMINATIM}/search?q=${encodeURIComponent(userInput)}&format=json&limit=1`;
```

**Rule: all user-supplied strings passed to external URLs must be wrapped in `encodeURIComponent()`.**

### Never expose external API responses directly to the client without shaping

```typescript
// BAD — forwards raw third-party response structure
return NextResponse.json(rawExternalApiResponse);

// GOOD — extract only what the client needs
return NextResponse.json({
  lat: data[0].lat,
  lng: data[0].lon,
  display: data[0].display_name,
});
```

---

## Next.js API Route Security

### API routes are server-only — do not import from client components

Files in `src/app/api/` run only on the server. Never import them into client components (`"use client"` files). Data flows: server → props → client, or server → API route → `fetch()` → client.

### HTTP method enforcement

Every route handler exports only the HTTP methods it supports:

```typescript
// Only allow POST — other methods automatically get 405
export async function POST(req: Request) { ... }
```

Do not export `GET`, `PUT`, `DELETE`, `PATCH` unless the route explicitly supports them.

### Request body size

Next.js defaults allow up to 1 MB request bodies. For this app, all request bodies are small JSON. Add a length check if accepting file uploads or large payloads in the future.

---

## Dependency Security

When installing a new package:
```bash
npm audit
```
Run after install. Address any **high** or **critical** severity advisories before continuing. Document any **moderate** advisories that cannot be resolved with a comment explaining why.

**HARD BLOCK — do not ship with known high/critical CVEs in direct dependencies.**

---

## Checklist — Before Merging Any Feature That Handles User Input

- [ ] All string inputs validated for type and length in the API route
- [ ] All user-supplied values passed to external URLs use `encodeURIComponent()`
- [ ] No `dangerouslySetInnerHTML` added
- [ ] No secrets or keys hardcoded — `git diff --staged` is clean
- [ ] `NEXT_PUBLIC_` prefix not used for any sensitive value
- [ ] External API responses shaped before returning to client
- [ ] `npm audit` run — no new high/critical advisories
- [ ] Location/personal data not logged or cached
