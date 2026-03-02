# SmartRoute Vision

**Dynamic waste fleet optimization from bin fill-level sensors + Geotab telematics.**

## Who Is This For? (Sensor Assumption)

**Reality:** Many waste fleets don't have Bigbelly/Sensoneo yet. Sensors cost money; managers need to justify ROI before investing.

**Our stance:** SmartRoute delivers value **with or without** smart bins. We're not dependent on a specific vendor.

| Scenario | What they have | What we offer | Value |
|----------|----------------|---------------|-------|
| **No sensors** | Geotab only (routes, zones, trips, vehicles) | Route sequence optimization (same stops, better order) | 10–15% fuel/time savings immediately |
| **No sensors** | Geotab + driver feedback | "Driver reports bin empty" → we learn patterns over time | Build fill history from actual collections |
| **Planning sensors** | Geotab, evaluating vendors | Prove ROI first: optimize existing routes, show savings | Justify sensor investment with numbers |
| **Partial sensors** | Some bins smart, some not | Hybrid: use sensor data where available, infer elsewhere | Gradual rollout, no big-bang |
| **Full sensors** | Bigbelly/Sensoneo everywhere | Threshold-based skip logic, real-time optimization | 20–40% savings (Sensoneo case studies) |

**Pitch:** "Start optimizing today with Geotab. Add sensors when you're ready—we're built for both."

**Why this matters for adoption:**
- Sensor vendors (Bigbelly, Sensoneo) sell hardware + software. Fleets often resist: "Why lock into one vendor?"
- SmartRoute is **sensor-agnostic**. We consume fill data from any source (API, driver, history). Geotab is the fleet system of record.
- **Geotab-first** = we fit into how fleets already work. Routes, zones, vehicles, trips—all in Geotab. We add intelligence on top.
- **Low barrier to entry** = no upfront sensor cost. Prove value with route optimization alone. Upgrade when ready.

---

## Core Flow (Current → Target)

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────┐
│ Route + Bins    │ ──► │ Our Algo     │ ──► │ Updated Route       │
│ (from Geotab)   │     │ (threshold,  │     │ (fewer stops)        │
│                 │     │  closures…)  │     │ write back to DB     │
└─────────────────┘     └──────────────┘     └─────────────────────┘
```

**Input:** Route with stops (Zones) + bin status per stop --> bin status will be mocked and suggested as one of the things they should track? 
**Algo:** Decides which stops to skip (empty bins, road closures, construction, etc.) --> google api, gemini api --> good space to explore possible google integrations   
**Output:** Updated route with fewer stops → write back to Geotab + update the ui 

ui --

1. route optimization page 
2. predictive section
3. dashboard

## User Value Props (Fleet Manager) [achieved by dashboard amd would also govern the algorithm]

### Operational Intelligence
2. **Bin hotspots** – Identify which bins consistently fill fastest → suggest more frequent collection or larger bins
3. **Exception alerts** – Integrate with ExceptionEvent (harsh braking, speeding) to flag risky collection behavior --> how can we do this? 
4. **Maintenance predictions** – Correlate vehicle FaultData with routes; predict which trucks need service --> can we mock? 

### Cost Tracking
5. **Fuel cost per route** – Use FuelTransaction from Geotab to show actual fuel spend per optimized vs. original route
6. **Labor cost savings** – Hours saved × hourly rate = $ saved
7. **Vehicle utilization** – Show which trucks are underutilized using DeviceStatusInfo (idle time) + Trip data

### Compliance & Reporting
8. **Audit trail** – Every collection logged in AddInData = proof of service for billing/compliance
9. **Route compliance** – Compare actual path (LogRecord GPS) vs. planned route to flag deviations
10. **Environmental reporting** – CO₂ saved → ESG/sustainability reports for city contracts

## Skip Reasons (Future)

| Reason        | Source                    | How we know                    |
|---------------|---------------------------|--------------------------------|
| Empty bins    | Bin sensors / AddInData   | fillLevel < threshold          |
| Road closure  | External API / manual     | User input or traffic API      |
| Construction  | External API / manual     | User input or city data        |
| Already full  | Bin sensors              | fillLevel > 95% (skip today)   |

## Bin Status: Where Does fillLevel Come From?

When sensors don't exist, we still need something to drive "skip this stop" decisions:

| Source | How it works | Pros | Cons |
|--------|--------------|------|------|
| **Sensors (Bigbelly, Sensoneo)** | API returns fill % per bin | Real-time, accurate | Cost, deployment |
| **Driver feedback** | Driver taps "empty" / "half" / "full" at each stop | No hardware, builds history | Manual, depends on compliance |
| **Historical inference** | collection_log: "last collected 5 days ago at 30%" → estimate fill rate | Uses data we already collect | Needs 2–4 weeks of logs to be useful |
| **Manual override** | Manager marks "skip Zone X this week" (construction, etc.) | Simple, flexible | One-off, not predictive |
| **Mocked (demo)** | Random fill % for hackathon | Proves the flow works | Not production |

**Recommendation for fleets without sensors:** Start with driver feedback. Add a "Log collection" flow: driver reports fill % at each stop. Over 4–6 weeks, we have enough history to predict "Zone X fills ~15%/day" and suggest skip days. No hardware required.

## Phases

### Phase 1 (Current)
- [x] Load bins from Geotab Zones + RoutePlanItems
- [x] Threshold slider → skip low-fill bins
- [x] Nearest-neighbor + 2-opt optimization
- [x] Write new Route to Geotab
- [x] AddInData for bin_state, collection_log

### Phase 2 (Next)
- [ ] **Update existing route** instead of always creating new
- [ ] Road closure / construction input (manual or API)
- [ ] Bin status from real sensors (Sensoneo/Bigbelly proxy)

### Phase 3 (Predictive)
- [ ] Predict fill levels from history
- [ ] Suggest future schedules (e.g. “skip Tuesdays for Zone X”)
- [ ] Manager dashboard: recommended collection days per zone

### Phase 4 (Metrics Dashboard)
- [ ] **Fuel savings** – km saved × fuel rate; use FuelTransaction for actual cost
- [ ] **Hours saved** – stops × avg time per stop
- [ ] **CO2 avoided** – fuel saved × CO₂ per liter
- [ ] **Dashboard: daily/weekly/monthly totals**
  - Trend charts (Chart.js)
  - Driver leaderboard (fastest routes, most bins collected)
  - Bin heatmap (which zones fill fastest)
  - Export to Power BI / Tableau via Data Connector (OData)

## Data Flow

```
Geotab DB                    SmartRoute Add-In              External (future)
─────────                    ─────────────────              ─────────────────
Route          ──Get──►     Load route + stops
RoutePlanItem  ──Get──►     Build bins list
Zone           ──Get──►     (lat, lng, name)
AddInData      ──Get──►     fillLevel per zone
                                    │
                                    ▼
                            Run optimization
                            (threshold, closures)
                                    │
                                    ▼
Route          ◄──Add──     New route (optimized)
RoutePlanItem  ◄──Add──     Stops in order
AddInData      ◄──Set──     Updated bin_state
```

## Work Division (3-Person Team)

### Person 1: UI/Frontend (Add-In)
**Focus:** SmartRoute Add-In polish + manager dashboard

**Tasks:**
1. **Map improvements**
   - Better bin markers (icons, color gradients)
   - Vehicle icons with direction arrows (bearing from DeviceStatusInfo)
   - Route animation (show vehicle moving along route)
   - Click bin → show fill history chart
2. **Manager dashboard panel**
   - KPI cards: fuel saved, hours saved, CO₂ avoided (polish existing)
   - Daily/weekly/monthly trend charts (Chart.js)
   - Driver leaderboard (fastest routes, most bins collected)
   - Bin heatmap (which zones fill fastest)
3. **Predictive UI**
   - "Predicted fill date" per bin
   - "Recommended collection days" calendar view
   - "What-if" threshold slider with projected savings

**Tech:** Leaflet, Chart.js, Bootstrap, ES5

---

### Person 2: Algorithm/Optimization
**Focus:** Route optimization quality + predictive models

**Tasks:**
1. **Algorithm improvements**
   - Clarke-Wright savings algorithm (better than nearest-neighbor)
   - Vehicle capacity constraints (truck holds X bins max)
   - Time windows (bins must be collected 8am–5pm)
   - Better multi-vehicle assignment (k-means clustering)
2. **Road closure integration**
   - Manual input UI ("mark Zone as closed")
   - Skip zones in that area during optimization
   - Optional: Google Maps API for real-time traffic
3. **Predictive model**
   - Load collection_log from AddInData
   - Train regression: `fillLevel(day) = baseline + fillRate × days_since_collection`
   - Suggest optimal collection schedule per bin
   - Store predictions back to AddInData

**Tech:** JavaScript (ES5 for Add-In, Node.js for scripts), Python (for model training)

---

### Person 3: Integration/Backend
**Focus:** Geotab API integration + data pipeline + backend

**Tasks:**
1. **Geotab data pipeline**
   - Fetch Trip, FuelTransaction, ExceptionEvent from Geotab
   - Store in AddInData or local DB for historical analysis
   - Build `/api/stats` endpoint → returns KPIs for dashboard
2. **Real sensor proxy (optional)**
   - If Sensoneo/Bigbelly access: proxy API calls through backend
   - Otherwise: simulator that writes to AddInData on schedule
3. **N8n workflows (automation)**
   - Schedule: Every hour, check bin fill levels
   - If any bin >90%, send Slack/email alert
   - Auto-run optimization and write updated Route to Geotab
   - Log results to AddInData
4. **Mapbox integration (Phase 2)**
   - Backend endpoint: `/api/optimize-route`
   - Calls Mapbox Optimization API with bin coords
   - Returns optimized order + real driving distances
5. **Metrics dashboard backend**
   - Aggregate fuel/hours/CO₂ from AddInData logs
   - Serve to dashboard as JSON
   - Optional: Power BI / Tableau connector using Data Connector (OData)
   - predictive 

**Tech:** Node.js (backend), n8n (workflows), Mapbox API, Geotab API

---

## Hackathon Priorities (24 Hours)

| Priority | Task | Owner |
|----------|------|-------|
| P0 | Polish existing UI (threshold slider, map, KPIs) | UI Person |
| P0 | Add driver leaderboard + bin heatmap | UI Person |
| P1 | Clarke-Wright or capacity constraints | Algo Person |
| P1 | Predictive model (even simple moving average) | Algo Person |
| P1 | N8n automation (1 workflow: hourly check + alert) | Backend Person |
| P2 | Backend metrics API | Backend Person |
| P2 | Mapbox integration | Backend Person |

**Foundation is solid** – bins from Geotab, threshold-based routing, 2-opt, writeback all work. Adding predictive + automation + better visuals will make it a strong demo.

---

## Seeding Demo Data

```bash
node scripts/seed-demo-routes.js
```

Creates 10 Toronto zones + 1 route with RoutePlanItems. Refresh the Add-In to see them.
