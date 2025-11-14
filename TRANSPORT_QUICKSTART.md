# Quick Start: Custom Multiplayer Transports

## 🎯 Overview

The game engine supports multiple communication methods through a transport adapter pattern. You can use:

- **WebSocket** - Server-based communication (included)
- **Custom** - Any protocol you want (WebRTC, Socket.io, Firebase, gRPC, etc.)

**Note:** As of v1.1.0, a transport must be explicitly provided.

## 🚀 Quick Examples

### WebSocket Transport

```javascript
import { Game, WebSocketTransport } from './dist/swordfight-engine.js';

const transport = new WebSocketTransport(null, {
  serverUrl: 'ws://localhost:8080'
});

const game = new Game('room-123', 'human-fighter', 'goblin-fighter', {
  transport: transport
});
```

### Run WebSocket Server

```bash
# Install dependencies
npm install ws

# Start the example server
node examples/websocket-server.js

# Server runs on ws://localhost:8080
```

## 📦 What's Exported

```javascript
import {
  Game,                    // Main game class
  CharacterLoader,         // Load characters dynamically
  MultiplayerTransport,    // Base class for custom transports
  WebSocketTransport       // WebSocket transport
} from './dist/swordfight-engine.js';
```

## 🔧 Create Custom Transport

```javascript
import { MultiplayerTransport } from './dist/swordfight-engine.js';

class MyTransport extends MultiplayerTransport {
  async connect(roomId) {
    // Connect to your service
    this.started = true;
  }

  sendMove(data) {
    // Send move to opponent
  }

  getMove(callback) {
    // Register callback for opponent moves
  }

  sendName(data) {
    // Send player name
  }

  getName(callback) {
    // Register callback for opponent name
  }

  getPeerCount() {
    return this.started ? 1 : 0;
  }

  disconnect() {
    // Cleanup
  }
}

// Use it
const transport = new MyTransport();
const game = new Game('room-id', 'human', 'goblin', { transport });
```

## 📚 Documentation

- `MULTIPLAYER_TRANSPORTS.md` - Complete guide
- `TRANSPORT_IMPLEMENTATION.md` - Implementation details  
- `examples/transport-usage.js` - Usage examples
- `examples/websocket-server.js` - WebSocket server example

## ✅ Backward Compatible

All existing code continues to work without any changes. The transport system is opt-in.
