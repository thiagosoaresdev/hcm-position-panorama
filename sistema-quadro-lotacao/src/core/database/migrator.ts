import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, transaction } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  version: string;
  filename: string;
  sql: string;
}

interface MigrationRecord {
  version: string;
  filename: string;
  applied_at: Date;
  checksum: string;
}

/**
 * Database migrator class
 */
export class DatabaseMigrator {
  private migrationsPath: string;

  constructor(migrationsPath?: string) {
    this.migrationsPath = migrationsPath || join(__dirname, 'migrations');
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        filename VARCHAR(200) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
      ON schema_migrations(applied_at);
    `;

    await query(createTableSQL);
    console.log('Migration tracking table initialized');
  }

  /**
   * Get all migration files
   */
  async getMigrationFiles(): Promise<Migration[]> {
    try {
      const files = await readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      const migrations: Migration[] = [];

      for (const filename of migrationFiles) {
        const filePath = join(this.migrationsPath, filename);
        const sql = await readFile(filePath, 'utf-8');
        const version = this.extractVersionFromFilename(filename);

        migrations.push({
          version,
          filename,
          sql,
        });
      }

      return migrations;
    } catch (error) {
      console.error('Error reading migration files:', error);
      throw error;
    }
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      const result = await query<MigrationRecord>(
        'SELECT version, filename, applied_at, checksum FROM schema_migrations ORDER BY version'
      );
      return result.rows;
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error instanceof Error && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    // Simple checksum using content length and first/last chars
    const hash = content.length.toString(16) + 
                 content.charCodeAt(0).toString(16) + 
                 content.charCodeAt(content.length - 1).toString(16);
    return hash.padStart(8, '0');
  }

  /**
   * Extract version from filename (e.g., "001_initial_schema.sql" -> "001")
   */
  private extractVersionFromFilename(filename: string): string {
    const match = filename.match(/^(\d+)_/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    return match[1];
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    await transaction(async (client) => {
      console.log(`Applying migration ${migration.version}: ${migration.filename}`);
      
      // Execute migration SQL
      await client.query(migration.sql);
      
      // Record migration as applied
      const checksum = this.calculateChecksum(migration.sql);
      await client.query(
        'INSERT INTO schema_migrations (version, filename, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.filename, checksum]
      );
      
      console.log(`Migration ${migration.version} applied successfully`);
    });
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    try {
      console.log('Starting database migration...');
      
      // Initialize migration table
      await this.initializeMigrationTable();
      
      // Get all migrations and applied migrations
      const [allMigrations, appliedMigrations] = await Promise.all([
        this.getMigrationFiles(),
        this.getAppliedMigrations(),
      ]);
      
      // Find pending migrations
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = allMigrations.filter(
        migration => !appliedVersions.has(migration.version)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations found');
        return;
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations`);
      
      // Apply pending migrations
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      console.log('All migrations applied successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Validate applied migrations against files
   */
  async validateMigrations(): Promise<boolean> {
    try {
      const [allMigrations, appliedMigrations] = await Promise.all([
        this.getMigrationFiles(),
        this.getAppliedMigrations(),
      ]);
      
      const migrationMap = new Map(
        allMigrations.map(m => [m.version, m])
      );
      
      let isValid = true;
      
      for (const applied of appliedMigrations) {
        const migration = migrationMap.get(applied.version);
        
        if (!migration) {
          console.error(`Applied migration ${applied.version} not found in files`);
          isValid = false;
          continue;
        }
        
        const currentChecksum = this.calculateChecksum(migration.sql);
        if (currentChecksum !== applied.checksum) {
          console.error(
            `Migration ${applied.version} checksum mismatch. ` +
            `Expected: ${applied.checksum}, Got: ${currentChecksum}`
          );
          isValid = false;
        }
      }
      
      return isValid;
    } catch (error) {
      console.error('Migration validation failed:', error);
      return false;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    total: number;
    applied: number;
    pending: number;
    migrations: Array<{
      version: string;
      filename: string;
      applied: boolean;
      appliedAt?: Date;
    }>;
  }> {
    const [allMigrations, appliedMigrations] = await Promise.all([
      this.getMigrationFiles(),
      this.getAppliedMigrations(),
    ]);
    
    const appliedMap = new Map(
      appliedMigrations.map(m => [m.version, m])
    );
    
    const migrations = allMigrations.map(migration => {
      const applied = appliedMap.get(migration.version);
      return {
        version: migration.version,
        filename: migration.filename,
        applied: !!applied,
        appliedAt: applied?.applied_at,
      };
    });
    
    return {
      total: allMigrations.length,
      applied: appliedMigrations.length,
      pending: allMigrations.length - appliedMigrations.length,
      migrations,
    };
  }
}

// Export default migrator instance
export const migrator = new DatabaseMigrator();