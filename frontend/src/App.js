import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different facility types
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const urgentCareIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

  // Midtown Atlanta coordinates
  const midtownCenter = [33.7756, -84.3963];

  // Sample facilities in Midtown Atlanta
  const facilities = [
    {
      id: 1,
      name: 'Grady Memorial Hospital',
      type: 'ER',
      position: [33.7557, -84.3816],
      capacity: 'High',
      waitTime: '45 min',
      insurance: 'All accepted',
      status: 'Open'
    },
    {
      id: 2,
      name: 'Emory Midtown Hospital',
      type: 'ER',
      position: [33.7806, -84.3722],
      capacity: 'Medium',
      waitTime: '30 min',
      insurance: 'Most accepted',
      status: 'Open'
    },
    {
      id: 3,
      name: 'Piedmont Hospital',
      type: 'ER',
      position: [33.8048, -84.3685],
      capacity: 'High',
      waitTime: '60 min',
      insurance: 'All accepted',
      status: 'Open'
    },
    {
      id: 4,
      name: 'WellStreet Urgent Care - Midtown',
      type: 'Urgent Care',
      position: [33.7712, -84.3850],
      capacity: 'Low',
      waitTime: '15 min',
      insurance: 'Most major',
      status: 'Open'
    },
    {
      id: 5,
      name: 'Peachtree Immediate Care',
      type: 'Urgent Care',
      position: [33.7890, -84.3840],
      capacity: 'Low',
      waitTime: '20 min',
      insurance: 'Most major',
      status: 'Open'
    }
  ];

  useEffect(() => {
    // Check backend connection
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/health`)
      .then(res => res.json())
      .then(data => setBackendStatus('Connected'))
      .catch(err => setBackendStatus('Backend not running'));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>EVAC+</h1>
        <p className="subtitle">Emergency Evacuation & Care Access Platform</p>
        <div className="status-badge">
          Backend: {backendStatus}
        </div>
      </header>

      <main className="App-main">
        <section className="info-card">
          <h2>MVP Foundation - Midtown Atlanta</h2>
          <p>
            Interactive map showing emergency care facilities in Midtown Atlanta.
            Red markers = ERs | Blue markers = Urgent Care Centers
          </p>
        </section>

        <section className="map-section">
          <MapContainer 
            center={midtownCenter} 
            zoom={14} 
            style={{ height: '500px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Simulated congestion zones */}
            <Circle
              center={[33.7706, -84.3880]}
              radius={500}
              pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.2 }}
            />
            <Circle
              center={[33.7850, -84.3750]}
              radius={400}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
            />

            {facilities.map(facility => (
              <Marker 
                key={facility.id} 
                position={facility.position}
                icon={facility.type === 'ER' ? hospitalIcon : urgentCareIcon}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{facility.name}</h3>
                    <p style={{ margin: '5px 0' }}><strong>Type:</strong> {facility.type}</p>
                    <p style={{ margin: '5px 0' }}><strong>Capacity:</strong> {facility.capacity}</p>
                    <p style={{ margin: '5px 0' }}><strong>Wait Time:</strong> {facility.waitTime}</p>
                    <p style={{ margin: '5px 0' }}><strong>Insurance:</strong> {facility.insurance}</p>
                    <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={{ color: 'green' }}>{facility.status}</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>

        <section className="info-card">
          <h2>Three Core Decisions</h2>
          <div className="decision-grid">
            <div className="decision-card">
              <h3>Stay (Static)</h3>
              <p>Remain in place and call for ambulance or telemedicine</p>
            </div>
            <div className="decision-card">
              <h3>Move (Active)</h3>
              <p>Travel independently to hospital or urgent care</p>
            </div>
            <div className="decision-card">
              <h3>Hybrid (Adaptive)</h3>
              <p>Combine modes (e.g., walk and meet ambulance)</p>
            </div>
          </div>
        </section>

        <section className="info-card">
          <h2>Technology</h2>
          <p>
            Using <strong>Leaflet.js</strong> with <strong>OpenStreetMap</strong> (free, open-source mapping).
            Orange/red circles represent simulated traffic congestion zones.
          </p>
        </section>
      </main>

      <footer className="App-footer">
        <p>Georgia Tech VIP - Climate Migration & Emergency Response</p>
        <p>Research Prototype | Not for production use</p>
      </footer>
    </div>
  );
}

export default App;
