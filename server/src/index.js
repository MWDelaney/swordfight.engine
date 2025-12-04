/**
 * SwordFight Multiplayer Server
 *
 * CloudFlare Worker with Durable Objects for game room management.
 * Each game room is an isolated Durable Object that maintains WebSocket
 * connections between two players and forwards messages between them.
 */

const ALLOWED_ORIGINS = [
  'https://swordfight.me',
  'https://www.swordfight.me',
  'http://localhost:8080', // for development
];

/**
 * GameRoom Durable Object
 *
 * Each instance represents one game room with up to 2 players.
 * Handles WebSocket connections and message forwarding.
 */
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.players = new Map(); // Track player metadata
    this.messageBuffer = []; // Buffer for messages before second player joins
  }

  /**
   * Handle incoming requests (WebSocket upgrades)
   */
  async fetch(request) {
    const origin = request.headers.get('Origin');

    // Upgrade to WebSocket
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Check if room is full
    if (this.sessions.length >= 2) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      server.accept();
      server.send(JSON.stringify({
        type: 'room-full',
        message: 'This game room is full'
      }));
      server.close(1008, 'Room full');

      return new Response(null, {
        status: 101,
        webSocket: client,
        headers: {
          'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
        },
      });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Add to sessions
    const sessionId = this.sessions.length;
    this.sessions.push(server);

    console.log(`Player ${sessionId + 1} joined. Total players: ${this.sessions.length}`);

    // Notify if second player joined
    if (this.sessions.length === 2) {
      // Replay buffered messages to the new player
      if (this.messageBuffer.length > 0) {
        console.log(`Replaying ${this.messageBuffer.length} buffered messages to player 2`);
        server.send(JSON.stringify({
          type: 'history',
          messages: this.messageBuffer
        }));
      }

      // Notify both players that opponent connected
      this.sessions.forEach(s => {
        if (s.readyState === 1) { // WebSocket.OPEN
          s.send(JSON.stringify({
            type: 'peer-joined',
            message: 'Opponent connected'
          }));
        }
      });
    }

    // Set up message handling
    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleMessage(message, server);
      } catch (error) {
        console.error('Error handling message:', error);
        server.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle disconnection
    server.addEventListener('close', () => {
      console.log(`Player disconnected. Remaining: ${this.sessions.length - 1}`);

      // Remove from sessions
      const index = this.sessions.indexOf(server);
      if (index > -1) {
        this.sessions.splice(index, 1);
      }

      // Notify remaining player
      this.sessions.forEach(s => {
        if (s.readyState === 1) {
          s.send(JSON.stringify({
            type: 'peer-left',
            message: 'Opponent disconnected'
          }));
        }
      });
    });

    // Return response with WebSocket
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: {
        'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
      },
    });
  }

  /**
   * Handle incoming messages and forward to opponent
   */
  async handleMessage(message, sender) {
    // Validate message structure
    if (!message.type) {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Message must have a type'
      }));
      return;
    }

    // Buffer messages if only one player is connected
    // (moves, names, and other game state that needs to be replayed)
    if (this.sessions.length === 1) {
      const bufferableTypes = ['move', 'name', 'character-select', 'ready'];
      if (bufferableTypes.includes(message.type)) {
        this.messageBuffer.push(message);
        console.log(`Buffered message type: ${message.type}. Buffer size: ${this.messageBuffer.length}`);
      }
    }

    // Forward message to opponent
    this.sessions.forEach(session => {
      if (session !== sender && session.readyState === 1) {
        try {
          session.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error forwarding message:', error);
        }
      }
    });
  }
}

/**
 * Main Worker - Routes requests to Durable Objects
 */
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const origin = request.headers.get('Origin');

      // Validate origin
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return new Response('Forbidden', { status: 403 });
      }

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
          },
        });
      }

      // Get room ID from query parameter
      const roomId = url.searchParams.get('room');
      if (!roomId) {
        return new Response('Missing room parameter', { status: 400 });
      }

      // Validate room ID format
      if (roomId.length > 100 || !/^[a-zA-Z0-9-_]+$/.test(roomId)) {
        return new Response('Invalid room ID format', { status: 400 });
      }

      // Get Durable Object ID from room name
      const id = env.SWORD_FIGHTS.idFromName(roomId);
      const room = env.SWORD_FIGHTS.get(id);

      // Forward request to Durable Object
      return await room.fetch(request);

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },
};
