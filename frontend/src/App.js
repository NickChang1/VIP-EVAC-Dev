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

// Highlighted marker (gold/yellow for recommended facility)
const highlightedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
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
  
  // Simulated time of day (defaults to current hour)
  const [simulatedHour, setSimulatedHour] = useState(new Date().getHours());
  
  // Selected persona (default to Burn Injury)
  const [selectedPersona, setSelectedPersona] = useState('burn');
  
  // Highlighted facility ID (for showing recommended facility on map)
  const [highlightedFacilityId, setHighlightedFacilityId] = useState(null);

  // ===== PERSONA DEFINITIONS =====
  const personas = {
    burn: {
      id: 'burn',
      name: 'Single Mother with Burn Injury',
      age: '32',
      description: 'Has child at home | Limited transportation',
      severityLabel: 'Burn Severity',
      riskTolerance: 'low'
    },
    pregnancy: {
      id: 'pregnancy',
      name: 'Pregnant Woman with Pre-eclampsia Symptoms',
      age: '25-35',
      description: 'Late stage pregnancy | Very concerned about pregnancy',
      severityLabel: 'Condition Severity',
      trimesters: {
        'Mild': '1st Trimester - Stable BP, mild swelling',
        'Moderate': '2nd Trimester - Higher BP, headache, vision changes',
        'Severe': '3rd Trimester - Extreme BP, non-stop headache, seizure risk'
      },
      riskTolerance: 'very-low'
    },
    asthma: {
      id: 'asthma',
      name: 'Adult with Asthma Attack',
      age: '30-40',
      description: 'Limited mobility due to shortness of breath | Takes care of elderly parents',
      severityLabel: 'Peak Flow Zone',
      zones: {
        'Mild': 'Green Zone (80-100% PFM) - Symptoms controlled',
        'Moderate': 'Yellow Zone (50-80% PFM) - Symptoms worsening',
        'Severe': 'Red Zone (<50% PFM) - Severe shortness of breath'
      },
      riskTolerance: 'medium'
    },
    dementia: {
      id: 'dementia',
      name: 'Elder with Dementia',
      age: '75-80',
      description: 'Frail mobility | Has caretaker | Low tech comfort',
      severityLabel: 'Agitation Level',
      levels: {
        'Mild': 'Mild Distress - Slight confusion, mild anxiety',
        'Moderate': 'Moderate Agitation - Increased confusion, restlessness',
        'Severe': 'Severe Crisis - Screaming, hitting, severe paranoia'
      },
      riskTolerance: 'low-medium'
    }
  };

  // ===== MAP CONFIGURATION =====
  // User location: Klaus Advanced Computing Building, Georgia Tech
  // 266 Ferst Dr NW, Atlanta, GA 30332
  // Latitude: 33° 46' 39.09" N = 33.777525°
  // Longitude: -84° 23' 46.06" W = -84.396128°
  const userLocation = [33.777525, -84.396128];
  
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
   * @param {string|number} waitTime - Wait time like "30 min" or 30
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

  /**
   * Get traffic level for a specific hour (for simulation)
   * @param {number} hour - Hour of day (0-23)
   * @returns {string} - Traffic level
   */
  const getTrafficForHour = (hour) => {
    if ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 19)) {
      return 'severe';  // Rush hour
    }
    if ((hour >= 6 && hour < 7) || (hour >= 10 && hour < 12) || (hour >= 14 && hour < 16)) {
      return 'heavy';
    }
    if (hour >= 12 && hour < 14) {
      return 'moderate';
    }
    return 'low';
  };

  /**
   * Calculate travel time to a facility based on distance and current traffic
   * Uses Haversine formula to calculate distance, then adjusts for traffic
   * 
   * @param {Array} facilityPosition - [lat, lng] of the facility
   * @returns {Object} - { time: number (minutes), distance: number (miles) }
   */
  const calculateTravelTime = (facilityPosition) => {
    // Safety check
    if (!facilityPosition) {
      return { time: 0, distance: '0.0' };
    }
    
    // Handle both array [lat, lng] and object {lat, lng} formats
    let facLat, facLng;
    if (Array.isArray(facilityPosition)) {
      facLat = facilityPosition[0];
      facLng = facilityPosition[1];
    } else if (facilityPosition.lat && facilityPosition.lng) {
      facLat = facilityPosition.lat;
      facLng = facilityPosition.lng;
    } else {
      return { time: 0, distance: '0.0' };
    }
    
    // User's location: Klaus Advanced Computing Building, Georgia Tech
    const userLat = userLocation[0];
    const userLng = userLocation[1];
    
    // Haversine formula to calculate distance
    const R = 3959; // Earth's radius in miles
    const dLat = (facLat - userLat) * Math.PI / 180;
    const dLng = (facLng - userLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(facLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in miles
    
    // Base speed (assuming car travel in city)
    let speed = 25; // mph base speed in city
    
    // Use simulated traffic based on selected hour
    const currentTraffic = getTrafficForHour(simulatedHour);
    
    // Adjust speed based on traffic level
    switch(currentTraffic) {
      case 'low':
        speed = 30; // Faster during low traffic
        break;
      case 'moderate':
        speed = 20; // Slower in moderate traffic
        break;
      case 'heavy':
        speed = 15; // Much slower in heavy traffic
        break;
      case 'severe':
        speed = 10; // Crawling in severe traffic (Atlanta rush hour!)
        break;
      default:
        speed = 25;
    }
    
    // Calculate time in minutes
    const time = Math.round((distance / speed) * 60);
    
    return {
      time: Math.max(1, time), // Minimum 1 minute
      distance: distance.toFixed(1)
    };
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
    const fetchUrl = `${apiUrl}/api/facilities?simulatedHour=${simulatedHour}`;
    
    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Convert position from {lat, lng} to [lat, lng] for Leaflet
          const facilitiesWithArrayPos = data.data.map(f => ({
            ...f,
            position: f.position.lat ? [f.position.lat, f.position.lng] : f.position
          }));
          setFacilities(facilitiesWithArrayPos);
          
          // Update traffic level from backend
          const newTrafficLevel = data.trafficLevel || 'moderate';
          setTrafficLevel(newTrafficLevel);
          console.log('Updated traffic level:', newTrafficLevel, 'for hour:', data.simulatedHour || 'current');
        }
      })
      .catch(err => console.error('Failed to fetch facilities:', err));
    
    // Refresh facilities every 60 seconds to show time-based changes
    const interval = setInterval(() => {
      const refreshUrl = `${apiUrl}/api/facilities?simulatedHour=${simulatedHour}`;
      
      fetch(refreshUrl)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Convert position from {lat, lng} to [lat, lng] for Leaflet
            const facilitiesWithArrayPos = data.data.map(f => ({
              ...f,
              position: f.position.lat ? [f.position.lat, f.position.lng] : f.position
            }));
            setFacilities(facilitiesWithArrayPos);
            
            // Update traffic level
            const newTrafficLevel = data.trafficLevel || 'moderate';
            setTrafficLevel(newTrafficLevel);
          }
        })
        .catch(err => console.error('Failed to refresh facilities:', err));
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, [simulatedHour]); // Re-fetch when simulated hour changes

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
  /**
   * WEIGHTED RECOMMENDATION ENGINE
   * Scores facilities based on multiple factors for each persona
   * Returns best facility with reasoning
   */
  const handleGetRecommendation = () => {
    // Check if facilities are loaded
    if (!facilities || facilities.length === 0) {
      alert('Loading facility data, please wait a moment and try again.');
      return;
    }
    
    const ers = facilities.filter(f => f.type === 'ER' && f.status === 'Open');
    const urgentCares = facilities.filter(f => f.type === 'Urgent Care' && f.status === 'Open');
    
    let result = {
      decision: '',
      facility: null,
      reasoning: [],
      travelTime: null
    };
    
    // SEVERE CASES - Always go to ER or call 911
    if (severity === 'Severe') {
      // Choose Grady (trauma center) for severe cases
      // All severe cases need ER immediately
      if (selectedPersona === 'pregnancy' || selectedPersona === 'asthma') {
        // Call 911 for pregnancy complications and severe asthma
        const grady = facilities.find(f => f.name.includes('Grady'));
        result.facility = grady || ers[0];
        result.decision = 'STAY - Call 911';
        result.travelTime = calculateTravelTime(result.facility?.position);
        
        if (selectedPersona === 'pregnancy') {
          result.reasoning = [
            'Extreme blood pressure and seizure risk requires immediate specialized care',
            'Ambulance provides critical monitoring and can administer emergency medications',
            `${result.facility?.name} has OB specialists available 24/7`,
            'Do not drive yourself - risk of seizure while driving is too high'
          ];
        } else { // asthma
          result.reasoning = [
            'Red Zone (<50% PFM) indicates severe respiratory distress',
            'Relief inhaler not working - need immediate medical intervention',
            'Ambulance can provide nebulizer treatment and oxygen en route',
            `${result.facility?.name} can provide intubation if breathing worsens`
          ];
        }
      } else if (selectedPersona === 'dementia') {
        // Severe crisis needs specialized geriatric ER
        const scored = ers.map(facility => {
          const travel = calculateTravelTime(facility.position);
          return {
            facility,
            score: (100 - facility.currentWaitTime) + (50 - travel.time * 2),
            travel
          };
        }).sort((a, b) => b.score - a.score);
        
        result.facility = scored[0].facility;
        result.decision = 'MOVE to ER with Caretaker';
        result.travelTime = scored[0].travel;
        result.reasoning = [
          'Severe crisis (screaming, hitting, paranoia) requires immediate de-escalation',
          'Caretaker should accompany to provide familiar presence and medical history',
          `${result.facility.name} has shortest wait (${result.facility.currentWaitTime} min)`,
          'Avoid bright lights and loud noises - request quiet room upon arrival'
        ];
      } else { // burn injury
        const grady = facilities.find(f => f.name.includes('Grady'));
        result.facility = grady || ers[0];
        result.decision = 'STAY - Call 911';
        result.travelTime = calculateTravelTime(result.facility?.position);
        result.reasoning = [
          'Severe burns require immediate trauma care',
          'Ambulance provides pain management and sterile wound care en route',
          `${result.facility?.name} has specialized burn unit`,
          `Facility is ${result.travelTime.distance} miles away (${result.travelTime.time} min by ambulance)`
        ];
      }
    } 
    // MODERATE CASES - Weighted scoring based on persona priorities
    else if (severity === 'Moderate') {
      const allFacilities = selectedPersona === 'burn' ? [...ers, ...urgentCares] : ers;
      
      // Score each facility based on persona-specific weights
      const scored = allFacilities.map(facility => {
        const travel = calculateTravelTime(facility.position);
        const totalTime = travel.time + facility.currentWaitTime;
        
        let score = 0;
        let weights = {};
        
        // Persona-specific weights
        if (selectedPersona === 'pregnancy') {
          weights = { waitTime: 50, travelTime: 30, expertise: 20 };
          score = (100 - facility.currentWaitTime) * (weights.waitTime / 100);
          score += (50 - travel.time) * (weights.travelTime / 100);
          score += facility.type === 'ER' ? 20 : 0; // Prefer ER
        } else if (selectedPersona === 'asthma') {
          weights = { waitTime: 40, travelTime: 40, cost: 20 };
          score = (100 - facility.currentWaitTime) * (weights.waitTime / 100);
          score += (50 - travel.time) * (weights.travelTime / 100);
          score += facility.type === 'Urgent Care' ? 20 : 0; // UC ok if has nebulizer
        } else if (selectedPersona === 'dementia') {
          weights = { waitTime: 30, travelTime: 50, familiarity: 20 };
          score = (100 - facility.currentWaitTime) * (weights.waitTime / 100);
          score += (50 - travel.time) * (weights.travelTime / 100);
          score += 20; // Closer is better for confusion
        } else { // burn
          weights = { waitTime: 40, travelTime: 30, cost: 30 };
          score = (100 - facility.currentWaitTime) * (weights.waitTime / 100);
          score += (50 - travel.time) * (weights.travelTime / 100);
          score += facility.type === 'Urgent Care' ? 30 : 0; // Cost sensitive
        }
        
        return { facility, score, travel, totalTime };
      }).sort((a, b) => b.score - a.score);
      
      result.facility = scored[0].facility;
      result.travelTime = scored[0].travel;
      result.decision = `MOVE to ${result.facility.type}`;
      
      // Generate reasoning based on persona
      if (selectedPersona === 'pregnancy') {
        result.reasoning = [
          'High blood pressure and headache need professional evaluation',
          `${result.facility.name} can run lab tests to check for pre-eclampsia`,
          `Wait time: ${result.facility.currentWaitTime} min, Travel: ${result.travelTime.time} min`,
          'Total time to see doctor: ~' + (result.travelTime.time + result.facility.currentWaitTime) + ' min'
        ];
      } else if (selectedPersona === 'asthma') {
        result.reasoning = [
          'Yellow Zone (50-80% PFM) - symptoms worsening, need nebulizer treatment',
          `${result.facility.name} can provide quick-relief treatment`,
          `${result.facility.type === 'Urgent Care' ? 'Lower cost than ER' : 'Full emergency capabilities'}`,
          `Total time: ${scored[0].totalTime} min (${result.travelTime.time} min travel + ${result.facility.currentWaitTime} min wait)`
        ];
      } else if (selectedPersona === 'dementia') {
        result.reasoning = [
          'Moderate agitation - increased confusion and restlessness',
          'Closer facility reduces stress and disorientation',
          `${result.facility.name} is only ${result.travelTime.distance} miles away`,
          'Bring comfort items and have caretaker explain each step'
        ];
      } else { // burn
        result.reasoning = [
          'Moderate burns need professional assessment',
          `${result.facility.name} has shortest total time (${scored[0].totalTime} min)`,
          result.facility.type === 'Urgent Care' ? 'Much lower cost than ER ($80-150 vs $300-500)' : 'ER provides comprehensive care',
          `Travel: ${result.travelTime.distance} mi, ${result.travelTime.time} min`
        ];
      }
    }
    // MILD CASES - Prefer Urgent Care when possible
    else {
      const availableUCs = urgentCares.filter(f => f.status === 'Open');
      
      if (availableUCs.length > 0 && selectedPersona !== 'pregnancy') {
        // Score urgent cares
        const scored = availableUCs.map(facility => {
          const travel = calculateTravelTime(facility.position);
          const totalTime = travel.time + facility.currentWaitTime;
          return { facility, travel, totalTime };
        }).sort((a, b) => a.totalTime - b.totalTime);
        
        result.facility = scored[0].facility;
        result.travelTime = scored[0].travel;
        result.decision = 'MOVE to Urgent Care';
        result.reasoning = [
          selectedPersona === 'burn' ? 'Minor burns can be treated at Urgent Care' : 
          selectedPersona === 'asthma' ? 'Green Zone (80-100% PFM) - symptoms controlled, routine check recommended' :
          'Mild distress can be managed with calming environment',
          `${result.facility.name} has shortest total time (${scored[0].totalTime} min)`,
          `Much lower cost than ER ($80-150 vs $300-500)`,
          `Travel: ${result.travelTime.distance} mi in ${result.travelTime.time} min`
        ];
      } else {
        // Pregnancy with mild symptoms or all UCs closed - go to ER
        const scored = ers.map(facility => {
          const travel = calculateTravelTime(facility.position);
          return { facility, travel, totalTime: travel.time + facility.currentWaitTime };
        }).sort((a, b) => a.totalTime - b.totalTime);
        
        result.facility = scored[0].facility;
        result.travelTime = scored[0].travel;
        result.decision = availableUCs.length === 0 ? 'MOVE to ER (Urgent Care closed)' : 'MOVE to ER';
        result.reasoning = [
          selectedPersona === 'pregnancy' ? 'Any pregnancy symptoms should be evaluated at ER' : 'Urgent Care centers are currently closed',
          `${result.facility.name} has shortest wait (${result.facility.currentWaitTime} min)`,
          `Travel: ${result.travelTime.distance} mi, ${result.travelTime.time} min`,
          availableUCs.length === 0 ? 'Still appropriate for mild symptoms' : 'Better safe than sorry during pregnancy'
        ];
      }
    }

    // Highlight facility on map and scroll to recommendation
    setHighlightedFacilityId(result.facility?.id);
    setRecommendation(result);
    
    // Auto-scroll to recommendation
    setTimeout(() => {
      document.querySelector('.recommendation-result')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }, 100);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>EVAC+</h1>
        <p className="subtitle">Emergency Evacuation & Care Access Platform</p>
        <div className="header-badges">
          <div className={`status-badge ${backendStatus === 'Connected' ? 'status-connected' : 'status-disconnected'}`}>
            {backendStatus === 'Connected' ? 'Backend Connected' : 'Backend NOT CONNECTED'}
          </div>
          <div className={`traffic-badge traffic-${trafficLevel}`}>
            Traffic: {trafficLevel.toUpperCase()}
          </div>
        </div>
      </header>

      <main className="App-main">
        <section className="info-card">
          <h2>Patient Profile & Severity</h2>
          <div className="input-panel">
            <div className="time-simulator">
              <label><strong>Time of Day Simulator:</strong></label>
              <select 
                value={simulatedHour === null ? new Date().getHours() : simulatedHour} 
                onChange={(e) => {
                  const newHour = parseInt(e.target.value);
                  setSimulatedHour(newHour);
                  console.log('Time changed to:', `${newHour}:00`);
                }}
                className="time-selector"
              >
                <option value="0">12 AM - Midnight</option>
                <option value="2">2 AM - Late Night</option>
                <option value="6">6 AM - Early Morning</option>
                <option value="7">7 AM - Morning Rush Hour</option>
                <option value="9">9 AM - Business Hours Start</option>
                <option value="12">12 PM - Noon / Lunch Time</option>
                <option value="14">2 PM - Afternoon</option>
                <option value="16">4 PM - Pre-Rush Hour</option>
                <option value="17">5 PM - Evening Rush Hour</option>
                <option value="19">7 PM - Evening</option>
                <option value="20">8 PM - Evening (UC Closing)</option>
                <option value="22">10 PM - Night</option>
              </select>
              <p className="simulator-note">Defaults to current hour. Select different times to see how recommendations change.</p>
              <div className="current-conditions">
                <span><strong>Selected Time:</strong> {`${simulatedHour % 12 || 12}:00 ${simulatedHour >= 12 ? 'PM' : 'AM'}`}</span>
                <span className="traffic-dot"><strong>Traffic:</strong> <span className={`traffic-${trafficLevel}`}>{trafficLevel.toUpperCase()}</span></span>
              </div>
            </div>
            
            <div className="persona-selector">
              <label><strong>Select Profile:</strong></label>
              <select 
                value={selectedPersona} 
                onChange={(e) => {
                  setSelectedPersona(e.target.value);
                  setRecommendation(null);
                  setHighlightedFacilityId(null);
                }}
                className="persona-dropdown"
              >
                <option value="burn">Single Mother with Burn Injury</option>
                <option value="pregnancy">Pregnant Woman with Pre-eclampsia</option>
                <option value="asthma">Adult with Asthma Attack</option>
                <option value="dementia">Elder with Dementia</option>
              </select>
            </div>

            <div className="profile-display">
              <h3>Profile: {personas[selectedPersona].name}</h3>
              <p>Age: {personas[selectedPersona].age} | {personas[selectedPersona].description}</p>
              <p className="location-info">Current Location: Klaus Building, Georgia Tech (266 Ferst Dr NW)</p>
            </div>
            
            <div className="severity-selector">
              <label><strong>{personas[selectedPersona].severityLabel}:</strong></label>
              <div className="severity-buttons">
                <button 
                  className={severity === 'Mild' ? 'severity-btn active' : 'severity-btn'}
                  onClick={() => setSeverity('Mild')}
                  title={
                    selectedPersona === 'pregnancy' ? personas.pregnancy.trimesters.Mild :
                    selectedPersona === 'asthma' ? personas.asthma.zones.Mild :
                    selectedPersona === 'dementia' ? personas.dementia.levels.Mild :
                    'Minor injury'
                  }
                >
                  Mild
                </button>
                <button 
                  className={severity === 'Moderate' ? 'severity-btn active' : 'severity-btn'}
                  onClick={() => setSeverity('Moderate')}
                  title={
                    selectedPersona === 'pregnancy' ? personas.pregnancy.trimesters.Moderate :
                    selectedPersona === 'asthma' ? personas.asthma.zones.Moderate :
                    selectedPersona === 'dementia' ? personas.dementia.levels.Moderate :
                    'Serious condition'
                  }
                >
                  Moderate
                </button>
                <button 
                  className={severity === 'Severe' ? 'severity-btn active' : 'severity-btn'}
                  onClick={() => setSeverity('Severe')}
                  title={
                    selectedPersona === 'pregnancy' ? personas.pregnancy.trimesters.Severe :
                    selectedPersona === 'asthma' ? personas.asthma.zones.Severe :
                    selectedPersona === 'dementia' ? personas.dementia.levels.Severe :
                    'Life-threatening'
                  }
                >
                  Severe
                </button>
              </div>
              <p className="severity-hint">
                {selectedPersona === 'pregnancy' && personas.pregnancy.trimesters[severity]}
                {selectedPersona === 'asthma' && personas.asthma.zones[severity]}
                {selectedPersona === 'dementia' && personas.dementia.levels[severity]}
                {selectedPersona === 'burn' && (
                  severity === 'Mild' ? 'Minor burns - redness, minor pain' :
                  severity === 'Moderate' ? 'Serious burns - blistering, severe pain' :
                  'Severe burns - deep tissue damage, life-threatening'
                )}
              </p>
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
                {recommendation.travelTime && (
                  <p><strong>Travel Time:</strong> {recommendation.travelTime.time} min ({recommendation.travelTime.distance} miles)</p>
                )}
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
            
            {/* Traffic congestion zones - dynamically update based on traffic level */}
            {trafficLevel === 'severe' && (
              <>
                <Circle
                  center={[33.7706, -84.3880]}
                  radius={800}
                  pathOptions={{ color: '#ff6b6b', fillColor: '#ff6b6b', fillOpacity: 0.3, weight: 2 }}
                />
                <Circle
                  center={[33.7850, -84.3750]}
                  radius={700}
                  pathOptions={{ color: '#ff6b6b', fillColor: '#ff6b6b', fillOpacity: 0.3, weight: 2 }}
                />
                <Circle
                  center={[33.7650, -84.3800]}
                  radius={600}
                  pathOptions={{ color: '#ff6b6b', fillColor: '#ff6b6b', fillOpacity: 0.3, weight: 2 }}
                />
              </>
            )}
            {trafficLevel === 'heavy' && (
              <>
                <Circle
                  center={[33.7706, -84.3880]}
                  radius={600}
                  pathOptions={{ color: '#ff8787', fillColor: '#ff8787', fillOpacity: 0.25, weight: 2 }}
                />
                <Circle
                  center={[33.7850, -84.3750]}
                  radius={500}
                  pathOptions={{ color: '#ff8787', fillColor: '#ff8787', fillOpacity: 0.25, weight: 2 }}
                />
              </>
            )}
            {trafficLevel === 'moderate' && (
              <Circle
                center={[33.7706, -84.3880]}
                radius={400}
                pathOptions={{ color: '#ffa94d', fillColor: '#ffa94d', fillOpacity: 0.2, weight: 2 }}
              />
            )}

            {/* Profile location marker */}
            <Circle
              center={userLocation}
              radius={50}
              pathOptions={{ color: '#2b8a3e', fillColor: '#51cf66', fillOpacity: 0.6, weight: 3 }}
            />
            <Marker 
              position={userLocation}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2b8a3e' }}>Profile Location</h3>
                  <p style={{ margin: '5px 0', fontSize: '13px' }}>Klaus Building, Georgia Tech</p>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>266 Ferst Dr NW</p>
                </div>
              </Popup>
            </Marker>

            {facilities.length > 0 && facilities.map(facility => (
              <React.Fragment key={facility.id}>
                {/* Highlight circle for recommended facility */}
                {highlightedFacilityId === facility.id && (
                  <Circle
                    center={facility.position}
                    radius={300}
                    pathOptions={{ 
                      color: '#ffd43b',
                      fillColor: '#ffd43b',
                      fillOpacity: 0.25,
                      weight: 4,
                      dashArray: '10, 10'
                    }}
                  />
                )}
                
                {/* Capacity circle - size based on wait time */}
                <Circle
                  center={facility.position}
                  radius={getCapacityRadius(facility.waitTime)}
                  pathOptions={{ 
                    color: facility.type === 'ER' ? '#ff6b6b' : '#4dabf7',
                    fillColor: facility.type === 'ER' ? '#ff6b6b' : '#4dabf7',
                    fillOpacity: 0.15,
                    weight: highlightedFacilityId === facility.id ? 3 : 2
                  }}
                />
                
                {/* Facility marker - gold if recommended, otherwise red/blue */}
                <Marker 
                  position={facility.position}
                  icon={
                    highlightedFacilityId === facility.id 
                      ? highlightedIcon 
                      : (facility.type === 'ER' ? hospitalIcon : urgentCareIcon)
                  }
                >
                  <Popup>
                    <div style={{ minWidth: '220px' }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{facility.name}</h3>
                      <p style={{ margin: '5px 0' }}><strong>Type:</strong> {facility.type}</p>
                      <p style={{ margin: '5px 0' }}><strong>Wait Time:</strong> {facility.waitTimeDisplay || `${facility.currentWaitTime} min`}</p>
                      {(() => {
                        const travel = calculateTravelTime(facility.position);
                        return travel.time > 0 ? (
                          <p style={{ margin: '5px 0' }}><strong>Travel Time:</strong> ~{travel.time} min ({travel.distance} mi)</p>
                        ) : null;
                      })()}
                      <p style={{ margin: '5px 0' }}><strong>Insurance:</strong> {facility.insurance?.join(', ')}</p>
                      <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={{ color: facility.status === 'Open' ? 'green' : 'red' }}>{facility.status}</span></p>
                      {facility.hours && <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>{facility.hours}</p>}
                      <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#999', borderTop: '1px solid #eee', paddingTop: '5px' }}>Traffic: {trafficLevel}</p>
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
