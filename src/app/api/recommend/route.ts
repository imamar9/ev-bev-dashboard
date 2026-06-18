import { NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM      = "https://router.project-osrm.org";
const OVERPASS  = "https://overpass-api.de/api/interpreter";
const UA        = "EV-Dashboard-Demo/1.0 (educational project)";

interface Coords { lat: number; lng: number }

interface ChargingStop {
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  connectors: string;
  num_points: number;
}

// ── Safe JSON parse helper ───────────────────────────────────────────────────
async function safeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${text.slice(0, 120)}`);
  }
  return res.json();
}

// ── Free geocoding via Nominatim ─────────────────────────────────────────────
async function geocode(address: string): Promise<Coords & { display: string }> {
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const data = await safeJson(res) as Record<string, string>[];
  if (!data.length) throw new Error(`Location not found: "${address}". Try a more specific address.`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
}

// ── Free routing via OSRM ────────────────────────────────────────────────────
async function getRoute(from: Coords, to: Coords) {
  const url = `${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await safeJson(res) as any;
  if (data.code !== "Ok") throw new Error("Could not calculate route between those locations.");
  const route = data.routes[0];
  const distMi  = route.distance / 1609.34;
  const durMin  = Math.round(route.duration / 60);
  const durStr  = durMin >= 60
    ? `${Math.floor(durMin / 60)}h ${durMin % 60}m`
    : `${durMin} min`;
  // GeoJSON coords are [lng, lat] — convert to Leaflet [lat, lng]
  const coords: [number, number][] = (route.geometry.coordinates as [number, number][])
    .map(([lng, lat]) => [lat, lng]);
  return { distance: `${distMi.toFixed(1)} miles`, duration: durStr, distance_mi: distMi, duration_min: durMin, route_coords: coords };
}

// ── Free EV charging stations via Overpass API (OpenStreetMap) ──────────────
async function getChargingStations(lat: number, lng: number): Promise<ChargingStop[]> {
  // Query OSM nodes tagged amenity=charging_station within 25 km
  const query = `[out:json][timeout:10];node[amenity=charging_station](around:25000,${lat},${lng});out body;`;
  const url   = `${OVERPASS}?data=${encodeURIComponent(query)}`;
  let data: unknown;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    data = await safeJson(res);
  } catch { return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = (data as any)?.elements ?? [];
  if (!Array.isArray(elements)) return [];

  return elements.slice(0, 10).map((el: any) => {
    const t = el.tags ?? {};
    const connectorParts = [
      t["socket:tesla_supercharger"] && "Tesla SC",
      (t["socket:type2_cable"] || t["socket:type2"]) && "Type 2",
      (t["socket:ccs"] || t["socket:type2_combo"]) && "CCS",
      t["socket:chademo"] && "CHAdeMO",
      t["socket:type1"] && "J1772",
    ].filter(Boolean);

    return {
      name:       t.name || t.operator || t.brand || "EV Charging Station",
      vicinity:   [t["addr:street"], t["addr:city"] || t["addr:suburb"]].filter(Boolean).join(", "),
      lat:        el.lat  ?? 0,
      lng:        el.lon  ?? 0,
      connectors: connectorParts.join(", "),
      num_points: parseInt(t.capacity ?? t["capacity:charging"] ?? "1", 10) || 1,
    };
  });
}

// ── Template narrative (no LLM needed) ──────────────────────────────────────
const EV_RANGES: Record<string, number> = {
  "Tesla Model 3": 358, "Tesla Model Y": 330, "Tesla Model S": 405,
  "Tesla Model X": 348, "Chevrolet Bolt EV": 259, "Ford F-150 Lightning": 320,
  "Ford Mustang Mach-E": 312, "Rivian R1T": 314, "Rivian R1S": 321,
  "Hyundai IONIQ 5": 303, "Hyundai IONIQ 6": 361, "Kia EV6": 310,
  "Volkswagen ID.4": 275, "Nissan Leaf": 212, "BMW iX": 324, "Toyota bZ4X": 252,
};

function buildNarrative(
  origin: string,
  destination: string,
  distMi: number,
  durStr: string,
  stops: ChargingStop[],
  evModel: string | undefined,
  preferences: string | undefined
): Record<string, unknown> {
  const range       = evModel ? EV_RANGES[evModel] : null;
  const usableRange = range ? range * 0.8 : 200;
  const needsCharge = distMi > usableRange;
  const chargeStops = Math.ceil(distMi / usableRange) - 1;

  const summary = `${distMi.toFixed(0)}-mile trip from ${origin.split(",")[0]} to ${destination.split(",")[0]} — estimated drive time ${durStr}.`;

  const chargingPlan = needsCharge
    ? `This trip exceeds ${usableRange.toFixed(0)} miles of usable range${range ? ` (80% of your ${evModel}'s ${range}-mile range)` : ""}. Plan ${chargeStops} charging stop${chargeStops > 1 ? "s" : ""} along the way. ${stops.length > 0 ? `${stops.length} charging stations were found along your route.` : "Use PlugShare to locate stations en route."}`
    : `Great news — this trip fits comfortably within your EV's range${range ? ` (${distMi.toFixed(0)} miles vs. ${usableRange.toFixed(0)} usable miles on your ${evModel})` : ""}. You can complete it on a single charge if you start with a full battery.`;

  const rangeTips = [
    "Charge to 80% for daily use; only go to 100% before long trips to protect battery health.",
    "Pre-condition the cabin while still plugged in on cold days to maximize range.",
    "Use regenerative braking to recover energy — especially useful on mountain descents in WA.",
    needsCharge ? "Plan charging stops at 20% battery or higher — avoid letting it run to 0%." : "Highway driving reduces range by 15–25%; adjust your expectations accordingly.",
    preferences?.toLowerCase().includes("highway") ? "Eco/range mode can add 10–15% more range on highways." : "Avoid aggressive acceleration — smooth driving can extend range by up to 20%.",
  ].slice(0, 3);

  const estChargeTime = needsCharge
    ? chargeStops === 1 ? "~30–45 minutes at a DC fast charger" : `~${chargeStops * 35}–${chargeStops * 50} minutes total charging`
    : "No charging needed for this trip";

  const costEstimate = (() => {
    const kwhPer100mi = 30;
    const totalKwh = (distMi / 100) * kwhPer100mi;
    const homeCost  = (totalKwh * 0.10).toFixed(2);
    const publicCost = (totalKwh * 0.35).toFixed(2);
    return needsCharge ? `$${homeCost}–$${publicCost} (home: $${homeCost}, public fast-charge: $${publicCost})` : `~$${homeCost} if you charge at home before departure`;
  })();

  const narrative = `Your ${distMi.toFixed(0)}-mile trip from ${origin.split(",")[0]} to ${destination.split(",")[0]} is ${needsCharge ? "a longer journey that will require a charging stop" : "well within single-charge range for most modern EVs"}. ${chargingPlan}

${stops.length > 0 ? `I found ${stops.length} charging stations along your route. The nearest options include ${stops.slice(0, 2).map((s) => s.name).join(" and ")}${stops[0].connectors ? ` (connectors: ${stops[0].connectors})` : ""}.` : "No charging stations were found in the immediate search area. Use PlugShare or ABRP for comprehensive station data."}

Washington State is one of the best places to own an EV — with some of the lowest electricity rates in the US (~$0.10/kWh) and strong charging infrastructure, especially along the I-5 and I-90 corridors. ${evModel ? `Your ${evModel} should handle this route well.` : "Most modern BEVs with 250+ mile range will handle this route comfortably."}`;

  return { summary, charging_plan: chargingPlan, range_tips: rangeTips, estimated_charging_time: estChargeTime, cost_estimate: costEstimate, narrative };
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { origin, destination, ev_model, preferences } = await req.json();

  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
  }

  try {
    const [originCoords, destCoords] = await Promise.all([geocode(origin), geocode(destination)]);

    const routeData = await getRoute(originCoords, destCoords);

    const midLat = (originCoords.lat + destCoords.lat) / 2;
    const midLng = (originCoords.lng + destCoords.lng) / 2;

    const [startStops, midStops, endStops] = await Promise.all([
      getChargingStations(originCoords.lat, originCoords.lng),
      getChargingStations(midLat, midLng),
      getChargingStations(destCoords.lat, destCoords.lng),
    ]);

    const allStops = [...startStops, ...midStops, ...endStops].filter(
      (s, i, arr) =>
        s.lat !== 0 && s.lng !== 0 &&
        arr.findIndex(
          (x) => Math.abs(x.lat - s.lat) < 0.0005 && Math.abs(x.lng - s.lng) < 0.0005
        ) === i
    );

    const recommendation = buildNarrative(
      originCoords.display || origin,
      destCoords.display   || destination,
      routeData.distance_mi,
      routeData.duration,
      allStops,
      ev_model || undefined,
      preferences || undefined
    );

    return NextResponse.json({
      route_info: {
        origin,
        destination,
        origin_coords:  { lat: originCoords.lat, lng: originCoords.lng },
        dest_coords:    { lat: destCoords.lat,   lng: destCoords.lng },
        distance:       routeData.distance,
        duration:       routeData.duration,
        route_coords:   routeData.route_coords,
      },
      charging_stops: allStops,
      recommendation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An error occurred." },
      { status: 500 }
    );
  }
}
