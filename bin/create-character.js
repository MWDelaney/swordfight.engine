#!/usr/bin/env node
/**
 * Interactive Character Creation Tool
 *
 * Guides you through creating a new character by:
 * 1. Choosing a template
 * 2. Defining character attributes
 * 3. Tuning parameters (offense, defense, speed)
 * 4. Generating the character file
 *
 * Usage:
 *   node bin/create-character.js
 *   node bin/create-character.js --template human-fighter --name "Rogue" --slug rogue
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const CHARACTERS_DIR = './src/characters';

// Command line args
const args = process.argv.slice(2);
const flags = {
  template: args.includes('--template') ? args[args.indexOf('--template') + 1] : null,
  name: args.includes('--name') ? args[args.indexOf('--name') + 1] : null,
  slug: args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null,
  interactive: !args.includes('--yes')
};

const templates = {
  'human-fighter': 'Balanced fighter with sword and shield (RECOMMENDED)',
  'goblin': 'Faster fighter with mace and shield',
  'barbarian': 'Slow heavy hitter with two-handed sword',
  'human-monk': 'Fast glass cannon with quarterstaff',
  'knight': 'Tank with high durability',
  'lizard-man': 'High health, fast, with scimitar',
  'skeleton': 'Fragile but fast',
  'zombie': 'Slow with moderate health'
};

const archetypes = {
  'glass-cannon': { health: 9, offenseMult: 1.3, defenseMult: 1.4, speedBoost: 0.15 },
  'tank': { health: 15, offenseMult: 0.7, defenseMult: 0.5, speedBoost: -0.10 },
  'speed': { health: 11, offenseMult: 0.9, defenseMult: 0.9, speedBoost: 0.20 },
  'balanced': { health: 12, offenseMult: 1.0, defenseMult: 1.0, speedBoost: 0 },
  'heavy-hitter': { health: 12, offenseMult: 1.2, defenseMult: 1.1, speedBoost: -0.08 }
};

// Helper to prompt user
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Load template character
function loadTemplate(slug) {
  const filePath = join(CHARACTERS_DIR, `${slug}.json`);
  if (!existsSync(filePath)) {
    console.error(`❌ Template ${slug} not found`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

// Adjust move modifiers
function adjustMoveModifiers(moves, multiplier) {
  return moves.map(move => {
    const mod = parseInt(move.mod);
    let newMod;

    if (mod > 0) {
      // Boost positive modifiers
      newMod = Math.round(mod * multiplier);
    } else if (mod < 0) {
      // Keep negative modifiers similar (defensive moves)
      newMod = mod;
    } else {
      newMod = 0;
    }

    // Clamp to valid range
    newMod = Math.max(-6, Math.min(5, newMod));

    return { ...move, mod: newMod.toString() };
  });
}

// Adjust result damage values
function adjustResultDamage(results, multiplier) {
  return results.map(result => {
    if (!result.score || result.score === '') {
      return result;
    }

    const score = parseInt(result.score);

    if (score < 0) {
      // Keep blocking values the same
      return result;
    }

    if (score === 0) {
      return result;
    }

    // Adjust positive damage
    let newScore = Math.round(score * multiplier);
    newScore = Math.max(1, Math.min(10, newScore));

    return { ...result, score: newScore.toString() };
  });
}

// Adjust outcome tables for speed
function adjustOutcomeTables(tables, results, speedBoost) {
  if (Math.abs(speedBoost) < 0.01) {
    return tables; // No speed change
  }

  // Get positioning results (0 damage)
  const positioningResults = results
    .filter(r => (!r.score || r.score === '' || r.score === '0') && !r.allowOnly)
    .map(r => r.id);

  // Get wound results (positive damage)
  const woundResults = results
    .filter(r => r.score && parseInt(r.score) > 0)
    .map(r => r.id);

  return tables.map(table => {
    const outcomes = { ...table.outcomes[0] };

    Object.keys(outcomes).forEach(moveId => {
      const currentResultId = outcomes[moveId];

      if (currentResultId === '00') {
        return; // Skip impossible matchups
      }

      const currentResult = results.find(r => r.id === currentResultId);
      if (!currentResult) {
        return;
      }

      const isWound = currentResult.score && parseInt(currentResult.score) > 0;
      const isPositioning = (!currentResult.score || currentResult.score === '' || currentResult.score === '0') && !currentResult.allowOnly;

      // Random chance based on speed boost
      const roll = Math.random();

      if (speedBoost > 0 && isWound && roll < speedBoost) {
        // Make faster: Replace wound with positioning
        const newResultId = positioningResults[Math.floor(Math.random() * positioningResults.length)];
        outcomes[moveId] = newResultId;
      } else if (speedBoost < 0 && isPositioning && roll < Math.abs(speedBoost)) {
        // Make slower: Replace positioning with wound
        const newResultId = woundResults[Math.floor(Math.random() * woundResults.length)];
        outcomes[moveId] = newResultId;
      }
    });

    return { ...table, outcomes: [outcomes] };
  });
}

// Main creation flow
async function createCharacter() {
  console.log('='.repeat(80));
  console.log('SWORDFIGHT CHARACTER CREATION TOOL');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Choose template
  let templateSlug = flags.template;
  if (!templateSlug && flags.interactive) {
    console.log('Available templates:');
    Object.entries(templates).forEach(([slug, description]) => {
      console.log(`  ${slug}: ${description}`);
    });
    console.log();
    templateSlug = await prompt('Choose a template (default: human-fighter): ') || 'human-fighter';
  } else if (!templateSlug) {
    templateSlug = 'human-fighter';
  }

  if (!templates[templateSlug]) {
    console.error(`❌ Invalid template: ${templateSlug}`);
    process.exit(1);
  }

  const template = loadTemplate(templateSlug);
  console.log(`✓ Loaded template: ${template.name}`);
  console.log();

  // Step 2: Character details
  let name = flags.name;
  let slug = flags.slug;

  if (flags.interactive) {
    name = name || await prompt('Character name: ');
    slug = slug || await prompt(`Character slug (default: ${name.toLowerCase().replace(/\s+/g, '-')}): `) || name.toLowerCase().replace(/\s+/g, '-');
  }

  if (!name || !slug) {
    console.error('❌ Name and slug are required');
    process.exit(1);
  }

  // Check if character already exists
  const outputPath = join(CHARACTERS_DIR, `${slug}.json`);
  if (existsSync(outputPath)) {
    console.error(`❌ Character ${slug} already exists at ${outputPath}`);
    process.exit(1);
  }

  console.log(`✓ Character: ${name} (${slug})`);
  console.log();

  // Step 3: Choose archetype
  let archetype = 'balanced';
  if (flags.interactive) {
    console.log('Available archetypes:');
    console.log('  glass-cannon: High offense, low defense, fast');
    console.log('  tank: High defense, low offense, slow');
    console.log('  speed: Evasive, moderate power, very fast');
    console.log('  balanced: Average stats (default)');
    console.log('  heavy-hitter: High variance, slow');
    console.log();
    archetype = await prompt('Choose archetype (default: balanced): ') || 'balanced';
  }

  if (!archetypes[archetype]) {
    console.error(`❌ Invalid archetype: ${archetype}`);
    process.exit(1);
  }

  const config = archetypes[archetype];
  console.log(`✓ Archetype: ${archetype}`);
  console.log(`  Health: ${config.health}`);
  console.log(`  Offense: ${(config.offenseMult * 100).toFixed(0)}%`);
  console.log(`  Defense: ${(config.defenseMult * 100).toFixed(0)}% (lower = more durable)`);
  console.log(`  Speed: ${config.speedBoost > 0 ? '+' : ''}${(config.speedBoost * 100).toFixed(0)}%`);
  console.log();

  // Step 4: Weapon and shield
  let weapon = template.weapon;
  let shield = template.shield;
  let description = template.description;

  if (flags.interactive) {
    weapon = await prompt(`Weapon name (default: ${template.weapon}): `) || template.weapon;
    const hasShield = await prompt('Has shield? (y/n, default: ' + (template.shield ? 'y' : 'n') + '): ') || (template.shield ? 'y' : 'n');
    shield = hasShield.toLowerCase() === 'y' ? (await prompt('Shield name: ') || 'Shield') : false;
    description = await prompt(`Description (default: ${name} with ${weapon}): `) || `${name} with ${weapon}`;
  }

  console.log(`✓ Weapon: ${weapon}`);
  console.log(`✓ Shield: ${shield || 'None'}`);
  console.log();

  // Step 5: Generate character
  console.log('Generating character...');

  const character = {
    name,
    slug,
    description,
    difficulty: 5.0, // Will be calculated by analysis tools
    health: config.health.toString(),
    firstMove: template.firstMove,
    weapon,
    shield,
    moves: adjustMoveModifiers(template.moves, config.offenseMult),
    tables: adjustOutcomeTables(template.tables, template.results, config.speedBoost),
    results: adjustResultDamage(template.results, config.defenseMult)
  };

  // Remove shield moves if no shield
  if (!shield) {
    character.moves = character.moves.filter(move => !move.requiresShield);
  }

  // Write character file
  writeFileSync(outputPath, JSON.stringify(character, null, 2));
  console.log(`✓ Created ${outputPath}`);
  console.log();

  // Update index
  const indexPath = join(CHARACTERS_DIR, 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  if (!index.characters.includes(slug)) {
    index.characters.push(slug);
    index.characters.sort();
    writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`✓ Updated ${indexPath}`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✅ CHARACTER CREATED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('  1. Validate: node bin/validate-characters.js --character ' + slug);
  console.log('  2. Analyze stats: node bin/analyze-character-stats.js --character ' + slug);
  console.log('  3. Check difficulty: node bin/analyze-character-difficulty.js --character ' + slug);
  console.log('  4. Test matchup: node bin/analyze-character-stats.js --matchup ' + slug + ' human-fighter');
  console.log('  5. Build: npm run build');
  console.log('  6. Playtest and iterate!');
  console.log();
  console.log('To fine-tune your character, edit: ' + outputPath);
  console.log('See CHARACTER_CREATION_GUIDE.md for detailed tuning instructions.');
  console.log();
}

// Run
createCharacter().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
