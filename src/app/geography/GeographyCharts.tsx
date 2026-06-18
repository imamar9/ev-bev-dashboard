"use client";
import PlotlyChart from "@/components/PlotlyChart";

const BLUE  = "#00338D";
const GREEN = "#86BC25";
const TEAL  = "#0076A8";

interface Row     { [key: string]: string | number }

interface Props {
  countyDist:  Row[];
  cityDist:    Row[];
  utilityDist: Row[];
}

export default function GeographyCharts({ countyDist, cityDist, utilityDist }: Props) {
  const countyData = [{
    type: "bar" as const,
    x: countyDist.map((d) => d.count as number),
    y: countyDist.map((d) => d.county as string),
    orientation: "h" as const,
    marker: { color: BLUE },
    hovertemplate: "%{y}: %{x:,}<extra></extra>",
  }];

  const cityData = [{
    type: "bar" as const,
    x: cityDist.map((d) => d.count as number),
    y: cityDist.map((d) => d.city as string),
    orientation: "h" as const,
    marker: { color: GREEN },
    hovertemplate: "%{y}: %{x:,}<extra></extra>",
  }];

  const utilityData = [{
    type: "bar" as const,
    x: utilityDist.map((d) => d.utility as string),
    y: utilityDist.map((d) => d.count as number),
    marker: {
      color: utilityDist.map((_, i) =>
        [BLUE, GREEN, TEAL, "#DA291C", "#9333EA", "#F59E0B", "#10B981", "#EF4444", "#6366F1", "#84CC16"][i % 10]
      ),
    },
    hovertemplate: "%{x}: %{y:,}<extra></extra>",
  }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Top 15 Counties</h2>
          <p className="mb-3 text-xs text-gray-400">Counties with the most registered EVs</p>
          <PlotlyChart
            data={countyData}
            layout={{
              height: 360,
              margin: { t: 10, r: 20, b: 40, l: 100 },
              xaxis: { title: "Registrations" },
            }}
            className="h-96"
          />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Top 15 Cities</h2>
          <p className="mb-3 text-xs text-gray-400">Cities with the most registered EVs</p>
          <PlotlyChart
            data={cityData}
            layout={{
              height: 360,
              margin: { t: 10, r: 20, b: 40, l: 110 },
              xaxis: { title: "Registrations" },
            }}
            className="h-96"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">Top 10 Electric Utilities</h2>
        <p className="mb-3 text-xs text-gray-400">Which utilities serve the most registered EVs</p>
        <PlotlyChart
          data={utilityData}
          layout={{
            height: 320,
            margin: { t: 10, r: 20, b: 100, l: 60 },
            xaxis: { title: "Utility", tickangle: -35 },
            yaxis: { title: "Registrations" },
          }}
          className="h-80"
        />
      </div>
    </div>
  );
}
