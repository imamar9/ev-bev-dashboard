import KpiCard from "@/components/KpiCard";
import { readJson } from "@/lib/data";
import DashboardCharts from "./DashboardCharts";

interface Kpis {
  total_evs: number;
  bev_count: number;
  phev_count: number;
  bev_pct: number;
  avg_bev_range: number;
  max_bev_range: number;
  unique_makes: number;
  unique_counties: number;
  top_make: string;
  top_make_count: number;
}

export default function OverviewPage() {
  const kpis          = readJson<Kpis>("ev_kpis.json");
  const typeBreakdown = readJson("ev_type_breakdown.json");
  const topMakes      = readJson("top_makes.json");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EV Population Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Washington State · {kpis.total_evs.toLocaleString()} registered EVs ·{" "}
          {kpis.unique_makes} makes · {kpis.unique_counties} counties
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <KpiCard
          label="Total EVs Registered"
          value={kpis.total_evs.toLocaleString()}
          sub="Washington State"
          color="blue"
        />
        <KpiCard
          label="Battery EVs (BEV)"
          value={`${kpis.bev_pct}%`}
          sub={`${kpis.bev_count.toLocaleString()} fully electric vehicles`}
          color="green"
        />
        <KpiCard
          label="Avg BEV Range"
          value={`${kpis.avg_bev_range} mi`}
          sub={`Max: ${kpis.max_bev_range} miles`}
          color="teal"
        />
        <KpiCard
          label="Top Make"
          value={kpis.top_make}
          sub={`${kpis.top_make_count.toLocaleString()} registrations`}
          color="green"
        />
      </div>

      <DashboardCharts typeBreakdown={typeBreakdown} topMakes={topMakes} />
    </div>
  );
}
