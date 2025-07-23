# CodeSync WebSocket Server

This is the WebSocket server for CodeSync's collaborative editing feature.

## Setup

1. Install dependencies:
```bash
cd websocket-server
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

- Default port: 1234
- Set custom port: `PORT=3001 npm start`

## Features

- Real-time collaborative editing using Yjs
- Room-based collaboration
- Automatic room cleanup
- Connection management
- Health check endpoint

## API

### WebSocket Connection
Connect to: `ws://localhost:1234?room=ROOM_ID`

### Health Check
GET: `http://localhost:1234/health`

## Room Management

- Rooms are created automatically when first client connects
- Rooms are cleaned up 30 seconds after last client disconnects
- Each room maintains its own Yjs document state