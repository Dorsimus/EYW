import axios from 'axios';

class ProjectAPIClient {
  constructor() {
    this.API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/v1/projects`;
  }

  // Helper method to get auth headers
  async getAuthHeaders() {
    // This will be integrated with Clerk authentication
    // For now, return empty headers - Clerk will handle JWT token automatically
    return {
      'Content-Type': 'application/json'
    };
  }

  // Helper method for file upload headers
  async getFileUploadHeaders() {
    return {
      // Let browser set Content-Type for multipart/form-data
    };
  }

  // Project CRUD Operations
  async createProject(projectData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(this.API_BASE, projectData, { headers });
      console.log('✅ Project created successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to create project'
      };
    }
  }

  async getUserProjects(filters = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.current_phase) params.append('current_phase', filters.current_phase);
      
      const url = params.toString() ? `${this.API_BASE}?${params}` : this.API_BASE;
      const response = await axios.get(url, { headers });
      
      console.log(`✅ Retrieved ${response.data.length} projects`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to get projects:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to retrieve projects'
      };
    }
  }

  async getProject(projectId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.API_BASE}/${projectId}`, { headers });
      console.log('✅ Project retrieved successfully:', response.data.title);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to get project:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Project not found'
      };
    }
  }

  async updateProject(projectId, updateData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put(`${this.API_BASE}/${projectId}`, updateData, { headers });
      console.log('✅ Project updated successfully:', response.data.title);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update project'
      };
    }
  }

  // Project File Management
  async uploadProjectFile(projectId, fileData, file) {
    try {
      const headers = await this.getFileUploadHeaders();
      const formData = new FormData();
      
      formData.append('title', fileData.title);
      if (fileData.description) formData.append('description', fileData.description);
      formData.append('project_phase', fileData.project_phase);
      formData.append('deliverable_type', fileData.deliverable_type);
      formData.append('portfolio_tag', fileData.portfolio_tag);
      formData.append('competency_areas', JSON.stringify(fileData.competency_areas || []));
      formData.append('is_template_based', fileData.is_template_based || false);
      formData.append('file', file);
      
      const response = await axios.post(
        `${this.API_BASE}/${projectId}/files`, 
        formData, 
        { headers }
      );
      
      console.log('✅ Project file uploaded successfully:', response.data.title);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to upload project file:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to upload file'
      };
    }
  }

  async getProjectFiles(projectId, filters = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      
      if (filters.project_phase) params.append('project_phase', filters.project_phase);
      if (filters.deliverable_type) params.append('deliverable_type', filters.deliverable_type);
      
      const url = params.toString() ? 
        `${this.API_BASE}/${projectId}/files?${params}` : 
        `${this.API_BASE}/${projectId}/files`;
      
      const response = await axios.get(url, { headers });
      console.log(`✅ Retrieved ${response.data.length} project files`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to get project files:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to retrieve project files'
      };
    }
  }

  async updateProjectFile(fileId, updateData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put(
        `${this.API_BASE.replace('/projects', '/projects')}/files/${fileId}`, 
        updateData, 
        { headers }
      );
      console.log('✅ Project file updated successfully:', response.data.title);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to update project file:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update file'
      };
    }
  }

  // Project Notes Management
  async createProjectNote(projectId, noteData) {
    try {
      const headers = await this.getFileUploadHeaders(); // Use form data headers
      const formData = new FormData();
      
      formData.append('title', noteData.title);
      formData.append('content', noteData.content);
      formData.append('note_type', noteData.note_type || 'reflection');
      formData.append('project_phase', noteData.project_phase);
      formData.append('tags', JSON.stringify(noteData.tags || []));
      
      const response = await axios.post(
        `${this.API_BASE}/${projectId}/notes`, 
        formData, 
        { headers }
      );
      
      console.log('✅ Project note created successfully:', response.data.title);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to create project note:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to create note'
      };
    }
  }

  async getProjectNotes(projectId, filters = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      
      if (filters.note_type) params.append('note_type', filters.note_type);
      if (filters.project_phase) params.append('project_phase', filters.project_phase);
      
      const url = params.toString() ? 
        `${this.API_BASE}/${projectId}/notes?${params}` : 
        `${this.API_BASE}/${projectId}/notes`;
      
      const response = await axios.get(url, { headers });
      console.log(`✅ Retrieved ${response.data.length} project notes`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to get project notes:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to retrieve project notes'
      };
    }
  }

  // Integration Methods
  async linkFlightbookEntry(projectId, entryId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.API_BASE}/${projectId}/link-flightbook/${entryId}`, 
        {}, 
        { headers }
      );
      
      console.log('✅ Flightbook entry linked to project successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to link flightbook entry:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to link flightbook entry'
      };
    }
  }

  async markDeliverableComplete(projectId, deliverableId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.API_BASE}/${projectId}/deliverables/${deliverableId}/complete`, 
        {}, 
        { headers }
      );
      
      console.log('✅ Deliverable marked as complete successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to mark deliverable complete:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to mark deliverable complete'
      };
    }
  }

  // Analytics
  async getProjectStatistics() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.API_BASE}/statistics/overview`, { headers });
      console.log('✅ Project statistics retrieved successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to get project statistics:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to retrieve statistics'
      };
    }
  }

  // Helper methods for frontend integration
  getPhaseDisplayName(phase) {
    const phaseNames = {
      'planning': 'Planning & Design',
      'execution': 'Implementation & Execution', 
      'completion': 'Documentation & Presentation',
      'presented': 'Completed',
      'archived': 'Archived'
    };
    return phaseNames[phase] || phase;
  }

  getPhaseColor(phase) {
    const phaseColors = {
      'planning': 'bg-blue-100 text-blue-800',
      'execution': 'bg-yellow-100 text-yellow-800',
      'completion': 'bg-green-100 text-green-800',
      'presented': 'bg-purple-100 text-purple-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return phaseColors[phase] || 'bg-gray-100 text-gray-600';
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ProjectAPIClient;