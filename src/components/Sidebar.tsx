"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",           label: "Overview",        icon: "⬛" },
  { href: "/market",     label: "Market Trends",   icon: "📈" },
  { href: "/geography",  label: "Geography",       icon: "🗺" },
  { href: "/vehicles",   label: "Vehicle Analysis",icon: "🚗" },
  { href: "/recommend",  label: "Trip Planner",    icon: "🧭" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#00338D] text-white shadow-xl">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-blue-700">
        <h1 className="mt-1 text-base font-bold leading-tight">
          BEV Fleet<br />Analytics
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-blue-700 text-xs text-blue-300">
        <p>Source: WA EV Population Registry</p>
        <p className="mt-0.5">285,822 registered EVs</p>
      </div>
    </aside>
  );
}
