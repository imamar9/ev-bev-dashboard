"use client";
import PlotlyChart from "@/components/PlotlyChart";

const BLUE  = "#00338D";
const GREEN = "#86BC25";
const TEAL  = "#0076A8";

interface YearRow { year: number; bev: number; phev: number; total: number }
interface PieRow  { label: string; value: number }

interface Props {
  modelYearTrend:  YearRow[];
  cafvEligibility: PieRow[];
}

export default function MarketCharts({ modelYearTrend, cafvEligibility }: Props) {
  const years = modelYearTrend.map((d) => d.year);

  const trendData = [
    {
      x: years, y: modelYearTrend.map((d) => d.bev),
      type: "bar" as const, name: "BEV",
      marker: { color: BLUE },
      hovertemplate: "%{x}: %{y:,} BEVs<extra></extra>",
    },
    {
      x: years, y: modelYearTrend.map((d) => d.phev),
      type: "bar" as const, name: "PHEV",
      marker: { color: GREEN },
      hovertemplate: "%{x}: %{y:,} PHEVs<extra></extra>",
    },
    {
      x: years, y: modelYearTrend.map((d) => d.total),
      type: "scatter" as const, mode: "lines+markers" as const, name: "Total",
      line: { color: TEAL, width: 2 },
      marker: { size: 5, color: TEAL },
      hovertemplate: "%{x}: %{y:,} total<extra></extra>",
    },
  ];

  const cafvData = [{
    type: "pie" as const,
    labels: cafvEligibility.map((d) => d.label),
    values: cafvEligibility.map((d) => d.value),
    hole: 0.45,
    marker: { colors: [GREEN, "#DA291C", "#9CA3AF"] },
    textinfo: "percent+label" as const,
    hovertemplate: "%{label}: %{value:,}<extra></extra>",
  }];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">EV Registrations by Model Year</h2>
        <p className="mb-3 text-xs text-gray-400">Stacked BEV + PHEV count with total trend line (2010–2026)</p>
        <PlotlyChart
          data={trendData}
          layout={{
            barmode: "stack",
            height: 360,
            margin: { t: 10, r: 20, b: 50, l: 60 },
            xaxis: { title: "Model Year", dtick: 1, tickangle: -45 },
            yaxis: { title: "Registrations" },
            legend: { orientation: "h", y: -0.25 },
          }}
          className="h-96"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">CAFV Eligibility Breakdown</h2>
          <p className="mb-3 text-xs text-gray-400">
            Clean Alternative Fuel Vehicle eligibility status across all registered EVs
          </p>
          <PlotlyChart
            data={cafvData}
            layout={{
              height: 320,
              margin: { t: 20, r: 20, b: 20, l: 20 },
              showlegend: true,
              legend: { orientation: "v" },
            }}
            className="h-80"
          />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm flex flex-col justify-center px-8">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">What is CAFV Eligibility?</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#86BC25]" />
              <div>
                <p className="font-medium text-gray-800">CAFV Eligible</p>
                <p className="text-xs text-gray-500">Battery range meets or exceeds the Clean Alternative Fuel Vehicle standard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#DA291C]" />
              <div>
                <p className="font-medium text-gray-800">Not Eligible</p>
                <p className="text-xs text-gray-500">Low battery range — typically older PHEVs that don't meet the threshold.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-gray-400" />
              <div>
                <p className="font-medium text-gray-800">Unknown</p>
                <p className="text-xs text-gray-500">Battery range has not yet been researched by the DOL.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
