interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "teal" | "red";
}

const colorMap = {
  blue:  "border-[#00338D] bg-blue-50  text-[#00338D]",
  green: "border-[#86BC25] bg-green-50 text-[#86BC25]",
  teal:  "border-[#0076A8] bg-sky-50   text-[#0076A8]",
  red:   "border-[#DA291C] bg-red-50   text-[#DA291C]",
};

export default function KpiCard({ label, value, sub, color = "blue" }: Props) {
  return (
    <div className={`rounded-xl border-l-4 p-5 shadow-sm bg-white ${colorMap[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colorMap[color].split(" ")[2]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
