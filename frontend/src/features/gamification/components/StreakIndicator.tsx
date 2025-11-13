interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  shieldsAvailable: number;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  shieldsAvailable,
}: StreakIndicatorProps) {
  // Determine streak level for visual effects
  const getStreakLevel = () => {
    if (currentStreak >= 30) return 'epic';
    if (currentStreak >= 14) return 'great';
    if (currentStreak >= 7) return 'good';
    if (currentStreak >= 3) return 'active';
    return 'starting';
  };

  const streakLevel = getStreakLevel();

  const levelColors = {
    starting: 'text-gray-400',
    active: 'text-orange-400',
    good: 'text-orange-500',
    great: 'text-red-500',
    epic: 'text-purple-600',
  };

  const levelGlows = {
    starting: '',
    active: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]',
    good: 'drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]',
    great: 'drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]',
    epic: 'drop-shadow-[0_0_20px_rgba(147,51,234,0.8)]',
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border-2 border-orange-200">
      <div className="flex items-center gap-4">
        {/* Flame Icon */}
        <div className="relative">
          <div
            className={`text-6xl ${levelColors[streakLevel]} ${levelGlows[streakLevel]} ${currentStreak > 0 ? 'animate-pulse' : ''}`}
          >
            🔥
          </div>
          {currentStreak >= 7 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              HOT!
            </div>
          )}
        </div>

        {/* Streak Info */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {currentStreak}
            </span>
            <span className="text-lg text-gray-600">day streak</span>
          </div>

          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Best: </span>
              <span className="text-gray-900 font-bold">{longestStreak} days</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Shields: </span>
              <div className="flex gap-1">
                {Array.from({ length: shieldsAvailable }).map((_, i) => (
                  <span key={i} className="text-blue-500">🛡️</span>
                ))}
                {shieldsAvailable === 0 && (
                  <span className="text-gray-400">🛡️</span>
                )}
              </div>
            </div>
          </div>

          {/* Streak level indicator */}
          {currentStreak > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                {currentStreak >= 30 && (
                  <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                    EPIC STREAK!
                  </span>
                )}
                {currentStreak >= 14 && currentStreak < 30 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    GREAT STREAK!
                  </span>
                )}
                {currentStreak >= 7 && currentStreak < 14 && (
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                    WEEK STREAK!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Motivational message */}
      <div className="mt-4 text-sm text-gray-700 text-center">
        {currentStreak === 0 && "Complete an assignment to start your streak!"}
        {currentStreak > 0 && currentStreak < 3 && "Keep going! You're building momentum 💪"}
        {currentStreak >= 3 && currentStreak < 7 && "Awesome! You're on a roll 🎯"}
        {currentStreak >= 7 && currentStreak < 14 && "Amazing! You've got a week streak! ⚡"}
        {currentStreak >= 14 && currentStreak < 30 && "Incredible! Two weeks strong! 🌟"}
        {currentStreak >= 30 && "LEGENDARY! You're unstoppable! 👑"}
      </div>
    </div>
  );
}
