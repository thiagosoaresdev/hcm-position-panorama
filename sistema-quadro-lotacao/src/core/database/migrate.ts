#!/usr/bin/env node

import { migrator } from './migrator.js';
import { initializeDatabase, closeDatabase, testConnection } from './connection.js';

/**
 * Migration CLI runner
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migration process...');
    
    // Initialize database connection
    initializeDatabase();
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Run migrations
    await migrator.migrate();
    
    // Get final status
    const status = await migrator.getStatus();
    console.log('\n📊 Migration Status:');
    console.log(`   Total migrations: ${status.total}`);
    console.log(`   Applied: ${status.applied}`);
    console.log(`   Pending: ${status.pending}`);
    
    if (status.pending === 0) {
      console.log('✅ Database is up to date');
    }
    
    console.log('\n🎉 Migration process completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

/**
 * Migration status checker
 */
async function checkMigrationStatus() {
  try {
    console.log('📋 Checking migration status...');
    
    initializeDatabase();
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    const status = await migrator.getStatus();
    
    console.log('\n📊 Migration Status:');
    console.log(`   Total migrations: ${status.total}`);
    console.log(`   Applied: ${status.applied}`);
    console.log(`   Pending: ${status.pending}`);
    
    console.log('\n📝 Migration Details:');
    for (const migration of status.migrations) {
      const statusIcon = migration.applied ? '✅' : '⏳';
      const appliedText = migration.applied 
        ? `(applied ${migration.appliedAt?.toISOString()})`
        : '(pending)';
      
      console.log(`   ${statusIcon} ${migration.version}: ${migration.filename} ${appliedText}`);
    }
    
    // Validate migrations
    const isValid = await migrator.validateMigrations();
    if (isValid) {
      console.log('\n✅ All applied migrations are valid');
    } else {
      console.log('\n❌ Some applied migrations have validation errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'status':
    checkMigrationStatus();
    break;
  case 'migrate':
  case undefined:
    runMigrations();
    break;
  default:
    console.log('Usage: npm run db:migrate [status]');
    console.log('  migrate (default) - Run pending migrations');
    console.log('  status           - Check migration status');
    process.exit(1);
}