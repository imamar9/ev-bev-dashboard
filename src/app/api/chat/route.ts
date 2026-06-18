import { NextResponse } from "next/server";

// ── EV range table (miles) ───────────────────────────────────────────────────
const MODEL_RANGE: Record<string, { range: number; type: string }> = {
  "tesla model s":        { range: 405, type: "BEV" },
  "tesla model 3":        { range: 358, type: "BEV" },
  "tesla model y":        { range: 330, type: "BEV" },
  "tesla model x":        { range: 348, type: "BEV" },
  "rivian r1t":           { range: 314, type: "BEV" },
  "rivian r1s":           { range: 321, type: "BEV" },
  "ford f-150 lightning": { range: 320, type: "BEV" },
  "ford mustang mach-e":  { range: 312, type: "BEV" },
  "chevrolet bolt ev":    { range: 259, type: "BEV" },
  "hyundai ioniq 6":      { range: 361, type: "BEV" },
  "hyundai ioniq 5":      { range: 303, type: "BEV" },
  "kia ev6":              { range: 310, type: "BEV" },
  "volkswagen id.4":      { range: 275, type: "BEV" },
  "nissan leaf":          { range: 212, type: "BEV" },
  "bmw ix":               { range: 324, type: "BEV" },
  "toyota bz4x":          { range: 252, type: "BEV" },
  "polestar 2":           { range: 270, type: "BEV" },
  "lucid air":            { range: 516, type: "BEV" },
  "mercedes eqs":         { range: 350, type: "BEV" },
  "toyota prius prime":   { range: 44,  type: "PHEV" },
  "ford escape phev":     { range: 37,  type: "PHEV" },
  "jeep wrangler 4xe":    { range: 21,  type: "PHEV" },
  "bmw 330e":             { range: 22,  type: "PHEV" },
  "kia niro phev":        { range: 26,  type: "PHEV" },
};

// ── Intent patterns → response builders ─────────────────────────────────────
type Response = string;

function matchAny(text: string, ...words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function respondToMessage(userText: string): Response {
  const t = userText.toLowerCase().trim();

  // ── Greetings ──────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|sup)\b/.test(t)) {
    return `Hi there! I'm your EV assistant for Washington State. I can help with:

• Route & trip planning for EVs
• Charging stations and networks
• WA state EV incentives
• EV model comparisons and range info
• Cost savings vs gas
• Dashboard data explanations

What would you like to know?`;
  }

  // ── Specific model range lookup ─────────────────────────────────────────────
  for (const [model, info] of Object.entries(MODEL_RANGE)) {
    if (t.includes(model)) {
      return `The ${model.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} (${info.type}) has a rated range of up to ${info.range} miles per charge.

Real-world range is typically 10–20% lower at highway speeds or in cold weather. For long trips, plan to charge when the battery reaches ~20% to protect battery health.`;
    }
  }

  // ── Range — general ────────────────────────────────────────────────────────
  if (matchAny(t, "range", "how far", "miles per charge", "how many miles")) {
    return `Modern BEV ranges (2024 models):

• Budget BEVs (Bolt, Leaf): 200–260 miles
• Mid-range (Model 3, Kia EV6, Ioniq 5): 270–360 miles
• Long-range/premium (Model S, Lucid Air): 350–500+ miles
• PHEVs (electric-only): 20–50 miles

Real-world range is typically 10–20% less than rated. Cold weather and highway speeds reduce range most. Want the range for a specific model?`;
  }

  // ── Route planning ─────────────────────────────────────────────────────────
  if (matchAny(t, "route", "trip", "drive from", "travel from", "going from", "road trip", "long drive")) {
    return `For EV trip planning in WA, use the Trip Planner page (🧭 in the sidebar). Here are general tips:

1. Plan charging stops every 150–200 miles (don't let battery drop below 20%)
2. Use PlugShare or A Better Route Planner (ABRP) for detailed EV routing
3. Tesla owners: use the built-in navigation — it auto-plans Supercharger stops
4. Non-Tesla: ChargePoint and EVgo have good coverage on I-5 and I-90 corridors

Key WA charging corridors:
• I-5 (Seattle to Portland): excellent coverage
• I-90 (Seattle to Spokane): good, but plan stops carefully east of Ellensburg
• US-2 (Stevens Pass): limited — check stations before departing`;
  }

  // ── Charging cost ──────────────────────────────────────────────────────────
  if (matchAny(t, "cost to charge", "charging cost", "how much to charge", "price to charge", "electricity cost", "cost of charging")) {
    return `Charging costs in Washington State:

Home charging (Level 2):
• WA average rate: ~$0.10/kWh (one of the lowest in the US)
• Cost per mile: ~$0.03–0.04 (vs $0.12–0.15 for gas)
• Full charge (75 kWh battery): ~$7.50

Public fast charging (DC Fast/Level 3):
• ChargePoint: ~$0.30–0.45/kWh
• EVgo: ~$0.25–0.40/kWh
• Tesla Supercharger: ~$0.25–0.35/kWh

Annual savings estimate: switching from a 25 mpg gas car to a BEV in WA saves roughly $1,000–1,500/year on fuel.`;
  }

  // ── EV vs gas savings ──────────────────────────────────────────────────────
  if (matchAny(t, "vs gas", "gas vs", "save money", "savings", "cheaper", "fuel cost", "running cost", "cost comparison")) {
    return `EV vs gas cost comparison in WA:

Fuel cost per mile:
• Gas car (25 mpg, $3.50/gal): ~$0.14/mile
• BEV (home charging, $0.10/kWh): ~$0.03–0.04/mile

Savings: ~$0.10/mile — that's $1,500/year at 15,000 miles/year.

Additional EV savings:
• No oil changes (~$150–250/year)
• Fewer brake replacements (regenerative braking)
• WA sales tax exemption on qualifying EVs (saves $2,000–4,500 on purchase)

Total 5-year savings over a comparable gas vehicle: often $8,000–15,000.`;
  }

  // ── Charging networks ──────────────────────────────────────────────────────
  if (matchAny(t, "charging network", "best network", "which network", "chargepoint", "evgo", "supercharger", "blink", "electrify america")) {
    if (t.includes("supercharger") || t.includes("tesla")) {
      return `Tesla Supercharger network:
• Largest fast-charging network in WA by speed and reliability
• V3 Superchargers: up to 250 kW (adds ~200 miles in 15 min)
• Now open to non-Tesla vehicles (with CCS adapter)
• Cost: ~$0.25–0.35/kWh for non-Tesla, slightly less for Tesla owners

Best for: Tesla owners, or any CCS vehicle needing reliable fast charging.`;
    }
    if (t.includes("chargepoint")) {
      return `ChargePoint:
• Largest network by number of locations in WA
• Mix of Level 2 (workplaces, parking) and DC fast chargers
• Cost: ~$0.30–0.45/kWh for DC fast charging
• App: excellent, shows real-time availability

Best for: workplace/destination charging and urban areas.`;
    }
    return `Major charging networks in Washington State:

Fast charging (DC/Level 3):
• Tesla Supercharger — fastest, most reliable, now open to all
• EVgo — good urban coverage, frequently found at Walmart/Meijer
• Electrify America — located at Walmart stores, solid WA highway coverage
• ChargePoint — largest number of locations, mix of speeds

Level 2 (slower, good for overnight/workplace):
• ChargePoint — most common in parking garages and workplaces
• Blink — widely available but check reviews (reliability varies)

Tip: Use PlugShare (free app) to see real-time availability and reviews for any network.`;
  }

  // ── WA incentives ──────────────────────────────────────────────────────────
  if (matchAny(t, "incentive", "tax credit", "rebate", "discount", "exemption", "washington ev", "wa ev program", "federal credit")) {
    return `Washington State EV incentives:

State incentives:
• Sales tax exemption: EVs under $45,000 MSRP — saves $2,500–4,500 at purchase
• HOV lane access: EVs can use HOV lanes with only 1 occupant (requires WA EV license plate)
• Utility rebates: Many WA utilities (Puget Sound Energy, Seattle City Light) offer $500–3,000 for home charger installation

Federal incentive (IRA 2022):
• Up to $7,500 tax credit for new EVs (income and price limits apply)
• Up to $4,000 for used EVs
• New: can be applied as point-of-sale discount at dealerships (2024+)

Combined potential savings: $10,000–15,000 off purchase price when incentives stack.`;
  }

  // ── Home charging ──────────────────────────────────────────────────────────
  if (matchAny(t, "home charg", "level 2", "240v", "charger install", "home install", "garage charg", "wallbox", "chargepoint home")) {
    return `Home charging setup:

Level 1 (standard outlet, 120V):
• Adds ~4–5 miles per hour — fine for PHEVs or short daily drives
• No installation needed

Level 2 (240V, recommended for BEVs):
• Adds ~25–30 miles per hour — full charge overnight
• Cost: $400–900 for the charger unit + $200–800 for installation
• Popular brands: ChargePoint Home Flex, Emporia, Tesla Wall Connector, JuiceBox

Installation tips:
• Have a licensed electrician install a dedicated 50-amp 240V circuit
• Check with your WA utility for rebates (Puget Sound Energy offers up to $500)
• Most BEV owners find Level 2 home charging covers 90%+ of their needs`;
  }

  // ── Range anxiety ──────────────────────────────────────────────────────────
  if (matchAny(t, "range anxiety", "run out", "stranded", "dead battery", "out of charge", "worry", "scared")) {
    return `Range anxiety is very common with new EV owners — and it almost always goes away within a few months! Here's why:

The math in WA:
• Average American drives 37 miles/day
• Even the shortest-range BEVs (Nissan Leaf: 212 miles) cover 5+ average days
• 90% of EV owners charge at home and wake up to a "full tank" every morning

Practical tips to ease anxiety:
• Set a departure charge limit to 80% daily (preserves battery health), only go to 100% before long trips
• Learn 2–3 fast chargers near your regular routes as "backup"
• Use PlugShare or ABRP for trip planning
• Don't obsess over the battery percentage — most EVs have a buffer below 0%

Bottom line: for daily WA driving, range anxiety is rarely a real problem.`;
  }

  // ── Charging station finder ─────────────────────────────────────────────────
  if (matchAny(t, "find charg", "where to charge", "nearest charg", "nearby charg", "charging station near", "where can i charge")) {
    return `Ways to find charging stations in WA:

Apps (free):
• PlugShare — best community-reviewed map, real-time check-ins
• ChargePoint app — great for ChargePoint network stations
• A Better Route Planner (ABRP) — best for trip planning with charging stops

Built-in navigation:
• Tesla: auto-plans Supercharger stops based on remaining range
• Most 2022+ EVs: have built-in charging maps (Google Maps/Here Maps)

On the Trip Planner page (🧭 in the sidebar), you can enter your route and see charging stations along the way using real-time data.`;
  }

  // ── WA EV population data ──────────────────────────────────────────────────
  if (matchAny(t, "how many ev", "washington ev", "wa ev", "registered ev", "ev population", "ev data", "ev market")) {
    return `Washington State EV statistics (from this dashboard's dataset):

Total registered EVs: 285,822
• BEV (fully electric): 229,876 (80.4%)
• PHEV (plug-in hybrid): 55,946 (19.6%)

Top counties: King (140,181), Snohomish (35,806), Pierce (23,596)
Top makes: Tesla (117,392), Chevrolet (19,677), Nissan (16,121), Ford (15,639), Kia (14,328)

WA has the 2nd-highest EV adoption rate in the US (after California), driven by low electricity rates, strong incentives, and tech-savvy population.

Explore the full data on the Overview and Market Trends pages.`;
  }

  // ── EV recommendation ──────────────────────────────────────────────────────
  if (matchAny(t, "recommend", "best ev", "which ev", "should i buy", "first ev", "new ev", "what ev", "suggest")) {
    return `Top EV picks by use case:

Best overall value: Chevrolet Bolt EV (~$27K after incentives, 259 mi range)
Best long range: Tesla Model 3 Long Range (358 mi, supercharger access)
Best for families: Tesla Model Y or Kia EV6 (space + range)
Best truck: Ford F-150 Lightning (320 mi, useful for towing)
Best luxury: BMW iX or Mercedes EQS
Most affordable PHEV: Toyota Prius Prime (44 mi electric, ~$30K)

For WA specifically, any Tesla benefits most from the Supercharger network. Non-Tesla vehicles do well too given ChargePoint/EVgo/Electrify America coverage.

Tip: Use the Vehicle Analysis page to see what WA drivers are actually buying.`;
  }

  // ── Utilities / electricity rate ───────────────────────────────────────────
  if (matchAny(t, "utility", "electricity rate", "puget", "seattle city light", "snohomish", "pse", "pacificorp", "rate")) {
    return `Washington State electricity rates for EV charging:

Major WA utilities serving EV owners:
• Seattle City Light: ~$0.10/kWh (among the cheapest in the nation — mostly hydro)
• Puget Sound Energy (PSE): ~$0.10–0.12/kWh + EV Time-of-Use rates
• Snohomish PUD: ~$0.09/kWh
• Tacoma Public Utilities: ~$0.08–0.10/kWh

WA's low rates are largely due to abundant hydroelectric power — great for EV owners.

PSE and Snohomish PUD offer EV-specific Time-of-Use rates: charge off-peak (11pm–6am) and pay as little as $0.06/kWh.

Annual home charging cost at WA rates: ~$400–600 for a typical BEV (vs $2,000+ for gas).`;
  }

  // ── Dashboard explanation ──────────────────────────────────────────────────
  if (matchAny(t, "dashboard", "chart", "visualization", "page", "what does", "explain", "how to read")) {
    return `This dashboard shows Washington State EV population data (285,822 vehicles). Here's what each page shows:

• Overview — total EV counts, BEV vs PHEV split, top manufacturers
• Market Trends — EV adoption growth by model year (2010–2026), CAFV eligibility
• Geography — EV registrations by county, city, and electric utility
• Vehicle Analysis — top models, BEV vs PHEV by brand, range distribution
• Trip Planner (🧭) — enter a trip to get charging station recommendations and a route map

Is there a specific chart or number you'd like me to explain?`;
  }

  // ── Thanks / goodbye ───────────────────────────────────────────────────────
  if (matchAny(t, "thank", "thanks", "great", "perfect", "bye", "goodbye", "that helps")) {
    return `Happy to help! Feel free to ask anytime — whether it's about EV ranges, charging costs, WA incentives, or planning a road trip. Safe travels! ⚡`;
  }

  // ── Default fallback ───────────────────────────────────────────────────────
  return `I can help with EV topics like:

• Range and model comparisons (e.g. "How far does a Tesla Model Y go?")
• Charging networks and costs (e.g. "Which charging network is best?")
• WA state incentives (e.g. "What tax credits are available?")
• Trip planning tips (e.g. "How do I plan a long EV road trip?")
• Cost vs gas comparisons
• Dashboard data explanations

Try asking one of the above, or use the Trip Planner page (🧭) for route-specific advice!`;
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const userText = typeof lastMessage?.content === "string" ? lastMessage.content : "";
  const content = respondToMessage(userText);
  return NextResponse.json({ content });
}
