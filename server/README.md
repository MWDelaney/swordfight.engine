# SwordFight Multiplayer Server

CloudFlare Workers + Durable Objects server for SwordFight Engine multiplayer games.

## Overview

This server provides a lightweight, globally distributed WebSocket relay for multiplayer games. Each game room is an isolated Durable Object that:

- Accepts up to 2 WebSocket connections per room
- Forwards messages between connected players
- Automatically handles disconnections
- Scales globally to CloudFlare's edge network

## Architecture

```
Client 1 (Netlify) ──┐
                     │ WebSocket
                     ├──> Durable Object (Game Room)
                     │    - Message forwarding
Client 2 (Anywhere) ─┘    - Connection management
```

Each room ID creates a unique Durable Object instance that lives close to your players on CloudFlare's edge network.

## Prerequisites

- [CloudFlare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Node.js](https://nodejs.org/) 18+ installed
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Login to CloudFlare

```bash
npx wrangler login
```

This will open your browser to authenticate.

### 3. Deploy to CloudFlare

**Option A: Manual deployment**

```bash
npm run deploy
```

You'll see output like:

```
Published swordfight-multiplayer (1.23 sec)
  https://swordfight-multiplayer.your-username.workers.dev
```

**Option B: Automatic deployment via GitHub Actions**

Set up automatic deployment on push to main:

1. See [../.github/CLOUDFLARE_SETUP.md](../.github/CLOUDFLARE_SETUP.md) for setup
2. Add `CLOUDFLARE_API_TOKEN` secret to GitHub
3. Push changes to the `server/` directory
4. Workflow automatically deploys

**Save this URL!** You'll use it in your client.

## Usage in Your Game

Use the `DurableObjectTransport` in your game client:

```javascript
import { Game } from 'swordfight-engine';
import { DurableObjectTransport } from 'swordfight-engine/transports';

const game = new Game('room-123', 'fighter', 'goblin', {
  transport: new DurableObjectTransport(game, {
    serverUrl: 'wss://swordfight-multiplayer.your-username.workers.dev'
  })
});
```

**Note:** Use `wss://` (not `https://`) for the WebSocket connection.

## Development

### Local development

Run the server locally:

```bash
npm run dev
```

This starts a local server at `ws://localhost:8787`

### Testing locally

Connect your client to the local server:

```javascript
const game = new Game('test-room', 'fighter', 'goblin', {
  transport: new DurableObjectTransport(game, {
    serverUrl: 'ws://localhost:8787'
  })
});
```

### View logs

Watch live logs from your deployed worker:

```bash
npm run tail
```

## Configuration

Edit `wrangler.toml` to customize:

```toml
name = "swordfight-multiplayer"  # Change worker name
compatibility_date = "2024-12-03"
```

## Custom Domain (Optional)

Add a custom domain in CloudFlare Dashboard:

1. Go to Workers & Pages > swordfight-multiplayer
2. Click "Triggers" tab
3. Add Custom Domain (e.g., `games.yourdomain.com`)
4. Update your client to use: `wss://games.yourdomain.com`

## Costs

At 10,000 games/day:

- **Requests**: Free (well under 100k/day limit)
- **Durable Objects**: ~$0.05-0.20/month
- **Total**: Effectively free on CloudFlare's free tier

See [CloudFlare Pricing](https://developers.cloudflare.com/workers/platform/pricing/) for details.

## API

The server accepts WebSocket connections at:

```
wss://your-worker.workers.dev?room={roomId}
```

### Message Format

All messages are JSON with a `type` field:

**Client → Server:**
```json
{ "type": "move", "data": { "move": {...}, "round": 1 } }
{ "type": "name", "data": { "name": "Player1" } }
```

**Server → Client:**
```json
{ "type": "peer-joined", "message": "Opponent connected" }
{ "type": "peer-left", "message": "Opponent disconnected" }
{ "type": "room-full", "message": "This game room is full" }
{ "type": "move", "data": {...} }
{ "type": "name", "data": {...} }
```

## Troubleshooting

### Connection refused

- Check your worker URL is correct
- Verify you're using `wss://` (not `ws://` in production)
- Check CloudFlare dashboard for deployment status

### Room full errors

- Each room supports exactly 2 players
- Use unique room IDs for each game
- Check if a stale connection is holding the room

### Messages not arriving

- Check browser console for errors
- Use `npm run tail` to view server logs
- Verify both clients are in the same room

## Security Notes

- Room IDs should be randomly generated (UUID recommended)
- This implementation has no authentication (anyone with room ID can join)
- For production, consider adding:
  - Authentication tokens
  - Rate limiting
  - Room expiration
  - Player validation

## Learn More

- [CloudFlare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [CloudFlare Workers](https://developers.cloudflare.com/workers/)
- [WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
