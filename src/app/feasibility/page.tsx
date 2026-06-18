import { readJson } from "@/lib/data";
import FeasibilityCharts from "./FeasibilityCharts";

export default function FeasibilityPage() {
  const data = readJson("feasibility_by_company.json");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EV Feasibility by Company</h1>
        <p className="mt-1 text-sm text-gray-500">
          Companies with ≥80% of trips within the 300-mile EV range threshold are considered EV-ready
        </p>
      </div>
      <FeasibilityCharts data={data} />
    </div>
  );
}
