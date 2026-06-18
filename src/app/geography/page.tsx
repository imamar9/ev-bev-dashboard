import { readJson } from "@/lib/data";
import GeographyCharts from "./GeographyCharts";

export default function GeographyPage() {
  const countyDist  = readJson("county_distribution.json");
  const cityDist    = readJson("city_distribution.json");
  const utilityDist = readJson("utility_distribution.json");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Geography</h1>
        <p className="mt-1 text-sm text-gray-500">
          EV registrations by county, city, and electric utility
        </p>
      </div>
      <GeographyCharts countyDist={countyDist} cityDist={cityDist} utilityDist={utilityDist} />
    </div>
  );
}
