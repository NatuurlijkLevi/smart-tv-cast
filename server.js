const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const DeviceDiscovery = require('./lib/deviceDiscovery');
const CastManager = require('./lib/castManager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize device discovery and cast manager
const deviceDiscovery = new DeviceDiscovery();
const castManager = new CastManager();

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New WebSocket client connected');
  
  // Send current devices to new client
  ws.send(JSON.stringify({
    type: 'devices',
    devices: Array.from(deviceDiscovery.devices.values())
  }));

  ws.on('close', () => {
    clients.remove(ws);
    console.log('WebSocket client disconnected');
  });
});

// Broadcast device updates to all connected clients
function broadcastDevices() {
  const message = JSON.stringify({
    type: 'devices',
    devices: Array.from(deviceDiscovery.devices.values())
  });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Device discovery event handlers
deviceDiscovery.on('deviceFound', (device) => {
  console.log(`Device found: ${device.name} (${device.host}:${device.port})`);
  broadcastDevices();
});

deviceDiscovery.on('deviceLost', (device) => {
  console.log(`Device lost: ${device.name}`);
  broadcastDevices();
});

// API Routes

// Get all discovered devices
app.get('/api/devices', (req, res) => {
  res.json({
    devices: Array.from(deviceDiscovery.devices.values())
  });
});

// Start casting to selected devices
app.post('/api/cast', async (req, res) => {
  const { deviceIds, url } = req.body;
  
  if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
    return res.status(400).json({ error: 'Device IDs are required' });
  }
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const results = await castManager.castToDevices(deviceIds, url, deviceDiscovery.devices);
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Cast error:', error);
    res.status(500).json({
      error: 'Failed to cast to devices',
      message: error.message
    });
  }
});

// Stop casting on selected devices
app.post('/api/stop', async (req, res) => {
  const { deviceIds } = req.body;
  
  if (!deviceIds || !Array.isArray(deviceIds)) {
    return res.status(400).json({ error: 'Device IDs are required' });
  }
  
  try {
    const results = await castManager.stopCasting(deviceIds);
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Stop error:', error);
    res.status(500).json({
      error: 'Failed to stop casting',
      message: error.message
    });
  }
});

// Get casting status
app.get('/api/status', (req, res) => {
  res.json({
    activeCasts: castManager.getActiveCasts()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Smart TV Cast server running on http://localhost:${PORT}`);
  
  // Start device discovery
  deviceDiscovery.start();
  console.log('Device discovery started...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  deviceDiscovery.stop();
  castManager.stopAll();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
