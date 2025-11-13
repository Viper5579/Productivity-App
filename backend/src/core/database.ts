import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { config } from './config';
import { logger } from './logger';
import { Database } from '../shared/types/database.types';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

// Create Kysely instance
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
};

// Close database connection
export const closeDatabaseConnection = async (): Promise<void> => {
  await pool.end();
  logger.info('Database connection closed');
};

// Raw pool export for migrations and special queries
export { pool };
