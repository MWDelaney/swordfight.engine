/**
 * DurableObjectTransport - CloudFlare Durable Objects implementation
 *
 * Uses WebSockets to connect to a CloudFlare Worker with Durable Objects
 * Provides elegant, isolated game rooms with automatic edge deployment
 *
 * Server requirements:
 * - CloudFlare Worker with Durable Objects
 * - See /server directory for reference implementation
 */

import { MultiplayerTransport } from './MultiplayerTransport.js';

export class DurableObjectTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);

    // CloudFlare Worker URL (e.g., 'wss://swordfight.your-username.workers.dev')
    this.serverUrl = options.serverUrl;
    if (!this.serverUrl) {
      throw new Error('DurableObjectTransport requires options.serverUrl (your CloudFlare Worker URL)');
    }

    this.ws = null;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
    this.roomId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
  }

  /**
   * Connect to a CloudFlare Worker and join a game room
   * @param {string} roomId - The room identifier
   */
  async connect(roomId) {
    this.roomId = roomId;

    return new Promise((resolve, reject) => {
      // Construct WebSocket URL with room parameter
      const wsUrl = `${this.serverUrl}?room=${encodeURIComponent(roomId)}`;

      console.log('Connecting to CloudFlare Worker:', wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
        return;
      }

      // Set up connection timeout
      const timeout = setTimeout(() => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log('Connected to CloudFlare Worker');

        // Send player name immediately on connection
        const playerName = this._getPlayerName();
        this.game.myCharacter.name = playerName;
        this.sendName({ name: playerName });

        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log('WebSocket connection closed', event.code, event.reason);
        this.started = false;

        // Attempt reconnection for non-normal closures
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this._attemptReconnect();
        }
      };
    });
  }

  /**
   * Attempt to reconnect to the server
   * @private
   */
  _attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

    setTimeout(() => {
      this.connect(this.roomId).catch(error => {
        console.error('Reconnection failed:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          if (typeof document !== 'undefined') {
            const disconnectEvent = new CustomEvent('connectionLost');
            document.dispatchEvent(disconnectEvent);
          }
        }
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  _handleMessage(message) {
    switch (message.type) {
    case 'peer-joined':
      console.log('Peer joined the room');
      this.started = true;

      // Dispatch start event
      if (typeof document !== 'undefined') {
        const startEvent = new CustomEvent('start', { detail: { game: this.game } });
        document.dispatchEvent(startEvent);
      }
      break;

    case 'move':
      // Call all registered move callbacks
      this.moveCallbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('Error in move callback:', error);
        }
      });
      break;

    case 'name':
      // Call all registered name callbacks
      this.nameCallbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('Error in name callback:', error);
        }
      });
      break;

    case 'room-full':
      console.error('Room is full');
      if (typeof document !== 'undefined') {
        const roomFullEvent = new CustomEvent('roomFull');
        document.dispatchEvent(roomFullEvent);
      }
      break;

    case 'peer-left':
      console.log('Peer left the room');
      this.started = false;
      if (typeof document !== 'undefined') {
        const peerLeftEvent = new CustomEvent('peerLeft');
        document.dispatchEvent(peerLeftEvent);
      }
      break;

    case 'error':
      console.error('Server error:', message.message);
      break;

    default:
      console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Get player name from storage or character
   * @private
   */
  _getPlayerName() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('playerName')) {
      return localStorage.getItem('playerName');
    }
    return this.game.myCharacter.name;
  }

  /**
   * Send a move to the opponent
   * @param {Object} data - Move data { move: Object, round: number }
   */
  sendMove(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'move',
        data: data
      }));
    } else {
      console.error('Cannot send move: WebSocket not open');
    }
  }

  /**
   * Register callback for receiving opponent's move
   * @param {Function} callback - Callback function to handle received move
   */
  getMove(callback) {
    this.moveCallbacks.push(callback);
  }

  /**
   * Send player name to opponent
   * @param {Object} data - Name data { name: string }
   */
  sendName(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'name',
        data: data
      }));
    } else {
      console.error('Cannot send name: WebSocket not open');
    }
  }

  /**
   * Register callback for receiving opponent's name
   * @param {Function} callback - Callback function to handle received name
   */
  getName(callback) {
    this.nameCallbacks.push(callback);
  }

  /**
   * Disconnect from the session
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    this.started = false;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
  }

  /**
   * Get the number of connected peers
   * Note: Durable Objects don't expose peer count directly
   * We track this based on peer-joined/peer-left events
   * @returns {number}
   */
  getPeerCount() {
    // Returns 1 if started (opponent connected), 0 otherwise
    return this.started ? 1 : 0;
  }
}
