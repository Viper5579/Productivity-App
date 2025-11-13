import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.string().transform(Number).default('5000'),
  apiUrl: z.string().url().default('http://localhost:5000'),

  // Database
  databaseUrl: z.string().url(),

  // Redis
  redisHost: z.string().default('localhost'),
  redisPort: z.string().transform(Number).default('6379'),
  redisPassword: z.string().optional(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('7d'),

  // Encryption
  encryptionKey: z.string().length(32),

  // Canvas
  canvasSyncIntervalMinutes: z.string().transform(Number).default('30'),

  // Feature Flags
  features: z.object({
    canvasIntegration: z.string().transform(val => val === 'true').default('true'),
    gamification: z.string().transform(val => val === 'true').default('false'),
    habits: z.string().transform(val => val === 'true').default('false'),
    scheduling: z.string().transform(val => val === 'true').default('false'),
    analytics: z.string().transform(val => val === 'true').default('false'),
    aiEnhancement: z.string().transform(val => val === 'true').default('false'),
  }),

  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // CORS
  corsOrigin: z.string().default('http://localhost:3000'),
});

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  apiUrl: process.env.API_URL,
  databaseUrl: process.env.DATABASE_URL,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisPassword: process.env.REDIS_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  encryptionKey: process.env.ENCRYPTION_KEY,
  canvasSyncIntervalMinutes: process.env.CANVAS_SYNC_INTERVAL_MINUTES,
  features: {
    canvasIntegration: process.env.FEATURE_CANVAS_INTEGRATION,
    gamification: process.env.FEATURE_GAMIFICATION,
    habits: process.env.FEATURE_HABITS,
    scheduling: process.env.FEATURE_SCHEDULING,
    analytics: process.env.FEATURE_ANALYTICS,
    aiEnhancement: process.env.FEATURE_AI_ENHANCEMENT,
  },
  logLevel: process.env.LOG_LEVEL,
  corsOrigin: process.env.CORS_ORIGIN,
};

// Validate and parse config
export const config = configSchema.parse(rawConfig);

// Helper to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};
