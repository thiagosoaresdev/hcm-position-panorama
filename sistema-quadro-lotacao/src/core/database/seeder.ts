import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, transaction } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SeedFile {
  filename: string;
  sql: string;
  order: number;
}

/**
 * Database seeder class
 */
export class DatabaseSeeder {
  private seedsPath: string;

  constructor(seedsPath?: string) {
    this.seedsPath = seedsPath || join(__dirname, 'seeds');
  }

  /**
   * Get all seed files
   */
  async getSeedFiles(): Promise<SeedFile[]> {
    try {
      const files = await readdir(this.seedsPath);
      const seedFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      const seeds: SeedFile[] = [];

      for (const filename of seedFiles) {
        const filePath = join(this.seedsPath, filename);
        const sql = await readFile(filePath, 'utf-8');
        const order = this.extractOrderFromFilename(filename);

        seeds.push({
          filename,
          sql,
          order,
        });
      }

      return seeds.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error reading seed files:', error);
      throw error;
    }
  }

  /**
   * Extract order from filename (e.g., "001_master_data.sql" -> 1)
   */
  private extractOrderFromFilename(filename: string): number {
    const match = filename.match(/^(\d+)_/);
    if (!match) {
      throw new Error(`Invalid seed filename format: ${filename}`);
    }
    return parseInt(match[1], 10);
  }

  /**
   * Apply a single seed file
   */
  async applySeed(seed: SeedFile): Promise<void> {
    await transaction(async (client) => {
      console.log(`Applying seed: ${seed.filename}`);
      
      // Execute seed SQL
      await client.query(seed.sql);
      
      console.log(`Seed ${seed.filename} applied successfully`);
    });
  }

  /**
   * Run all seed files
   */
  async seed(): Promise<void> {
    try {
      console.log('Starting database seeding...');
      
      // Get all seed files
      const seedFiles = await this.getSeedFiles();
      
      if (seedFiles.length === 0) {
        console.log('No seed files found');
        return;
      }
      
      console.log(`Found ${seedFiles.length} seed files`);
      
      // Apply seed files in order
      for (const seed of seedFiles) {
        await this.applySeed(seed);
      }
      
      console.log('All seed files applied successfully');
    } catch (error) {
      console.error('Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all data from tables (for testing)
   */
  async clearData(): Promise<void> {
    try {
      console.log('Clearing database data...');
      
      await transaction(async (client) => {
        // Disable foreign key checks temporarily
        await client.query('SET session_replication_role = replica;');
        
        // Get all tables
        const result = await client.query(`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename NOT IN ('schema_migrations')
        `);
        
        // Truncate all tables
        for (const row of result.rows) {
          await client.query(`TRUNCATE TABLE ${row.tablename} CASCADE;`);
          console.log(`Cleared table: ${row.tablename}`);
        }
        
        // Re-enable foreign key checks
        await client.query('SET session_replication_role = DEFAULT;');
      });
      
      console.log('Database data cleared successfully');
    } catch (error) {
      console.error('Clear data failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (clear + seed)
   */
  async reset(): Promise<void> {
    try {
      console.log('Resetting database...');
      
      await this.clearData();
      await this.seed();
      
      console.log('Database reset completed successfully');
    } catch (error) {
      console.error('Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, number>> {
    try {
      const result = await query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);
      
      const stats: Record<string, number> = {};
      
      for (const row of result.rows) {
        stats[row.tablename] = row.live_tuples;
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }
}

// Export default seeder instance
export const seeder = new DatabaseSeeder();