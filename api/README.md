# SwordFight Static API

A statically-generated JSON API that serves as the canonical reference implementation for the SwordFight game engine. This API uses Eleventy to pre-generate all possible game outcomes, character data, and move combinations into static JSON files that can be hosted on any CDN or static hosting service.

## About

This is the **official reference API** for the SwordFight engine. It's maintained as part of the engine repository to ensure that the API and engine stay perfectly in sync. The API is deterministic and stateless - given the same inputs, it will always return the same outputs.

## Features

- **Zero Runtime Cost**: Pure static JSON files, no server required
- **Complete Coverage**: Pre-generates all ~30,864 valid round outcomes
- **CDN-Ready**: Host on Netlify, Vercel, GitHub Pages, or any static host
- **Tiny Footprint**: ~20-40MB compressed, served via CDN
- **Offline-Capable**: Perfect for PWAs and offline games
- **Always In Sync**: Uses the engine source code directly, not as a dependency

## Building

From the repository root:

```bash
# Build just the API
npm run build:api

# Build both engine and API
npm run build:all

# Development server with live reload
npm run build:api:dev
```

This generates the complete static API in the `api/dist/` directory.

### Development Server

```bash
npm run dev
```

Starts Eleventy's development server with live reload.

### Clean Build

```bash
npm run clean
npm run build
```

## Deployment

The API is automatically deployed to GitHub Pages when changes are pushed to the main branch.

**Live API**: https://mwdelaney.github.io/swordfight.engine/

For deployment setup and custom domain configuration, see [DEPLOYMENT.md](DEPLOYMENT.md).

## API Endpoints

All endpoints return JSON.

### Index
- `GET /index.json` - API metadata and available endpoints

### Characters
- `GET /characters/index.json` - List all characters
- `GET /characters/{slug}.json` - Get character details
  - Example: `/characters/human-fighter.json`

### Round Outcomes
- `GET /rounds/{char1}/{char2}/{move1}/{move2}.json` - Get round outcome
  - Example: `/rounds/human-fighter/goblin/24/10.json`
  - Returns complete round data for both players including:
    - Outcome IDs
    - Damage calculations
    - Move restrictions
    - Bonuses
    - Result descriptions

## Response Format

### Character List
```json
{
  "characters": [
    {
      "slug": "human-fighter",
      "name": "Human Fighter",
      "description": "Human with sword and shield",
      "health": "12",
      "weapon": "Broadsword",
      "shield": "Shield"
    }
  ]
}
```

### Round Outcome
```json
{
  "player1": {
    "character": { "slug": "human-fighter", "name": "Human Fighter" },
    "move": { "id": "24", "name": "Smash", "tag": "Down Swing" },
    "outcome": "53",
    "result": { "id": "53", "name": "Body wound", "score": "4" },
    "range": "close",
    "score": "4",
    "totalScore": 7,
    "modifier": 3,
    "bonus": 0,
    "restrictions": ["strong", "high", "low"]
  },
  "player2": { ... }
}
```

## Project Structure

```
api/
├── package.json              # Dependencies and scripts
├── .eleventy.js             # Eleventy configuration
├── src/
│   ├── _data/
│   │   └── characters.js    # Global data: loads all characters
│   ├── index.11ty.js        # API index endpoint
│   ├── characters/
│   │   ├── index.11ty.js    # Character list endpoint
│   │   └── detail.11ty.js   # Individual character endpoints
│   └── rounds/
│       └── rounds.11ty.js   # Round outcome generator
└── dist/                     # Generated API (gitignored)
```

## How It Works

1. **Data Loading**: Eleventy loads all characters from the parent `swordfight-engine` package
2. **Combination Generation**: Creates all possible character × character × move × move combinations
3. **Outcome Calculation**: Uses the engine's `Round` class to calculate each outcome
4. **Static Generation**: Writes each outcome as a static JSON file

## Deployment

### Netlify
```bash
npm run build
# Deploy dist/ directory
```

### Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

## Statistics

- **Characters**: 8
- **Total Moves**: ~240 (30 per character average)
- **Character Combinations**: 64
- **Total Round Outcomes**: ~57,600
- **Uncompressed Size**: ~30MB
- **Compressed Size**: ~5-8MB (gzip)

## License

MIT
