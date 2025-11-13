interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  unlocked?: boolean;
  unlockedAt?: Date;
  progress?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  showProgress?: boolean;
}

export function AchievementBadge({ achievement, showProgress = true }: AchievementBadgeProps) {
  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-blue-400 to-purple-600',
  };

  const tierBorders = {
    bronze: 'border-amber-600',
    silver: 'border-gray-500',
    gold: 'border-yellow-500',
    platinum: 'border-purple-500',
  };

  const isLocked = !achievement.unlocked;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 ${
        isLocked
          ? 'bg-gray-100 border-gray-300 opacity-60'
          : `bg-gradient-to-br ${tierColors[achievement.tier]} ${tierBorders[achievement.tier]}`
      } transition-all hover:scale-105`}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🔒</span>
        </div>
      )}

      {/* Achievement content */}
      <div className={isLocked ? 'blur-sm' : ''}>
        <div className="text-center">
          {/* Icon */}
          <div className="text-4xl mb-2">{achievement.icon || '🏆'}</div>

          {/* Tier badge */}
          <div
            className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${
              isLocked
                ? 'bg-gray-300 text-gray-600'
                : 'bg-white bg-opacity-30 text-white'
            }`}
          >
            {achievement.tier.toUpperCase()}
          </div>

          {/* Name */}
          <h3
            className={`font-bold text-sm mb-1 ${
              isLocked ? 'text-gray-700' : 'text-white'
            }`}
          >
            {achievement.name}
          </h3>

          {/* Description */}
          <p
            className={`text-xs mb-2 ${
              isLocked ? 'text-gray-600' : 'text-white text-opacity-90'
            }`}
          >
            {achievement.description}
          </p>

          {/* XP Reward */}
          {!isLocked && achievement.xpReward > 0 && (
            <div className="text-xs text-white font-semibold">
              +{achievement.xpReward} XP
            </div>
          )}

          {/* Progress bar for locked achievements */}
          {isLocked && showProgress && achievement.progress !== undefined && (
            <div className="mt-3">
              <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {achievement.progress}% Complete
              </div>
            </div>
          )}

          {/* Unlocked date */}
          {!isLocked && achievement.unlockedAt && (
            <div className="mt-2 text-xs text-white text-opacity-75">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  showLocked?: boolean;
}

export function AchievementGrid({ achievements, showLocked = true }: AchievementGridProps) {
  const displayedAchievements = showLocked
    ? achievements
    : achievements.filter((a) => a.unlocked);

  // Group by category
  const byCategory = displayedAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="space-y-8">
      {Object.entries(byCategory).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
            {category} Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryAchievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
