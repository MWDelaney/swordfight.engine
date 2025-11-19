/**
 * OpenAPI 3.0 Specification Generator
 * Generates a complete OpenAPI spec for the SwordFight API
 */
export default {
  data: {
    permalink: "/openapi.json"
  },
  render(data) {
    const spec = {
      openapi: "3.0.3",
      info: {
        title: "SwordFight API",
        version: "1.0.0",
        description: "A static, pre-computed API for turn-based sword fighting games. All outcomes are deterministic and pre-generated as static JSON files.",
        license: {
          name: "MIT",
          url: "https://github.com/MWDelaney/swordfight.engine/blob/main/LICENSE"
        },
        contact: {
          name: "SwordFight Engine",
          url: "https://github.com/MWDelaney/swordfight.engine"
        }
      },
      servers: [
        {
          url: "https://api.swordfight.me",
          description: "Production API (GitHub Pages)"
        },
        {
          url: "http://localhost:8080",
          description: "Local development server"
        }
      ],
      tags: [
        {
          name: "Characters",
          description: "Character data including stats, moves, and abilities"
        },
        {
          name: "Rounds",
          description: "Pre-computed round outcomes for all move combinations"
        },
        {
          name: "Meta",
          description: "API metadata and discovery endpoints"
        }
      ],
      paths: {
        "/index.json": {
          get: {
            tags: ["Meta"],
            summary: "API metadata and discovery",
            description: "Returns information about the API including available endpoints and character list",
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ApiIndex"
                    },
                    example: {
                      name: "SwordFight Static API",
                      version: "1.0.0",
                      description: "Static JSON API for SwordFight game engine",
                      endpoints: {
                        characters: "/characters/index.json",
                        characterDetail: "/characters/{slug}.json",
                        rounds: "/rounds/{char1}/{char2}/{move1}/{move2}.json"
                      },
                      characters: [
                        {
                          slug: "human-fighter",
                          name: "Human Fighter",
                          description: "Human fighter with sword and shield",
                          health: "12",
                          weapon: "Broadsword",
                          shield: "Shield"
                        },
                        {
                          slug: "goblin",
                          name: "Goblin",
                          description: "Goblin with mace and shield",
                          health: "13",
                          weapon: "Mace",
                          shield: "Wooden Shield"
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        "/characters/index.json": {
          get: {
            tags: ["Characters"],
            summary: "List all characters",
            description: "Returns a list of all available characters with basic stats",
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        characters: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/CharacterSummary"
                          }
                        }
                      }
                    },
                    example: {
                      characters: [
                        {
                          slug: "human-fighter",
                          name: "Human Fighter",
                          description: "Human fighter with sword and shield",
                          health: "12",
                          weapon: "Broadsword",
                          shield: "Shield"
                        },
                        {
                          slug: "goblin",
                          name: "Goblin",
                          description: "Goblin with mace and shield",
                          health: "13",
                          weapon: "Mace",
                          shield: "Wooden Shield"
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        "/characters/{slug}.json": {
          get: {
            tags: ["Characters"],
            summary: "Get character details",
            description: "Returns complete character data including all moves and abilities",
            parameters: [
              {
                name: "slug",
                in: "path",
                required: true,
                description: "Character slug identifier",
                schema: {
                  type: "string",
                  enum: data.characters.slugs
                },
                example: "human-fighter"
              }
            ],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Character"
                    },
                    example: {
                      name: "Human Fighter",
                      slug: "human-fighter",
                      description: "Human fighter with sword and shield",
                      health: "12",
                      firstMove: "62",
                      weapon: "Broadsword",
                      shield: "Shield",
                      moves: [
                        {
                          tag: "Down Swing",
                          name: "Smash",
                          range: "close",
                          type: "strong",
                          id: "24",
                          mod: "3",
                          requiresWeapon: true
                        },
                        {
                          tag: "Side Swing",
                          name: "High",
                          range: "close",
                          type: "high",
                          id: "10",
                          mod: "1",
                          requiresWeapon: true
                        }
                      ]
                    }
                  }
                }
              },
              "404": {
                description: "Character not found"
              }
            }
          }
        },
        "/rounds/{char1}/{char2}/{move1}/{move2}.json": {
          get: {
            tags: ["Rounds"],
            summary: "Get round outcome",
            description: "Returns the complete outcome for a specific round including damage, bonuses, restrictions, and result text for both players",
            parameters: [
              {
                name: "char1",
                in: "path",
                required: true,
                description: "Player 1 character slug",
                schema: {
                  type: "string",
                  enum: data.characters.slugs
                },
                example: "human-fighter"
              },
              {
                name: "char2",
                in: "path",
                required: true,
                description: "Player 2 character slug",
                schema: {
                  type: "string",
                  enum: data.characters.slugs
                },
                example: "goblin-fighter"
              },
              {
                name: "move1",
                in: "path",
                required: true,
                description: "Player 1 move ID",
                schema: {
                  type: "string",
                  pattern: "^[0-9]+$"
                },
                example: "24"
              },
              {
                name: "move2",
                in: "path",
                required: true,
                description: "Player 2 move ID",
                schema: {
                  type: "string",
                  pattern: "^[0-9]+$"
                },
                example: "10"
              }
            ],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/RoundOutcome"
                    },
                    example: {
                      player1: {
                        character: {
                          slug: "human-fighter",
                          name: "Human Fighter"
                        },
                        move: {
                          id: "24",
                          name: "Smash",
                          tag: "Down Swing"
                        },
                        outcome: "45",
                        result: "Parrying high",
                        range: "close",
                        score: "-4",
                        totalScore: 0,
                        modifier: "3",
                        bonus: 0,
                        nextRoundBonus: 0,
                        restrictions: []
                      },
                      player2: {
                        character: {
                          slug: "goblin",
                          name: "Goblin"
                        },
                        move: {
                          id: "10",
                          name: "High",
                          tag: "Side Swing"
                        },
                        outcome: "45",
                        result: "Parrying high",
                        range: "close",
                        score: "-4",
                        totalScore: 0,
                        modifier: "1",
                        bonus: 0,
                        nextRoundBonus: 0,
                        restrictions: []
                      }
                    }
                  }
                }
              },
              "404": {
                description: "Round outcome not found (invalid character or move combination)"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ApiIndex: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "API name"
              },
              version: {
                type: "string",
                description: "API version"
              },
              description: {
                type: "string",
                description: "API description"
              },
              endpoints: {
                type: "object",
                description: "Available endpoint patterns",
                properties: {
                  characters: { type: "string" },
                  characterDetail: { type: "string" },
                  rounds: { type: "string" }
                }
              },
              characters: {
                type: "array",
                description: "List of all available characters",
                items: {
                  $ref: "#/components/schemas/CharacterSummary"
                }
              }
            }
          },
          CharacterSummary: {
            type: "object",
            description: "Basic character information",
            properties: {
              slug: {
                type: "string",
                description: "URL-friendly character identifier",
                example: "human-fighter"
              },
              name: {
                type: "string",
                description: "Character display name",
                example: "Human Fighter"
              },
              description: {
                type: "string",
                description: "Character description",
                example: "Human fighter with sword and shield"
              },
              health: {
                type: "string",
                description: "Maximum health points",
                example: "12"
              },
              weapon: {
                oneOf: [
                  { type: "string" },
                  { type: "boolean" }
                ],
                description: "Equipped weapon or false if none",
                example: "Broadsword"
              },
              shield: {
                oneOf: [
                  { type: "string" },
                  { type: "boolean" }
                ],
                description: "Equipped shield or false if none",
                example: "Shield"
              }
            }
          },
          Character: {
            type: "object",
            description: "Complete character data",
            properties: {
              name: {
                type: "string",
                description: "Character display name"
              },
              slug: {
                type: "string",
                description: "URL-friendly identifier"
              },
              description: {
                type: "string",
                description: "Character description"
              },
              health: {
                type: "string",
                description: "Maximum health points"
              },
              firstMove: {
                type: "string",
                description: "ID of the first available move"
              },
              weapon: {
                oneOf: [
                  { type: "string" },
                  { type: "boolean" }
                ],
                description: "Equipped weapon or false if none"
              },
              shield: {
                oneOf: [
                  { type: "string" },
                  { type: "boolean" }
                ],
                description: "Equipped shield or false if none"
              },
              moves: {
                type: "array",
                description: "All available moves for this character",
                items: {
                  $ref: "#/components/schemas/Move"
                }
              }
            }
          },
          Move: {
            type: "object",
            description: "A character move/attack",
            properties: {
              id: {
                type: "string",
                description: "Unique move identifier"
              },
              tag: {
                type: "string",
                description: "Move category/type",
                example: "Down Swing"
              },
              name: {
                type: "string",
                description: "Move display name",
                example: "Smash"
              },
              range: {
                type: "string",
                enum: ["close", "medium", "far"],
                description: "Effective range of the move"
              },
              type: {
                type: "string",
                enum: ["strong", "high", "low", "defense"],
                description: "Attack type"
              },
              mod: {
                type: "string",
                description: "Damage modifier"
              },
              requiresWeapon: {
                type: "boolean",
                description: "Whether this move requires a weapon"
              }
            }
          },
          RoundOutcome: {
            type: "object",
            description: "Complete outcome of a round for both players",
            properties: {
              player1: {
                $ref: "#/components/schemas/PlayerRoundResult"
              },
              player2: {
                $ref: "#/components/schemas/PlayerRoundResult"
              }
            }
          },
          PlayerRoundResult: {
            type: "object",
            description: "Round result from one player's perspective",
            properties: {
              character: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  name: { type: "string" }
                }
              },
              move: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  tag: { type: "string" }
                }
              },
              outcome: {
                type: "string",
                description: "Outcome ID from combat resolution"
              },
              result: {
                type: "string",
                description: "Human-readable result text"
              },
              range: {
                type: "string",
                enum: ["close", "medium", "far"],
                description: "Combat range for this round"
              },
              score: {
                oneOf: [
                  { type: "string" },
                  { type: "number" }
                ],
                description: "Base damage score for this round"
              },
              totalScore: {
                type: "number",
                description: "Total damage including modifiers and bonuses"
              },
              modifier: {
                oneOf: [
                  { type: "string" },
                  { type: "number" }
                ],
                description: "Move-specific damage modifier"
              },
              bonus: {
                type: "number",
                description: "Bonus damage applied this round"
              },
              nextRoundBonus: {
                type: "number",
                description: "Bonus damage to apply next round"
              },
              restrictions: {
                type: "array",
                description: "Move restrictions for next round",
                items: {
                  type: "string",
                  enum: ["strong", "high", "low", "defense"]
                }
              }
            }
          }
        }
      }
    };

    return JSON.stringify(spec, null, 2);
  }
};
