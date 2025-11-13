import { useEffect, useState } from 'react';

interface XpProgressBarProps {
  currentXp: number;
  xpToNextLevel: number;
  level: number;
  totalXp: number;
  animate?: boolean;
}

export function XpProgressBar({
  currentXp,
  xpToNextLevel,
  level,
  totalXp,
  animate = true,
}: XpProgressBarProps) {
  const [progress, setProgress] = useState(0);

  const percentage = (currentXp / xpToNextLevel) * 100;

  useEffect(() => {
    if (animate) {
      // Animate progress bar
      const timer = setTimeout(() => {
        setProgress(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setProgress(percentage);
    }
  }, [percentage, animate]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-2xl font-bold text-primary-600">Level {level}</span>
          <span className="ml-2 text-sm text-gray-600">
            {currentXp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total XP</div>
          <div className="text-lg font-semibold text-gray-700">
            {totalXp.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress bar */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer" />
        </div>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
          {Math.floor(percentage)}%
        </div>
      </div>
    </div>
  );
}
