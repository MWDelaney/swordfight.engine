/**
 * Examples of using different multiplayer transports
 *
 * Note: As of v1.1.0, a transport must be explicitly provided.
 */

// Example 1: WebSocket transport
import { Game, WebSocketTransport } from './dist/swordfight-engine.js';

const wsTransport = new WebSocketTransport(null, {
  serverUrl: 'wss://my-game-server.com'
});

const game1 = new Game('room-123', 'human-fighter', 'goblin-fighter', {
  transport: wsTransport
});
console.log('Game 1 created:', game1.gameId);

// Example 2: Character selection with custom transport
import { Game as Game2, WebSocketTransport as WS, CharacterLoader } from './dist/swordfight-engine.js';

// Show character selection
const characters = CharacterLoader.getAvailableCharacters();
console.log('Available characters:', characters);

// Player selects characters
const playerCharacter = 'human-fighter';
const opponentCharacter = 'evil-human-fighter';

// Create transport
const customTransport = new WS(null, {
  serverUrl: 'ws://localhost:8080'
});

// Create game with selections
const game2 = new Game2('custom-room', playerCharacter, opponentCharacter, {
  transport: customTransport
});
console.log('Game 2 created:', game2.gameId);

// Listen for game events
document.addEventListener('start', () => {
  console.log('Game started with custom transport!');
});

document.addEventListener('round', (e) => {
  console.log('Round completed:', e.detail);
});

document.addEventListener('victory', () => {
  console.log('Victory!');
});

document.addEventListener('defeat', () => {
  console.log('Defeat!');
});
