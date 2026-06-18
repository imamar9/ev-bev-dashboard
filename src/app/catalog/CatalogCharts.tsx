"use client";
import PlotlyChart from "@/components/PlotlyChart";
import KpiCard from "@/components/KpiCard";

interface RangeHist { bin_centers: number[]; counts: number[]; threshold: number; pct_long_range: number; }
interface TopMakes  { makes: string[]; counts: number[]; }
interface TopModels { models: string[]; counts: number[]; }
interface ByYear    { years: number[]; bev: number[]; phev: number[]; }
interface TopRange  { models: string[]; ranges: number[]; }
interface TypeSplit { BEV?: number; PHEV?: number; }
interface CafvData  { ev_types: string[]; eligible: number[]; not_eligible: number[]; unknown: number[]; }

interface EVPopData {
  range_histogram: RangeHist;
  top_makes: TopMakes;
  top_models: TopModels;
  by_year: ByYear;
  top_by_range: TopRange;
  type_split: TypeSplit;
  total_registered: number;
  cafv: CafvData;
}

export default function CatalogCharts({ data }: { data: EVPopData }) {
  const { range_histogram: rh, top_makes, top_models, by_year, top_by_range, type_split, cafv } = data;
  const bevTotal  = type_split.BEV  ?? 0;
  const phevTotal = type_split.PHEV ?? 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total EV Registrations" value={data.total_registered.toLocaleString()} color="blue" />
        <KpiCard label="Battery EVs (BEV)" value={bevTotal.toLocaleString()} sub={`${((bevTotal / data.total_registered) * 100).toFixed(1)}% of fleet`} color="green" />
        <KpiCard label="Plug-in Hybrids (PHEV)" value={phevTotal.toLocaleString()} sub={`${((phevTotal / data.total_registered) * 100).toFixed(1)}% of fleet`} color="teal" />
        <KpiCard label="BEVs ≥ 200mi Range" value={`${rh.pct_long_range}%`} sub="of BEVs meet long-range threshold" color="green" />
      </div>

      {/* Range distribution + BEV vs PHEV type pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Electric Range Distribution (BEV &amp; PHEV)</h2>
          <p className="mt-0.5 text-xs text-gray-400">{rh.pct_long_range}% of BEVs exceed the {rh.threshold}-mile long-range threshold</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[{
                x: rh.bin_centers,
                y: rh.counts,
                type: "bar",
                name: "Vehicle count",
                marker: { color: "#0076A8", opacity: 0.85 },
              }]}
              layout={{
                xaxis: { title: "Electric Range (miles)" },
                yaxis: { title: "Number of Vehicles" },
                shapes: [{ type: "line", x0: rh.threshold, x1: rh.threshold, y0: 0, y1: 1, yref: "paper", line: { color: "#00338D", width: 2, dash: "dash" } }],
                annotations: [{ x: rh.threshold, y: 1.02, yref: "paper", text: `${rh.threshold}-mi threshold`, showarrow: false, font: { color: "#00338D", size: 10 } }],
                margin: { t: 20, r: 10, b: 50, l: 55 },
              }}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">BEV vs PHEV Split</h2>
          <p className="mt-0.5 text-xs text-gray-400">Full registry type breakdown</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[{
                type: "pie",
                labels: ["BEV", "PHEV"],
                values: [bevTotal, phevTotal],
                marker: { colors: ["#86BC25", "#0076A8"] },
                textinfo: "label+percent",
                hole: 0.4,
              }]}
              layout={{ showlegend: false, margin: { t: 10, r: 10, b: 10, l: 10 } }}
            />
          </div>
        </div>
      </div>

      {/* Growth by year */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">EV Registrations by Model Year</h2>
        <p className="mt-0.5 text-xs text-gray-400">Growth in EV adoption since 2010</p>
        <div className="mt-4 h-72">
          <PlotlyChart
            data={[
              { x: by_year.years, y: by_year.bev,  type: "bar", name: "BEV",  marker: { color: "#86BC25" } },
              { x: by_year.years, y: by_year.phev, type: "bar", name: "PHEV", marker: { color: "#0076A8" } },
              {
                x: by_year.years,
                y: by_year.bev.map((v, i) => v + by_year.phev[i]),
                type: "scatter", mode: "lines+markers", name: "Total",
                line: { color: "#00338D", width: 2 }, marker: { size: 5 },
              },
            ]}
            layout={{
              barmode: "stack",
              xaxis: { title: "Model Year", tickangle: -45, dtick: 1 },
              yaxis: { title: "Registrations" },
              legend: { orientation: "h", y: -0.25 },
              margin: { t: 10, r: 10, b: 80, l: 60 },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top makes */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Top 15 Makes by Registrations</h2>
          <div className="mt-4 h-80">
            <PlotlyChart
              data={[{
                x: top_makes.counts,
                y: top_makes.makes,
                type: "bar",
                orientation: "h",
                text: top_makes.counts.map(v => v.toLocaleString()),
                textposition: "outside",
                marker: { color: top_makes.makes.map(m => m === "TESLA" ? "#00338D" : "#86BC25") },
              }]}
              layout={{
                xaxis: { title: "Registrations" },
                yaxis: { automargin: true },
                margin: { t: 10, r: 70, b: 50, l: 100 },
              }}
            />
          </div>
        </div>

        {/* Top models by range */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Top 15 BEV Models by Electric Range</h2>
          <p className="mt-0.5 text-xs text-gray-400">Sorted by max range — use to recommend EV replacements</p>
          <div className="mt-4 h-80">
            <PlotlyChart
              data={[{
                x: top_by_range.ranges,
                y: top_by_range.models,
                type: "bar",
                orientation: "h",
                text: top_by_range.ranges.map(v => `${v} mi`),
                textposition: "outside",
                marker: { color: top_by_range.ranges.map(v => v >= rh.threshold ? "#86BC25" : "#DA291C") },
              }]}
              layout={{
                xaxis: { title: "Max Electric Range (miles)", range: [0, Math.max(...top_by_range.ranges) * 1.15] },
                yaxis: { automargin: true },
                shapes: [{ type: "line", x0: rh.threshold, x1: rh.threshold, y0: 0, y1: 1, yref: "paper", line: { color: "#00338D", width: 1.5, dash: "dash" } }],
                margin: { t: 10, r: 70, b: 50, l: 160 },
              }}
            />
          </div>
        </div>
      </div>

      {/* CAFV eligibility */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">CAFV Eligibility by EV Type</h2>
        <p className="mt-0.5 text-xs text-gray-400">Clean Alternative Fuel Vehicle state incentive eligibility</p>
        <div className="mt-4 h-72">
          <PlotlyChart
            data={[
              { x: cafv.ev_types, y: cafv.eligible,     type: "bar", name: "Eligible",     marker: { color: "#86BC25" } },
              { x: cafv.ev_types, y: cafv.not_eligible, type: "bar", name: "Not Eligible", marker: { color: "#DA291C" } },
              { x: cafv.ev_types, y: cafv.unknown,      type: "bar", name: "Unknown",      marker: { color: "#A7A9AC" } },
            ]}
            layout={{
              barmode: "stack",
              xaxis: { title: "EV Type" },
              yaxis: { title: "Number of Vehicles" },
              legend: { orientation: "h", y: -0.25 },
              margin: { t: 10, r: 10, b: 70, l: 70 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
