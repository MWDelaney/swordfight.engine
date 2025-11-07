/**
 * MultiplayerTransport Base Class
 *
 * Abstract interface for multiplayer communication adapters.
 * Implement this interface to support different communication methods
 * (Trystero, Socket.io, WebSockets, etc.)
 */

export class MultiplayerTransport {
  constructor(game) {
    this.game = game;
    this.started = false;

    if (new.target === MultiplayerTransport) {
      throw new Error('MultiplayerTransport is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Connect to a room/session
   * @param {string} _roomId - The room identifier
   * @returns {Promise<void>}
   */
  async connect(_roomId) {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Send a move to the opponent
   * @param {Object} _data - Move data { move: Object, round: number }
   */
  sendMove(_data) {
    throw new Error('sendMove() must be implemented by subclass');
  }

  /**
   * Register callback for receiving opponent's move
   * @param {Function} _callback - Callback function to handle received move
   */
  getMove(_callback) {
    throw new Error('getMove() must be implemented by subclass');
  }

  /**
   * Send player name to opponent
   * @param {Object} _data - Name data { name: string }
   */
  sendName(_data) {
    throw new Error('sendName() must be implemented by subclass');
  }

  /**
   * Register callback for receiving opponent's name
   * @param {Function} _callback - Callback function to handle received name
   */
  getName(_callback) {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Disconnect from the session
   */
  disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /**
   * Get the number of connected peers
   * @returns {number}
   */
  getPeerCount() {
    throw new Error('getPeerCount() must be implemented by subclass');
  }

  /**
   * Check if room is full
   * @returns {boolean}
   */
  isRoomFull() {
    return this.getPeerCount() >= 2;
  }
}
