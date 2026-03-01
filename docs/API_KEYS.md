# API Keys Guide

## Required for Hackathon Demo

| Key | Where | Get From |
|-----|-------|----------|
| Geotab credentials | `.env` | [my.geotab.com/registration](https://my.geotab.com/registration.html) — Create Demo Database |

**Note:** The demo uses synthetic bin data. No bin sensor API keys needed.

## Optional (Production)

| Key | Where Used | Get From |
|-----|------------|----------|
| Mapbox token | Backend only | [account.mapbox.com](https://account.mapbox.com/access-tokens/) — free tier |
| Sensoneo | Backend proxy | [sensoneo.com](https://sensoneo.com) — contact for API |
| Bigbelly | Backend proxy | Contact Bigbelly for API access |

## Setup

1. Copy `.env.example` to `.env`
2. Fill in Geotab credentials for backend/local dev
3. Add Mapbox token if using backend route optimization
4. Add bin sensor keys only when integrating real APIs

**Never commit `.env`** — it is in `.gitignore`.
