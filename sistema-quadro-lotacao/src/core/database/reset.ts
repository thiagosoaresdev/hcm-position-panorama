#!/usr/bin/env node

import { migrator } from './migrator.js';
import { seeder } from './seeder.js';
import { initializeDatabase, closeDatabase, testConnection } from './connection.js';

/**
 * Complete database reset (migrate + seed)
 */
async function resetDatabase() {
  try {
    console.log('🔄 Starting complete database reset...');
    
    // Initialize database connection
    initializeDatabase();
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Step 1: Run migrations
    console.log('\n📦 Step 1: Running migrations...');
    await migrator.migrate();
    
    // Step 2: Clear existing data
    console.log('\n🧹 Step 2: Clearing existing data...');
    await seeder.clearData();
    
    // Step 3: Seed with fresh data
    console.log('\n🌱 Step 3: Seeding fresh data...');
    await seeder.seed();
    
    // Get final status
    const migrationStatus = await migrator.getStatus();
    const dataStats = await seeder.getStats();
    
    console.log('\n📊 Final Status:');
    console.log('   Migrations:');
    console.log(`     Total: ${migrationStatus.total}`);
    console.log(`     Applied: ${migrationStatus.applied}`);
    console.log(`     Pending: ${migrationStatus.pending}`);
    
    console.log('\n   Data:');
    let totalRecords = 0;
    for (const [table, count] of Object.entries(dataStats)) {
      console.log(`     ${table}: ${count} records`);
      totalRecords += count;
    }
    console.log(`     Total records: ${totalRecords}`);
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('   Your database is now ready for development.');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run the reset
resetDatabase();