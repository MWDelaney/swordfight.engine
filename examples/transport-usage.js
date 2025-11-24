/**
 * Examples of using different multiplayer transports
 *
 * Note: As of v1.1.0, a transport must be explicitly provided.
 * For computer opponents, you can either use gameId='computer' (automatic)
 * or explicitly pass a ComputerTransport.
 */

// Example 1: Computer opponent (automatic when gameId='computer')
import { Game } from './dist/swordfight-engine.js';

const singlePlayerGame = new Game('computer', 'human-fighter', 'goblin-fighter');
console.log('Single-player game created:', singlePlayerGame.gameId);

// Example 2: Computer opponent (explicit transport with custom options)
import { Game as Game0, ComputerTransport } from './dist/swordfight-engine.js';

const computerTransport = new ComputerTransport(null, {
  startDelay: 1000 // 1 second instead of default 3 seconds
});

const customComputerGame = new Game0('custom-computer', 'human-monk', 'skeleton-warrior', {
  transport: computerTransport
});
console.log('Custom computer game created:', customComputerGame.gameId);

// Example 3: WebSocket transport
import { Game as Game1, WebSocketTransport } from './dist/swordfight-engine.js';

const wsTransport = new WebSocketTransport(null, {
  serverUrl: 'wss://my-game-server.com'
});

const game1 = new Game1('room-123', 'human-fighter', 'goblin-fighter', {
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
