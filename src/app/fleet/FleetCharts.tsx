"use client";
import PlotlyChart from "@/components/PlotlyChart";

interface FleetData {
  type_counts: Record<string, number>;
  state_counts: Record<string, number>;
  companies: string[];
  vehicles_count: number[];
}

export default function FleetCharts({ data }: { data: FleetData }) {
  const typeLabels  = Object.keys(data.type_counts);
  const typeValues  = Object.values(data.type_counts);
  const stateLabels = Object.keys(data.state_counts);
  const stateValues = Object.values(data.state_counts);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vehicle type pie */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Fleet Composition by Vehicle Type</h2>
          <p className="mt-0.5 text-xs text-gray-400">Current ICE / Hybrid breakdown</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[{
                type: "pie",
                labels: typeLabels,
                values: typeValues,
                marker: { colors: ["#00338D", "#86BC25", "#0076A8", "#A7A9AC"] },
                textinfo: "label+percent",
                hovertemplate: "<b>%{label}</b><br>Count: %{value}<br>Share: %{percent}<extra></extra>",
                hole: 0.35,
              }]}
              layout={{ showlegend: true, legend: { orientation: "h", y: -0.15 }, margin: { t: 10, r: 10, b: 40, l: 10 } }}
            />
          </div>
        </div>

        {/* State distribution pie */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Fleet Distribution by State</h2>
          <p className="mt-0.5 text-xs text-gray-400">Vehicles across NY and CA</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[{
                type: "pie",
                labels: stateLabels,
                values: stateValues,
                marker: { colors: ["#0076A8", "#86BC25"] },
                textinfo: "label+percent+value",
                hole: 0.35,
              }]}
              layout={{ showlegend: true, legend: { orientation: "h", y: -0.15 }, margin: { t: 10, r: 10, b: 40, l: 10 } }}
            />
          </div>
        </div>
      </div>

      {/* Vehicles per company — full width */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Vehicles per Company</h2>
        <p className="mt-0.5 text-xs text-gray-400">Top 20 fleet companies by vehicle count</p>
        <div className="mt-4 h-96">
          <PlotlyChart
            data={[{
              x: data.vehicles_count,
              y: data.companies,
              type: "bar",
              orientation: "h",
              text: data.vehicles_count.map(v => `${v}`),
              textposition: "outside",
              marker: { color: "#0076A8" },
              hovertemplate: "<b>%{y}</b><br>Vehicles: %{x}<extra></extra>",
            }]}
            layout={{
              xaxis: { title: "Number of Vehicles" },
              yaxis: { automargin: true },
              margin: { t: 10, r: 50, b: 50, l: 200 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
