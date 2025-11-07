/**
 * Multiplayer class - Transport-agnostic multiplayer handler
 *
 * Uses a transport adapter (WebSocketTransport, custom transports, etc.)
 * to handle multiplayer communication
 */

export class Multiplayer {
  constructor(game, transport) {
    if (!transport) {
      throw new Error('A transport is required for multiplayer. Provide a transport implementation (e.g., WebSocketTransport).');
    }

    this.transport = transport;

    // Initialize connection
    this.transport.connect(game.gameId).catch(error => {
      console.error('Failed to connect:', error);
    });
  }

  /**
   * Send a move to the opponent
   * @param {Object} data - Move data
   */
  sendMove(data) {
    this.transport.sendMove(data);
  }

  /**
   * Register callback for receiving opponent's move
   * @param {Function} callback - Callback function
   */
  getMove(callback) {
    this.transport.getMove(callback);
  }

  /**
   * Send player name to opponent
   * @param {Object} data - Name data
   */
  sendName(data) {
    this.transport.sendName(data);
  }

  /**
   * Register callback for receiving opponent's name
   * @param {Function} callback - Callback function
   */
  getName(callback) {
    this.transport.getName(callback);
  }

  /**
   * Check if the game has started
   * @returns {boolean}
   */
  get started() {
    return this.transport.started;
  }

  /**
   * Disconnect from multiplayer session
   */
  disconnect() {
    if (this.transport) {
      this.transport.disconnect();
    }
  }
}
