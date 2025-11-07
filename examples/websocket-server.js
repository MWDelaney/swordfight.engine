/**
 * Example WebSocket Server for SwordFight Engine
 *
 * This is a simple reference implementation showing how to create
 * a WebSocket server that works with WebSocketTransport.
 *
 * Install: npm install ws
 * Run: node examples/websocket-server.js
 */

import { WebSocketServer } from 'ws';

const PORT = 8080;
const rooms = new Map(); // roomId -> Set of connections

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server listening on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('New connection');

  let currentRoom = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
      case 'join':
        handleJoin(ws, message.roomId);
        currentRoom = message.roomId;
        break;

      case 'leave':
        handleLeave(ws, currentRoom);
        currentRoom = null;
        break;

      case 'move':
      case 'name':
        handleBroadcast(ws, currentRoom, message);
        break;

      default:
        console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Connection closed');
    if (currentRoom) {
      handleLeave(ws, currentRoom);
    }
  });
});

function handleJoin(ws, roomId) {
  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  const room = rooms.get(roomId);

  // Check if room is full
  if (room.size >= 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room is full'
    }));
    ws.send(JSON.stringify({
      type: 'room-full'
    }));
    return;
  }

  // Add player to room
  room.add(ws);

  console.log(`Player joined room ${roomId} (${room.size}/2 players)`);

  // Confirm join
  ws.send(JSON.stringify({
    type: 'joined',
    roomId: roomId
  }));

  // Notify other player if room now has 2 players
  if (room.size === 2) {
    room.forEach((client) => {
      client.send(JSON.stringify({
        type: 'peer-joined'
      }));
    });
  }
}

function handleLeave(ws, roomId) {
  if (!roomId || !rooms.has(roomId)) {
    return;
  }

  const room = rooms.get(roomId);
  room.delete(ws);

  console.log(`Player left room ${roomId} (${room.size}/2 players)`);

  // Notify remaining player
  room.forEach((client) => {
    client.send(JSON.stringify({
      type: 'peer-left'
    }));
  });

  // Clean up empty rooms
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted`);
  }
}

function handleBroadcast(ws, roomId, message) {
  if (!roomId || !rooms.has(roomId)) {
    return;
  }

  const room = rooms.get(roomId);

  // Send to all other players in the room
  room.forEach((client) => {
    if (client !== ws && client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: message.type,
        data: message.data
      }));
    }
  });
}

// Cleanup on server shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
