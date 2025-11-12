# EVAC+ Backend

Backend API for the EVAC+ emergency care navigation system.

## Setup

```bash
npm install
npm start
```

The `.env` file is already included with default settings (no API keys needed!).

## API Endpoints

### Health Check
```
GET /api/health
```

### Facilities
```
GET /api/facilities
```
Returns list of urgent care centers and ERs in Midtown Atlanta.

### Decision Engine
```
POST /api/decision
Body: {
  userProfile: {...},
  location: {...}
}
```
Returns Stay/Move/Hybrid recommendation.

### Routing
```
GET /api/route?origin=...&destination=...
```

