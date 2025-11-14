import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import { apiClient } from '../../../core/api-client';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { XpProgressBar } from '../../gamification/components/XpProgressBar';
import { LevelUpModal } from '../../gamification/components/LevelUpModal';
import { DailyMissionWidget } from '../../scheduling/components/DailyMissionWidget';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  pointsPossible: number | null;
  courseName: string | null;
  assignmentType: string | null;
  externalUrl: string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

interface Stats {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showCompleted, setShowCompleted] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    show: boolean;
    oldLevel: number;
    newLevel: number;
    xpGained: number;
  } | null>(null);

  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['assignments', showCompleted],
    queryFn: async () => {
      const response = await apiClient.get('/assignments', {
        params: { completed: showCompleted },
      });
      return response.data.data.assignments as Assignment[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['assignment-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/assignments/stats');
      return response.data.data.stats as Stats;
    },
  });

  // Fetch gamification stats
  const { data: gamificationStats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/stats');
      return response.data.data.stats;
    },
    retry: false, // Don't retry if gamification is disabled
  });

  // Complete assignment mutation
  const completeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/assignments/${assignmentId}/complete`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });

  // Uncomplete assignment mutation
  const uncompleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/assignments/${assignmentId}/uncomplete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });

  const handleToggleComplete = (assignment: Assignment) => {
    if (assignment.isCompleted) {
      uncompleteMutation.mutate(assignment.id);
    } else {
      completeMutation.mutate(assignment.id);
    }
  };

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Productivity Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              {gamificationStats && (
                <Link to="/gamification">
                  <Button size="sm">
                    🎮 Level {gamificationStats.xp.currentLevel}
                  </Button>
                </Link>
              )}
              <Link to="/missions">
                <Button size="sm" variant="secondary">
                  📋 Missions
                </Button>
              </Link>
              <Link to="/habits">
                <Button size="sm" variant="secondary">
                  🎯 Habits
                </Button>
              </Link>
              <Link to="/analytics">
                <Button size="sm" variant="secondary">
                  📊 Analytics
                </Button>
              </Link>
              <Link to="/canvas/setup">
                <Button size="sm" variant="secondary">
                  Canvas Setup
                </Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Gamification XP Bar */}
        {gamificationStats && (
          <div className="mb-8">
            <Card>
              <XpProgressBar
                currentXp={gamificationStats.xp.currentXp}
                xpToNextLevel={gamificationStats.xp.xpToNextLevel}
                level={gamificationStats.xp.currentLevel}
                totalXp={gamificationStats.xp.totalXpEarned}
              />
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-2xl">🔥</span>
                  <span className="font-semibold">{gamificationStats.streak.currentDailyStreak} day streak</span>
                </div>
                <div>
                  <span className="font-semibold">{gamificationStats.achievements.total}</span> achievements
                </div>
                <Link to="/gamification" className="text-primary-600 hover:text-primary-700 font-medium">
                  View All Stats →
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total Assignments</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </p>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-600 mt-1">Overdue</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.completionRate.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
              </div>
            </Card>
          </div>
        )}

        {/* Daily Mission Widget */}
        <div className="mb-8">
          <DailyMissionWidget />
        </div>

        {/* Assignment List */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!showCompleted ? 'primary' : 'secondary'}
                onClick={() => setShowCompleted(false)}
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={showCompleted ? 'primary' : 'secondary'}
                onClick={() => setShowCompleted(true)}
              >
                Completed
              </Button>
            </div>
          </div>

          {isLoadingAssignments ? (
            <p className="text-gray-600">Loading assignments...</p>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    assignment.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : isOverdue(assignment.dueDate)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={assignment.isCompleted}
                          onChange={() => handleToggleComplete(assignment)}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <div>
                          <h3
                            className={`font-semibold text-gray-900 ${
                              assignment.isCompleted ? 'line-through' : ''
                            }`}
                          >
                            {assignment.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                            {assignment.courseName && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {assignment.courseName}
                              </span>
                            )}
                            {assignment.pointsPossible && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                {assignment.pointsPossible} pts
                              </span>
                            )}
                            {assignment.dueDate && (
                              <span
                                className={`px-2 py-1 rounded ${
                                  isOverdue(assignment.dueDate) && !assignment.isCompleted
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {assignment.description && (
                        <p className="mt-2 text-sm text-gray-600 ml-8">
                          {assignment.description.substring(0, 150)}
                          {assignment.description.length > 150 && '...'}
                        </p>
                      )}
                    </div>

                    {assignment.externalUrl && (
                      <a
                        href={assignment.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-primary-600 hover:text-primary-700 text-sm"
                      >
                        View in Canvas →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {showCompleted
                  ? 'No completed assignments yet'
                  : 'No active assignments found'}
              </p>
              {!showCompleted && (
                <Link to="/canvas/setup">
                  <Button>Connect Canvas to get started</Button>
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Level Up Modal */}
      {levelUpData && (
        <LevelUpModal
          show={levelUpData.show}
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          xpGained={levelUpData.xpGained}
          onClose={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}
