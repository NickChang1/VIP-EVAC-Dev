require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EVAC+ Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Facilities data for Midtown Atlanta
const facilities = [
  {
    id: 1,
    name: 'Grady Memorial Hospital',
    type: 'ER',
    position: { lat: 33.7557, lng: -84.3816 },
    capacity: 'High',
    currentWaitTime: 45,
    insurance: ['All'],
    status: 'Open',
    specialties: ['Emergency', 'Trauma', 'Cardiac']
  },
  {
    id: 2,
    name: 'Emory Midtown Hospital',
    type: 'ER',
    position: { lat: 33.7806, lng: -84.3722 },
    capacity: 'Medium',
    currentWaitTime: 30,
    insurance: ['Most major'],
    status: 'Open',
    specialties: ['Emergency', 'Cardiac', 'Orthopedic']
  },
  {
    id: 3,
    name: 'Piedmont Hospital',
    type: 'ER',
    position: { lat: 33.8048, lng: -84.3685 },
    capacity: 'High',
    currentWaitTime: 60,
    insurance: ['All'],
    status: 'Open',
    specialties: ['Emergency', 'Trauma', 'Stroke']
  },
  {
    id: 4,
    name: 'WellStreet Urgent Care - Midtown',
    type: 'Urgent Care',
    position: { lat: 33.7712, lng: -84.3850 },
    capacity: 'Low',
    currentWaitTime: 15,
    insurance: ['Most major'],
    status: 'Open',
    specialties: ['Urgent Care', 'X-Ray']
  },
  {
    id: 5,
    name: 'Peachtree Immediate Care',
    type: 'Urgent Care',
    position: { lat: 33.7890, lng: -84.3840 },
    capacity: 'Low',
    currentWaitTime: 20,
    insurance: ['Most major'],
    status: 'Open',
    specialties: ['Urgent Care', 'Lab Services']
  }
];

// API routes
app.get('/api/facilities', (req, res) => {
  res.json({
    success: true,
    data: facilities
  });
});

app.post('/api/decision', (req, res) => {
  // Simple decision engine logic
  const { age, healthStatus, mobility, location } = req.body;
  
  let recommendation = 'MOVE';
  let reasoning = [];
  
  // Basic decision logic
  if (age > 65 || healthStatus === 'critical' || mobility === 'limited') {
    recommendation = 'STAY';
    reasoning.push('Age, health status, or mobility suggests ambulance dispatch');
  } else if (healthStatus === 'moderate') {
    recommendation = 'HYBRID';
    reasoning.push('Moderate condition suggests hybrid approach');
  } else {
    recommendation = 'MOVE';
    reasoning.push('User can safely travel to nearest facility');
  }
  
  res.json({
    success: true,
    recommendation,
    reasoning,
    suggestedFacility: facilities[0] // For now, suggest first facility
  });
});

app.get('/api/route', (req, res) => {
  // Simple routing response (in real app, would calculate actual route)
  const { origin, destination } = req.query;
  
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`EVAC+ Backend API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
