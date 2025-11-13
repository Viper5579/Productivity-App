import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../src/core/database';
import { logger } from '../src/core/logger';

/**
 * Simple migration runner
 * Run with: npm run migrate
 */

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of already executed migrations
    const executedResult = await pool.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedMigrations = new Set(
      executedResult.rows.map((row) => row.name)
    );

    // Migration files to run (in order)
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_gamification_schema.sql',
      // Add more migrations here as needed
    ];

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        logger.info(`Skipping already executed migration: ${filename}`);
        continue;
      }

      logger.info(`Executing migration: ${filename}`);

      // Read migration file
      const migrationPath = join(__dirname, filename);
      const sql = readFileSync(migrationPath, 'utf-8');

      // Execute migration
      await pool.query(sql);

      // Record migration
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);

      logger.info(`Successfully executed migration: ${filename}`);
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
