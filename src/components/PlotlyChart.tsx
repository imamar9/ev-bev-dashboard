"use client";
import { useEffect, useRef, useState } from "react";

const BASE_LAYOUT = {
  paper_bgcolor: "white",
  plot_bgcolor: "#F0F4F8",
  font: { family: "Inter, sans-serif", size: 12, color: "#374151" },
  margin: { t: 30, r: 20, b: 50, l: 60 },
  legend: { bgcolor: "rgba(255,255,255,0.9)", bordercolor: "#d1d5db", borderwidth: 1 },
  xaxis: { gridcolor: "#e5e7eb", linecolor: "#d1d5db", zerolinecolor: "#d1d5db" },
  yaxis: { gridcolor: "#e5e7eb", linecolor: "#d1d5db", zerolinecolor: "#d1d5db" },
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
  className?: string;
}

export default function PlotlyChart({ data, layout = {}, config, className }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!divRef.current) return;

    const el = divRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let PlotlyLib: any = null;

    import("plotly.js/dist/plotly-basic.min.js")
      .then((mod) => {
        if (!el) return;
        // plotly.js may use default export or namespace export depending on bundler
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PlotlyLib = (mod as any).default ?? mod;

        const mergedLayout = {
          ...BASE_LAYOUT,
          ...layout,
          // Merge nested axis objects so our base grid styles aren't lost
          xaxis: { ...BASE_LAYOUT.xaxis, ...(layout.xaxis ?? {}) },
          yaxis: { ...BASE_LAYOUT.yaxis, ...(layout.yaxis ?? {}) },
          autosize: true,
        };

        return PlotlyLib.react(el, data, mergedLayout, {
          displayModeBar: false,
          responsive: true,
          ...config,
        });
      })
      .then(() => setReady(true))
      .catch(console.error);

    return () => {
      if (PlotlyLib && el) {
        try { PlotlyLib.purge(el); } catch { /* ignore */ }
      }
    };
    // data/layout are stable (come from static JSON), run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heightStyle = layout.height ? { height: layout.height } : { height: 320 };

  return (
    <div className={`relative ${className ?? "w-full"}`} style={heightStyle}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-50">
          <span className="text-xs text-gray-400 animate-pulse">Loading chart…</span>
        </div>
      )}
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
