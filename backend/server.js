/**
 * EVAC+ Backend API Server
 * Emergency Evacuation & Care Access Platform
 * 
 * This server provides REST API endpoints for:
 * 1. Facility data (hospitals and urgent care centers in Midtown Atlanta)
 * 2. Decision engine (Stay/Move/Hybrid recommendations)
 * 3. Routing information (travel times and directions)
 * 
 * Built with Express.js - runs on port 3001 by default
 */

require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const cors = require('cors');  // Allow cross-origin requests from frontend
const bodyParser = require('body-parser');  // Parse JSON request bodies

const app = express();
const PORT = process.env.PORT || 3001;  // Use port from .env or default to 3001

// ===== CORS CONFIGURATION =====
// Allow frontend to make requests from different domain (needed for hosting)
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',  // Allow all origins in development
  credentials: true
};

// ===== MIDDLEWARE CONFIGURATION =====
// These run on every request to process data and enable features

app.use(cors(corsOptions));  // Allow frontend to communicate with backend (works in dev and production)
app.use(bodyParser.json());  // Parse JSON data in request bodies
app.use(bodyParser.urlencoded({ extended: true }));  // Parse URL-encoded form data

// ===== HEALTH CHECK ENDPOINT =====
/**
 * GET /api/health
 * Simple endpoint to verify the server is running
 * Frontend calls this on startup to check backend connection
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EVAC+ Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// ===== FACILITY DATA =====
/**
 * TIME-BASED SIMULATION FUNCTIONS
 * These create realistic patterns based on Atlanta's actual conditions
 * No APIs needed - uses time of day to adjust wait times and traffic
 */

/**
 * Get current hour in Atlanta timezone (EST/EDT)
 * @returns {number} Current hour (0-23)
 */
const getAtlantaHour = () => {
  return new Date().getHours();
};

/**
 * Calculate wait time multiplier based on time of day
 * Based on real Atlanta ER patterns:
 * - Morning (6-10am): Moderate traffic, fewer patients
 * - Midday (10am-2pm): Lower traffic, steady patients  
 * - Afternoon Rush (2-7pm): Heavy traffic, more patients
 * - Evening (7pm-midnight): Moderate traffic, moderate patients
 * - Night (midnight-6am): Low traffic, fewer patients
 * 
 * @param {string} facilityType - 'ER' or 'Urgent Care'
 * @returns {number} Multiplier for base wait time (0.5 = half wait, 2.0 = double wait)
 */
const getTimeMultiplier = (facilityType) => {
  const hour = getAtlantaHour();
  
  if (facilityType === 'ER') {
    // ERs are busiest during evening rush and nights (accidents, emergencies)
    if (hour >= 18 && hour < 23) return 1.8;  // 6pm-11pm: Peak ER time
    if (hour >= 14 && hour < 18) return 1.5;  // 2pm-6pm: Afternoon rush
    if (hour >= 10 && hour < 14) return 1.0;  // 10am-2pm: Normal
    if (hour >= 6 && hour < 10) return 1.2;   // 6am-10am: Morning moderate
    return 0.7;  // Midnight-6am: Quieter
  } else { // Urgent Care
    // Urgent Care busiest during business hours, closed at night
    if (hour >= 9 && hour < 12) return 1.6;   // 9am-noon: Morning rush
    if (hour >= 12 && hour < 14) return 1.3;  // Noon-2pm: Lunch time
    if (hour >= 14 && hour < 18) return 1.8;  // 2pm-6pm: After-work rush
    if (hour >= 18 && hour < 20) return 1.4;  // 6pm-8pm: Early evening
    if (hour >= 20 || hour < 8) return 0;     // Closed overnight
    return 1.0;  // Other times: Normal
  }
};

/**
 * Get traffic congestion level for current time
 * Based on real Atlanta traffic patterns (notorious for rush hour!)
 * @returns {string} 'low', 'moderate', 'heavy', or 'severe'
 */
const getTrafficLevel = () => {
  const hour = getAtlantaHour();
  
  // Atlanta rush hours are brutal
  if ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 19)) {
    return 'severe';  // Morning and evening rush hour
  }
  if ((hour >= 6 && hour < 7) || (hour >= 10 && hour < 12) || (hour >= 14 && hour < 16)) {
    return 'heavy';  // Pre-rush and midday business traffic
  }
  if (hour >= 12 && hour < 14) {
    return 'moderate';  // Lunch hour
  }
  return 'low';  // Night and very early morning
};

/**
 * Real facilities in Midtown Atlanta with BASE wait times
 * Actual wait times are calculated dynamically using getTimeMultiplier()
 * This creates realistic patterns without needing real-time APIs
 */
const baseFacilities = [
  {
    id: 1,
    name: 'Grady Memorial Hospital',
    type: 'ER',
    position: { lat: 33.7557, lng: -84.3816 },
    baseWaitTime: 45,  // Base wait time - will be adjusted by time of day
    insurance: ['All'],
    specialties: ['Emergency', 'Trauma', 'Cardiac'],
    description: 'Level I Trauma Center - Handles most severe emergencies'
  },
  {
    id: 2,
    name: 'Emory Midtown Hospital',
    type: 'ER',
    position: { lat: 33.7806, lng: -84.3722 },
    baseWaitTime: 30,
    insurance: ['Most major'],
    specialties: ['Emergency', 'Cardiac', 'Orthopedic'],
    description: 'Well-equipped ER with cardiac specialists'
  },
  {
    id: 3,
    name: 'Piedmont Hospital',
    type: 'ER',
    position: { lat: 33.8048, lng: -84.3685 },
    baseWaitTime: 50,
    insurance: ['All'],
    specialties: ['Emergency', 'Trauma', 'Stroke'],
    description: 'Comprehensive ER with stroke center'
  },
  {
    id: 4,
    name: 'WellStreet Urgent Care - Midtown',
    type: 'Urgent Care',
    position: { lat: 33.7712, lng: -84.3850 },
    baseWaitTime: 15,
    insurance: ['Most major'],
    specialties: ['Urgent Care', 'X-Ray'],
    description: 'Quick walk-in care for minor injuries',
    hours: '8am-8pm daily'
  },
  {
    id: 5,
    name: 'Peachtree Immediate Care',
    type: 'Urgent Care',
    position: { lat: 33.7890, lng: -84.3840 },
    baseWaitTime: 18,
    insurance: ['Most major'],
    specialties: ['Urgent Care', 'Lab Services'],
    description: 'Full-service urgent care with lab',
    hours: '8am-8pm daily'
  }
];

/**
 * Get facilities with dynamically calculated wait times
 * This function applies time-based multipliers to create realistic patterns
 * @returns {Array} Facilities with current wait times and status
 */
const getFacilitiesWithCurrentStatus = () => {
  const hour = getAtlantaHour();
  
  return baseFacilities.map(facility => {
    const multiplier = getTimeMultiplier(facility.type);
    
    // Calculate current wait time
    const currentWaitTime = Math.round(facility.baseWaitTime * multiplier);
    
    // Determine if urgent care is open
    let status = 'Open';
    if (facility.type === 'Urgent Care' && (hour < 8 || hour >= 20)) {
      status = 'Closed';
    }
    
    return {
      ...facility,
      currentWaitTime,
      waitTimeDisplay: currentWaitTime > 0 ? `${currentWaitTime} min` : 'Closed',
      status,
      capacity: currentWaitTime < 20 ? 'High' : currentWaitTime < 40 ? 'Medium' : 'Low'
    };
  });
};

// ===== API ENDPOINTS =====

/**
 * GET /api/facilities
 * Returns list of all emergency care facilities with CURRENT wait times
 * Wait times are calculated dynamically based on time of day
 * This creates realistic patterns without needing real-time APIs
 * 
 * Query parameters:
 * - simulatedHour (optional): Hour 0-23 to simulate specific time
 * 
 * Response includes:
 * - Current wait times (adjusted for time of day)
 * - Open/closed status
 * - Traffic level
 * - Time of last update
 */
app.get('/api/facilities', (req, res) => {
  // Check if simulated hour is provided
  const simulatedHour = req.query.simulatedHour ? parseInt(req.query.simulatedHour) : null;
  
  // Override getAtlantaHour if simulating
  const originalGetAtlantaHour = getAtlantaHour;
  if (simulatedHour !== null && simulatedHour >= 0 && simulatedHour <= 23) {
    // Temporarily override the hour function
    global.getAtlantaHour = () => simulatedHour;
  }
  
  const facilities = getFacilitiesWithCurrentStatus();
  const trafficLevel = getTrafficLevel();
  
  // Restore original function
  if (simulatedHour !== null) {
    global.getAtlantaHour = originalGetAtlantaHour;
  }
  
  res.json({
    success: true,
    data: facilities,
    trafficLevel,  // Current or simulated traffic conditions
    lastUpdated: new Date().toISOString(),
    simulatedHour: simulatedHour,
    simulationNote: simulatedHour !== null 
      ? `Simulating ${simulatedHour}:00 (${simulatedHour % 12 || 12}${simulatedHour >= 12 ? 'PM' : 'AM'})`
      : 'Using current time'
  });
});

/**
 * POST /api/decision
 * Decision engine endpoint - analyzes patient info and recommends action
 * 
 * Request body should include:
 * - age: patient age
 * - healthStatus: 'mild', 'moderate', or 'critical'
 * - mobility: 'full', 'limited', etc.
 * - location: current coordinates
 * 
 * Returns:
 * - recommendation: 'STAY', 'MOVE', or 'HYBRID'
 * - reasoning: array of reasons for this recommendation
 * - suggestedFacility: which facility to use
 */
app.post('/api/decision', (req, res) => {
  const { age, healthStatus, mobility, location } = req.body;
  
  let recommendation = 'MOVE';
  let reasoning = [];
  
  // Decision logic based on patient factors
  if (age > 65 || healthStatus === 'critical' || mobility === 'limited') {
    recommendation = 'STAY';  // Call ambulance for high-risk patients
    reasoning.push('Age, health status, or mobility suggests ambulance dispatch');
  } else if (healthStatus === 'moderate') {
    recommendation = 'HYBRID';  // Combination approach for moderate cases
    reasoning.push('Moderate condition suggests hybrid approach');
  } else {
    recommendation = 'MOVE';  // Patient can safely travel independently
    reasoning.push('User can safely travel to nearest facility');
  }
  
  res.json({
    success: true,
    recommendation,
    reasoning,
    suggestedFacility: facilities[0]  // TODO: Implement smart facility selection
  });
});

/**
 * GET /api/route
 * Provides routing information between two points
 * In production, this would integrate with a real routing service
 * 
 * Query parameters:
 * - origin: starting location
 * - destination: ending location
 * 
 * Returns estimated travel time and turn-by-turn directions
 */
app.get('/api/route', (req, res) => {
  const { origin, destination } = req.query;
  
  // Placeholder routing data - would use real routing API in production
  res.json({
    success: true,
    data: {
      distance: '2.3 miles',
      duration: '8 minutes',
      steps: [
        'Head north on Peachtree St',
        'Turn right on 10th St',
        'Arrive at destination'
      ]
    }
  });
});

// ===== ERROR HANDLING =====

/**
 * 404 Handler - catches requests to non-existent endpoints
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * General error handler - catches any unexpected errors
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ===== SERVER STARTUP =====
/**
 * Start the Express server and listen for requests
 * Logs the server URL for easy access during development
 */
app.listen(PORT, () => {
  console.log(`EVAC+ Backend API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
