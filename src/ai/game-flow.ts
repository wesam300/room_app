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
    lastUpdate: Date.now(),
};

// Zod schemas for input/output validation
const PlaceBetSchema = z.object({
  fruit: z.custom<FruitKey>(),
  amount: z.number().positive(),
});

const EmptySchema = z.object({});

/**
 * The main game engine. Runs on the server and updates the state.
 * This function is called on every request to ensure the state is always current.
 */
function gameEngine() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - gameState.lastUpdate) / 1000);

    if (gameState.isSpinning) {
        const spinStartTime = gameState.spinStartTime ?? now;
        if (!gameState.spinStartTime) {
             gameState.spinStartTime = spinStartTime;
        }
        
        const spinElapsedTime = now - spinStartTime;

        if (spinElapsedTime < SPIN_DURATION_MS) {
            // Spin animation phase
            const winner = gameState.winningFruit!;
            const winnerIndex = SPIN_SEQUENCE_MAP.indexOf(winner);
            const totalRevolutions = 3;
            // Total steps available in the animation sequence
            const totalSteps = (totalRevolutions * SPIN_SEQUENCE_MAP.length) + winnerIndex;
            // Progress of the spin animation (0 to 1)
            const progress = spinElapsedTime / SPIN_DURATION_MS;
            // Current step in the animation sequence
            const currentStep = Math.floor(progress * totalSteps);
            // Get the fruit to highlight from the sequence map
            gameState.highlightedFruit = SPIN_SEQUENCE_MAP[currentStep % SPIN_SEQUENCE_MAP.length];
        } else {
            // End of spin, reset for next round
            gameState.isSpinning = false;
            gameState.history = [gameState.winningFruit!, ...gameState.history].slice(0, 5);
            // The client will handle the payout, so we just reset the server state
            gameState.bets = {} as Record<FruitKey, number>;
            gameState.timer = ROUND_DURATION;
            gameState.highlightedFruit = gameState.winningFruit; // Keep winner highlighted briefly
            gameState.winningFruit = null;
            gameState.spinStartTime = undefined;
            gameState.lastUpdate = now;
        }
    } else {
        // Betting phase
        if (elapsedSeconds > 0) {
            // If the round just ended, there might be a brief moment where winningFruit is null
            // but the timer reset is pending. We clear the highlight here.
            if(gameState.highlightedFruit) {
                gameState.highlightedFruit = null;
            }
            gameState.timer -= elapsedSeconds;
            gameState.lastUpdate = now;
        }

        if (gameState.timer <= 0) {
            // Timer is 0, start spinning
            gameState.isSpinning = true;
            gameState.winningFruit = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
            gameState.spinStartTime = now;
            gameState.lastUpdate = now;
            gameState.timer = 0;
        }
    }
}


// Define the flows that the client can call
export const getGameState = ai.defineFlow(
  {
    name: 'getGameState',
    inputSchema: EmptySchema,
    outputSchema: z.custom<GameState>(),
  },
  async () => {
    gameEngine();
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
    // Run the engine to make sure the timer is up-to-date before checking
    gameEngine();
    if (gameState.isSpinning || gameState.timer <= 3) {
      console.warn("Bet placed on closed round.");
      return { success: false };
    }
    gameState.bets[fruit] = (gameState.bets[fruit] || 0) + amount;
    return { success: true };
  }
);
