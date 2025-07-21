
import React from 'react';

// Defines the structure for each fruit
interface Fruit {
  id: FruitKey;
  emoji: string;
  name: string;
  multiplier: number;
}

// Defines the types for fruit keys
export type FruitKey = 'cherry' | 'lemon' | 'apple' | 'watermelon' | 'grapes' | 'strawberry' | 'orange' | 'pear';

// A record of all fruits in the game, matching the multipliers from the screenshot
export const FRUITS: Record<FruitKey, Fruit> = {
  watermelon: { id: 'watermelon', name: 'بطيخ',      emoji: '🍉', multiplier: 5 },
  cherry:     { id: 'cherry',     name: 'كرز',       emoji: '🍒', multiplier: 45 },
  orange:     { id: 'orange',     name: 'برتقال',     emoji: '🍊', multiplier: 25 },
  pear:       { id: 'pear',       name: 'كمثرى',      emoji: '🍐', multiplier: 5 },
  lemon:      { id: 'lemon',      name: 'ليمون',      emoji: '🍋', multiplier: 15  },
  strawberry: { id: 'strawberry', name: 'فراولة',    emoji: '🍓', multiplier: 5 },
  apple:      { id: 'apple',      name: 'تفاح',       emoji: '🍎', multiplier: 5  },
  grapes:     { id: 'grapes',     name: 'عنب',       emoji: '🍇', multiplier: 10 },
};


// A component to display a single fruit, using emoji and multiplier
interface FruitDisplayProps {
  fruitType: keyof typeof FRUITS;
  size?: 'small' | 'medium' | 'large';
  showMultiplier?: boolean;
  isNew?: boolean;
}

export const FruitDisplay: React.FC<FruitDisplayProps> = ({ fruitType, size = 'medium', showMultiplier = true, isNew = false }) => {
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
      {showMultiplier ? (
        <div className="text-xs text-white opacity-90 font-bold">
          x{fruit.multiplier}
        </div>
      ) : isNew ? (
        <div className="text-xs text-yellow-300 border border-yellow-400 rounded-sm px-1 py-0.5" style={{fontSize: '0.6rem'}}>
          new
        </div>
      ) : null}
    </div>
  );
};
