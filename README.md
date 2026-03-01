# SmartRoute: Dynamic Waste Fleet Optimization

Connecting bin fill-level sensors to Geotab telematics for real-time route decisions.

## Overview

SmartRoute is a Geotab Add-In that integrates bin fill-level sensor data with vehicle telematics to dynamically optimize waste collection routes. Instead of fixed routes that hit every bin every day, SmartRoute only routes to bins that actually need emptying.

**Hackathon:** Geotab Vibe Coding Challenge (Feb 12 – Mar 2, 2026)

## Quick Start

1. **Get Geotab credentials:** [Create a free demo database](https://my.geotab.com/registration.html) (click "Create a Demo Database")
2. **Install the Add-In (embedded — no hosting needed):**
   - Copy the **entire** contents of `addin/smartroute-embedded-config.json`
   - In MyGeotab: User profile → Administration → System Settings → Add-Ins
   - Enable "Allow unverified Add-Ins" → Yes
   - New Add-In → Configuration tab → Paste → Save
3. **Refresh** and find "SmartRoute" in the sidebar

## Project Structure

```
smartroute/
├── .env.example       # Template for API keys (copy to .env)
├── addin/             # Geotab Add-In
│   ├── smartroute.html
│   ├── smartroute.js
│   ├── smartroute-config.json      # External hosted config
│   └── smartroute-embedded-config.json  # Embedded (no hosting)
├── data/
│   └── bins-demo.json # Synthetic bin data for demo
├── backend/           # Optional: Cloud Function for production
└── docs/
    └── API_KEYS.md    # Where to get API keys
```

## Demo Mode

The hackathon demo uses **synthetic bin data** — no real sensor APIs needed. Bin fill levels are randomized on load. Geotab vehicle data comes from your demo database.

## Production (Phase 2)

For real deployments:
- Backend proxies Sensoneo/Bigbelly APIs (keeps keys server-side)
- Mapbox Optimization API for route optimization
- Session verification per Geotab security patterns

See `backend/README.md` and `docs/API_KEYS.md`.

## References

Built with patterns from [geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide).
