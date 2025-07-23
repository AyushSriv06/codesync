const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = process.env.PORT || 1234;

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

  // Set up Yjs WebSocket connection
  // setupWSConnection handles Y.Doc creation/retrieval and connection management
  // It also handles garbage collection when gc: true is set
  setupWSConnection(ws, req, {
    docName: roomId,
    gc: true // Ensures Y.Doc is garbage collected when no clients are connected
  });

  // Handle connection close
  ws.on('close', () => {
    console.log(`Client disconnected from room: ${roomId}`);
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
      status: 'healthy'
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