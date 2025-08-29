#!/usr/bin/env node

/**
 * Migration script for API Keys from in-memory cache to database
 * 
 * Usage:
 *   npm run migrate:api-keys
 *   
 * This script will:
 * 1. Export all API keys from the current cache
 * 2. Save them to database
 * 3. Provide rollback capability
 * 4. Generate migration report
 */

import { Sequelize } from 'sequelize-typescript';
import { ApiKey } from '../v1/models/ApiKey';
import { config } from '../config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface MigrationData {
  keys: Array<{
    keyPrefix: string;
    hashedKey: string;
    companyId: number;
    name: string;
    permissions: string[];
    rateLimit: number;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    createdBy?: number;
    metadata?: any;
  }>;
  timestamp: string;
  version: string;
}

class ApiKeyMigration {
  private sequelize: Sequelize | null = null;
  private backupFile: string;
  private reportFile: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    this.backupFile = path.join(__dirname, `../backups/api-keys-backup-${timestamp}.json`);
    this.reportFile = path.join(__dirname, `../reports/migration-report-${timestamp}.txt`);
  }

  /**
   * Connect to database
   */
  async connectDatabase(): Promise<void> {
    console.log('📦 Connecting to database...');
    
    try {
      this.sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'tucanlink',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        logging: false,
      });

      this.sequelize.addModels([ApiKey]);
      await this.sequelize.authenticate();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Load existing keys from backup or export file
   */
  async loadExistingKeys(filePath?: string): Promise<MigrationData | null> {
    const targetFile = filePath || this.backupFile;
    
    if (!fs.existsSync(targetFile)) {
      console.log('⚠️  No backup file found');
      return null;
    }

    console.log(`📂 Loading keys from ${targetFile}`);
    
    try {
      const data = fs.readFileSync(targetFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load backup file:', error);
      return null;
    }
  }

  /**
   * Export current cache keys (manual export required)
   */
  async exportCurrentKeys(): Promise<void> {
    console.log('\n📤 Export current API keys from cache');
    console.log('⚠️  Manual export required:');
    console.log('   1. Access the running API Bridge service');
    console.log('   2. Call GET /api/bridge/v1/admin/export-keys');
    console.log('   3. Save the response to a JSON file');
    console.log(`   4. Place the file at: ${this.backupFile}`);
    console.log('\nPress Enter when export is complete...');
    
    await this.waitForUserInput();
  }

  /**
   * Migrate keys to database
   */
  async migrateToDatabase(data: MigrationData): Promise<void> {
    console.log(`\n🔄 Migrating ${data.keys.length} API keys to database...`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const keyData of data.keys) {
      try {
        // Check if key already exists
        const existing = await ApiKey.findOne({
          where: { hashedKey: keyData.hashedKey },
        });

        if (existing) {
          console.log(`⏭️  Skipping existing key: ${keyData.name}`);
          results.skipped++;
          continue;
        }

        // Create new key in database
        await ApiKey.create({
          keyPrefix: keyData.keyPrefix,
          hashedKey: keyData.hashedKey,
          companyId: keyData.companyId,
          name: keyData.name,
          permissions: keyData.permissions || [],
          rateLimit: keyData.rateLimit || 1000,
          expiresAt: keyData.expiresAt,
          lastUsedAt: keyData.lastUsedAt,
          isActive: keyData.isActive !== false,
          createdBy: keyData.createdBy,
          metadata: keyData.metadata || {},
        });

        console.log(`✅ Migrated: ${keyData.name}`);
        results.success++;
      } catch (error: any) {
        console.error(`❌ Failed to migrate ${keyData.name}:`, error.message);
        results.failed++;
        results.errors.push(`${keyData.name}: ${error.message}`);
      }
    }

    // Generate report
    this.generateReport(results, data);
  }

  /**
   * Generate migration report
   */
  private generateReport(results: any, data: MigrationData): void {
    const report = `
API Key Migration Report
========================
Timestamp: ${new Date().toISOString()}
Total Keys: ${data.keys.length}
Successfully Migrated: ${results.success}
Skipped (Existing): ${results.skipped}
Failed: ${results.failed}

${results.errors.length > 0 ? 'Errors:\n' + results.errors.join('\n') : 'No errors'}

Migration Status: ${results.failed === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS'}
`;

    // Create reports directory if it doesn't exist
    const reportsDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(this.reportFile, report);
    console.log(`\n📊 Report saved to: ${this.reportFile}`);
    console.log(report);
  }

  /**
   * Rollback migration
   */
  async rollback(backupFile: string): Promise<void> {
    console.log('\n⚠️  Rollback functionality:');
    console.log('   1. Delete migrated keys from database');
    console.log('   2. Restore from backup file');
    console.log('   This is a manual process for safety');
    
    const data = await this.loadExistingKeys(backupFile);
    if (!data) {
      console.error('❌ Cannot rollback: backup file not found');
      return;
    }

    console.log(`\nBackup contains ${data.keys.length} keys`);
    console.log('To rollback, manually delete the migrated keys from the database');
  }

  /**
   * Verify migration
   */
  async verify(): Promise<void> {
    console.log('\n🔍 Verifying migration...');
    
    const dbCount = await ApiKey.count({ where: { isActive: true } });
    console.log(`✅ Active API keys in database: ${dbCount}`);
    
    const recentKeys = await ApiKey.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
    
    console.log('\n📋 Recent API keys:');
    recentKeys.forEach(key => {
      console.log(`   - ${key.name} (Company: ${key.companyId})`);
    });
  }

  /**
   * Wait for user input
   */
  private waitForUserInput(): Promise<void> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * Run migration
   */
  async run(): Promise<void> {
    console.log('🚀 Starting API Key Migration Tool\n');
    
    try {
      // Connect to database
      await this.connectDatabase();
      
      // Check for existing backup
      let data = await this.loadExistingKeys();
      
      if (!data) {
        // No backup found, need to export
        await this.exportCurrentKeys();
        data = await this.loadExistingKeys();
        
        if (!data) {
          throw new Error('No data to migrate');
        }
      }
      
      // Confirm migration
      console.log(`\n📊 Ready to migrate ${data.keys.length} API keys`);
      console.log('⚠️  This operation cannot be automatically rolled back');
      console.log('Continue? (yes/no): ');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      rl.question('', async (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'yes') {
          await this.migrateToDatabase(data!);
          await this.verify();
          console.log('\n✅ Migration completed successfully!');
        } else {
          console.log('❌ Migration cancelled');
        }
        
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new ApiKeyMigration();
  migration.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default ApiKeyMigration;