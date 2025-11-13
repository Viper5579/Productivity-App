/**
 * Shared types used across the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: string;
  details?: any;
  statusCode?: number;
}

// Common database column types
export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

export interface SoftDelete {
  deleted_at: Date | null;
}

// User-related types
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

// Module names for feature flags
export type ModuleName =
  | 'auth'
  | 'canvas'
  | 'assignments'
  | 'gamification'
  | 'habits'
  | 'scheduling'
  | 'analytics';

// Feature flags
export interface FeatureFlags {
  canvasIntegration: boolean;
  gamification: boolean;
  habits: boolean;
  scheduling: boolean;
  analytics: boolean;
  aiEnhancement: boolean;
}
