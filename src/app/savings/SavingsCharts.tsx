"use client";
import PlotlyChart from "@/components/PlotlyChart";
import KpiCard from "@/components/KpiCard";

interface SavingsData {
  states: string[];
  gas_cost: number[];
  electric_cost: number[];
  savings: number[];
  vehicles: number[];
  trips: number[];
  savings_per_vehicle: number[];
}

export default function SavingsCharts({ data }: { data: SavingsData }) {
  const totalSavings = data.savings.reduce((a, b) => a + b, 0);
  const totalVehicles = data.vehicles.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Estimated Savings"
          value={`$${Math.round(totalSavings).toLocaleString()}`}
          sub="all states combined"
          color="green"
        />
        <KpiCard
          label="Savings per Vehicle"
          value={`$${Math.round(totalSavings / totalVehicles).toLocaleString()}`}
          sub="average across fleet"
          color="blue"
        />
        {data.states.map((state, i) => (
          <KpiCard
            key={state}
            label={`${state} Savings`}
            value={`$${Math.round(data.savings[i]).toLocaleString()}`}
            sub={`$${Math.round(data.savings_per_vehicle[i]).toLocaleString()} per vehicle`}
            color={state === "NY" ? "teal" : "blue"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gas vs Electric cost grouped bar */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Gas vs Electric Cost by State</h2>
          <p className="mt-0.5 text-xs text-gray-400">Full-year fuel cost across all vehicles in fleet</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[
                {
                  x: data.states,
                  y: data.gas_cost.map(v => v / 1000),
                  type: "bar",
                  name: "Gas Cost",
                  text: data.gas_cost.map(v => `$${Math.round(v).toLocaleString()}`),
                  textposition: "outside",
                  marker: { color: "#DA291C" },
                },
                {
                  x: data.states,
                  y: data.electric_cost.map(v => v / 1000),
                  type: "bar",
                  name: "Electric Cost",
                  text: data.electric_cost.map(v => `$${Math.round(v).toLocaleString()}`),
                  textposition: "outside",
                  marker: { color: "#86BC25" },
                },
              ]}
              layout={{
                barmode: "group",
                xaxis: { title: "State" },
                yaxis: { title: "Total Cost ($000s)" },
                legend: { orientation: "h", y: -0.25 },
                margin: { t: 30, r: 10, b: 70, l: 60 },
              }}
            />
          </div>
        </div>

        {/* Savings bar */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Estimated Annual Fuel Savings</h2>
          <p className="mt-0.5 text-xs text-gray-400">Gas cost minus electric cost if fully switched to BEV</p>
          <div className="mt-4 h-72">
            <PlotlyChart
              data={[{
                x: data.states,
                y: data.savings.map(v => v / 1000),
                type: "bar",
                text: data.savings.map((v, i) =>
                  `$${Math.round(v).toLocaleString()}<br>($${Math.round(data.savings_per_vehicle[i]).toLocaleString()}/vehicle)`
                ),
                textposition: "outside",
                marker: { color: ["#00338D", "#0076A8"] },
                hovertemplate: "<b>%{x}</b><br>Savings: $%{y:.1f}K<extra></extra>",
              }]}
              layout={{
                xaxis: { title: "State" },
                yaxis: { title: "Savings ($000s)" },
                margin: { t: 30, r: 10, b: 50, l: 60 },
              }}
            />
          </div>
        </div>
      </div>

      {/* Assumptions box */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-gray-700">
        <p className="font-semibold text-[#00338D] mb-2">Calculation Assumptions</p>
        <div className="grid grid-cols-2 gap-2 text-xs lg:grid-cols-4">
          <div><span className="font-medium">EV Efficiency:</span> 3.5 miles/kWh</div>
          <div><span className="font-medium">NY Gas:</span> $3.45/gal</div>
          <div><span className="font-medium">CA Gas:</span> $4.75/gal</div>
          <div><span className="font-medium">Charging Mix:</span> 80% home / 20% public</div>
          <div><span className="font-medium">NY Home Rate:</span> $0.22/kWh</div>
          <div><span className="font-medium">NY Public Rate:</span> $0.36/kWh</div>
          <div><span className="font-medium">CA Home Rate:</span> $0.30/kWh</div>
          <div><span className="font-medium">CA Public Rate:</span> $0.48/kWh</div>
        </div>
        <p className="mt-2 text-xs text-gray-400">Directional estimates only — not actuarial. Actual savings depend on fleet utilisation and charging behaviour.</p>
      </div>
    </div>
  );
}
