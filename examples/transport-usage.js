/**
 * Examples of using different multiplayer transports
 */

// Example 1: Default Trystero (WebRTC) - No changes needed
import { Game } from './dist/swordfight-engine.js';

const game1 = new Game('room-123', 'human-fighter', 'goblin-fighter');
console.log('Game 1 created:', game1.gameId);
// Uses Trystero by default

// Example 2: Custom Trystero configuration
import { Game as Game2, TrysteroTransport } from './dist/swordfight-engine.js';

const trysteroTransport = new TrysteroTransport(null, {
  appId: 'my-custom-app-id'
});

const game2 = new Game2('room-456', 'human-fighter', 'goblin-fighter', {
  transport: trysteroTransport
});
console.log('Game 2 created:', game2.gameId);

// Example 3: WebSocket transport
import { Game as Game3, WebSocketTransport } from './dist/swordfight-engine.js';

const wsTransport = new WebSocketTransport(null, {
  serverUrl: 'wss://my-game-server.com'
});

const game3 = new Game3('room-789', 'human-fighter', 'goblin-fighter', {
  transport: wsTransport
});
console.log('Game 3 created:', game3.gameId);

// Example 4: Character selection with custom transport
import { Game as Game4, WebSocketTransport as WS, CharacterLoader } from './dist/swordfight-engine.js';

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
const game4 = new Game4('custom-room', playerCharacter, opponentCharacter, {
  transport: customTransport
});
console.log('Game 4 created:', game4.gameId);

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
