#!/usr/bin/env node

import { build, context } from 'esbuild';
import { readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');
const isDev = isWatch || process.argv.includes('--dev');

// Read package.json to get project info
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const sharedOptions = {
  bundle: true,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  sourcemap: isDev,
  minify: !isDev,
  banner: {
    js: `/**
 * ${packageJson.name} v${packageJson.version}
 * ${packageJson.description}
 *
 * @author ${packageJson.author}
 * @license ${packageJson.license}
 */`
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    'process.env.VERSION': JSON.stringify(packageJson.version)
  },
  loader: {
    '.js': 'js',
    '.json': 'json'
  },
  external: ['trystero'],
  resolveExtensions: ['.js', '.json'],
  logLevel: 'info'
};

// Full build (includes all character data)
const buildOptions = {
  ...sharedOptions,
  entryPoints: ['src/SwordFight.Game.js'],
  outfile: 'dist/swordfight-engine.js'
};

// Lite build (no character data, uses API)
const liteBuildOptions = {
  ...sharedOptions,
  entryPoints: ['src/SwordFight.Game.Lite.js'],
  outfile: 'dist/swordfight-engine.lite.js',
  external: ['trystero'],
  // Mark character JSON files as external so they're not bundled
  plugins: [{
    name: 'exclude-character-data',
    setup(build) {
      // Exclude all character JSON files by providing an empty module
      build.onResolve({ filter: /\/characters\/.*\.json$/ }, () => {
        return { path: 'excluded', namespace: 'excluded-ns' };
      });

      // Return an empty object for excluded modules
      build.onLoad({ filter: /.*/, namespace: 'excluded-ns' }, () => {
        return { contents: 'export default {}', loader: 'js' };
      });
    }
  }]
};

// Additional minified builds
const minifiedOptions = {
  ...buildOptions,
  outfile: 'dist/swordfight-engine.min.js',
  minify: true,
  sourcemap: false
};

const liteMinifiedOptions = {
  ...liteBuildOptions,
  outfile: 'dist/swordfight-engine.lite.min.js',
  minify: true,
  sourcemap: false
};

// Transport builds (individual files for tree-shaking)
const transportBuildOptions = {
  bundle: true,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  sourcemap: false,
  minify: false,
  banner: {
    js: `/**
 * ${packageJson.name} v${packageJson.version}
 * Transport Modules
 *
 * @author ${packageJson.author}
 * @license ${packageJson.license}
 */`
  },
  external: [],
  logLevel: 'info'
};

const transportBuilds = [
  {
    ...transportBuildOptions,
    entryPoints: ['src/transports.js'],
    outfile: 'dist/transports.js'
  },
  {
    ...transportBuildOptions,
    entryPoints: ['src/classes/transports/MultiplayerTransport.js'],
    outfile: 'dist/transports/MultiplayerTransport.js'
  },
  {
    ...transportBuildOptions,
    entryPoints: ['src/classes/transports/WebSocketTransport.js'],
    outfile: 'dist/transports/WebSocketTransport.js'
  },
  {
    ...transportBuildOptions,
    entryPoints: ['src/classes/transports/DurableObjectTransport.js'],
    outfile: 'dist/transports/DurableObjectTransport.js'
  },
  {
    ...transportBuildOptions,
    entryPoints: ['src/classes/transports/ComputerTransport.js'],
    outfile: 'dist/transports/ComputerTransport.js'
  }
];

async function buildProject() {
  try {
    console.log(`Building ${packageJson.name} v${packageJson.version}...`);

    if (isWatch) {
      console.log('Watching for changes...');
      const ctx = await context(buildOptions);
      await ctx.watch();
      console.log('Watching... (Press Ctrl+C to stop)');

      // Keep the process running
      process.on('SIGINT', async () => {
        await ctx.dispose();
        process.exit(0);
      });
    } else {
      // Build full version
      await build(buildOptions);
      console.log('✅ Full build completed');

      // Build lite version
      await build(liteBuildOptions);
      console.log('✅ Lite build completed');

      // Build minified versions in production
      if (!isDev) {
        await build(minifiedOptions);
        console.log('✅ Full minified build completed');

        await build(liteMinifiedOptions);
        console.log('✅ Lite minified build completed');
      }

      // Build transport modules
      for (const transportBuild of transportBuilds) {
        await build(transportBuild);
      }
      console.log('✅ Transport modules built');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProject();
