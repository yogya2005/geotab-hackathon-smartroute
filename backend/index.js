// SmartRoute Backend - Phase 2
// Session verification + Mapbox Optimization + Bin sensor API proxy
// Pattern: https://github.com/fhoffa/geotab-vibe-guide/blob/main/examples/server-side/generate-image/index.js

const functions = require('@google-cloud/functions-framework');

const ALLOWED_DATABASES = (process.env.ALLOWED_DATABASES || '').split(',').map(db => db.trim().toLowerCase()).filter(Boolean);
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

function isValidGeotabServer(server) {
  return server === 'my.geotab.com' || server.endsWith('.geotab.com');
}

async function verifyGeotabSession(database, username, sessionId, server) {
  const apiUrl = `https://${server}/apiv1`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'GetSystemTimeUtc',
      params: {
        credentials: { database, userName: username, sessionId }
      }
    })
  });
  if (!response.ok) return false;
  const data = await response.json();
  return !data.error && data.result !== undefined;
}

// Mapbox Optimization API - returns optimized waypoint order
async function optimizeRoute(waypoints) {
  if (!MAPBOX_ACCESS_TOKEN) {
    return { error: 'MAPBOX_ACCESS_TOKEN not configured' };
  }
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?access_token=${MAPBOX_ACCESS_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

functions.http('smartroute', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { geotab_database, geotab_username, geotab_session_id, geotab_server, action, waypoints } = req.body || {};

  if (!geotab_database || !geotab_username || !geotab_session_id || !geotab_server) {
    return res.status(400).json({ error: 'Missing Geotab session credentials' });
  }
  if (!ALLOWED_DATABASES.includes(geotab_database.toLowerCase())) {
    return res.status(403).json({ error: 'Database not allowed' });
  }
  if (!isValidGeotabServer(geotab_server)) {
    return res.status(400).json({ error: 'Invalid Geotab server' });
  }

  const valid = await verifyGeotabSession(geotab_database, geotab_username, geotab_session_id, geotab_server);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid Geotab session' });
  }

  if (action === 'optimize' && waypoints && Array.isArray(waypoints)) {
    const result = await optimizeRoute(waypoints);
    return res.json(result);
  }

  return res.status(400).json({ error: 'Unknown action. Use action: "optimize" with waypoints array' });
});
