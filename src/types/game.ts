import { FruitKey } from '@/components/fruits';

export interface GameState {
  timer: number;
  isSpinning: boolean;
  winningFruit: FruitKey | null;
  highlightedFruit: FruitKey | null;
  history: FruitKey[];
  bets: Record<FruitKey, number>;
}
