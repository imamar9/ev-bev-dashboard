"use client";
import { useEffect, useRef } from "react";

interface Stop { name: string; lat: number; lng: number }

interface Props {
  originCoords: [number, number];
  destCoords:   [number, number];
  routeCoords:  [number, number][];
  stops:        Stop[];
}

function divIcon(color: string, label: string) {
  return `<div style="
    background:${color};
    color:white;
    width:28px;height:28px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:2px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,.4);
    display:flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:700;
  "><span style="transform:rotate(45deg)">${label}</span></div>`;
}

export default function RouteMap({ originCoords, destCoords, routeCoords, stops }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet so it only runs in the browser
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Load Leaflet CSS dynamically
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current).setView(originCoords, 10);
      mapRef.current = map;

      // OpenStreetMap tiles — free, no API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const makeIcon = (color: string, label: string) =>
        L.divIcon({ html: divIcon(color, label), className: "", iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28] });

      // Route polyline
      if (routeCoords.length > 1) {
        L.polyline(routeCoords, { color: "#00338D", weight: 4, opacity: 0.85 }).addTo(map);
      }

      // Origin marker (green)
      L.marker(originCoords, { icon: makeIcon("#86BC25", "A") })
        .addTo(map).bindPopup("<b>Origin</b>");

      // Destination marker (red)
      L.marker(destCoords, { icon: makeIcon("#DA291C", "B") })
        .addTo(map).bindPopup("<b>Destination</b>");

      // Charging stop markers (amber)
      stops.forEach((s) => {
        L.marker([s.lat, s.lng], { icon: makeIcon("#F59E0B", "⚡") })
          .addTo(map)
          .bindPopup(`<b>${s.name}</b>`);
      });

      // Fit all points in view
      const bounds =
        routeCoords.length > 1
          ? L.polyline(routeCoords).getBounds()
          : L.latLngBounds([originCoords, destCoords, ...stops.map((s) => [s.lat, s.lng] as [number, number])]);
      map.fitBounds(bounds, { padding: [30, 30] });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Run once on mount — props are stable after first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: 320, width: "100%", borderRadius: 8, zIndex: 0, position: "relative" }}
    />
  );
}
