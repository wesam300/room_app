'use server';
/**
 * @fileOverview A server-side game engine for Fruity Fortune.
 *
 * This flow manages the central game state, including the timer,
 * bets, and round lifecycle, ensuring all players have a
 * synchronized experience.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FruitKey, FRUITS } from '@/components/fruits';
import { GameState } from '@/types/game';

// Constants
const ROUND_DURATION = 20;
const SPIN_DURATION_MS = 5000;
const FRUIT_KEYS = Object.keys(FRUITS) as FruitKey[];
const SPIN_SEQUENCE_MAP: FruitKey[] = ['lemon', 'orange', 'cherry', 'watermelon', 'pear', 'strawberry', 'apple', 'grapes'];

// In-memory state. In a real production app, this would be a persistent database.
let gameState: GameState = {
    id: 'main_game',
    timer: ROUND_DURATION,
    isSpinning: false,
    winningFruit: null,
    highlightedFruit: null,
    history: [],
    bets: {} as Record<FruitKey, number>,
};

// Zod schemas for input/output validation
const PlaceBetSchema = z.object({
  fruit: z.custom<FruitKey>(),
  amount: z.number().positive(),
});

const EmptySchema = z.object({});

/**
 * The main game loop. Runs on the server and updates the state.
 * This function is self-invoking and creates a continuous loop.
 */
async function gameLoop() {
    if (gameState.isSpinning) {
        // Spin animation phase
        const spinStartTime = Date.now();
        const winner = gameState.winningFruit!;
        const winnerIndex = SPIN_SEQUENCE_MAP.indexOf(winner);
        const totalSteps = (3 * SPIN_SEQUENCE_MAP.length) + winnerIndex;
        const stepDuration = SPIN_DURATION_MS / totalSteps;

        for (let i = 0; i <= totalSteps; i++) {
             gameState.highlightedFruit = SPIN_SEQUENCE_MAP[i % SPIN_SEQUENCE_MAP.length];
             await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
        gameState.highlightedFruit = winner;
        
        // End of spin, reset for next round
        gameState.isSpinning = false;
        gameState.history = [winner, ...gameState.history].slice(0, 5);
        gameState.winningFruit = null;
        gameState.bets = {} as Record<FruitKey, number>;
        gameState.timer = ROUND_DURATION;
        gameState.highlightedFruit = null;

    } else {
        // Betting phase
        if (gameState.timer > 0) {
            gameState.timer--;
        } else {
            // Timer is 0, start spinning
            gameState.isSpinning = true;
            const winningFruit = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
            gameState.winningFruit = winningFruit;
        }
    }
    // Schedule the next loop iteration
    setTimeout(gameLoop, 1000);
}

// Start the game loop when the server starts.
gameLoop();


// Define the flows that the client can call
export const getGameState = ai.defineFlow(
  {
    name: 'getGameState',
    inputSchema: EmptySchema,
    outputSchema: z.custom<GameState>(),
  },
  async () => {
    return gameState;
  }
);

export const placeBet = ai.defineFlow(
  {
    name: 'placeBet',
    inputSchema: PlaceBetSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ fruit, amount }) => {
    if (gameState.isSpinning || gameState.timer <= 3) {
      console.warn("Bet placed on closed round.");
      return { success: false };
    }
    gameState.bets[fruit] = (gameState.bets[fruit] || 0) + amount;
    return { success: true };
  }
);
