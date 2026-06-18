import { readJson } from "@/lib/data";
import CatalogCharts from "./CatalogCharts";

interface EvPop {
  total_registered: number;
  type_split: { BEV?: number; PHEV?: number };
}

export default function CatalogPage() {
  const data = readJson<EvPop>("ev_population.json");
  const bevTotal  = data.type_split?.BEV  ?? 0;
  const phevTotal = data.type_split?.PHEV ?? 0;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EV Market Catalog</h1>
        <p className="mt-1 text-sm text-gray-500">
          Washington State EV registry — {data.total_registered.toLocaleString()} registered vehicles
          · {bevTotal.toLocaleString()} BEV · {phevTotal.toLocaleString()} PHEV
        </p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
  <CatalogCharts data={data as any} />
    </div>
  );
}
