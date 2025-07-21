
"use client";
import React from 'react';

// An object containing fruit data and simple display components
export const FruitImages = {
  watermelon: {
    emoji: '🍉',
    arabicName: 'بطيخ',
    multiplier: 5,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍉</div>
        <div className="text-xs text-white">5 مرة</div>
      </div>
    )
  },
  
  cherry: {
    emoji: '🍒',
    arabicName: 'كرز',
    multiplier: 45,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍒</div>
        <div className="text-xs text-white">45 مرة</div>
      </div>
    )
  },
  
  orange: {
    emoji: '🍊',
    arabicName: 'برتقال',
    multiplier: 25,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍊</div>
        <div className="text-xs text-white">25 مرة</div>
      </div>
    )
  },
  
  pear: {
    emoji: '🍐',
    arabicName: 'إجاص',
    multiplier: 5,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍐</div>
        <div className="text-xs text-white">5 مرة</div>
      </div>
    )
  },
  
  lemon: {
    emoji: '🍋',
    arabicName: 'ليمون',
    multiplier: 15,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍋</div>
        <div className="text-xs text-white">15 مرة</div>
      </div>
    )
  },
  
  strawberry: {
    emoji: '🍓',
    arabicName: 'فراولة',
    multiplier: 5,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍓</div>
        <div className="text-xs text-white">5 مرة</div>
      </div>
    )
  },
  
  apple: {
    emoji: '🍎',
    arabicName: 'تفاح',
    multiplier: 5,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍎</div>
        <div className="text-xs text-white">5 مرة</div>
      </div>
    )
  },
  
  grapes: {
    emoji: '🍇',
    arabicName: 'عنب',
    multiplier: 10,
    component: () => (
      <div className="flex flex-col items-center">
        <div className="text-4xl mb-2">🍇</div>
        <div className="text-xs text-white">10 مرة</div>
      </div>
    )
  }
};

// Component to display a single fruit
interface FruitDisplayProps {
  fruitType: keyof typeof FruitImages;
  size?: 'small' | 'medium' | 'large';
}

export const FruitDisplay: React.FC<FruitDisplayProps> = ({ fruitType, size = 'medium' }) => {
  const fruit = FruitImages[fruitType];
  
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl'
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} mb-1`}>
        {fruit.emoji}
      </div>
      <div className="text-xs text-white opacity-90">
        {fruit.multiplier} مرة
      </div>
    </div>
  );
};

// Component to display all fruits in a grid
export const AllFruitsDisplay: React.FC = () => {
  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {Object.entries(FruitImages).map(([key, fruit]) => (
        <div key={key} className="bg-purple-600/50 rounded-lg p-3 text-center shadow-lg border border-purple-400/50">
          <div className="text-3xl mb-2">{fruit.emoji}</div>
          <div className="text-sm text-white">{fruit.arabicName}</div>
          <div className="text-xs text-yellow-300">{fruit.multiplier}x</div>
        </div>
      ))}
    </div>
  );
};

export default FruitImages;
