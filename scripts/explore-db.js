#!/usr/bin/env node
/**
 * Explore Demo_garbage_trucks database - list devices, users, zones, routes
 * Run: node scripts/explore-db.js (from smartroute root)
 */
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1].trim()] = val;
    }
  });
}

const DB = process.env.GEOTAB_DATABASE;
const USER = process.env.GEOTAB_USERNAME;
const PASS = process.env.GEOTAB_PASSWORD;
const SERVER = process.env.GEOTAB_SERVER || 'my.geotab.com';

if (!DB || !USER || !PASS) {
  console.error('Missing GEOTAB_DATABASE, GEOTAB_USERNAME, or GEOTAB_PASSWORD in .env');
  process.exit(1);
}

const url = `https://${SERVER}/apiv1`;

async function api(method, params) {
  const body = { method, params };
  if (params.credentials) body.params = params;
  else body.params = { ...params, credentials };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.result;
}

async function main() {
  console.log('Authenticating to', DB, '...');
  const auth = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'Authenticate',
      params: { database: DB, userName: USER, password: PASS }
    })
  });
  const authData = await auth.json();
  if (authData.error) {
    console.error('Auth failed:', authData.error.message);
    process.exit(1);
  }
  const credentials = authData.result.credentials;
  console.log('Connected.\n');

  const get = (typeName, search = {}) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Get',
        params: { typeName, search: { ...search }, credentials }
      })
    }).then(r => r.json()).then(d => d.error ? [] : d.result);

  console.log('=== DEVICES (vehicles) ===');
  const devices = await get('Device');
  console.log('Count:', devices.length);
  devices.slice(0, 10).forEach(d => console.log('  -', d.name, '(id:', d.id + ')'));
  if (devices.length > 10) console.log('  ... and', devices.length - 10, 'more');

  console.log('\n=== USERS (drivers) ===');
  const users = await get('User', { isDriver: true });
  console.log('Drivers:', users.length);
  users.slice(0, 5).forEach(u => console.log('  -', u.name, '(' + u.id + ')'));

  console.log('\n=== ROUTES ===');
  const routes = await get('Route');
  console.log('Count:', routes.length);
  routes.forEach(r => console.log('  -', r.name, '(id:', r.id + ')'));

  console.log('\n=== ROUTE PLAN ITEMS (stops = bins) ===');
  const planItems = await get('RoutePlanItem');
  console.log('Count:', planItems.length);
  planItems.forEach(p => {
    const zoneId = p.zone && p.zone.id ? p.zone.id : p.zone;
    console.log('  Route', p.route?.id || p.route, '| Zone', zoneId, '| seq:', p.sequence);
  });

  console.log('\n=== ZONES (stops/bins with centroids) ===');
  const zones = await get('Zone');
  console.log('Count:', zones.length);
  zones.forEach(z => {
    const pts = z.points || [];
    const centroid = pts.length ? {
      lng: pts.reduce((s, p) => s + (p.x || 0), 0) / pts.length,
      lat: pts.reduce((s, p) => s + (p.y || 0), 0) / pts.length
    } : null;
    console.log('  -', z.name, '| centroid:', centroid ? centroid.lat.toFixed(4) + ',' + centroid.lng.toFixed(4) : 'n/a');
  });

  console.log('\n=== GROUPS ===');
  const groups = await get('Group');
  console.log('Count:', groups.length);
  groups.slice(0, 5).forEach(g => console.log('  -', g.name));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
