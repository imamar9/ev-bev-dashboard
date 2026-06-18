"use client";
import PlotlyChart from "@/components/PlotlyChart";

const BLUE  = "#00338D";
const GREEN = "#86BC25";

interface Props {
  typeBreakdown: { label: string; value: number }[];
  topMakes: { make: string; count: number }[];
}

export default function DashboardCharts({ typeBreakdown, topMakes }: Props) {
  const donutData = [{
    type: "pie" as const,
    labels: typeBreakdown.map((d) => d.label),
    values: typeBreakdown.map((d) => d.value),
    hole: 0.55,
    marker: { colors: [BLUE, GREEN] },
    textinfo: "percent+label" as const,
    hovertemplate: "%{label}: %{value:,}<extra></extra>",
  }];

  const makesData = [{
    type: "bar" as const,
    x: topMakes.map((d) => d.count),
    y: topMakes.map((d) => d.make),
    orientation: "h" as const,
    marker: { color: BLUE },
    hovertemplate: "%{y}: %{x:,}<extra></extra>",
  }];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">BEV vs PHEV Split</h2>
        <PlotlyChart
          data={donutData}
          layout={{ height: 320, margin: { t: 20, r: 20, b: 20, l: 20 }, showlegend: true }}
          className="h-80"
        />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Top 15 Makes by Registrations</h2>
        <PlotlyChart
          data={makesData}
          layout={{
            height: 320,
            margin: { t: 10, r: 20, b: 40, l: 110 },
            xaxis: { title: "Registrations" },
          }}
          className="h-80"
        />
      </div>
    </div>
  );
}
