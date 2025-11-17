/**
 * AI Enhancement Module Type Definitions
 * Fully modular - all features work without AI
 */

// Provider types
export type AIProvider = 'openai' | 'anthropic' | 'none';

// AI Settings (stored per user)
export interface AIUserSettings {
  id: string;
  userId: string;
  isEnabled: boolean;
  provider: AIProvider;
  apiKeyEncrypted: string | null;

  // Feature toggles
  enableTimeEstimation: boolean;
  enableSmartPriority: boolean;
  enableInsightGeneration: boolean;
  enableNaturalLanguage: boolean;

  // Usage tracking
  totalRequestsToday: number;
  lastRequestAt: Date | null;
  dailyLimit: number;

  createdAt: Date;
  updatedAt: Date;
}

// AI Request/Response types
export interface AITimeEstimationRequest {
  taskTitle: string;
  taskDescription?: string;
  taskType?: string;
  pointsPossible?: number;
  userHistoryAvailable: boolean;
}

export interface AITimeEstimationResponse {
  estimatedMinutes: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  source: 'ai' | 'heuristic'; // Shows if AI or fallback was used
}

export interface AIPriorityRequest {
  taskTitle: string;
  taskDescription?: string;
  dueDate?: Date;
  pointsPossible?: number;
  currentPriorityScore: number;
  userPreferences?: any;
}

export interface AIPriorityResponse {
  suggestedScore: number;
  adjustment: number; // Difference from current
  reasoning: string;
  source: 'ai' | 'algorithm';
}

export interface AIInsightRequest {
  userId: string;
  recentActivity: any;
  currentMetrics: any;
  preferences?: any;
}

export interface AIInsight {
  id: string;
  title: string;
  content: string;
  category: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  source: 'ai' | 'template';
  generatedAt: Date;
  expiresAt?: Date;
}

export interface AINaturalLanguageRequest {
  input: string;
  context?: {
    currentTasks?: any[];
    currentHabits?: any[];
    userTimezone?: string;
  };
}

export interface AINaturalLanguageResponse {
  understood: boolean;
  action: 'create_task' | 'complete_task' | 'query' | 'unknown';
  extractedData?: {
    title?: string;
    dueDate?: string;
    description?: string;
    category?: string;
    priority?: string;
  };
  suggestions?: string[];
  source: 'ai' | 'pattern_matching';
}

// AI Provider Interface (for pluggable providers)
export interface AIProviderInterface {
  estimateTime(request: AITimeEstimationRequest): Promise<AITimeEstimationResponse>;
  refinePriority(request: AIPriorityRequest): Promise<AIPriorityResponse>;
  generateInsights(request: AIInsightRequest): Promise<AIInsight[]>;
  parseNaturalLanguage(request: AINaturalLanguageRequest): Promise<AINaturalLanguageResponse>;
  isAvailable(): boolean;
}

// DTOs
export interface UpdateAISettingsDto {
  isEnabled?: boolean;
  provider?: AIProvider;
  apiKey?: string; // Will be encrypted before storage
  enableTimeEstimation?: boolean;
  enableSmartPriority?: boolean;
  enableInsightGeneration?: boolean;
  enableNaturalLanguage?: boolean;
  dailyLimit?: number;
}

export interface AIStatusResponse {
  available: boolean;
  provider: AIProvider;
  features: {
    timeEstimation: boolean;
    smartPriority: boolean;
    insightGeneration: boolean;
    naturalLanguage: boolean;
  };
  usage: {
    requestsToday: number;
    limit: number;
    remaining: number;
  };
}
