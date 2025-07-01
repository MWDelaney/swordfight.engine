#!/usr/bin/env node

import { build } from 'esbuild';
import { readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');
const isDev = isWatch || process.argv.includes('--dev');

// Read package.json to get project info
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const buildOptions = {
  entryPoints: ['src/SwordFight.Game.js'],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  outfile: 'dist/swordfight-engine.js',
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

// Additional build for minified version in production
const minifiedOptions = {
  ...buildOptions,
  outfile: 'dist/swordfight-engine.min.js',
  minify: true,
  sourcemap: false
};

async function buildProject() {
  try {
    console.log(`Building ${packageJson.name} v${packageJson.version}...`);

    if (isWatch) {
      console.log('Watching for changes...');
      const ctx = await build({
        ...buildOptions,
        watch: {
          onRebuild(error, _result) {
            if (error) {
              console.error('Watch build failed:', error);
            } else {
              console.log('Rebuilt successfully');
            }
          }
        }
      });

      // Keep the process running
      process.on('SIGINT', () => {
        ctx.dispose();
        process.exit(0);
      });
    } else {
      // Build main version
      await build(buildOptions);
      console.log('✅ Main build completed');

      // Build minified version in production
      if (!isDev) {
        await build(minifiedOptions);
        console.log('✅ Minified build completed');
      }
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProject();
