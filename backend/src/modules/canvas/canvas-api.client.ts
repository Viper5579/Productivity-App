import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../core/logger';
import {
  CanvasUser,
  CanvasCourse,
  CanvasAssignment,
} from './canvas.types';

/**
 * Canvas LMS API Client
 * Handles all interactions with Canvas REST API
 * Documentation: https://canvas.instructure.com/doc/api/
 */
export class CanvasApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(canvasUrl: string, accessToken: string) {
    // Ensure URL ends with /api/v1
    this.baseUrl = canvasUrl.replace(/\/$/, '');
    if (!this.baseUrl.includes('/api/v1')) {
      this.baseUrl += '/api/v1';
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<CanvasUser> {
    try {
      const response = await this.client.get<CanvasUser>('/users/self');
      return response.data;
    } catch (error) {
      logger.error('Failed to get Canvas user:', error);
      throw new Error('Failed to get Canvas user profile');
    }
  }

  /**
   * Get all courses for the current user
   */
  async getCourses(): Promise<CanvasCourse[]> {
    try {
      const courses: CanvasCourse[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.client.get<CanvasCourse[]>('/courses', {
          params: {
            enrollment_state: 'active',
            per_page: 100,
            page,
          },
        });

        courses.push(...response.data);

        // Check if there are more pages
        const linkHeader = response.headers['link'];
        hasMore = linkHeader ? linkHeader.includes('rel="next"') : false;
        page++;
      }

      logger.info(`Fetched ${courses.length} courses from Canvas`);
      return courses;
    } catch (error) {
      logger.error('Failed to get Canvas courses:', error);
      throw new Error('Failed to fetch courses from Canvas');
    }
  }

  /**
   * Get assignments for a specific course
   */
  async getCourseAssignments(courseId: number): Promise<CanvasAssignment[]> {
    try {
      const assignments: CanvasAssignment[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.client.get<CanvasAssignment[]>(
          `/courses/${courseId}/assignments`,
          {
            params: {
              per_page: 100,
              page,
            },
          }
        );

        assignments.push(...response.data);

        // Check if there are more pages
        const linkHeader = response.headers['link'];
        hasMore = linkHeader ? linkHeader.includes('rel="next"') : false;
        page++;
      }

      return assignments;
    } catch (error) {
      logger.error(`Failed to get assignments for course ${courseId}:`, error);
      throw new Error(`Failed to fetch assignments for course ${courseId}`);
    }
  }

  /**
   * Get all assignments across all courses
   */
  async getAllAssignments(): Promise<{ courseId: number; assignments: CanvasAssignment[] }[]> {
    try {
      const courses = await this.getCourses();
      const results: { courseId: number; assignments: CanvasAssignment[] }[] = [];

      for (const course of courses) {
        try {
          const assignments = await this.getCourseAssignments(course.id);
          results.push({
            courseId: course.id,
            assignments,
          });
        } catch (error) {
          logger.warn(`Skipping course ${course.id} due to error:`, error);
          // Continue with other courses even if one fails
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to get all assignments:', error);
      throw new Error('Failed to fetch assignments from Canvas');
    }
  }

  /**
   * Test connection to Canvas
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      logger.error('Canvas API error:', {
        status,
        message: data?.message || data?.errors,
      });

      if (status === 401) {
        throw new Error('Invalid Canvas access token');
      } else if (status === 403) {
        throw new Error('Insufficient permissions to access Canvas');
      } else if (status === 404) {
        throw new Error('Canvas resource not found');
      } else if (status === 429) {
        throw new Error('Canvas API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(data?.message || 'Canvas API error');
      }
    } else if (error.request) {
      // Request made but no response received
      logger.error('Canvas API no response:', error.message);
      throw new Error('Cannot reach Canvas. Please check the Canvas URL.');
    } else {
      // Error setting up request
      logger.error('Canvas API request error:', error.message);
      throw new Error('Failed to communicate with Canvas');
    }
  }
}
