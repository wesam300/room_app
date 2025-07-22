
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
const ROUND_DURATION_S = 20;
const SPIN_DURATION_S = 5;
const TOTAL_DURATION_S = ROUND_DURATION_S + SPIN_DURATION_S;
const FRUIT_KEYS = Object.keys(FRUITS) as FruitKey[];
const SPIN_SEQUENCE_MAP: FruitKey[] = ['lemon', 'orange', 'cherry', 'watermelon', 'pear', 'strawberry', 'apple', 'grapes'];

// In-memory state for bets. This is a simplified approach.
// In a real production app, this would be a persistent database.
let roundBets: Record<FruitKey, number> = {};
let currentRoundId = 0;


// Zod schemas for input/output validation
const PlaceBetSchema = z.object({
  fruit: z.custom<FruitKey>(),
  amount: z.number().positive(),
});

const EmptySchema = z.undefined();

function getDeterministicGameState(): GameState {
    const now_ms = Date.now();
    const roundId = Math.floor(now_ms / (TOTAL_DURATION_S * 1000));
    
    // Reset bets when a new round starts
    if (roundId !== currentRoundId) {
        roundBets = {};
        currentRoundId = roundId;
    }

    const timeIntoRound_ms = now_ms % (TOTAL_DURATION_S * 1000);
    const isSpinning = timeIntoRound_ms >= (ROUND_DURATION_S * 1000);
    const timer = isSpinning ? 0 : Math.ceil(( (ROUND_DURATION_S * 1000) - timeIntoRound_ms) / 1000);
    
    // Use the roundId to seed the random number generator for deterministic results
    const pseudoRandom = (seed: number) => {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const winningFruit = FRUIT_KEYS[Math.floor(pseudoRandom(roundId) * FRUIT_KEYS.length)];
    const history = Array.from({length: 5}, (_, i) => {
        const pastRoundId = roundId - i - 1;
        return FRUIT_KEYS[Math.floor(pseudoRandom(pastRoundId) * FRUIT_KEYS.length)];
    });

    let highlightedFruit: FruitKey | null = null;

    if (isSpinning) {
        const timeIntoSpin_ms = timeIntoRound_ms - (ROUND_DURATION_S * 1000);
        const spinProgress = timeIntoSpin_ms / (SPIN_DURATION_S * 1000);

        if (spinProgress < 1) {
            // Spinning animation
            const winnerIndex = SPIN_SEQUENCE_MAP.indexOf(winningFruit);
            const totalRevolutions = 3;
            const totalSteps = (totalRevolutions * SPIN_SEQUENCE_MAP.length) + winnerIndex;
            const currentStep = Math.floor(spinProgress * totalSteps);
            highlightedFruit = SPIN_SEQUENCE_MAP[currentStep % SPIN_SEQUENCE_MAP.length];
        } else {
            // Momentarily show the winner after spin
            highlightedFruit = winningFruit;
        }
    }

    return {
        id: roundId.toString(),
        timer,
        isSpinning,
        winningFruit,
        highlightedFruit,
        history,
        bets: roundBets,
        lastUpdate: now_ms,
    };
}


// Define the flows that the client can call
export const getGameState = ai.defineFlow(
  {
    name: 'getGameState',
    inputSchema: EmptySchema,
    outputSchema: z.custom<GameState>(),
  },
  async () => {
    return getDeterministicGameState();
  }
);

export const placeBet = ai.defineFlow(
  {
    name: 'placeBet',
    inputSchema: PlaceBetSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ fruit, amount }) => {
    const currentState = getDeterministicGameState();
    if (currentState.isSpinning || currentState.timer <= 3) {
      console.warn("Bet placed on closed round.");
      return { success: false };
    }
    roundBets[fruit] = (roundBets[fruit] || 0) + amount;
    return { success: true };
  }
);
