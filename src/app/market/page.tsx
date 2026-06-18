import { readJson } from "@/lib/data";
import MarketCharts from "./MarketCharts";

export default function MarketPage() {
  const modelYearTrend  = readJson("model_year_trend.json");
  const cafvEligibility = readJson("cafv_eligibility.json");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Market Trends</h1>
        <p className="mt-1 text-sm text-gray-500">
          EV adoption growth by model year · CAFV eligibility breakdown
        </p>
      </div>
      <MarketCharts modelYearTrend={modelYearTrend} cafvEligibility={cafvEligibility} />
    </div>
  );
}
