# SmartRoute Backend (Phase 2)

Optional Cloud Function for production deployments. Handles:

- **Session verification** — Only authenticated Geotab users can call the API
- **Mapbox Optimization** — Route optimization (keeps API key server-side)
- **Bin sensor proxy** — Future: proxy Sensoneo/Bigbelly APIs

## Deploy (Google Cloud Functions)

```bash
cd backend
npm install
gcloud functions deploy smartroute \
  --gen2 \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="ALLOWED_DATABASES=your_db" \
  --set-env-vars="MAPBOX_ACCESS_TOKEN=your_mapbox_token"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOWED_DATABASES` | Yes | Comma-separated Geotab database names |
| `MAPBOX_ACCESS_TOKEN` | For optimize | Mapbox API token from account.mapbox.com |

## Call from Add-In

```javascript
api.getSession(function(session) {
  fetch("https://YOUR_FUNCTION_URL", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      geotab_database: session.database,
      geotab_username: session.userName,
      geotab_session_id: session.sessionId,
      geotab_server: window.location.hostname,
      action: "optimize",
      waypoints: [{ lat: 40.71, lng: -74.00 }, { lat: 40.72, lng: -74.01 }]
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) { console.log(data); });
});
```

## Security

Follows patterns from [geotab-vibe-guide SECURE_ADDIN_BACKEND](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/SECURE_ADDIN_BACKEND.md).
