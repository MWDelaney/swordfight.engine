# Multiplayer Transport System

The game engine supports multiple communication methods through a transport adapter pattern. This allows you to use WebSockets, WebRTC (via custom implementation), or any custom protocol.

## Architecture

```
Game Class
    ↓
Multiplayer Class
    ↓
MultiplayerTransport (Interface)
    ↓
├── WebSocketTransport (WebSocket)
└── Custom implementations (WebRTC, Socket.io, etc.)
```

## Using Different Transports

**Note:** As of version 1.1.0, a transport must be explicitly provided. There is no default transport.

### WebSocket Transport

```javascript
import { Game } from './dist/swordfight-engine.js';
import { WebSocketTransport } from './classes/transports/WebSocketTransport.js';

const transport = new WebSocketTransport(null, {
  serverUrl: 'wss://your-server.com'
});

const game = new Game('room-123', 'human-fighter', 'evil-human-fighter', {
  transport: transport
});
```

### Custom Transport

```javascript
import { Game } from './dist/swordfight-engine.js';
import { MultiplayerTransport } from './classes/transports/MultiplayerTransport.js';

class MyCustomTransport extends MultiplayerTransport {
  async connect(roomId) {
    // Your connection logic
  }

  sendMove(data) {
    // Send move to opponent
  }

  getMove(callback) {
    // Register callback for receiving moves
  }

  sendName(data) {
    // Send player name
  }

  getName(callback) {
    // Register callback for receiving name
  }

  getPeerCount() {
    return this.connected ? 1 : 0;
  }

  disconnect() {
    // Cleanup
  }
}

const transport = new MyCustomTransport(null);
const game = new Game('room-123', 'human-fighter', 'evil-human-fighter', {
  transport: transport
});
```

## Available Transports

### WebSocketTransport (Included)

**Pros:**
- Works in Node.js and browsers
- More control over server logic
- Better for matchmaking/lobbies

**Cons:**
- Requires a WebSocket server
- Server infrastructure needed

**Usage:**
```javascript
import { WebSocketTransport } from './classes/transports/WebSocketTransport.js';

const transport = new WebSocketTransport(game, {
  serverUrl: 'ws://localhost:8080'
});
```

**Server Requirements:**
The WebSocket server must handle these message types:
- `join` - Player joins a room
- `leave` - Player leaves a room
- `move` - Forward move to other player
- `name` - Forward name to other player

See `examples/websocket-server.js` for a reference implementation.

## Creating a Custom Transport

To create your own transport (e.g., for Socket.io, Firebase, or custom protocols):

1. **Extend MultiplayerTransport:**

```javascript
import { MultiplayerTransport } from './classes/transports/MultiplayerTransport.js';

export class MyTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);
    // Your initialization
  }
}
```

2. **Implement Required Methods:**

```javascript
async connect(roomId) {
  // Connect to your service and join room
  // Must set this.started = true when ready
}

sendMove(data) {
  // Send { move: Object, round: number } to opponent
}

getMove(callback) {
  // Register callback(data) to receive opponent's moves
}

sendName(data) {
  // Send { name: string } to opponent
}

getName(callback) {
  // Register callback(data) to receive opponent's name
}

getPeerCount() {
  // Return number of connected peers (0, 1, or 2)
}

disconnect() {
  // Clean up connections
}
```

3. **Handle Events:**

Your transport should dispatch these events when appropriate:
- `start` - When game is ready to begin
- `roomFull` - When room has too many players

```javascript
if (typeof document !== 'undefined') {
  const startEvent = new CustomEvent('start', { detail: { game: this.game } });
  document.dispatchEvent(startEvent);
}
```

## Example: Socket.io Transport

```javascript
import { MultiplayerTransport } from './classes/transports/MultiplayerTransport.js';
import { io } from 'socket.io-client';

export class SocketIOTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);
    this.socket = io(options.serverUrl || 'http://localhost:3000');
    this.moveCallbacks = [];
    this.nameCallbacks = [];
  }

  async connect(roomId) {
    return new Promise((resolve) => {
      this.socket.emit('join-room', roomId);
      
      this.socket.on('room-joined', () => {
        console.log('Joined room:', roomId);
        resolve();
      });

      this.socket.on('player-joined', () => {
        this.started = true;
        this.sendName({ name: this.game.myCharacter.name });
        
        if (typeof document !== 'undefined') {
          const startEvent = new CustomEvent('start', { detail: { game: this.game } });
          document.dispatchEvent(startEvent);
        }
      });

      this.socket.on('move', (data) => {
        this.moveCallbacks.forEach(cb => cb(data));
      });

      this.socket.on('name', (data) => {
        this.nameCallbacks.forEach(cb => cb(data));
      });
    });
  }

  sendMove(data) {
    this.socket.emit('move', data);
  }

  getMove(callback) {
    this.moveCallbacks.push(callback);
  }

  sendName(data) {
    this.socket.emit('name', data);
  }

  getName(callback) {
    this.nameCallbacks.push(callback);
  }

  getPeerCount() {
    return this.started ? 1 : 0;
  }

  disconnect() {
    this.socket.disconnect();
    this.started = false;
  }
}
```

## Testing Your Transport

```javascript
// test-transport.js
import { Game } from './src/SwordFight.Game.js';
import { MyCustomTransport } from './src/classes/transports/MyCustomTransport.js';

const transport = new MyCustomTransport(null, {
  // your options
});

const game = new Game('test-room', 'human-fighter', 'goblin-fighter', {
  transport: transport
});

// Listen for game events
document.addEventListener('start', () => {
  console.log('Game started!');
});

document.addEventListener('round', (e) => {
  console.log('Round completed:', e.detail);
});
```

## Migration Guide (v1.1.0+)

### Breaking Change: Transport Required

**Before (v1.0.x):**
```javascript
const game = new Game('room-123'); // Used Trystero by default
```

**After (v1.1.0+):**
```javascript
import { WebSocketTransport } from './dist/swordfight-engine.js';

const transport = new WebSocketTransport(null, {
  serverUrl: 'wss://my-server.com'
});

const game = new Game('room-123', 'human-fighter', 'evil-human-fighter', {
  transport: transport
});
```

**Note:** If you were using Trystero/WebRTC, you'll need to implement it in your front-end application. The engine no longer includes Trystero as a dependency.

## Benefits of This Architecture

1. **Flexibility** - Easy to switch between communication methods
2. **Testability** - Can mock transports for testing
3. **Extensibility** - Add new protocols without changing game logic
4. **Platform Agnostic** - Enable Node.js CLI or other platforms
5. **Smaller Bundle** - Only include the transport you need
