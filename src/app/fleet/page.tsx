import { readJson } from "@/lib/data";
import FleetCharts from "./FleetCharts";

export default function FleetPage() {
  const data = readJson("fleet_composition.json");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vehicle type breakdown, state distribution, and vehicles per company
        </p>
      </div>
      <FleetCharts data={data} />
    </div>
  );
}
