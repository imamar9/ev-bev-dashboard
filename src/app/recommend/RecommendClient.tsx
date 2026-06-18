"use client";
import { useState, lazy, Suspense } from "react";

// Dynamically import the Leaflet map (browser-only)
const RouteMap = lazy(() => import("@/components/RouteMap"));

const EV_MODELS = [
  "Tesla Model 3", "Tesla Model Y", "Tesla Model S", "Tesla Model X",
  "Chevrolet Bolt EV", "Ford F-150 Lightning", "Ford Mustang Mach-E",
  "Rivian R1T", "Rivian R1S", "Volkswagen ID.4",
  "Hyundai IONIQ 5", "Hyundai IONIQ 6", "Kia EV6",
  "BMW iX", "Toyota bZ4X", "Nissan Leaf",
];

interface ChargingStop { name: string; vicinity: string; lat: number; lng: number; connectors: string; num_points: number }
interface Recommendation {
  summary?: string;
  charging_plan?: string;
  range_tips?: string[];
  estimated_charging_time?: string;
  cost_estimate?: string;
  narrative?: string;
}
interface Result {
  route_info: {
    origin: string; destination: string;
    origin_coords: { lat: number; lng: number };
    dest_coords:   { lat: number; lng: number };
    distance?: string; duration?: string;
    route_coords?: [number, number][];
  };
  charging_stops: ChargingStop[];
  recommendation: Recommendation;
  error?: string;
}

export default function RecommendClient() {
  const [origin, setOrigin]           = useState("");
  const [destination, setDestination] = useState("");
  const [evModel, setEvModel]         = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<Result | null>(null);
  const [error, setError]             = useState("");
  const [geoLoading, setGeoLoading]   = useState(false);

  async function useMyLocation() {
    // Browsers block geolocation on HTTP for non-localhost origins (security policy)
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isSecure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" || host === "localhost" || host === "127.0.0.1");
    if (!isSecure) {
      setError("Location requires HTTPS. Please type your address instead (e.g. 'Seattle, WA').");
      return;
    }
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "EV-Dashboard-Demo/1.0" } }
          );
          const d = await res.json();
          setOrigin(d.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setOrigin(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setGeoLoading(false);
      },
      (err) => {
        const msg = err.code === 1
          ? "Location permission denied. Please type your address instead."
          : "Could not get your location. Please enter it manually.";
        setError(msg);
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, ev_model: evModel, preferences }),
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
    <div className="space-y-8">
      {/* ── Form ── */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Trip Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Origin */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Origin</label>
              <div className="flex gap-2">
                <input
                  value={origin} onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Seattle, WA" required
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]"
                />
                <button type="button" onClick={useMyLocation} disabled={geoLoading}
                  title="Use my location"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 hover:border-[#00338D] hover:text-[#00338D] transition-colors disabled:opacity-50">
                  {geoLoading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Destination</label>
              <input
                value={destination} onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Portland, OR" required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]"
              />
            </div>

            {/* EV Model */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">EV Model (optional)</label>
              <select value={evModel} onChange={(e) => setEvModel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]">
                <option value="">Select model…</option>
                {EV_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Preferences */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Preferences (optional)</label>
              <input value={preferences} onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. avoid highways, prefer fast chargers"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#00338D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002670] disabled:opacity-60 transition-colors">
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Planning route…
              </>
            ) : "Get Recommendation"}
          </button>
        </form>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Distance",         value: result.route_info.distance ?? "—" },
              { label: "Drive Time",       value: result.route_info.duration ?? "—" },
              { label: "Charging Stations",value: result.charging_stops.length > 0 ? result.charging_stops.length : "—" },
              { label: "Est. Charge Cost", value: result.recommendation.cost_estimate?.split(" ")[0] ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border-l-4 border-[#00338D] bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-[#00338D]">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Map */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Route Map
                <span className="ml-2 text-xs font-normal text-gray-400">© OpenStreetMap</span>
              </h3>
              {result.route_info.origin_coords && result.route_info.dest_coords ? (
                <Suspense fallback={<div className="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">Loading map…</div>}>
                  <RouteMap
                    originCoords={[result.route_info.origin_coords.lat, result.route_info.origin_coords.lng]}
                    destCoords={[result.route_info.dest_coords.lat, result.route_info.dest_coords.lng]}
                    routeCoords={result.route_info.route_coords ?? []}
                    stops={result.charging_stops.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }))}
                  />
                </Suspense>
              ) : (
                <div className="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
                  Map unavailable
                </div>
              )}
            </div>

            {/* Charging stops */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Charging Stations Near Route
                {result.charging_stops.length > 0 && (
                  <span className="ml-2 rounded-full bg-[#86BC25] px-2 py-0.5 text-xs text-white">
                    {result.charging_stops.length} found
                  </span>
                )}
              </h3>
              {result.charging_stops.length > 0 ? (
                <ul className="space-y-2 overflow-y-auto" style={{ maxHeight: 280 }}>
                  {result.charging_stops.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-xs font-bold">⚡</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="truncate text-xs text-gray-500">{s.vicinity}</p>
                        {s.connectors && <p className="text-xs text-blue-500">{s.connectors}</p>}
                        {s.num_points > 1 && <p className="text-xs text-gray-400">{s.num_points} points</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No charging stations found in the route area. Try PlugShare for comprehensive coverage.</p>
              )}
            </div>
          </div>

          {/* Narrative + Tips */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {result.recommendation.narrative && (
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Trip Recommendation</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{result.recommendation.narrative}</p>
              </div>
            )}
            <div className="space-y-4">
              {result.recommendation.range_tips && result.recommendation.range_tips.length > 0 && (
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Range Tips</h3>
                  <ul className="space-y-2">
                    {result.recommendation.range_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-[#86BC25] font-bold">✓</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.recommendation.estimated_charging_time && (
                <div className="rounded-xl border-l-4 border-[#86BC25] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Charging Time</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">{result.recommendation.estimated_charging_time}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
