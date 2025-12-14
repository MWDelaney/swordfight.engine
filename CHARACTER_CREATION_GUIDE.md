# Character Creation Guide

This guide explains how to create new characters for the SwordFight Engine using the "book swapping" combat system.

## Table of Contents
1. [Understanding the System](#understanding-the-system)
2. [Character Design Process](#character-design-process)
3. [Step-by-Step Creation](#step-by-step-creation)
4. [Tuning Parameters](#tuning-parameters)
5. [Testing & Balance](#testing--balance)

---

## Understanding the System

### The "Book Swapping" Mechanic

Combat resolution uses **defensive tables** - when you attack an opponent, you look in the **opponent's character file** to see what happens TO THEM.

**Example:**
```
Player A uses Move 10 (Side Swing High)
Player B uses Move 14 (Thrust Low)

Combat Resolution:
1. Look in Player B's tables → Find table for Move 10 → Look up column 14 → Get Result ID "13"
2. Look in Player B's results → Find Result 13 → "Leg wound" (3 damage)
3. Look in Player A's tables → Find table for Move 14 → Look up column 10 → Get Result ID "53"
4. Look in Player A's results → Find Result 53 → "Body wound" (4 damage)

Damage Calculation:
- Player A's move modifier: +1
- Player B's move modifier: -1
- Damage TO Player B: 3 + 1 = 4
- Damage TO Player A: 4 + (-1) = 3

Both players hit each other (symmetric outcome)
```

### Character Attributes

Characters differ in three ways:

1. **Offensive Power** - Move modifiers (-6 to +4)
2. **Defensive Durability** - Result damage values (1-8 damage)
3. **Speed Profile** - Outcome table mappings (which results appear in tables)

---

## Character Design Process

### Step 1: Define Character Concept

Answer these questions:

- **Archetype**: Tank, Speed, Balanced, Glass Cannon?
- **Weapon**: What weapon type? (affects move names)
- **Shield**: Yes or No? (determines available moves)
- **Health**: 7-16 HP (fragile to tanky)
- **Playstyle**: Aggressive, Defensive, Technical?

### Step 2: Choose a Base Template

All characters share 85% of their structure. Pick a template:

- **Human Fighter** - Balanced, has shield (best starting point)
- **Goblin** - Slightly faster, has shield
- **Barbarian** - Slower, no shield, high variance
- **Human Monk** - Fast, no shield, low health
- **Knight** - Tank, has shield, very durable
- **Lizard Man** - High health, fast, has buckler
- **Skeleton** - Fragile, fast, has shield
- **Zombie** - Slow, moderate health, no shield

### Step 3: Set Target Stats

Based on your concept, set targets:

| Stat | Fragile | Average | Durable |
|------|---------|---------|---------|
| Health | 7-10 | 11-13 | 14-16 |
| Leg Wound Damage | 4-5 | 3 | 1-2 |
| Body Wound Damage | 6-8 | 4-5 | 2-3 |
| Dazed Damage | 7-8 | 6 | 4-5 |

| Stat | Weak | Average | Strong |
|------|------|---------|--------|
| Strong Attack Mod | +1 to +2 | +3 | +4 to +5 |
| High/Low Attack Mod | -1 to 0 | +1 | +2 |
| Thrust Attack Mod | -2 to -1 | 0 | +1 to +2 |

| Stat | Slow | Average | Fast |
|------|------|---------|------|
| Speed Win Rate | 35-45% | 46-54% | 55-65% |

---

## Step-by-Step Creation

### 1. Copy Template File

```bash
cp src/characters/fighter.json src/characters/yourCharacter.json
```

### 2. Update Metadata

```json
{
  "name": "Your Character Name",
  "slug": "your-character-slug",
  "description": "Character description",
  "difficulty": 5.0,
  "health": "12",
  "firstMove": "62",
  "weapon": "Your Weapon",
  "shield": "Shield Name or false or null"
}
```

### 3. Adjust Move List

**If your character has a shield:**
- Keep all moves with `"requiresShield": true`
- Keep moves: 4, 26, 44, 48, 6

**If your character has NO shield:**
- Remove all moves with `"requiresShield": true`
- Remove moves: 4, 26, 44, 48, 6

**Universal moves to keep (19 moves):**
```
2, 8, 10, 14, 16, 22, 24, 28, 30, 32, 40, 44, 46, 50, 54, 56, 58, 62, 64
```

### 4. Tune Move Modifiers (Offensive Power)

For each move, adjust the `mod` field:

**Strong Attacks** (move types: "strong"):
- Glass Cannon: +4 to +5
- Balanced: +2 to +3
- Tank: +1 to +2

**High/Low Attacks** (move types: "high", "low"):
- Aggressive: +2
- Balanced: +1
- Defensive: 0 to -1

**Thrust Attacks** (move tag: "Thrust"):
- Rapier/Fast: +1 to +2
- Balanced: 0
- Heavy Weapon: -1 to -2

**Defensive Moves** (move types: "defense", "risky"):
- Keep at -4 to -6 (high risk, low reward on damage)

**Example:**
```json
{
  "tag": "Down Swing",
  "name": "Smash",
  "type": "strong",
  "id": "24",
  "mod": "3",  // ← Adjust this for offensive power
  "requiresWeapon": true
}
```

### 5. Tune Result Damage Values (Defensive Durability)

Adjust damage in the `results` array for these key results:

**Critical Results:**
```json
{
  "id": "7",
  "name": "Dazed",
  "score": "6"  // ← Tank: 4-5, Balanced: 6, Fragile: 7-8
}
```

```json
{
  "id": "13",
  "name": "Leg wound",
  "score": "3"  // ← Tank: 1-2, Balanced: 3, Fragile: 4-5
}
```

```json
{
  "id": "31",
  "name": "Arm wound",
  "score": "2"  // ← Tank: 1, Balanced: 2, Fragile: 3-4
}
```

```json
{
  "id": "53",
  "name": "Body wound",
  "score": "4"  // ← Tank: 2-3, Balanced: 4-5, Fragile: 6-8
}
```

**Blocking Results (negative damage):**
```json
{
  "id": "17",
  "name": "Blocking high",
  "score": "-4"  // ← Keep at -4 to -6 for shields/parries
}
```

### 6. Adjust Outcome Tables (Speed Profile)

**This is the hardest part.** Outcome tables determine speed advantages.

#### Understanding Speed

- **Fast characters**: Their tables map to "positioning" results (0 damage) more often
- **Slow characters**: Their tables map to "wound" results (positive damage) more often

#### The Pattern

For each table (one per move ID), the outcomes map opponent moves to result IDs:

```json
{
  "id": "10",  // Your move (Side Swing High)
  "outcomes": [{
    "2": "31",   // Opponent uses move 2 → You experience result 31 (Arm wound)
    "4": "53",   // Opponent uses move 4 → You experience result 53 (Body wound)
    "10": "45",  // Opponent uses move 10 → You experience result 45 (Parrying high)
    // ... etc
  }]
}
```

#### Making a Character Faster

**Strategy:** Replace "wound" result IDs with "positioning" result IDs

**Positioning Results (0 damage):**
- `"3"` - Swinging high
- `"5"` - Swinging low
- `"9"` - Thrusting high
- `"11"` - Thrusting low
- `"15"` - Swinging down
- `"23"` - Behind you!
- `"25"` - Kicking

**Wound Results (positive damage):**
- `"7"` - Dazed (6+ damage)
- `"13"` - Leg wound (3-5 damage)
- `"31"` - Arm wound (2-4 damage)
- `"53"` - Body wound (4-8 damage)

**Example Change for Speed:**
```json
// BEFORE (slower character):
{
  "id": "10",
  "outcomes": [{
    "24": "53",  // Opponent Down Swing → You take Body wound (4 damage)
    "28": "31",  // Opponent Strong Swing → You take Arm wound (2 damage)
  }]
}

// AFTER (faster character):
{
  "id": "10",
  "outcomes": [{
    "24": "15",  // Opponent Down Swing → You're Swinging down (0 damage) - YOU'RE FASTER!
    "28": "3",   // Opponent Strong Swing → You're Swinging high (0 damage) - YOU'RE FASTER!
  }]
}
```

#### Symmetry Rule

**Important:** When both players use the same move (or equivalent moves), they should get symmetric results:
- Both parry: IDs 45 (Parrying high) or 49 (Parrying low)
- Both swing: IDs 3 (Swinging high) or 5 (Swinging low)
- Both thrust: IDs 9 (Thrusting high) or 11 (Thrusting low)

Don't break symmetry for identical matchups.

#### Defensive Move Outcomes

For defensive moves (jumps, dodges, blocks), typically map to:
- Result 57 (Extended range blocking) - successful defense
- Result 33 (Dodging) - successful dodge
- Result 61 (Extended range dodging) - successful dodge at range

#### The "00" Placeholder

Use `"00"` for moves that don't exist in your character's moveset:

```json
{
  "id": "2",
  "outcomes": [{
    "12": "00",  // If your character doesn't have move 12 (Fake Low)
    "22": "00",  // If your character doesn't have move 22 (Fake Side Swing)
    "38": "00"   // If your character doesn't have move 38 (Fake Thrust)
  }]
}
```

### 7. Update Character Index

Add your character to `src/characters/index.json`:

```json
{
  "characters": [
    "barbarian",
    "goblin",
    "fighter",
    "humanMonk",
    "knight",
    "lizardMan",
    "skeletonWarrior",
    "zombie",
    "yourCharacter"  // ← Add your character slug
  ]
}
```

---

## Tuning Parameters

### Quick Reference: Character Archetypes

#### Glass Cannon (High Offense, Low Defense)
- Health: 7-10 HP
- Move modifiers: +3 to +5 on strong attacks
- Result damage: 5-8 for wounds
- Speed: Average to Fast (50-60% win rate)
- Example: Human Monk (but less extreme)

#### Tank (High Defense, Low Offense)
- Health: 14-16 HP
- Move modifiers: +1 to +2 on strong attacks
- Result damage: 1-3 for wounds
- Speed: Slow to Average (40-50% win rate)
- Example: Knight

#### Speed Fighter (Evasive, Moderate Power)
- Health: 10-12 HP
- Move modifiers: +0 to +2 on attacks
- Result damage: 3-4 for wounds
- Speed: Fast (55-65% win rate)
- Outcome tables: More positioning results
- Example: Goblin

#### Balanced Fighter
- Health: 12 HP
- Move modifiers: +1 to +3 on attacks
- Result damage: 3-4 for wounds
- Speed: Average (46-54% win rate)
- Example: Human Fighter

#### Heavy Hitter (High Variance)
- Health: 11-13 HP
- Move modifiers: -2 to +4 (wide range)
- Result damage: 4-6 for wounds
- Speed: Slow (35-45% win rate)
- Example: Barbarian

---

## Testing & Balance

### 1. Validate Character File

```bash
node bin/validate-characters.js --character your-character-slug
```

This checks for:
- Missing references
- Invalid move types
- Broken outcome tables
- Missing results

### 2. Analyze Stats

```bash
node bin/analyze-character-stats.js --character your-character-slug
```

Review:
- Average attack modifier
- Maximum damage output
- Move type distribution
- Special abilities

### 3. Check Difficulty

```bash
node bin/analyze-character-difficulty.js --character your-character-slug --verbose
```

Review:
- Speed/Timing score (40% of difficulty)
- Defense score (25% of difficulty)
- Forgiveness score (20% of difficulty)
- Overall difficulty rating

Target difficulty ranges:
- Beginner: 2.0-4.0
- Intermediate: 4.0-6.0
- Advanced: 6.0-8.0
- Expert: 8.0-10.0

### 4. Test Matchups

```bash
node bin/analyze-character-stats.js --matchup your-character-slug fighter
```

Check:
- Damage ratios
- Speed advantages
- Knockout moves

### 5. Build and Test

```bash
npm run build
```

Test in actual gameplay to verify:
- Character feels right
- Speed profile works as intended
- Damage values are balanced
- No broken interactions

---

## Common Pitfalls

### 1. Breaking Symmetry
❌ **Wrong:** Different results for identical moves
```json
// Player A's table for move 10
"10": "53"  // Body wound

// Player B's table for move 10
"10": "45"  // Parrying high
```

✅ **Right:** Same results for identical moves
```json
// Both players' tables for move 10
"10": "45"  // Both parry
```

### 2. Forgetting Shield Dependencies
❌ **Wrong:** Keeping shield moves when `shield: false`
✅ **Right:** Remove all `requiresShield: true` moves if no shield

### 3. Extreme Values
❌ **Wrong:** Health of 3 or move modifier of +10
✅ **Right:** Health 7-16, modifiers -6 to +4

### 4. Missing "00" Placeholders
❌ **Wrong:** No outcome for opponent moves your character doesn't have
✅ **Right:** Use `"00"` for impossible matchups

### 5. Inconsistent Result IDs
❌ **Wrong:** Using non-existent result IDs in outcome tables
✅ **Right:** Only use result IDs that exist in your results array

---

## Advanced Topics

### Creating Unique Results

You can add 1-2 unique results for character flavor (Skeleton has 33 results vs 32 standard):

```json
{
  "id": "65",  // Use an unused ID
  "name": "Special Move Name",
  "range": "close",
  "score": "5",
  "restrict": ["strong", "high"],
  "bonus": [{"low": "2"}]
}
```

Then reference this ID in your outcome tables.

### Custom Restrictions

Restrictions limit moves next round. Common patterns:

```json
"restrict": ["strong", "high", "low"]  // Can only use defense, risky, extended
"restrict": ["Thrust", "high"]         // Can't use Thrust moves or high attacks
"restrict": []                         // No restrictions
```

Special restriction:
```json
"allowOnly": ["Jump"]  // ONLY Jump moves allowed (knocked down)
```

### Bonus Mechanics

Bonuses give +2 damage to specific move types next round:

```json
"bonus": [
  {
    "strong": "2",  // +2 to strong attacks next round
    "high": "2",    // +2 to high attacks next round
    "low": "2"      // +2 to low attacks next round
  }
]
```

Can also target move tags:
```json
"bonus": [
  {
    "Down Swing": "2",  // +2 to Down Swing moves next round
    "Side Swing": "2"   // +2 to Side Swing moves next round
  }
]
```

---

## Appendix: Move ID Reference

### Universal Moves (All Characters)
- `2` - Side Swing Low
- `8` - Jump Dodge
- `10` - Side Swing High
- `14` - Thrust Low
- `16` - Jump Away
- `22` - Fake Side Swing
- `24` - Down Swing Smash
- `28` - Side Swing Strong
- `30` - Special Dislodge Weapon
- `32` - Thrust High
- `40` - Special Wild Swing
- `44` - Protected Attack Down Swing (if shield) OR Block & Attack (no shield)
- `46` - Special Retrieve Weapon
- `50` - Extended Range Charge
- `54` - Extended Range Thrust High
- `56` - Extended Range Block & Close
- `58` - Extended Range Swing Low
- `62` - Extended Range Jump Back (typically firstMove)
- `64` - Extended Range Swing High

### Common Moves (6-7 Characters)
- `4` - Shield Block Low (shield only)
- `12` - Fake Low
- `18` - Jump Up
- `20` - Jump Duck
- `26` - Shield Block High (shield only)
- `34` - Special Kick
- `42` - Fake High
- `48` - Protected Attack Side Swing (shield only)
- `52` - Extended Range Dodge
- `60` - Extended Range Thrust Low

### Unique/Rare Moves
- `6` - Protected Attack Thrust (shield only)
- `36` - Down Swing Bash
- `38` - Fake Thrust

---

## Appendix: Result ID Reference

### Universal Results (All Characters)

**Positioning (0 damage):**
- `1` - Jumping away (grants bonus)
- `3` - Swinging high
- `5` - Swinging low
- `9` - Thrusting high
- `11` - Thrusting low
- `15` - Swinging down
- `23` - Behind you!
- `25` - Kicking
- `29` - Ducking (grants bonus)
- `33` - Dodging (grants bonus)
- `37` - Jumping up (grants bonus)
- `39` - Charging
- `57` - Extended range blocking
- `61` - Extended range dodging

**Defensive (negative damage):**
- `17` - Blocking high (-4)
- `45` - Parrying high (-4)
- `49` - Parrying low (-4)
- `63` - Blocking low (-4)

**Wounds (positive damage):**
- `7` - Dazed (6-8 damage, heavy restrictions)
- `13` - Leg wound (1-5 damage)
- `31` - Arm wound (1-4 damage)
- `35` - Extended range body wound (2-6 damage)
- `47` - Extended range leg wound (3-5 damage)
- `53` - Body wound (2-8 damage)
- `59` - Extended range arm wound (1-3 damage)

**Control (0 damage, restrictions):**
- `19` - Knocked off balance
- `21` - Turned around
- `41` - Knocked down (allowOnly: Jump)
- `51` - Kicked off balance

**Special:**
- `27` - Weapon Dislodged (weaponDislodged: true)
- `43` - Retrieving Weapon (retrieveWeapon: true)
- `55` - Shield Smashed (shieldDestroyed: true, shield characters only)

---

## Quick Start Checklist

- [ ] Choose base template character
- [ ] Define character concept (archetype, weapon, shield, health)
- [ ] Copy template file to new filename
- [ ] Update metadata (name, slug, description, health, weapon, shield)
- [ ] Remove shield moves if no shield
- [ ] Adjust move modifiers for offensive power
- [ ] Adjust result damage values for defensive durability
- [ ] Adjust outcome tables for speed profile (optional, advanced)
- [ ] Add character slug to index.json
- [ ] Run validation script
- [ ] Run stats analysis
- [ ] Run difficulty analysis
- [ ] Test matchups against existing characters
- [ ] Build and playtest
- [ ] Iterate based on playtesting

---

**Good luck creating your character!** Start with small changes to existing characters and gradually experiment with more dramatic modifications as you understand the system better.
