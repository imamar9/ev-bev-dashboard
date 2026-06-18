"use client";
import PlotlyChart from "@/components/PlotlyChart";

const BLUE  = "#00338D";
const GREEN = "#86BC25";

interface ModelRow { make_model: string; count: number }
interface MakeRow  { make: string; bev: number; phev: number }
interface RangeRow { range_start: number; range_end: number; count: number }

interface Props {
  topModels:        ModelRow[];
  makeTypeBreakdown: MakeRow[];
  rangeDist:        RangeRow[];
}

export default function VehicleCharts({ topModels, makeTypeBreakdown, rangeDist }: Props) {
  const modelsData = [{
    type: "bar" as const,
    x: topModels.map((d) => d.count),
    y: topModels.map((d) => d.make_model),
    orientation: "h" as const,
    marker: { color: BLUE },
    hovertemplate: "%{y}: %{x:,}<extra></extra>",
  }];

  const makeTypeData = [
    {
      type: "bar" as const,
      name: "BEV",
      x: makeTypeBreakdown.map((d) => d.make),
      y: makeTypeBreakdown.map((d) => d.bev),
      marker: { color: BLUE },
      hovertemplate: "%{x} BEV: %{y:,}<extra></extra>",
    },
    {
      type: "bar" as const,
      name: "PHEV",
      x: makeTypeBreakdown.map((d) => d.make),
      y: makeTypeBreakdown.map((d) => d.phev),
      marker: { color: GREEN },
      hovertemplate: "%{x} PHEV: %{y:,}<extra></extra>",
    },
  ];

  const rangeBinLabels = rangeDist.map(
    (d) => `${Math.round(d.range_start)}–${Math.round(d.range_end)} mi`
  );
  const rangeData = [{
    type: "bar" as const,
    x: rangeBinLabels,
    y: rangeDist.map((d) => d.count),
    marker: { color: BLUE },
    hovertemplate: "%{x}: %{y:,} vehicles<extra></extra>",
  }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Top 15 Models</h2>
          <p className="mb-3 text-xs text-gray-400">Most registered EV models (Make + Model)</p>
          <PlotlyChart
            data={modelsData}
            layout={{
              height: 380,
              margin: { t: 10, r: 20, b: 40, l: 160 },
              xaxis: { title: "Registrations" },
            }}
            className="h-96"
          />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">BEV vs PHEV by Manufacturer</h2>
          <p className="mb-3 text-xs text-gray-400">Top 10 makes — stacked by vehicle type</p>
          <PlotlyChart
            data={makeTypeData}
            layout={{
              barmode: "stack",
              height: 380,
              margin: { t: 10, r: 20, b: 60, l: 60 },
              xaxis: { title: "Make", tickangle: -30 },
              yaxis: { title: "Registrations" },
              legend: { orientation: "h", y: -0.3 },
            }}
            className="h-96"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">BEV Electric Range Distribution</h2>
        <p className="mb-3 text-xs text-gray-400">
          Distribution of declared electric ranges for BEVs (vehicles with range &gt; 0 miles)
        </p>
        <PlotlyChart
          data={rangeData}
          layout={{
            height: 320,
            margin: { t: 10, r: 20, b: 80, l: 60 },
            xaxis: { title: "Electric Range (miles)", tickangle: -35 },
            yaxis: { title: "Number of Vehicles" },
          }}
          className="h-80"
        />
      </div>
    </div>
  );
}
