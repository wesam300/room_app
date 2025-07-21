import React from 'react';

export type FruitKey = 'cherry' | 'lemon' | 'apple' | 'watermelon' | 'grapes' | 'strawberry' | 'orange' | 'pear';

interface Fruit {
  id: FruitKey;
  name: string;
  emoji: string;
  multiplier: number;
}

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

interface FruitDisplayProps {
  fruitType: FruitKey;
  size?: 'small' | 'medium' | 'large';
  showMultiplier?: boolean;
}

export const FruitDisplay: React.FC<FruitDisplayProps> = ({ fruitType, size = 'medium', showMultiplier = true }) => {
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
      {showMultiplier && (
        <div className="text-xs text-white opacity-90 font-bold">
          x{fruit.multiplier}
        </div>
      )}
    </div>
  );
};
