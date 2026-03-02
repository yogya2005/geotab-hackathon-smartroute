# Geotab Route / Zone Schema (SmartRoute)

How routes, stops, and bins map in Geotab. Reference: [Geotab API](https://geotab.github.io/sdk/software/api/reference/), [vibe-guide DEMO_DATABASE_REFERENCE](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/DEMO_DATABASE_REFERENCE.md).

## Entity Relationship

```
Route 1───* RoutePlanItem *───1 Zone
   (name)      (sequence)      (points = polygon)
```

- **Route** = planned route (name, comment)
- **RoutePlanItem** = one stop in the route (links Route ↔ Zone, has `sequence`)
- **Zone** = geofence / stop location (polygon `points`, `name`)

## Zone

| Field   | Type   | Description                    |
|---------|--------|--------------------------------|
| `id`    | string | Geotab-generated ID           |
| `name`  | string | Display name                   |
| `points`| array  | Polygon; **x = lng, y = lat** |
| `displayed` | bool | Show on map                |
| `groups` | array | Required on Add: `[{ id: "GroupCompanyId" }]` |

**Points format** (closed polygon, first = last):

```json
[
  {"x": -79.3810, "y": 43.6457},
  {"x": -79.3808, "y": 43.6457},
  {"x": -79.3808, "y": 43.6455},
  {"x": -79.3810, "y": 43.6455},
  {"x": -79.3810, "y": 43.6457}
]
```

## Route

| Field     | Type   | Description      |
|-----------|--------|------------------|
| `id`      | string | Geotab-generated |
| `name`    | string | Route name       |
| `comment` | string | Optional notes   |
| `routeType` | string | e.g. `"Basic"` |
| `routePlanItemCollection` | array | Stops when creating: `[{ zone: {id}, sequence }]` |

## RoutePlanItem

| Field    | Type   | Description              |
|----------|--------|--------------------------|
| `id`     | string | Geotab-generated         |
| `route`  | ref    | `{ "id": "routeId" }`     |
| `zone`   | ref    | `{ "id": "zoneId" }`      |
| `sequence` | int  | Stop order (0, 1, 2, …)   |

## AddInData (bin status)

Bin fill levels and collection logs live in **AddInData**, not in Zone/Route:

| `details.type`   | Purpose                          |
|------------------|----------------------------------|
| `bin_state`      | `{ bins: [{ id, lat, lng, fillLevel }], savedAt }` |
| `collection_log` | `{ binId, collectedAt, fillPctAtCollection, … }`  |

`id` in `bin_state.bins` = Zone id when bins come from Geotab.

## Write Flow

1. **Read**: `Get` Zone, Route, RoutePlanItem
2. **Optimize**: Apply algo (threshold, road closures, etc.) → fewer stops
3. **Write**:
   - **Add Route** with `routePlanItemCollection`: `[{ zone: {id}, sequence }]` for optimized stops
   - Or: Add Route (name only), then Add RoutePlanItems one by one

## Rate Limits

- RoutePlanItem: ~100 Add per minute
- Zone: ~750 Get per minute
