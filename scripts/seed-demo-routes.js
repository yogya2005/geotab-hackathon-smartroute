#!/usr/bin/env node
/**
 * Seed Toronto demo routes to Geotab DB
 * Creates Zones (bins/stops) + Route + RoutePlanItems
 * Run: node scripts/seed-demo-routes.js (from smartroute root)
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
  console.error('Missing .env credentials');
  process.exit(1);
}

const url = `https://${SERVER}/apiv1`;

function zonePoints(lat, lng) {
  const o = 0.0001;
  return [
    { x: lng - o, y: lat - o },
    { x: lng + o, y: lat - o },
    { x: lng + o, y: lat + o },
    { x: lng - o, y: lat + o },
    { x: lng - o, y: lat - o }
  ];
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

  const api = (method, params) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params: { ...params, credentials } })
    }).then(r => r.json()).then(d => {
      if (d.error) throw new Error(d.error.message);
      return d.result;
    });

  const dataPath = path.join(__dirname, '../data/toronto-route-demo.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('Creating', data.zones.length, 'zones...');
  const zoneIds = [];
  for (let i = 0; i < data.zones.length; i++) {
    const z = data.zones[i];
    const id = await api('Add', {
      typeName: 'Zone',
      entity: {
        name: z.name,
        points: zonePoints(z.lat, z.lng),
        displayed: true,
        groups: [{ id: 'GroupCompanyId' }]
      }
    });
    zoneIds.push(id);
    console.log('  ', z.name, '->', id);
  }

  console.log('\nCreating route:', data.routeName);
  const routePlanItems = zoneIds.map((zid, i) => ({
    zone: { id: zid },
    sequence: i
  }));
  const routeId = await api('Add', {
    typeName: 'Route',
    entity: {
      name: data.routeName,
      comment: 'SmartRoute demo - Toronto downtown waste collection',
      routeType: 'Basic',
      routePlanItemCollection: routePlanItems
    }
  });
  console.log('  Route id:', routeId);
  console.log('  Stops:', zoneIds.length);

  console.log('\nDone. Route "' + data.routeName + '" has', zoneIds.length, 'stops.');
  console.log('Refresh SmartRoute Add-In to see the new bins.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
