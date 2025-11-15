/**
 * Global Data: Round Combinations
 * Pre-generates all possible round combinations for pagination
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const characterFiles = [
  'humanFighter.json',
  'evilHumanFighter.json',
  'goblinFighter.json',
  'humanWithQuarterstaff.json',
  'lizardMan.json',
  'mummy.json',
  'skeletonWarrior.json',
  'troll.json'
];

export default function() {
  const charactersDir = join(__dirname, '../../../src/characters');
  const characters = {};
  const slugs = [];

  // Load all characters
  characterFiles.forEach(filename => {
    const filePath = join(charactersDir, filename);
    const character = JSON.parse(readFileSync(filePath, 'utf-8'));
    characters[character.slug] = character;
    slugs.push(character.slug);
  });

  // Generate all combinations
  const combinations = [];
  slugs.forEach(char1Slug => {
    const char1 = characters[char1Slug];

    slugs.forEach(char2Slug => {
      const char2 = characters[char2Slug];

      char1.moves.forEach(move1 => {
        char2.moves.forEach(move2 => {
          // Only generate combinations for moves in the same range
          if (move1.range === move2.range) {
            combinations.push({
              char1Slug,
              char2Slug,
              move1Id: move1.id,
              move2Id: move2.id,
              char1,
              char2,
              move1,
              move2
            });
          }
        });
      });
    });
  });

  console.log(`Generated ${combinations.length} valid round combinations (same-range only)`);
  return combinations;
};
