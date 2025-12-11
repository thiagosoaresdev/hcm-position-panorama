#!/usr/bin/env node

import { seeder } from './seeder.js';
import { initializeDatabase, closeDatabase, testConnection } from './connection.js';

/**
 * Seed CLI runner
 */
async function runSeeding() {
  try {
    console.log('🌱 Starting database seeding process...');
    
    // Initialize database connection
    initializeDatabase();
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Run seeding
    await seeder.seed();
    
    // Get final stats
    const stats = await seeder.getStats();
    console.log('\n📊 Database Statistics:');
    for (const [table, count] of Object.entries(stats)) {
      console.log(`   ${table}: ${count} records`);
    }
    
    console.log('\n🎉 Seeding process completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

/**
 * Clear database data
 */
async function clearData() {
  try {
    console.log('🧹 Starting database clear process...');
    
    initializeDatabase();
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    await seeder.clearData();
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Clear failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

/**
 * Reset database (clear + seed)
 */
async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset process...');
    
    initializeDatabase();
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    await seeder.reset();
    
    // Get final stats
    const stats = await seeder.getStats();
    console.log('\n📊 Database Statistics:');
    for (const [table, count] of Object.entries(stats)) {
      console.log(`   ${table}: ${count} records`);
    }
    
    console.log('✅ Database reset completed successfully');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

/**
 * Show database statistics
 */
async function showStats() {
  try {
    console.log('📊 Getting database statistics...');
    
    initializeDatabase();
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    const stats = await seeder.getStats();
    
    console.log('\n📊 Database Statistics:');
    let totalRecords = 0;
    
    for (const [table, count] of Object.entries(stats)) {
      console.log(`   ${table}: ${count} records`);
      totalRecords += count;
    }
    
    console.log(`\n   Total records: ${totalRecords}`);
    
  } catch (error) {
    console.error('❌ Stats failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'clear':
    clearData();
    break;
  case 'reset':
    resetDatabase();
    break;
  case 'stats':
    showStats();
    break;
  case 'seed':
  case undefined:
    runSeeding();
    break;
  default:
    console.log('Usage: npm run db:seed [command]');
    console.log('  seed (default) - Run database seeding');
    console.log('  clear          - Clear all data');
    console.log('  reset          - Clear and seed');
    console.log('  stats          - Show database statistics');
    process.exit(1);
}