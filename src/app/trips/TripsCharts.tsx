"use client";
import PlotlyChart from "@/components/PlotlyChart";

interface HistData  { bin_centers: number[]; within_ev_range: number[]; beyond_ev_range: number[]; threshold: number; pct_within: number; }
interface MonthlyData { months: string[]; trips: number[]; avg: number; }
interface TopVehData  { make_models: string[]; pct_feasible: number[]; vehicle_types: string[]; total_trips: number[]; }

export default function TripsCharts({
  hist, monthly, topVeh,
}: { hist: HistData; monthly: MonthlyData; topVeh: TopVehData }) {
  return (
    <div className="space-y-6">
      {/* Distance distribution — full width */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Trip Distance Distribution</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          {hist.pct_within}% of {(hist.within_ev_range.reduce((a, b) => a + b, 0) + hist.beyond_ev_range.reduce((a, b) => a + b, 0)).toLocaleString()} trips fall within the {hist.threshold}-mile EV range threshold
        </p>
        <div className="mt-4 h-80">
          <PlotlyChart
            data={[
              { x: hist.bin_centers, y: hist.within_ev_range, type: "bar", name: `Within EV range (≤${hist.threshold} mi)`, marker: { color: "#86BC25", opacity: 0.85 } },
              { x: hist.bin_centers, y: hist.beyond_ev_range, type: "bar", name: "Exceeds EV range", marker: { color: "#DA291C", opacity: 0.85 } },
            ]}
            layout={{
              barmode: "overlay",
              xaxis: { title: "Trip Distance (miles)" },
              yaxis: { title: "Number of Trips" },
              shapes: [{ type: "line", x0: hist.threshold, x1: hist.threshold, y0: 0, y1: 1, yref: "paper", line: { color: "#00338D", width: 2, dash: "dash" } }],
              annotations: [{ x: hist.threshold, y: 1, yref: "paper", text: `${hist.threshold}-mile threshold`, showarrow: false, font: { color: "#00338D", size: 10 }, xanchor: "left" }],
              legend: { orientation: "h", y: -0.18 },
              margin: { t: 10, r: 10, b: 70, l: 55 },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly volume */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Monthly Trip Volume</h2>
          <p className="mt-0.5 text-xs text-gray-400">Monthly average: {monthly.avg} trips</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[
                { x: monthly.months, y: monthly.trips, type: "bar", name: "Trips", marker: { color: "#00338D", opacity: 0.85 } },
                { x: monthly.months, y: monthly.trips, type: "scatter", mode: "lines+markers", name: "Trend", line: { color: "#86BC25", width: 2 }, marker: { size: 5 } },
              ]}
              layout={{
                xaxis: { title: "Month", tickangle: -45 },
                yaxis: { title: "Trips" },
                shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: monthly.avg, y1: monthly.avg, line: { color: "#DA291C", width: 1.5, dash: "dot" } }],
                annotations: [{ x: 1, xref: "paper", y: monthly.avg, text: `avg ${monthly.avg}`, showarrow: false, font: { color: "#DA291C", size: 9 }, xanchor: "left" }],
                legend: { orientation: "h", y: -0.3 },
                margin: { t: 10, r: 30, b: 90, l: 50 },
              }}
            />
          </div>
        </div>

        {/* Top vehicles */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Top 15 Vehicles by EV Feasibility</h2>
          <p className="mt-0.5 text-xs text-gray-400">% of each vehicle&apos;s trips within EV range (green ≥ 80%)</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[{
                x: topVeh.pct_feasible,
                y: topVeh.make_models,
                type: "bar",
                orientation: "h",
                text: topVeh.pct_feasible.map(v => `${v}%`),
                textposition: "outside",
                marker: { color: topVeh.pct_feasible.map(v => v >= 80 ? "#86BC25" : "#DA291C") },
              }]}
              layout={{
                xaxis: { title: "% Trips in EV Range", range: [0, 115] },
                shapes: [{ type: "line", x0: 80, x1: 80, y0: 0, y1: 1, yref: "paper", line: { color: "#00338D", width: 1.5, dash: "dash" } }],
                margin: { t: 10, r: 60, b: 50, l: 170 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
