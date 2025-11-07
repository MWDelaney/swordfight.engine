/**
 * TrysteroTransport - Trystero (WebRTC) implementation
 *
 * Uses Trystero for peer-to-peer communication via WebRTC
 */

import { joinRoom } from 'trystero';
import { MultiplayerTransport } from './MultiplayerTransport.js';

export class TrysteroTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);

    this.appId = options.appId || 'swordfight.me';
    this.room = null;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
  }

  /**
   * Connect to a Trystero room
   * @param {string} roomId - The room identifier
   */
  async connect(roomId) {
    console.log('Room ID: ', roomId);

    // Set up Trystero room
    this.room = joinRoom({ appId: this.appId }, roomId);

    // Check if room is full
    if (this.room.getPeers().length >= 2) {
      console.error('Room is full');

      // Dispatch room full event
      if (typeof document !== 'undefined') {
        const roomFullEvent = new CustomEvent('roomFull');
        document.dispatchEvent(roomFullEvent);
      }

      throw new Error('Room is full');
    } else {
      console.log('You have joined the room');
    }

    // Listen for peer join events
    this.room.onPeerJoin((peer) => {
      console.log('Peer joined: ', peer);

      const peers = this.room.getPeers();

      // If there are 2 peers, start the game
      if (Object.keys(peers).length >= 1) {
        this.started = true;

        // Send player name
        const playerName = this._getPlayerName();
        this.game.myCharacter.name = playerName;
        this.sendName({ name: playerName });

        if (typeof window !== 'undefined' && window.logging) {
          console.log('Sent name: ', playerName);
        }

        // Dispatch start event
        if (typeof document !== 'undefined') {
          const startEvent = new CustomEvent('start', { detail: { game: this.game } });
          document.dispatchEvent(startEvent);
        }
      }
    });

    // Create the sendMove and getMove actions
    [this.sendMove, this._getMoveHandler] = this.room.makeAction('move');

    // Create the sendName and getName actions
    [this.sendName, this._getNameHandler] = this.room.makeAction('name');
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
   * Register callback for receiving opponent's move
   * @param {Function} callback - Callback function to handle received move
   */
  getMove(callback) {
    this.moveCallbacks.push(callback);

    // Set up the handler if not already done
    if (this._getMoveHandler && this.moveCallbacks.length === 1) {
      this._getMoveHandler((data) => {
        this.moveCallbacks.forEach(cb => cb(data));
      });
    }
  }

  /**
   * Register callback for receiving opponent's name
   * @param {Function} callback - Callback function to handle received name
   */
  getName(callback) {
    this.nameCallbacks.push(callback);

    // Set up the handler if not already done
    if (this._getNameHandler && this.nameCallbacks.length === 1) {
      this._getNameHandler((data) => {
        this.nameCallbacks.forEach(cb => cb(data));
      });
    }
  }

  /**
   * Get the number of connected peers
   * @returns {number}
   */
  getPeerCount() {
    return this.room ? this.room.getPeers().length : 0;
  }

  /**
   * Disconnect from the room
   */
  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.started = false;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
  }
}
