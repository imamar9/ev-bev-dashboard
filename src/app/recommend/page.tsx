import RecommendClient from "./RecommendClient";

export default function RecommendPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EV Trip Planner</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your trip details — get AI-powered route, charging, and amenity recommendations
        </p>
      </div>
      <RecommendClient />
    </div>
  );
}
