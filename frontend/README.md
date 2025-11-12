# EVAC+ Frontend

React web application for the EVAC+ emergency care navigation system.

## Setup

```bash
npm install
npm start
```

The app will open at `http://localhost:3000`

The `.env` file is already included with default settings (no API keys needed!).

## Features (MVP)

- User profile form (age, health, mobility, location)
- Interactive map with Leaflet.js + OpenStreetMap (free!)
- Facility markers (urgent care + ERs) in Midtown Atlanta
- Decision recommendation display (Stay/Move/Hybrid)
- Simulated congestion overlays

## Project Structure

```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # React components (TODO)
│   ├── services/      # API client (TODO)
│   ├── pages/         # Main app pages (TODO)
│   ├── App.js         # Main app component
│   └── index.js       # Entry point
└── package.json
```

## Development

This project was bootstrapped with Create React App.
