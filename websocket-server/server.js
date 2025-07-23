const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 1234;

// Store for active rooms and their documents
const rooms = new Map();
const roomConnections = new Map();

// Create WebSocket server
const wss = new WebSocket.Server({
  port: PORT,
  perMessageDeflate: {
    zlibDeflateOptions: {
      threshold: 1024,
      concurrencyLimit: 10,
    },
    threshold: 1024,
  }
});

console.log(`🚀 WebSocket server running on port ${PORT}`);

// Handle new connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Extract room ID from URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room');
  
  if (!roomId) {
    console.log('Connection rejected: No room ID provided');
    ws.close(1008, 'Room ID required');
    return;
  }

  console.log(`Client joining room: ${roomId}`);

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    const doc = new Y.Doc();
    rooms.set(roomId, doc);
    roomConnections.set(roomId, new Set());
    
    // Initialize with default content
    const yText = doc.getText('monaco');
    yText.insert(0, '// Welcome to collaborative coding!\n// Start typing to see real-time collaboration in action.\n\nconsole.log("Hello, collaborative world!");');
    
    console.log(`Created new room: ${roomId}`);
  }

  // Add connection to room
  const connections = roomConnections.get(roomId);
  connections.add(ws);

  // Set up Yjs WebSocket connection
  setupWSConnection(ws, req, {
    docName: roomId,
    gc: true
  });

  // Handle connection close
  ws.on('close', () => {
    console.log(`Client disconnected from room: ${roomId}`);
    connections.delete(ws);
    
    // Clean up empty rooms after a delay
    setTimeout(() => {
      if (connections.size === 0) {
        console.log(`Cleaning up empty room: ${roomId}`);
        rooms.delete(roomId);
        roomConnections.delete(roomId);
      }
    }, 30000); // 30 seconds delay
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

// Health check endpoint (if needed)
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      rooms: rooms.size,
      connections: Array.from(roomConnections.values()).reduce((total, set) => total + set.size, 0)
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Optional: Run HTTP server on different port for health checks
// server.listen(PORT + 1, () => {
//   console.log(`Health check server running on port ${PORT + 1}`);
// });