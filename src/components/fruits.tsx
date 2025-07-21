
import React from 'react';

// Defines the structure for each fruit
interface Fruit {
  id: FruitKey;
  emoji: string;
  name: string;
  multiplier: number;
}

// Defines the types for fruit keys
export type FruitKey = 'cherry' | 'lemon' | 'apple' | 'watermelon' | 'grapes' | 'kiwi' | 'pineapple' | 'mango';

// A record of all fruits in the game, matching the multipliers from the screenshot
export const FRUITS: Record<FruitKey, Fruit> = {
  cherry:     { id: 'cherry',    name: 'كرز',      emoji: '🍒', multiplier: 45 },
  lemon:      { id: 'lemon',     name: 'ليمون',     emoji: '🍋', multiplier: 5  },
  apple:      { id: 'apple',     name: 'تفاح',      emoji: '🍎', multiplier: 5  },
  watermelon: { id: 'watermelon',name: 'بطيخ',     emoji: '🍉', multiplier: 5  },
  grapes:     { id: 'grapes',    name: 'عنب',      emoji: '🍇', multiplier: 10 },
  kiwi:       { id: 'kiwi',      name: 'كيوي',      emoji: '🥝', multiplier: 5 },
  pineapple:  { id: 'pineapple', name: 'أناناس',    emoji: '🍍', multiplier: 5 },
  mango:      { id: 'mango',     name: 'مانجو',     emoji: '🥭', multiplier: 45 },
};


// A component to display a single fruit, using emoji and multiplier
interface FruitDisplayProps {
  fruitType: keyof typeof FRUITS;
  size?: 'small' | 'medium' | 'large';
}

export const FruitDisplay: React.FC<FruitDisplayProps> = ({ fruitType, size = 'medium' }) => {
  const fruit = FRUITS[fruitType];
  
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-4xl',
    large: 'text-6xl'
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} mb-1`}>
        {fruit.emoji}
      </div>
      <div className="text-xs text-white opacity-90 font-bold">
        x{fruit.multiplier}
      </div>
    </div>
  );
};
