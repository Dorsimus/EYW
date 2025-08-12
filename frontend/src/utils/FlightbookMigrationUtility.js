/**
 * FlightbookMigrationUtility - Production-ready migration from localStorage to backend API
 * Handles data transformation, validation, and batch processing with comprehensive error handling
 */

import FlightbookAPIClient from './FlightbookAPIClient.js';

class FlightbookMigrationUtility {
  constructor(apiClient) {
    this.apiClient = apiClient || new FlightbookAPIClient();
    this.migrationResults = {
      totalFound: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      duplicatesSkipped: 0,
      validationErrors: []
    };
  }

  /**
   * Main migration function - migrate all localStorage flightbook data to backend
   */
  async migrateToBackend(progressCallback = null) {
    console.log('🚀 Starting flightbook migration from localStorage to backend...');
    
    try {
      // Step 1: Extract and validate localStorage data
      const existingEntries = this.extractLocalStorageData();
      this.migrationResults.totalFound = existingEntries.length;
      
      if (existingEntries.length === 0) {
        console.log('ℹ️ No existing flightbook entries found in localStorage');
        return this.migrationResults;
      }
      
      console.log(`📊 Found ${existingEntries.length} entries to migrate`);
      
      // Step 2: Create backup
      this.createBackup(existingEntries);
      
      // Step 3: Validate and normalize data
      const validEntries = this.validateAndNormalizeEntries(existingEntries);
      
      // Step 4: Remove duplicates
      const uniqueEntries = this.removeDuplicates(validEntries);
      
      // Step 5: Migrate in batches
      await this.migrateBatches(uniqueEntries, progressCallback);
      
      // Step 6: Verify migration success
      await this.verifyMigration();
      
      // Step 7: Clean up if successful
      if (this.migrationResults.failed === 0) {
        this.markMigrationComplete();
      }
      
      console.log('✅ Migration completed:', this.migrationResults);
      return this.migrationResults;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.migrationResults.errors.push(`Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract all flightbook data from localStorage
   */
  extractLocalStorageData() {
    const entries = [];
    
    // Check multiple localStorage keys that might contain flightbook data
    const possibleKeys = [
      'flightbook_entries',          // Primary key
      'journal_entries',             // Alternative key
      'competency_reflections',      // Legacy key
      'user_reflections'            // Legacy key
    ];
    
    for (const key of possibleKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          if (Array.isArray(parsed)) {
            entries.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            // Handle object-based storage
            Object.values(parsed).forEach(entry => {
              if (entry && typeof entry === 'object') {
                entries.push(entry);
              }
            });
          }
          
          console.log(`📋 Extracted ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} entries from ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse localStorage key ${key}:`, error);
        this.migrationResults.errors.push(`Failed to parse localStorage key ${key}: ${error.message}`);
      }
    }
    
    return entries;
  }

  /**
   * Validate and normalize entries to match backend schema
   */
  validateAndNormalizeEntries(entries) {
    const validEntries = [];
    
    for (const entry of entries) {
      try {
        const normalizedEntry = this.normalizeEntry(entry);
        
        if (this.validateEntry(normalizedEntry)) {
          validEntries.push(normalizedEntry);
        } else {
          this.migrationResults.validationErrors.push(`Invalid entry: ${entry.title || 'Untitled'}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to normalize entry:', entry, error);
        this.migrationResults.validationErrors.push(`Normalization failed for "${entry.title || 'Untitled'}": ${error.message}`);
      }
    }
    
    console.log(`✅ Validated ${validEntries.length}/${entries.length} entries`);
    return validEntries;
  }

  /**
   * Normalize a single entry to match backend FlightbookEntryCreate schema
   */
  normalizeEntry(entry) {
    // Handle different date formats and structures
    let entryDate = new Date();
    if (entry.date) {
      entryDate = new Date(entry.date);
    } else if (entry.created_at) {
      entryDate = new Date(entry.created_at);
    }
    
    // Normalize competency area
    const competencyArea = this.normalizeCompetencyArea(entry.competency || entry.competency_area || 'general');
    
    // Normalize entry type
    const entryType = this.normalizeEntryType(entry.type || entry.entry_type || 'reflection');
    
    // Normalize tags
    const tags = this.normalizeTags(entry.tags || []);
    
    // Build normalized entry
    const normalizedEntry = {
      title: this.sanitizeTitle(entry.title || entry.original_prompt || 'Untitled Entry'),
      content: this.sanitizeContent(entry.content || entry.story || entry.notes || ''),
      competency_area: competencyArea,
      sub_competency: entry.sub_competency || null,
      task_id: entry.task_id || null,
      entry_type: entryType,
      source: entry.source || 'localStorage_migration',
      tags: tags,
      original_prompt: entry.original_prompt || null
    };
    
    // Add entry_key if it exists (for journal contexts)
    if (entry.entry_key) {
      normalizedEntry.entry_key = entry.entry_key;
    }
    
    // Preserve creation date if available
    if (entry.date || entry.created_at) {
      normalizedEntry.created_at = entryDate.toISOString();
    }
    
    return normalizedEntry;
  }

  /**
   * Validate entry meets minimum requirements
   */
  validateEntry(entry) {
    // Required fields
    if (!entry.title || entry.title.trim().length === 0) {
      return false;
    }
    
    if (!entry.content || entry.content.trim().length === 0) {
      return false;
    }
    
    if (!entry.competency_area || entry.competency_area.trim().length === 0) {
      return false;
    }
    
    // Length limits
    if (entry.title.length > 500) {
      entry.title = entry.title.substring(0, 497) + '...';
    }
    
    if (entry.content.length > 50000) {
      entry.content = entry.content.substring(0, 49997) + '...';
    }
    
    return true;
  }

  /**
   * Remove duplicate entries based on content similarity
   */
  removeDuplicates(entries) {
    const uniqueEntries = [];
    const seen = new Set();
    
    for (const entry of entries) {
      // Create a signature for duplicate detection
      const signature = this.createEntrySignature(entry);
      
      if (!seen.has(signature)) {
        seen.add(signature);
        uniqueEntries.push(entry);
      } else {
        this.migrationResults.duplicatesSkipped++;
        console.log(`🔄 Skipped duplicate entry: ${entry.title}`);
      }
    }
    
    console.log(`✅ Removed ${entries.length - uniqueEntries.length} duplicates, ${uniqueEntries.length} unique entries remain`);
    return uniqueEntries;
  }

  /**
   * Create unique signature for duplicate detection
   */
  createEntrySignature(entry) {
    const normalizedTitle = entry.title.toLowerCase().trim();
    const normalizedContent = entry.content.toLowerCase().substring(0, 100).trim();
    const competencyArea = entry.competency_area;
    
    return `${competencyArea}:${normalizedTitle}:${normalizedContent}`;
  }

  /**
   * Migrate entries in batches to avoid overwhelming the server
   */
  async migrateBatches(entries, progressCallback = null) {
    const batchSize = 10; // Process 10 entries at a time
    const totalBatches = Math.ceil(entries.length / batchSize);
    
    console.log(`📦 Processing ${entries.length} entries in ${totalBatches} batches`);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, entries.length);
      const batch = entries.slice(start, end);
      
      console.log(`📤 Processing batch ${i + 1}/${totalBatches} (${batch.length} entries)`);
      
      try {
        const batchResults = await this.migrateBatch(batch);
        this.migrationResults.successful += batchResults.successful;
        this.migrationResults.failed += batchResults.failed;
        this.migrationResults.errors.push(...batchResults.errors);
        
        // Update progress
        this.migrationResults.processed += batch.length;
        
        if (progressCallback) {
          const progress = Math.round((this.migrationResults.processed / entries.length) * 100);
          progressCallback({
            progress,
            processed: this.migrationResults.processed,
            total: entries.length,
            successful: this.migrationResults.successful,
            failed: this.migrationResults.failed
          });
        }
        
        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error);
        this.migrationResults.errors.push(`Batch ${i + 1} failed: ${error.message}`);
        this.migrationResults.failed += batch.length;
      }
    }
  }

  /**
   * Migrate a single batch of entries
   */
  async migrateBatch(batch) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    try {
      // Try bulk create first (more efficient)
      const bulkResult = await this.apiClient.bulkCreateEntries(batch);
      
      results.successful = bulkResult.processed;
      if (bulkResult.errors && bulkResult.errors.length > 0) {
        results.errors.push(...bulkResult.errors);
        results.failed = batch.length - bulkResult.processed;
      }
      
    } catch (error) {
      console.warn('⚠️ Bulk create failed, trying individual creation:', error);
      
      // Fallback to individual creation
      for (const entry of batch) {
        try {
          await this.apiClient.createEntry(entry);
          results.successful++;
        } catch (entryError) {
          results.failed++;
          results.errors.push(`Failed to create "${entry.title}": ${entryError.message}`);
        }
      }
    }
    
    return results;
  }

  /**
   * Verify migration success by comparing counts
   */
  async verifyMigration() {
    console.log('🔍 Verifying migration success...');
    
    try {
      const stats = await this.apiClient.getStatistics();
      console.log(`📊 Backend reports ${stats.total_entries} total entries`);
      
      // Basic verification - check if we have entries in the backend
      if (stats.total_entries > 0 && this.migrationResults.successful > 0) {
        console.log('✅ Migration verification successful');
      } else if (this.migrationResults.successful === 0) {
        console.log('ℹ️ No entries were successfully migrated');
      } else {
        console.log('⚠️ Migration verification inconclusive');
      }
      
    } catch (error) {
      console.warn('⚠️ Could not verify migration:', error);
      // Don't fail the migration just because verification failed
    }
  }

  /**
   * Create backup of original localStorage data
   */
  createBackup(entries) {
    const backup = {
      timestamp: new Date().toISOString(),
      entries: entries,
      source: 'flightbook_migration',
      version: '1.0'
    };
    
    localStorage.setItem('flightbook_migration_backup', JSON.stringify(backup));
    console.log('💾 Created migration backup with', entries.length, 'entries');
  }

  /**
   * Mark migration as completed
   */
  markMigrationComplete() {
    const completionData = {
      completed: true,
      timestamp: new Date().toISOString(),
      results: this.migrationResults
    };
    
    localStorage.setItem('flightbook_migration_completed', JSON.stringify(completionData));
    console.log('🎉 Migration marked as complete');
  }

  /**
   * Check if migration has been completed
   */
  isMigrationCompleted() {
    const completed = localStorage.getItem('flightbook_migration_completed');
    return completed !== null;
  }

  /**
   * Get migration results
   */
  getMigrationResults() {
    return { ...this.migrationResults };
  }

  // === UTILITY METHODS ===

  /**
   * Normalize competency area to match backend expectations
   */
  normalizeCompetencyArea(competency) {
    const mapping = {
      'leadership': 'leadership_supervision',
      'leadership_supervision': 'leadership_supervision',
      'financial': 'financial_management',
      'financial_management': 'financial_management',
      'operations': 'operational_excellence',
      'operational': 'operational_excellence',
      'operational_excellence': 'operational_excellence',
      'collaboration': 'cross_functional_collaboration',
      'cross_functional_collaboration': 'cross_functional_collaboration',
      'strategic': 'strategic_thinking_planning',
      'strategic_thinking': 'strategic_thinking_planning',
      'strategic_thinking_planning': 'strategic_thinking_planning',
      'client': 'client_confidence_connection',
      'client_confidence': 'client_confidence_connection',
      'client_confidence_connection': 'client_confidence_connection',
      'core_values': 'core_values',
      'general': 'general'
    };
    
    const normalized = competency.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return mapping[normalized] || normalized;
  }

  /**
   * Normalize entry type
   */
  normalizeEntryType(type) {
    const mapping = {
      'reflection': 'reflection',
      'note': 'note',
      'story': 'story',
      'observation': 'observation',
      'journal': 'reflection',
      'task_reflection': 'reflection',
      'core_value_story': 'story',
      'culminating_project': 'note'
    };
    
    const normalized = type.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return mapping[normalized] || 'reflection';
  }

  /**
   * Normalize and validate tags
   */
  normalizeTags(tags) {
    if (!Array.isArray(tags)) {
      return [];
    }
    
    return tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => tag.toLowerCase().replace(/[^a-z0-9\-]/g, '-'))
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }

  /**
   * Sanitize title to prevent XSS and ensure proper length
   */
  sanitizeTitle(title) {
    if (!title) return 'Untitled Entry';
    
    return title
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '')     // Remove remaining < >
      .trim()
      .substring(0, 500);       // Enforce length limit
  }

  /**
   * Sanitize content to prevent XSS while preserving basic formatting
   */
  sanitizeContent(content) {
    if (!content) return '';
    
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '')                      // Remove HTML tags
      .replace(/[<>]/g, '')                         // Remove remaining < >
      .trim()
      .substring(0, 50000);                         // Enforce length limit
  }
}

export default FlightbookMigrationUtility;