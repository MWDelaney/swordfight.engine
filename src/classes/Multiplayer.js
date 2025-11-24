/**
 * Multiplayer class - DEPRECATED
 *
 * This class is maintained for backward compatibility only.
 * New code should use transports directly (they extend MultiplayerTransport).
 *
 * @deprecated Use transport classes directly instead of wrapping them
 *
 * Old way:
 *   const transport = new WebSocketTransport(game);
 *   const multiplayer = new Multiplayer(game, transport);
 *
 * New way:
 *   const multiplayer = new WebSocketTransport(game);
 *   await multiplayer.connect(gameId);
 */

export class Multiplayer {
  constructor(game, transport) {
    console.warn('Multiplayer wrapper class is deprecated. Use transport classes directly.');

    if (!transport) {
      throw new Error('A transport is required for multiplayer. Provide a transport implementation (e.g., WebSocketTransport).');
    }

    this.transport = transport;
    this.game = game;

    // Initialize connection
    this.transport.connect(game.gameId).catch(error => {
      console.error('Failed to connect:', error);
    });
  }

  getMove(callback) {
    this.transport.getMove(callback);
  }

  getName(callback) {
    this.transport.getName(callback);
  }

  sendMove(data) {
    this.transport.sendMove(data);
  }

  sendName(data) {
    this.transport.sendName(data);
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
