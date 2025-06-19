#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { Logger } from '../src/utils/logger';

async function runMigrations() {
  try {
    Logger.info('Starting database migrations...');
    
    // Generate Prisma client
    Logger.info('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to database
    Logger.info('Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    Logger.info('Database migrations completed successfully!');
  } catch (error) {
    Logger.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
