import { readJson } from "@/lib/data";
import SavingsCharts from "./SavingsCharts";

export default function SavingsPage() {
  const data = readJson("cost_savings.json");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cost Savings Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Estimated fuel cost comparison if fleet vehicles switched to BEV — NY vs CA
        </p>
      </div>
      <SavingsCharts data={data} />
    </div>
  );
}
