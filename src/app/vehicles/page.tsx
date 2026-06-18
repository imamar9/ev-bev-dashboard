import { readJson } from "@/lib/data";
import VehicleCharts from "./VehicleCharts";

export default function VehiclesPage() {
  const topModels       = readJson("top_models.json");
  const makeTypeBreakdown = readJson("make_type_breakdown.json");
  const rangeDist       = readJson("range_distribution.json");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Top models · BEV vs PHEV by manufacturer · electric range distribution
        </p>
      </div>
      <VehicleCharts
        topModels={topModels}
        makeTypeBreakdown={makeTypeBreakdown}
        rangeDist={rangeDist}
      />
    </div>
  );
}
