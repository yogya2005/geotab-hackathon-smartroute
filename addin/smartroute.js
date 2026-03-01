/* SmartRoute Add-In - Dynamic Waste Fleet Optimization */
/* ES5 only - MyGeotab embedded environment */

var _debugData = {};

function debugLog(msg) {
  var el = document.getElementById('debug-log');
  if (el) {
    el.textContent += '[' + new Date().toLocaleTimeString() + '] ' + msg + '\n';
    el.scrollTop = el.scrollHeight;
  }
}

function copyDebugData() {
  var t = document.createElement('textarea');
  t.value = JSON.stringify(_debugData, null, 2);
  document.body.appendChild(t);
  t.select();
  document.execCommand('copy');
  document.body.removeChild(t);
  alert('Debug data copied to clipboard!');
}

function debugSample(key, arr) {
  _debugData[key] = arr ? { total: arr.length, sample: arr.slice(0, 5) } : null;
}

/* Embedded bin data - same as data/bins-demo.json */
var BINS_DATA = {
  bins: [
    { id: 'bin-1', lat: 40.7128, lng: -74.006, fillLevel: 85 },
    { id: 'bin-2', lat: 40.715, lng: -74.008, fillLevel: 42 },
    { id: 'bin-3', lat: 40.718, lng: -74.004, fillLevel: 92 },
    { id: 'bin-4', lat: 40.71, lng: -74.01, fillLevel: 28 },
    { id: 'bin-5', lat: 40.72, lng: -74.012, fillLevel: 67 },
    { id: 'bin-6', lat: 40.708, lng: -74.002, fillLevel: 15 },
    { id: 'bin-7', lat: 40.722, lng: -74.006, fillLevel: 78 },
    { id: 'bin-8', lat: 40.706, lng: -74.014, fillLevel: 55 },
    { id: 'bin-9', lat: 40.724, lng: -74.01, fillLevel: 91 },
    { id: 'bin-10', lat: 40.714, lng: -74, fillLevel: 33 },
    { id: 'bin-11', lat: 40.716, lng: -74.016, fillLevel: 72 },
    { id: 'bin-12', lat: 40.704, lng: -74.006, fillLevel: 8 },
    { id: 'bin-13', lat: 40.726, lng: -74.004, fillLevel: 88 },
    { id: 'bin-14', lat: 40.712, lng: -74.018, fillLevel: 61 },
    { id: 'bin-15', lat: 40.702, lng: -74.01, fillLevel: 45 },
    { id: 'bin-16', lat: 40.728, lng: -74.008, fillLevel: 95 },
    { id: 'bin-17', lat: 40.71, lng: -74.02, fillLevel: 22 },
    { id: 'bin-18', lat: 40.7, lng: -74.002, fillLevel: 76 },
    { id: 'bin-19', lat: 40.73, lng: -74.012, fillLevel: 54 },
    { id: 'bin-20', lat: 40.708, lng: -74.022, fillLevel: 39 },
    { id: 'bin-21', lat: 40.718, lng: -73.998, fillLevel: 83 },
    { id: 'bin-22', lat: 40.698, lng: -74.006, fillLevel: 12 },
    { id: 'bin-23', lat: 40.732, lng: -74.002, fillLevel: 69 },
    { id: 'bin-24', lat: 40.706, lng: -74.024, fillLevel: 97 },
    { id: 'bin-25', lat: 40.72, lng: -73.996, fillLevel: 51 },
    { id: 'bin-26', lat: 40.696, lng: -74.014, fillLevel: 36 },
    { id: 'bin-27', lat: 40.734, lng: -74.016, fillLevel: 74 },
    { id: 'bin-28', lat: 40.704, lng: -74.026, fillLevel: 19 },
    { id: 'bin-29', lat: 40.722, lng: -73.994, fillLevel: 87 },
    { id: 'bin-30', lat: 40.694, lng: -74.018, fillLevel: 63 }
  ],
  depot: { lat: 40.7128, lng: -74.006 }
};

function haversineKm(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function routeDistanceKm(points) {
  var total = 0;
  for (var i = 0; i < points.length - 1; i++) {
    total += haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
  }
  return total;
}

function nearestNeighborRoute(start, bins) {
  var ordered = [];
  var remaining = bins.slice();
  var current = start;

  while (remaining.length > 0) {
    var bestIdx = 0;
    var bestDist = haversineKm(current.lat, current.lng, remaining[0].lat, remaining[0].lng);
    for (var i = 1; i < remaining.length; i++) {
      var d = haversineKm(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    ordered.push(remaining[bestIdx]);
    current = remaining[bestIdx];
    remaining.splice(bestIdx, 1);
  }
  return ordered;
}

function getBinColor(fillLevel) {
  if (fillLevel < 50) return '#28a745';
  if (fillLevel < 70) return '#ffc107';
  return '#dc3545';
}

geotab.addin['smartroute'] = function() {
  var map, apiRef;
  var binMarkers = [];
  var vehicleMarkers = [];
  var originalPolyline = null;
  var optimizedPolyline = null;
  var bins = [];

  function randomizeFillLevels() {
    bins = BINS_DATA.bins.map(function(b) {
      return {
        id: b.id,
        lat: b.lat,
        lng: b.lng,
        fillLevel: Math.floor(Math.random() * 95) + 5
      };
    });
  }

  function clearMapOverlays() {
    binMarkers.forEach(function(m) { if (map && map.removeLayer) map.removeLayer(m); });
    binMarkers = [];
    if (originalPolyline && map) map.removeLayer(originalPolyline);
    originalPolyline = null;
    if (optimizedPolyline && map) map.removeLayer(optimizedPolyline);
    optimizedPolyline = null;
  }

  function addBinMarker(bin) {
    var color = getBinColor(bin.fillLevel);
    var icon = L.divIcon({
      className: 'bin-marker',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color + ';border:2px solid #333;"></div>',
      iconSize: [14, 14]
    });
    var m = L.marker([bin.lat, bin.lng], { icon: icon })
      .addTo(map)
      .bindPopup('<b>' + bin.id + '</b><br>Fill: ' + bin.fillLevel + '%');
    binMarkers.push(m);
  }

  function addVehicleMarker(status) {
    var name = (status.device && status.device.id) ? status.device.id : 'Vehicle';
    var m = L.marker([status.latitude, status.longitude])
      .addTo(map)
      .bindPopup('<b>' + name + '</b><br>Speed: ' + (status.speed || 0) + ' km/h');
    vehicleMarkers.push(m);
  }

  function drawRoute(points, color, weight) {
    var latlngs = points.map(function(p) { return [p.lat, p.lng]; });
    return L.polyline(latlngs, { color: color, weight: weight || 4 }).addTo(map);
  }

  function updateStats(originalStops, optimizedStops, originalKm, optimizedKm) {
    var stopsReduced = originalStops - optimizedStops;
    var kmSaved = Math.max(0, originalKm - optimizedKm);
    var fuelPerKm = 0.3;
    var fuelSaved = kmSaved * fuelPerKm;
    var co2PerLiter = 2.68;
    var co2Avoided = fuelSaved * co2PerLiter;

    document.getElementById('val-stops').textContent = stopsReduced;
    document.getElementById('val-km').textContent = kmSaved.toFixed(1);
    document.getElementById('val-fuel').textContent = fuelSaved.toFixed(2) + ' L';
    document.getElementById('val-co2').textContent = co2Avoided.toFixed(1) + ' kg';
  }

  function runOptimization() {
    var threshold = parseInt(document.getElementById('threshold-slider').value, 10);
    document.getElementById('threshold-value').textContent = threshold;

    var binsAboveThreshold = bins.filter(function(b) { return b.fillLevel >= threshold; });
    var depot = BINS_DATA.depot;

    clearMapOverlays();

    bins.forEach(function(b) { addBinMarker(b); });

    var originalOrder = nearestNeighborRoute(depot, bins.slice());
    var optimizedOrder = binsAboveThreshold.length > 0
      ? nearestNeighborRoute(depot, binsAboveThreshold.slice())
      : [];

    var originalPoints = [depot].concat(originalOrder.map(function(b) { return { lat: b.lat, lng: b.lng }; }));
    var optimizedPoints = [depot].concat(optimizedOrder.map(function(b) { return { lat: b.lat, lng: b.lng }; }));
    if (optimizedPoints.length > 1) optimizedPoints.push(depot);
    if (originalPoints.length > 1) originalPoints.push(depot);

    originalPolyline = drawRoute(originalPoints, '#6c757d', 3);
    if (optimizedOrder.length > 0) {
      optimizedPolyline = drawRoute(optimizedPoints, '#0d6efd', 5);
    }

    var originalKm = routeDistanceKm(originalPoints);
    var optimizedKm = optimizedOrder.length > 0 ? routeDistanceKm(optimizedPoints) : 0;

    updateStats(bins.length, binsAboveThreshold.length, originalKm, optimizedKm);

    document.getElementById('status-text').textContent =
      binsAboveThreshold.length + ' bins above ' + threshold + '% (of ' + bins.length + ') — ' +
      (bins.length - binsAboveThreshold.length) + ' stops skipped';

    debugLog('Threshold: ' + threshold + '%, bins above: ' + binsAboveThreshold.length);
    debugSample('binsAboveThreshold', binsAboveThreshold);
  }

  function loadVehicles() {
    apiRef.call('Get', { typeName: 'DeviceStatusInfo' }, function(statuses) {
      debugLog('DeviceStatusInfo: ' + (statuses ? statuses.length : 0) + ' vehicles');
      debugSample('deviceStatuses', statuses);
      if (statuses) {
        statuses.forEach(function(s) {
          if (s.latitude && s.longitude) addVehicleMarker(s);
        });
      }
      runOptimization();
    }, function(err) {
      debugLog('DeviceStatusInfo error: ' + err);
      _debugData.lastError = String(err);
      runOptimization();
    });
  }

  return {
    initialize: function(api, state, callback) {
      apiRef = api;
      debugLog('SmartRoute initialize');

      map = L.map('map').setView([40.7128, -74.006], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      randomizeFillLevels();

      document.getElementById('threshold-slider').oninput = function() {
        runOptimization();
      };

      loadVehicles();
      callback();
    },
    focus: function(api, state) {
      apiRef = api;
      if (map) setTimeout(function() { map.invalidateSize(); }, 200);
    },
    blur: function() {}
  };
};
