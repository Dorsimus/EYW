/**
 * Production-ready Flightbook API Client
 * Replaces localStorage functionality with backend API integration
 * Includes offline support, migration utilities, and error handling
 */

class FlightbookAPIClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
    this.apiEndpoint = `${this.baseURL}/api/v1/flightbook`;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    // Setup network status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    console.log('🚀 FlightbookAPIClient initialized with endpoint:', this.apiEndpoint);
  }

  /**
   * Get authentication headers from Clerk
   */
  async getAuthHeaders() {
    try {
      const clerk = window.Clerk;
      if (!clerk) {
        throw new Error('Clerk not available');
      }
      
      const session = await clerk.session;
      if (!session) {
        throw new Error('No active session');
      }
      
      const token = await session.getToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  async request(endpoint, options = {}) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const headers = await this.getAuthHeaders();
        
        const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            ...options.headers
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token expired, sign out user
            if (window.Clerk) {
              await window.Clerk.signOut();
            }
            throw new Error('Authentication expired');
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        // Handle no-content responses (like DELETE)
        if (response.status === 204) {
          return null;
        }
        
        return await response.json();
      } catch (error) {
        attempt++;
        console.warn(`API request attempt ${attempt} failed:`, error.message);
        
        if (attempt >= maxRetries || !this.isOnline) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Create a new flightbook entry
   */
  async createEntry(entryData) {
    console.log('📝 Creating flightbook entry:', entryData.title);
    
    if (!this.isOnline) {
      this.queueForSync('CREATE', entryData);
      return this.createEntryLocally(entryData);
    }
    
    try {
      const entry = await this.request('/', {
        method: 'POST',
        body: JSON.stringify(entryData)
      });
      
      console.log('✅ Created flightbook entry:', entry.id);
      this.cacheEntry(entry);
      return entry;
    } catch (error) {
      console.warn('⚠️ Failed to create entry via API, using local fallback:', error.message);
      this.queueForSync('CREATE', entryData);
      return this.createEntryLocally(entryData);
    }
  }

  /**
   * Create or update flightbook entry from journal reflection (special endpoint)
   */
  async createOrUpdateFromJournal(entryData, entryKey = null) {
    console.log('📓 Creating/updating journal entry:', entryData.title);
    
    const queryParams = entryKey ? `?entry_key=${encodeURIComponent(entryKey)}` : '';
    
    if (!this.isOnline) {
      this.queueForSync('JOURNAL', { entryData, entryKey });
      return this.createEntryLocally(entryData, entryKey);
    }
    
    try {
      const entry = await this.request(`/journal${queryParams}`, {
        method: 'POST',
        body: JSON.stringify(entryData)
      });
      
      console.log('✅ Created/updated journal entry:', entry.id);
      this.cacheEntry(entry);
      return entry;
    } catch (error) {
      console.warn('⚠️ Failed to create/update journal entry via API:', error.message);
      this.queueForSync('JOURNAL', { entryData, entryKey });
      return this.createEntryLocally(entryData, entryKey);
    }
  }

  /**
   * Get all flightbook entries with optional filtering
   */
  async getEntries(filters = {}, page = 1, limit = 50) {
    console.log('📖 Getting flightbook entries with filters:', filters);
    
    if (!this.isOnline) {
      return this.getEntriesFromCache(filters);
    }
    
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const endpoint = `/${queryParams.toString() ? `?${queryParams}` : ''}`;
      const entries = await this.request(endpoint);
      
      console.log(`✅ Retrieved ${entries.length} flightbook entries`);
      this.cacheEntries(entries);
      return entries;
    } catch (error) {
      console.warn('⚠️ Failed to get entries from API, using cache:', error.message);
      return this.getEntriesFromCache(filters);
    }
  }

  /**
   * Get a specific flightbook entry by ID
   */
  async getEntry(entryId) {
    console.log('📄 Getting flightbook entry:', entryId);
    
    if (!this.isOnline) {
      return this.getEntryFromCache(entryId);
    }
    
    try {
      const entry = await this.request(`/${entryId}`);
      console.log('✅ Retrieved flightbook entry:', entry.title);
      this.cacheEntry(entry);
      return entry;
    } catch (error) {
      console.warn('⚠️ Failed to get entry from API, using cache:', error.message);
      return this.getEntryFromCache(entryId);
    }
  }

  /**
   * Update an existing flightbook entry
   */
  async updateEntry(entryId, updateData) {
    console.log('✏️ Updating flightbook entry:', entryId);
    
    if (!this.isOnline) {
      this.queueForSync('UPDATE', { id: entryId, ...updateData });
      return this.updateEntryLocally(entryId, updateData);
    }
    
    try {
      const entry = await this.request(`/${entryId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      console.log('✅ Updated flightbook entry:', entry.id);
      this.cacheEntry(entry);
      return entry;
    } catch (error) {
      console.warn('⚠️ Failed to update entry via API:', error.message);
      this.queueForSync('UPDATE', { id: entryId, ...updateData });
      return this.updateEntryLocally(entryId, updateData);
    }
  }

  /**
   * Delete a flightbook entry
   */
  async deleteEntry(entryId) {
    console.log('🗑️ Deleting flightbook entry:', entryId);
    
    if (!this.isOnline) {
      this.queueForSync('DELETE', { id: entryId });
      this.deleteEntryLocally(entryId);
      return;
    }
    
    try {
      await this.request(`/${entryId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Deleted flightbook entry:', entryId);
      this.removeFromCache(entryId);
    } catch (error) {
      console.warn('⚠️ Failed to delete entry via API:', error.message);
      this.queueForSync('DELETE', { id: entryId });
      this.deleteEntryLocally(entryId);
    }
  }

  /**
   * Get flightbook statistics
   */
  async getStatistics() {
    console.log('📊 Getting flightbook statistics');
    
    if (!this.isOnline) {
      return this.getStatisticsFromCache();
    }
    
    try {
      const stats = await this.request('/statistics/overview');
      console.log('✅ Retrieved flightbook statistics:', stats);
      this.cacheStatistics(stats);
      return stats;
    } catch (error) {
      console.warn('⚠️ Failed to get statistics from API, using cache:', error.message);
      return this.getStatisticsFromCache();
    }
  }

  /**
   * Bulk create entries (for migration)
   */
  async bulkCreateEntries(entriesData) {
    console.log('📦 Bulk creating flightbook entries:', entriesData.length);
    
    try {
      const result = await this.request('/bulk', {
        method: 'POST',
        body: JSON.stringify(entriesData)
      });
      
      console.log('✅ Bulk created entries:', result.processed);
      
      // Cache created entries
      if (result.created_entries) {
        result.created_entries.forEach(entry => this.cacheEntry(entry));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to bulk create entries:', error);
      throw error;
    }
  }

  // === CACHE MANAGEMENT METHODS ===

  /**
   * Cache a single entry
   */
  cacheEntry(entry) {
    const cached = this.getEntriesFromCache();
    const index = cached.findIndex(e => e.id === entry.id);
    
    if (index >= 0) {
      cached[index] = entry;
    } else {
      cached.push(entry);
    }
    
    this.cacheEntries(cached);
  }

  /**
   * Cache multiple entries
   */
  cacheEntries(entries) {
    const cacheData = {
      entries: entries,
      timestamp: Date.now(),
      version: '2.0'
    };
    
    localStorage.setItem('flightbook_api_cache', JSON.stringify(cacheData));
  }

  /**
   * Get entries from cache with optional filtering
   */
  getEntriesFromCache(filters = {}) {
    try {
      const cached = JSON.parse(localStorage.getItem('flightbook_api_cache') || '{}');
      let entries = cached.entries || [];
      
      // Apply filters
      if (filters.competency_area) {
        entries = entries.filter(e => e.competency_area === filters.competency_area);
      }
      if (filters.sub_competency) {
        entries = entries.filter(e => e.sub_competency === filters.sub_competency);
      }
      if (filters.entry_type) {
        entries = entries.filter(e => e.entry_type === filters.entry_type);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        entries = entries.filter(e => 
          e.title.toLowerCase().includes(searchTerm) ||
          e.content.toLowerCase().includes(searchTerm)
        );
      }
      if (filters.tags) {
        const tagList = filters.tags.split(',').map(t => t.trim().toLowerCase());
        entries = entries.filter(e => 
          e.tags && e.tags.some(tag => tagList.includes(tag.toLowerCase()))
        );
      }
      
      // Sort by updated_at descending
      entries.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      return entries;
    } catch (error) {
      console.warn('Failed to parse cached entries:', error);
      return [];
    }
  }

  /**
   * Get single entry from cache
   */
  getEntryFromCache(entryId) {
    const cached = this.getEntriesFromCache();
    return cached.find(e => e.id === entryId) || null;
  }

  /**
   * Remove entry from cache
   */
  removeFromCache(entryId) {
    const cached = this.getEntriesFromCache();
    const filtered = cached.filter(e => e.id !== entryId);
    this.cacheEntries(filtered);
  }

  /**
   * Cache statistics
   */
  cacheStatistics(stats) {
    const cacheData = {
      stats: stats,
      timestamp: Date.now()
    };
    localStorage.setItem('flightbook_stats_cache', JSON.stringify(cacheData));
  }

  /**
   * Get statistics from cache
   */
  getStatisticsFromCache() {
    try {
      const cached = JSON.parse(localStorage.getItem('flightbook_stats_cache') || '{}');
      return cached.stats || {
        total_entries: 0,
        entries_by_competency: {},
        entries_by_type: {},
        entries_by_month: {},
        most_used_tags: [],
        recent_activity: [],
        version_history_count: 0
      };
    } catch (error) {
      console.warn('Failed to parse cached statistics:', error);
      return {
        total_entries: 0,
        entries_by_competency: {},
        entries_by_type: {},
        entries_by_month: {},
        most_used_tags: [],
        recent_activity: [],
        version_history_count: 0
      };
    }
  }

  // === LOCAL STORAGE FALLBACK METHODS ===

  /**
   * Create entry locally when offline
   */
  createEntryLocally(entryData, entryKey = null) {
    const entry = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entryData,
      entry_key: entryKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      version_history: [{
        version: 1,
        content: entryData.content,
        updated_at: new Date().toISOString(),
        change_summary: 'Initial version (offline)'
      }],
      _local: true
    };
    
    this.cacheEntry(entry);
    return entry;
  }

  /**
   * Update entry locally when offline
   */
  updateEntryLocally(entryId, updateData) {
    const cached = this.getEntriesFromCache();
    const index = cached.findIndex(e => e.id === entryId);
    
    if (index >= 0) {
      const entry = cached[index];
      
      // Create version history entry if content changed
      if (updateData.content && updateData.content !== entry.content) {
        const newVersion = (entry.version || 1) + 1;
        entry.version_history = entry.version_history || [];
        entry.version_history.push({
          version: newVersion,
          content: updateData.content,
          updated_at: new Date().toISOString(),
          change_summary: 'Updated offline'
        });
        entry.version = newVersion;
      }
      
      // Apply updates
      Object.assign(entry, updateData, {
        updated_at: new Date().toISOString(),
        _local: true
      });
      
      this.cacheEntries(cached);
      return entry;
    }
    
    throw new Error('Entry not found in local cache');
  }

  /**
   * Delete entry locally when offline
   */
  deleteEntryLocally(entryId) {
    this.removeFromCache(entryId);
  }

  // === OFFLINE SYNC METHODS ===

  /**
   * Queue operation for sync when online
   */
  queueForSync(operation, data) {
    this.syncQueue.push({
      id: Date.now(),
      operation,
      data,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('flightbook_sync_queue', JSON.stringify(this.syncQueue));
    console.log(`📋 Queued ${operation} operation for sync:`, data.title || data.id);
  }

  /**
   * Process queued operations when back online
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    console.log(`🔄 Processing ${this.syncQueue.length} queued operations`);
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const item of queue) {
      try {
        switch (item.operation) {
          case 'CREATE':
            await this.request('/', {
              method: 'POST',
              body: JSON.stringify(item.data)
            });
            break;
            
          case 'JOURNAL':
            const queryParams = item.data.entryKey ? `?entry_key=${encodeURIComponent(item.data.entryKey)}` : '';
            await this.request(`/journal${queryParams}`, {
              method: 'POST',
              body: JSON.stringify(item.data.entryData)
            });
            break;
            
          case 'UPDATE':
            const { id, ...updateData } = item.data;
            await this.request(`/${id}`, {
              method: 'PUT',
              body: JSON.stringify(updateData)
            });
            break;
            
          case 'DELETE':
            await this.request(`/${item.data.id}`, {
              method: 'DELETE'
            });
            break;
        }
        
        console.log(`✅ Synced ${item.operation} operation`);
      } catch (error) {
        console.error(`❌ Failed to sync ${item.operation} operation:`, error);
        this.syncQueue.push(item); // Re-queue failed operations
      }
    }
    
    localStorage.setItem('flightbook_sync_queue', JSON.stringify(this.syncQueue));
    
    if (this.syncQueue.length === 0) {
      console.log('🎉 All operations synced successfully!');
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus() {
    return {
      pending: this.syncQueue.length,
      isOnline: this.isOnline,
      operations: this.syncQueue.map(item => ({
        operation: item.operation,
        timestamp: item.timestamp,
        data: item.data.title || item.data.id || 'Unknown'
      }))
    };
  }
}

export default FlightbookAPIClient;