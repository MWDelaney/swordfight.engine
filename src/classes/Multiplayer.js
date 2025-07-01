
// Import trystero from the trystero package
import { joinRoom } from 'trystero';

export class Multiplayer {
  constructor(game) {
    // Create a random room ID
    const roomId = game.gameId;

    // Set the started flag
    this.started = false;

    // Log the room ID
    console.log('Room ID: ', roomId);

    // Set up multiplayer
    const room = joinRoom({ appId: 'swordfight.me' }, roomId);

    // If the room already has 2 peers, log an error and return
    if (room.getPeers().length >= 2) {
      console.error('Room is full');
      // Dispatch a room full event
      const roomFullEvent = new CustomEvent('roomFull');
      document.dispatchEvent(roomFullEvent);

      return;
    } else {
      console.log('You have joined the room');
    }

    // Listen for peer join events, log them
    room.onPeerJoin((peer) => {
      console.log('Peer joined: ', peer);

      // Count the number of items in the peers object
      const peers = room.getPeers();

      // If there are 2 peers, start the game
      if (Object.keys(peers).length >= 1) {
        // Set the started flag
        this.started = true;

        // If the player's name is set in localstorage, send it, or send the name from the character object
        if (localStorage.getItem('playerName')) {
          game.myCharacter.name = localStorage.getItem('playerName');
          this.sendName({ name: game.myCharacter.name });
        } else {
          this.sendName({ name: game.myCharacter.name });
        }
        if (window.logging) {
          console.log('Sent name: ', game.myCharacter.name);
        }

        // Send the player's character slug to the opponent
        this.sendCharacter({ characterSlug: game.myCharacter.slug });
        if (window.logging) {
          console.log('Sent character slug: ', game.myCharacter.slug);
        }

        // Bubble the start event
        const startEvent = new CustomEvent('start', { detail: { game: game } });
        document.dispatchEvent(startEvent);
      }
    });

    // Create the sendMove and getMove actions
    [this.sendMove, this.getMove] = room.makeAction('move');

    // Create the sendName and getName actions
    [this.sendName, this.getName] = room.makeAction('name');

    // Create the sendCharacter and getCharacter actions
    [this.sendCharacter, this.getCharacter] = room.makeAction('character');
  }
}
