"use client";
import PlotlyChart from "@/components/PlotlyChart";

interface FeasData {
  companies: string[];
  pct_feasible: number[];
  total_trips: number[];
  threshold: number;
}

export default function FeasibilityCharts({ data }: { data: FeasData }) {
  const ready    = data.pct_feasible.filter(v => v >= data.threshold).length;
  const notReady = data.companies.length - ready;

  return (
    <div className="space-y-6">
      {/* Summary badges */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-3">
          <p className="text-2xl font-bold text-[#86BC25]">{ready}</p>
          <p className="text-xs text-gray-500">Companies EV-ready (≥{data.threshold}%)</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-3">
          <p className="text-2xl font-bold text-[#DA291C]">{notReady}</p>
          <p className="text-xs text-gray-500">Companies below target</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3">
          <p className="text-2xl font-bold text-[#00338D]">{data.companies.length}</p>
          <p className="text-xs text-gray-500">Total fleet companies</p>
        </div>
      </div>

      {/* Main bar chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">EV Feasibility % — All Companies</h2>
        <p className="mt-0.5 text-xs text-gray-400">Sorted by feasibility · green = meets 80% target</p>
        <div className="mt-4 h-[560px]">
          <PlotlyChart
            data={[{
              x: data.pct_feasible,
              y: data.companies,
              type: "bar",
              orientation: "h",
              text: data.pct_feasible.map(v => `${v}%`),
              textposition: "outside",
              hovertemplate: "<b>%{y}</b><br>Feasibility: %{x}%<extra></extra>",
              marker: {
                color: data.pct_feasible.map(v => v >= data.threshold ? "#86BC25" : "#DA291C"),
              },
            }]}
            layout={{
              xaxis: { title: "% of Trips Within EV Range", range: [0, 115] },
              yaxis: { automargin: true },
              shapes: [{
                type: "line", x0: data.threshold, x1: data.threshold,
                y0: 0, y1: 1, yref: "paper",
                line: { color: "#00338D", width: 2, dash: "dash" },
              }],
              annotations: [{
                x: data.threshold, y: 1.02, yref: "paper",
                text: `${data.threshold}% target`, showarrow: false,
                font: { color: "#00338D", size: 10 },
              }],
              margin: { t: 20, r: 60, b: 50, l: 200 },
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Company Detail Table</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold uppercase text-gray-500">
              <th className="pb-2 pr-4">Company</th>
              <th className="pb-2 pr-4 text-right">Total Trips</th>
              <th className="pb-2 pr-4 text-right">EV Feasibility</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.companies.map((company, i) => (
              <tr key={company} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium text-gray-800">{company}</td>
                <td className="py-2 pr-4 text-right text-gray-600">{data.total_trips[i].toLocaleString()}</td>
                <td className="py-2 pr-4 text-right font-semibold"
                    style={{ color: data.pct_feasible[i] >= data.threshold ? "#86BC25" : "#DA291C" }}>
                  {data.pct_feasible[i]}%
                </td>
                <td className="py-2">
                  {data.pct_feasible[i] >= data.threshold
                    ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">EV-Ready</span>
                    : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Below Target</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
