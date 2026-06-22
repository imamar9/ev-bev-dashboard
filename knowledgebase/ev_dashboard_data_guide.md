# EV Dashboard — Data Pipeline & JSON Schema Reference

## Source Data

**File:** `inputs/Electric_Vehicle_Population_Data.csv`
**Source:** Washington State Department of Licensing (public dataset)
**Records:** 285,822 registered electric vehicles
**Key columns:**

| Column | Type | Description |
|--------|------|-------------|
| VIN (1-10) | string | First 10 chars of VIN |
| County | string | WA county of registration |
| City | string | City of registration |
| State | string | Always "WA" |
| Model Year | int | Vehicle model year |
| Make | string | Manufacturer (TESLA, CHEVROLET, etc.) |
| Model | string | Vehicle model name |
| Electric Vehicle Type | string | "Battery Electric Vehicle (BEV)" or "Plug-in Hybrid Electric Vehicle (PHEV)" |
| CAFV Eligibility | string | Clean Alternative Fuel Vehicle eligibility status |
| Electric Range | int | EPA-rated range in miles (0 for PHEVs) |
| Electric Utility | string | Serving utility company |

---

## Running the Pipeline

```bash
cd ev-use-case
python scripts/export_ev_population_data.py
```

Writes 19 JSON files to `output/api_data/`. Then copy to dashboard:

```bash
cp output/api_data/*.json ev-dashboard/public/data/api_data/
```

Validate before updating the dashboard:

```bash
python testscripts/validate_outputs.py
```

---

## JSON File Reference

All files live in `output/api_data/` (pipeline output) and `ev-dashboard/public/data/api_data/` (dashboard copy).

---

### ev_kpis.json
Top-level metrics. Used on the Overview page KPI cards.

```json
{
  "total_evs": 285822,
  "bev_count": 229876,
  "phev_count": 55946,
  "bev_pct": 80.4,
  "avg_bev_range": 200.1,
  "max_bev_range": 337,
  "unique_makes": 48,
  "unique_counties": 254,
  "top_make": "TESLA",
  "top_make_count": 117392
}
```

---

### ev_type_breakdown.json
BEV vs PHEV split for pie/donut chart.

```json
[
  { "label": "BEV", "value": 229876 },
  { "label": "PHEV", "value": 55946 }
]
```

---

### top_makes.json
Top 15 manufacturers by registration count. Used in bar chart.

```json
[
  { "make": "TESLA", "count": 117392 },
  { "make": "CHEVROLET", "count": 18543 },
  ...
]
```

---

### model_year_trend.json
Registration counts by model year, split by type. Used in line/area chart.

```json
[
  { "year": 2011, "bev": 45, "phev": 12, "total": 57 },
  { "year": 2012, "bev": 210, "phev": 89, "total": 299 },
  ...
]
```

---

### county_distribution.json
Top 15 WA counties by EV count. Used in horizontal bar chart.

```json
[
  { "county": "King", "count": 126543 },
  { "county": "Snohomish", "count": 28901 },
  ...
]
```

---

### city_distribution.json
Top 15 cities by EV count.

```json
[
  { "city": "Seattle", "count": 42105 },
  { "city": "Bellevue", "count": 18234 },
  ...
]
```

---

### cafv_eligibility.json
CAFV (Clean Alternative Fuel Vehicle) eligibility breakdown. Used in donut chart.

```json
[
  { "label": "Eligible", "value": 189234 },
  { "label": "Not Eligible", "value": 54321 },
  { "label": "Unknown", "value": 42267 }
]
```

---

### range_distribution.json
Distribution of EPA electric range in 20-mile bins. Used in histogram.

```json
[
  { "range_start": 0,   "range_end": 20,  "count": 1234 },
  { "range_start": 20,  "range_end": 40,  "count": 5678 },
  ...
  { "range_start": 380, "range_end": 400, "count": 890 }
]
```

---

### make_type_breakdown.json
Top 10 makes with BEV/PHEV split. Used in stacked bar chart.

```json
[
  { "make": "TESLA",     "bev": 117392, "phev": 0 },
  { "make": "BMW",       "bev": 4521,   "phev": 6789 },
  ...
]
```

---

### top_models.json
Top 15 make+model combinations.

```json
[
  { "make_model": "TESLA Model Y",    "count": 58234 },
  { "make_model": "TESLA Model 3",    "count": 41892 },
  ...
]
```

---

### utility_distribution.json
Top 10 electric utility companies serving EV owners.

```json
[
  { "utility": "PUGET SOUND ENERGY INC",  "count": 98234 },
  { "utility": "CITY OF SEATTLE - (WA)",  "count": 67891 },
  ...
]
```

---

### kpis.json
Combined KPI summary (fleet analytics + EV population).

```json
{
  "total_trips": 12500,
  "total_vehicles": 450,
  "total_companies": 38,
  "pct_trips_in_ev_range": 73.4,
  "estimated_annual_savings": 284500,
  "feasible_companies": 29,
  "ev_range_threshold": 100,
  "ev_bev_pct": 80.4,
  "ev_total_registered": 285822,
  "ev_long_range_count": 189234
}
```

---

### cost_savings.json
Cost comparison analysis.

```json
{
  "states": [...],
  "gas_cost": 45230.50,
  "electric_cost": 12890.30,
  "savings": 32340.20,
  "vehicles": 450,
  "trips": 12500,
  "savings_per_vehicle": 71.87
}
```

---

### distance_histogram.json
Trip distance distribution vs EV range threshold.

```json
{
  "bin_centers": [10, 30, 50, ...],
  "within_ev_range": [450, 890, 1200, ...],
  "beyond_ev_range": [50, 120, 200, ...],
  "threshold": 100,
  "pct_within": 73.4
}
```

---

### feasibility_by_company.json
EV conversion feasibility by company.

```json
{
  "companies": ["Company A", "Company B", ...],
  "pct_feasible": [85.2, 72.1, ...],
  "total_trips": 12500,
  "threshold": 100
}
```

---

### fleet_composition.json
Fleet vehicle breakdown.

```json
{
  "type_counts": { "Sedan": 120, "SUV": 95, ... },
  "state_counts": { "WA": 200, "OR": 50, ... },
  "companies": ["Company A", ...],
  "vehicles_count": 450
}
```

---

### monthly_volume.json
Trip volume by month.

```json
{
  "months": ["Jan", "Feb", "Mar", ...],
  "trips": [980, 1100, 1250, ...],
  "avg": 1041.7
}
```

---

### top_vehicles.json
Top vehicles by trip count.

```json
{
  "vins": ["1HGBH41JXMN109186", ...],
  "make_models": ["Toyota Camry", ...],
  "vehicle_types": ["Sedan", ...],
  "pct_feasible": [92.3, ...],
  "total_trips": [145, ...]
}
```

---

### ev_population.json
Aggregated EV population summary (combined view).

```json
{
  "range_histogram": { ... },
  "top_makes": [...],
  "top_models": [...],
  "by_year": [...],
  "top_by_range": [...],
  "county_counts": { ... },
  "type_split": { ... },
  "total_registered": 285822,
  "cafv": { ... }
}
```

---

## Adding a New Metric to the Dashboard

### Step 1 — Add the aggregation in Python

Open `scripts/export_ev_population_data.py`. Add a new section following this pattern:

```python
# New metric: top cities by average range
top_cities_range = (
    df.groupby("City")["Electric Range"]
    .mean()
    .sort_values(ascending=False)
    .head(10)
    .reset_index()
    .rename(columns={"City": "city", "Electric Range": "avg_range"})
)
top_cities_range["avg_range"] = top_cities_range["avg_range"].round(1)
output["top_cities_range"] = top_cities_range.to_dict(orient="records")
```

Then make sure it is written:

```python
write_json("top_cities_range.json", output["top_cities_range"])
```

### Step 2 — Add the validation rule

Open `testscripts/validate_outputs.py`. Add to `EXPECTED_FILES`:

```python
"top_cities_range.json": [],   # empty = just check it's a non-empty array
```

### Step 3 — Run pipeline and copy

```bash
python scripts/export_ev_population_data.py
cp output/api_data/top_cities_range.json ev-dashboard/public/data/api_data/
python testscripts/validate_outputs.py
```

### Step 4 — Use the data in a page (most common)

In any server component (`page.tsx`), call `readJson()` directly — no API route needed:

```typescript
// In any server component (page.tsx) — no "use client"
import { readJson } from "@/lib/data";

const topCitiesRange = readJson<{ city: string; avg_range: number }[]>("top_cities_range.json");
// Pass directly as props to PlotlyChart or a client component
```

This is the right approach for **all dashboard chart pages**. The data is read on the server at request time and passed as props.

### Step 4 (alternative) — Add an API route only if needed

Only create an API route if the data must be fetched **from a client component** (e.g. after a user interaction, inside a `"use client"` component that can't use `readJson()` directly).

```typescript
// ev-dashboard/src/app/api/top-cities-range/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/data";

export async function GET() {
  const data = readJson("top_cities_range.json");
  return NextResponse.json(data);
}
```

**Rule: prefer `readJson()` in server components. Only add an API route when the client component has no server-component parent to receive the data as props.**
