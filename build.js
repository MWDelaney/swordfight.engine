#!/usr/bin/env node

import { build, context } from 'esbuild';
import { readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const baseConfig = {
  bundle: true,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  define: {
    'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'https://api.swordfight.me')
  },
  banner: {
    js: `/**
 * ${packageJson.name} v${packageJson.version}
 * @license ${packageJson.license}
 */`
  }
};

const builds = [
  // Full version (with character data)
  {
    ...baseConfig,
    entryPoints: ['src/SwordFight.Game.js'],
    outfile: 'dist/swordfight-engine.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/SwordFight.Game.js'],
    outfile: 'dist/swordfight-engine.min.js',
    minify: true
  },
  // Lite version (API-based)
  {
    ...baseConfig,
    entryPoints: ['src/SwordFight.Game.Lite.js'],
    outfile: 'dist/swordfight-engine.lite.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/SwordFight.Game.Lite.js'],
    outfile: 'dist/swordfight-engine.lite.min.js',
    minify: true
  },
  // Transport modules
  {
    ...baseConfig,
    entryPoints: ['src/transports.js'],
    outfile: 'dist/transports.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/classes/transports/MultiplayerTransport.js'],
    outfile: 'dist/transports/MultiplayerTransport.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/classes/transports/WebSocketTransport.js'],
    outfile: 'dist/transports/WebSocketTransport.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/classes/transports/DurableObjectTransport.js'],
    outfile: 'dist/transports/DurableObjectTransport.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/classes/transports/ComputerTransport.js'],
    outfile: 'dist/transports/ComputerTransport.js'
  }
];

async function runBuild() {
  try {
    if (isWatch) {
      console.log('Watching for changes...');
      const ctx = await context(builds[0]);
      await ctx.watch();
      process.on('SIGINT', async () => {
        await ctx.dispose();
        process.exit(0);
      });
    } else {
      console.log('Building...');
      await Promise.all(builds.map(config => build(config)));
      console.log('✅ Build complete');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
