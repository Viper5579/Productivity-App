import { useEffect, useState } from 'react';

interface LevelUpModalProps {
  show: boolean;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
  onClose: () => void;
}

export function LevelUpModal({
  show,
  oldLevel,
  newLevel,
  xpGained,
  onClose,
}: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 ${
          isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
        }`}
      >
        {/* Celebration emojis */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-6xl animate-bounce">
          🎉
        </div>

        <div className="text-center text-white">
          {/* Level Up text */}
          <h2 className="text-4xl font-bold mb-4 animate-pulse">
            LEVEL UP!
          </h2>

          {/* Level display */}
          <div className="bg-white bg-opacity-20 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold">{oldLevel}</div>
                <div className="text-sm opacity-75">Previous</div>
              </div>

              <div className="text-4xl">→</div>

              <div className="text-center">
                <div className="text-6xl font-bold animate-pulse">{newLevel}</div>
                <div className="text-sm opacity-75">New Level!</div>
              </div>
            </div>
          </div>

          {/* XP Gained */}
          <div className="mb-6">
            <div className="text-2xl font-semibold">
              +{xpGained.toLocaleString()} XP
            </div>
            <div className="text-sm opacity-90">Experience Gained</div>
          </div>

          {/* Motivational message */}
          <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
            <p className="text-lg font-medium">
              {newLevel <= 5 && "Great progress! Keep it up! 🚀"}
              {newLevel > 5 && newLevel <= 10 && "You're leveling up fast! Amazing work! ⭐"}
              {newLevel > 10 && newLevel <= 20 && "Incredible dedication! You're unstoppable! 💪"}
              {newLevel > 20 && "You're a true master! Legendary! 👑"}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold hover:bg-opacity-90 transition-all"
          >
            Awesome!
          </button>
        </div>

        {/* Confetti effect corners */}
        <div className="absolute top-0 left-0 text-2xl animate-ping">✨</div>
        <div className="absolute top-0 right-0 text-2xl animate-ping animation-delay-200">⭐</div>
        <div className="absolute bottom-0 left-0 text-2xl animate-ping animation-delay-400">💫</div>
        <div className="absolute bottom-0 right-0 text-2xl animate-ping animation-delay-600">🌟</div>
      </div>
    </div>
  );
}
