/**
 * Scheduling Module Type Definitions
 */

export type ItemType = 'assignment' | 'habit';
export type BlockType = 'task' | 'break' | 'focus' | 'meeting' | 'free';

export interface PrioritySettings {
  id: string;
  userId: string;
  dueDateWeight: number; // 0-100
  difficultyWeight: number; // 0-100
  importanceWeight: number; // 0-100
  estimatedTimeWeight: number; // 0-100
  preferMorningTasks: boolean;
  preferQuickWins: boolean;
  preferHighXp: boolean;
  workStartTime: string | null; // "09:00"
  workEndTime: string | null; // "17:00"
  breakDurationMinutes: number;
  focusBlockDurationMinutes: number;
  updatedAt: Date;
}

export interface DailyMission {
  id: string;
  userId: string;
  missionDate: Date;
  isGenerated: boolean;
  isCompleted: boolean;
  completionPercentage: number;
  totalItems: number;
  completedItems: number;
  totalXpAvailable: number;
  xpEarned: number;
  generatedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface MissionItem {
  id: string;
  missionId: string;
  userId: string;
  itemType: ItemType;
  assignmentId: string | null;
  habitId: string | null;
  priorityScore: number;
  sortOrder: number;
  title: string;
  description: string | null;
  estimatedDurationMinutes: number | null;
  xpReward: number;
  isCompleted: boolean;
  completedAt: Date | null;
  timeBlockId: string | null;
  createdAt: Date;
}

export interface TimeBlock {
  id: string;
  userId: string;
  blockDate: Date;
  startTime: Date;
  endTime: Date;
  blockType: BlockType;
  missionItemId: string | null;
  title: string;
  description: string | null;
  color: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyMissionWithItems extends DailyMission {
  items: MissionItem[];
}

export interface TimeBlockWithItem extends TimeBlock {
  missionItem?: MissionItem;
}

// Priority calculation types
export interface PriorityFactors {
  dueDateUrgency: number; // 0-1
  difficulty: number; // 0-1
  importance: number; // 0-1
  estimatedTime: number; // minutes
  xpReward: number;
}

export interface PriorityCalculationInput {
  itemType: ItemType;
  title: string;
  description?: string;
  dueDate?: Date;
  pointsPossible?: number;
  estimatedDuration?: number;
  xpReward?: number;
  userSettings: PrioritySettings;
}

export interface PriorityCalculationResult {
  score: number; // 0-100
  factors: {
    dueDateScore: number;
    difficultyScore: number;
    importanceScore: number;
    timeScore: number;
  };
  reasoning: string;
}

// DTOs
export interface UpdatePrioritySettingsDto {
  dueDateWeight?: number;
  difficultyWeight?: number;
  importanceWeight?: number;
  estimatedTimeWeight?: number;
  preferMorningTasks?: boolean;
  preferQuickWins?: boolean;
  preferHighXp?: boolean;
  workStartTime?: string;
  workEndTime?: string;
  breakDurationMinutes?: number;
  focusBlockDurationMinutes?: number;
}

export interface GenerateDailyMissionDto {
  date?: string; // ISO date string
  maxItems?: number;
  focusCategories?: string[];
}

export interface CreateTimeBlockDto {
  blockDate: string; // ISO date string
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  blockType: BlockType;
  missionItemId?: string;
  title: string;
  description?: string;
  color?: string;
}

export interface UpdateTimeBlockDto {
  startTime?: string;
  endTime?: string;
  blockType?: BlockType;
  title?: string;
  description?: string;
  color?: string;
  isCompleted?: boolean;
}

export interface MissionGenerationResult {
  mission: DailyMissionWithItems;
  itemsGenerated: number;
  totalXpAvailable: number;
}

export interface ScheduleOptimizationResult {
  blocks: TimeBlock[];
  totalScheduledMinutes: number;
  unscheduledItems: MissionItem[];
  conflicts: string[];
}
