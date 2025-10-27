const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static overlay files
app.use(cors());
app.use(express.static(path.join(__dirname, 'overlays')));

const server = app.listen(PORT, () => {
  console.log(`Overlay server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Store recent events for new connections
const recentEvents = {
  voice_update: [],
  stats: null,
  activity: [],
  milestones: [],
};

const MAX_ACTIVITY_EVENTS = 10;
const MAX_MILESTONE_EVENTS = 5;

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Send recent data to new connections
  if (recentEvents.stats) {
    ws.send(JSON.stringify({ type: 'stats', data: recentEvents.stats }));
  }
  
  if (recentEvents.voice_update.length > 0) {
    ws.send(JSON.stringify({ 
      type: 'voice_update', 
      data: recentEvents.voice_update 
    }));
  }
  
  recentEvents.activity.forEach(event => {
    ws.send(JSON.stringify(event));
  });
  
  ws.on('message', (message) => {
    try {
      const event = JSON.parse(message);
      
      // Store events for replay
      switch (event.type) {
        case 'voice_update':
          recentEvents.voice_update = event.data;
          break;
        case 'stats':
          recentEvents.stats = event.data;
          break;
        case 'message':
        case 'member_join':
          recentEvents.activity.unshift(event);
          recentEvents.activity = recentEvents.activity.slice(0, MAX_ACTIVITY_EVENTS);
          break;
        case 'milestone':
          recentEvents.milestones.unshift(event);
          recentEvents.milestones = recentEvents.milestones.slice(0, MAX_MILESTONE_EVENTS);
          break;
      }
      
      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: wss.clients.size,
    uptime: process.uptime(),
  });
});

console.log('WebSocket server ready');