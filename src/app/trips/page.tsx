import { readJson } from "@/lib/data";
import TripsCharts from "./TripsCharts";

export default function TripsPage() {
  const hist    = readJson("distance_histogram.json");
  const monthly = readJson("monthly_volume.json");
  const topVeh  = readJson("top_vehicles.json");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trip Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Telematics data — trip distance, monthly patterns, and top EV-feasible vehicles
        </p>
      </div>
      <TripsCharts hist={hist} monthly={monthly} topVeh={topVeh} />
    </div>
  );
}
