/**
 * WebSocketTransport - WebSocket implementation
 *
 * Uses WebSockets for real-time communication with a server
 * Requires a WebSocket server to coordinate multiplayer sessions
 */

import { MultiplayerTransport } from './MultiplayerTransport.js';

export class WebSocketTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);

    this.serverUrl = options.serverUrl || 'ws://localhost:8080';
    this.ws = null;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
    this.characterCallbacks = [];
    this.roomId = null;
  }

  /**
   * Connect to a WebSocket server and join a room
   * @param {string} roomId - The room identifier
   */
  async connect(roomId) {
    this.roomId = roomId;

    return new Promise((resolve, reject) => {
      console.log('Connecting to WebSocket server:', this.serverUrl);

      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');

        // Join room
        this.ws.send(JSON.stringify({
          type: 'join',
          roomId: roomId
        }));
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this._handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.started = false;
      };

      // Listen for joined confirmation
      const joinListener = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'joined') {
          resolve();
          this.ws.removeEventListener('message', joinListener);
        } else if (message.type === 'error') {
          reject(new Error(message.message));
        }
      };

      this.ws.addEventListener('message', joinListener);
    });
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  _handleMessage(message) {
    switch (message.type) {
    case 'joined':
      console.log('Successfully joined room:', message.roomId);
      break;

    case 'peer-joined': {
      console.log('Peer joined the room');
      this.started = true;

      // Send player name and character
      const playerName = this._getPlayerName();
      this.game.myCharacter.name = playerName;
      this.sendName({ 
        name: playerName,
        characterSlug: this.game.myCharacterSlug
      });

      // Dispatch start event
      if (typeof document !== 'undefined') {
        const startEvent = new CustomEvent('start', { detail: { game: this.game } });
        document.dispatchEvent(startEvent);
      }
      break;
    }

    case 'move':
      // Call all registered move callbacks
      this.moveCallbacks.forEach(callback => callback(message.data));
      break;

    case 'name':
      // Call all registered name callbacks
      this.nameCallbacks.forEach(callback => callback(message.data));
      break;

    case 'character':
      // Call all registered character callbacks
      this.characterCallbacks.forEach(callback => callback(message.data));
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
   * Send a move to the opponent via WebSocket
   * @param {Object} data - Move data
   */
  sendMove(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'move',
        roomId: this.roomId,
        data: data
      }));
    }
  }

  /**
   * Send player name to opponent via WebSocket
   * @param {Object} data - Name data
   */
  sendName(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'name',
        roomId: this.roomId,
        data: data
      }));
    }
  }

  /**
   * Register callback for receiving opponent's move
   * @param {Function} callback - Callback function
   */
  getMove(callback) {
    this.moveCallbacks.push(callback);
  }

  /**
   * Register callback for receiving opponent's name
   * @param {Function} callback - Callback function
   */
  getName(callback) {
    this.nameCallbacks.push(callback);
  }

  /**
   * Send character slug to opponent via WebSocket
   * @param {Object} data - Character data { characterSlug: string }
   */
  sendCharacter(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'character',
        roomId: this.roomId,
        data: data
      }));
    }
  }

  /**
   * Register callback for receiving opponent's character slug
   * @param {Function} callback - Callback function
   */
  getCharacter(callback) {
    this.characterCallbacks.push(callback);
  }

  /**
   * Get the number of connected peers
   * @returns {number}
   */
  getPeerCount() {
    // WebSocket transport doesn't track peer count locally
    // This would need to be provided by the server
    return this.started ? 1 : 0;
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'leave',
        roomId: this.roomId
      }));
      this.ws.close();
      this.ws = null;
    }
    this.started = false;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
    this.characterCallbacks = [];
  }
}
