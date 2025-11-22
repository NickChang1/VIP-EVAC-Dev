/**
 * EVAC+ Frontend Application
 * Emergency Evacuation & Care Access Platform for Midtown Atlanta
 * 
 * This app helps users make informed decisions about emergency care by:
 * 1. Displaying available facilities (ERs and Urgent Care) on an interactive map
 * 2. Showing real-time capacity indicators (circle size = availability)
 * 3. Providing personalized recommendations based on patient profile and severity
 * 
 * Built with React and Leaflet.js (OpenStreetMap) - no API keys required
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix for default marker icons in Leaflet with React
// This is a known issue when using Leaflet with React - we need to manually set icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Custom map marker icons for different facility types
 * RED markers = Emergency Rooms (hospitals with 24/7 emergency care)
 * BLUE markers = Urgent Care Centers (walk-in clinics for non-life-threatening conditions)
 * 
 * Using color-coded markers from GitHub repository for consistency
 */
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],        // Size of the icon in pixels [width, height]
  iconAnchor: [12, 41],      // Point of the icon which will correspond to marker's location
  popupAnchor: [1, -34],     // Point from which the popup should open relative to the iconAnchor
  shadowSize: [41, 41]       // Size of the shadow
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
  // ===== STATE MANAGEMENT =====
  // Track backend API connection status
  const [backendStatus, setBackendStatus] = useState('Checking...');
  
  // Track user-selected severity level (Mild, Moderate, or Severe)
  const [severity, setSeverity] = useState('Moderate');
  
  // Store the recommendation result after user clicks "Get Recommendation"
  const [recommendation, setRecommendation] = useState(null);
  
  // Store facilities data fetched from backend (with dynamic wait times)
  const [facilities, setFacilities] = useState([]);
  
  // Current traffic level (low, moderate, heavy, severe)
  const [trafficLevel, setTrafficLevel] = useState('moderate');

  // ===== MAP CONFIGURATION =====
  // Center coordinates for Midtown Atlanta (Latitude, Longitude)
  // This ensures the map initially displays the Midtown area
  const midtownCenter = [33.7756, -84.3963];

  // ===== HELPER FUNCTIONS =====
  
  /**
   * Extract numeric minutes from wait time (handles both string and number)
   * @param {string|number} waitTime - Wait time like "45 min" or 45
   * @returns {number} - Wait time in minutes
   */
  const getWaitMinutes = (waitTime) => {
    if (typeof waitTime === 'number') return waitTime;
    if (typeof waitTime === 'string') return parseInt(waitTime.replace(' min', ''));
    return 0;
  };

  /**
   * Calculate capacity circle radius based on wait time
   * Visual indicator: LARGER circle = MORE available (shorter wait)
   *                  SMALLER circle = LESS available (longer wait)
   * 
   * @param {string} waitTime - Wait time string like "30 min"
   * @returns {number} - Radius in meters for the circle on the map
   * 
   * Examples:
   * - 15 min wait → 325m radius (large circle = high availability)
   * - 30 min wait → 250m radius (medium circle = moderate availability)
   * - 60 min wait → 100m radius (small circle = low availability/crowded)
   */
  const getCapacityRadius = (waitTime) => {
    const minutes = getWaitMinutes(waitTime);
    // Formula: 400 - (minutes * 5)
    // Ensures minimum radius of 100m even with very long waits
    return Math.max(100, 400 - (minutes * 5));
  };



  // ===== BACKEND CONNECTION AND DATA FETCHING =====
  /**
   * Fetch facilities data when component loads
   * This gets current wait times based on time of day simulation
   * Also checks backend connection status
   */
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    // Check health
    fetch(`${apiUrl}/api/health`)
      .then(res => res.json())
      .then(data => setBackendStatus('Connected'))
      .catch(err => setBackendStatus('Backend not running'));
    
    // Fetch facilities with dynamic wait times
    fetch(`${apiUrl}/api/facilities`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFacilities(data.data);
          setTrafficLevel(data.trafficLevel || 'moderate');
        }
      })
      .catch(err => console.error('Failed to fetch facilities:', err));
    
    // Refresh facilities every 60 seconds to show time-based changes
    const interval = setInterval(() => {
      fetch(`${apiUrl}/api/facilities`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFacilities(data.data);
            setTrafficLevel(data.trafficLevel || 'moderate');
          }
        })
        .catch(err => console.error('Failed to refresh facilities:', err));
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Empty array = run only once on component mount

  // ===== RECOMMENDATION ENGINE =====
  /**
   * Core decision logic for burn injury recommendations
   * This function analyzes severity and recommends:
   * - WHERE to go (which facility)
   * - HOW to get there (Stay/Move decision)
   * - WHY this is the best choice (reasoning)
   * 
   * Decision factors:
   * 1. Severity of condition
   * 2. Facility capabilities (ER vs Urgent Care)
   * 3. Wait times
   * 4. Cost considerations
   * 5. Patient profile (single mother = cost-conscious, time-sensitive)
   */
  const handleGetRecommendation = () => {
    let result = {
      decision: '',      // The recommended action (Stay/Move)
      facility: null,    // Which facility to use
      reasoning: []      // Why this recommendation makes sense
    };

    // SEVERE BURNS: Life-threatening, needs immediate emergency care
    // Find facilities by type
    const ers = facilities.filter(f => f.type === 'ER' && f.status === 'Open');
    const urgentCares = facilities.filter(f => f.type === 'Urgent Care' && f.status === 'Open');
    
    if (severity === 'Severe') {
      // Choose Grady (trauma center) for severe cases
      const grady = facilities.find(f => f.name.includes('Grady'));
      result.decision = 'STAY - Call 911';
      result.facility = grady || ers[0];
      result.reasoning = [
        'Severe burns require immediate emergency care',
        'Ambulance ensures safe transport',
        result.facility?.name + ' has specialized trauma care'
      ];
    // MODERATE BURNS: Serious but not immediately life-threatening
    // Can safely travel to ER, choose facility with shortest wait
    } else if (severity === 'Moderate') {
      // Find ER with shortest wait time
      const bestER = ers.sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
      result.decision = 'MOVE to ER';
      result.facility = bestER;
      result.reasoning = [
        'Moderate burns need ER assessment',
        `${bestER?.name} has shortest wait time (${bestER?.currentWaitTime} min)`,
        `Current traffic: ${trafficLevel} - plan accordingly`
      ];
    // MILD BURNS: Minor injury, can be treated at Urgent Care
    // Cheaper and faster than ER for non-emergency conditions
    } else { // Mild
      // Find Urgent Care with shortest wait
      const bestUC = urgentCares.sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
      
      if (bestUC && bestUC.status === 'Open') {
        result.decision = 'MOVE to Urgent Care';
        result.facility = bestUC;
        result.reasoning = [
          'Minor burns can be treated at Urgent Care',
          `Much shorter wait time (${bestUC.currentWaitTime} min)`,
          'Lower cost than ER visit'
        ];
      } else {
        // If urgent cares are closed, recommend ER
        const bestER = ers.sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
        result.decision = 'MOVE to ER (Urgent Care closed)';
        result.facility = bestER;
        result.reasoning = [
          'Urgent Care centers are currently closed',
          `Go to ${bestER?.name} instead`,
          'Still appropriate for minor burns'
        ];
      }
    }

    // Update state to display recommendation to user
    setRecommendation(result);
  };

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
          <h2>Patient Profile & Severity</h2>
          <div className="input-panel">
            <div className="profile-display">
              <h3>Profile: Single Mother with Burn Injury</h3>
              <p>Age: 32 | Has child at home | Limited transportation</p>
            </div>
            
            <div className="severity-selector">
              <label><strong>Burn Severity:</strong></label>
              <div className="severity-buttons">
                <button 
                  className={severity === 'Mild' ? 'severity-btn active' : 'severity-btn'}
                  onClick={() => setSeverity('Mild')}
                >
                  Mild
                </button>
                <button 
                  className={severity === 'Moderate' ? 'severity-btn active' : 'severity-btn'}
                  onClick={() => setSeverity('Moderate')}
                >
                  Moderate
                </button>
                <button 
                  className={severity === 'Severe' ? 'severity-btn active' : 'severity-btn'}
                  onClick={() => setSeverity('Severe')}
                >
                  Severe
                </button>
              </div>
            </div>

            <button className="recommend-btn" onClick={handleGetRecommendation}>
              Get Recommendation
            </button>
          </div>

          {recommendation && recommendation.facility && (
            <div className="recommendation-result">
              <h3>Recommendation: {recommendation.decision}</h3>
              <div className="facility-recommendation">
                <h4>{recommendation.facility.name}</h4>
                <p><strong>Type:</strong> {recommendation.facility.type}</p>
                <p><strong>Current Wait:</strong> {recommendation.facility.waitTimeDisplay || `${recommendation.facility.currentWaitTime} min`}</p>
                <p><strong>Insurance:</strong> {recommendation.facility.insurance?.join(', ')}</p>
                <p><strong>Traffic Conditions:</strong> <span className={`traffic-${trafficLevel}`}>{trafficLevel.toUpperCase()}</span></p>
              </div>
              <div className="reasoning">
                <strong>Why this recommendation:</strong>
                <ul>
                  {recommendation.reasoning.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section className="info-card">
          <h2>Midtown Atlanta Facilities Map</h2>
          <div className="map-legend">
            <h3>How to Read the Map:</h3>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-marker red"></span>
                <div>
                  <strong>Red Markers = Emergency Rooms (ERs)</strong>
                  <p>24/7 emergency care for life-threatening conditions (heart attacks, severe injuries, etc.)</p>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-marker blue"></span>
                <div>
                  <strong>Blue Markers = Urgent Care Centers</strong>
                  <p>Walk-in care for non-emergency issues (minor burns, sprains, infections, etc.)</p>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-circles">
                  <div className="legend-circle large"></div>
                  <div className="legend-circle medium"></div>
                  <div className="legend-circle small"></div>
                </div>
                <div>
                  <strong>Circle Size = Current Availability</strong>
                  <p>Larger circle = shorter wait time (more available) | Smaller circle = longer wait time (more crowded)</p>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-marker orange"></span>
                <div>
                  <strong>Orange/Red Zones = Traffic Congestion</strong>
                  <p>Areas with current traffic delays - may affect travel time</p>
                </div>
              </div>
            </div>
            <p className="legend-tip"><strong>Tip:</strong> Click any marker to see facility details (wait time, insurance, etc.)</p>
          </div>
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
              <React.Fragment key={facility.id}>
                {/* Capacity circle - size based on wait time */}
                <Circle
                  center={facility.position}
                  radius={getCapacityRadius(facility.waitTime)}
                  pathOptions={{ 
                    color: facility.type === 'ER' ? '#ff6b6b' : '#4dabf7',
                    fillColor: facility.type === 'ER' ? '#ff6b6b' : '#4dabf7',
                    fillOpacity: 0.15,
                    weight: 2
                  }}
                />
                
                {/* Facility marker */}
                <Marker 
                  position={facility.position}
                  icon={facility.type === 'ER' ? hospitalIcon : urgentCareIcon}
                >
                  <Popup>
                    <div style={{ minWidth: '220px' }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{facility.name}</h3>
                      <p style={{ margin: '5px 0' }}><strong>Type:</strong> {facility.type}</p>
                      <p style={{ margin: '5px 0' }}><strong>Wait Time:</strong> {facility.waitTimeDisplay || `${facility.currentWaitTime} min`}</p>
                      <p style={{ margin: '5px 0' }}><strong>Insurance:</strong> {facility.insurance?.join(', ')}</p>
                      <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={{ color: facility.status === 'Open' ? 'green' : 'red' }}>{facility.status}</span></p>
                      {facility.hours && <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>{facility.hours}</p>}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
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
