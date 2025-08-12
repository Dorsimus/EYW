import React, { useState, useEffect } from 'react';
import ProjectAPIClient from './utils/ProjectAPIClient';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CulminatingProjectsView = ({ 
  user, 
  showSuccessMessage, 
  showErrorMessage, 
  setCurrentView,
  flightbookAPIClient,
  portfolio,
  setPortfolio
}) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentTab, setCurrentTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectAPIClient] = useState(() => new ProjectAPIClient());

  // Project creation state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    project_type: '',
    competency_areas: [],
    timeline_start: '',
    timeline_end: ''
  });

  // File upload state
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileUpload, setFileUpload] = useState({
    title: '',
    description: '',
    project_phase: 'planning',
    deliverable_type: '',
    portfolio_tag: 'culminating-project-planning',
    competency_areas: [],
    is_template_based: false,
    file: null
  });

  // Note creation state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'reflection',
    project_phase: 'planning',
    tags: []
  });

  const [projectFiles, setProjectFiles] = useState([]);
  const [projectNotes, setProjectNotes] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Load user projects
  useEffect(() => {
    loadProjects();
    loadStatistics();
  }, []);

  // Load project details when selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles(selectedProject.id);
      loadProjectNotes(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await projectAPIClient.getUserProjects();
      if (result.success) {
        setProjects(result.data);
        if (result.data.length > 0 && !selectedProject) {
          setSelectedProject(result.data[0]);
        }
      } else {
        showErrorMessage('Failed to load projects: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      showErrorMessage('Failed to load projects');
    }
    setLoading(false);
  };

  const loadProjectFiles = async (projectId) => {
    try {
      const result = await projectAPIClient.getProjectFiles(projectId);
      if (result.success) {
        setProjectFiles(result.data);
      } else {
        console.error('Failed to load project files:', result.error);
      }
    } catch (error) {
      console.error('Error loading project files:', error);
    }
  };

  const loadProjectNotes = async (projectId) => {
    try {
      const result = await projectAPIClient.getProjectNotes(projectId);
      if (result.success) {
        setProjectNotes(result.data);
      } else {
        console.error('Failed to load project notes:', result.error);
      }
    } catch (error) {
      console.error('Error loading project notes:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await projectAPIClient.getProjectStatistics();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProject.title || !newProject.description || !newProject.project_type) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      const result = await projectAPIClient.createProject(newProject);
      if (result.success) {
        showSuccessMessage('Project created successfully!');
        setShowCreateModal(false);
        setNewProject({
          title: '',
          description: '',
          project_type: '',
          competency_areas: [],
          timeline_start: '',
          timeline_end: ''
        });
        loadProjects();
      } else {
        showErrorMessage('Failed to create project: ' + result.error);
      }
    } catch (error) {
      showErrorMessage('Failed to create project');
    }
  };

  // Helper function to add uploaded project file to portfolio
  const addFileToPortfolio = async (fileData, projectFile) => {
    try {
      if (!user?.id) {
        console.log('No user ID available for portfolio integration');
        return false;
      }

      const formData = new FormData();
      formData.append('title', fileData.title);
      formData.append('description', fileData.description || `${fileData.deliverable_type} from ${selectedProject.title}`);
      
      // Map project competency areas to portfolio format
      const competencyAreas = selectedProject?.competency_areas || [];
      formData.append('competency_areas', JSON.stringify(competencyAreas));
      
      // Create tags from project context
      const tags = [
        'culminating-project',
        fileData.deliverable_type.toLowerCase().replace(/\s+/g, '-'),
        fileData.project_phase
      ].filter(Boolean);
      formData.append('tags', JSON.stringify(tags));
      formData.append('visibility', 'private');
      
      // Add the same file to portfolio
      formData.append('file', fileData.file);
      
      const response = await axios.post(`${API}/users/${user.id}/portfolio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update portfolio state
      const portfolioResponse = await axios.get(`${API}/users/${user.id}/portfolio`);
      setPortfolio(portfolioResponse.data);
      
      console.log('✅ File successfully added to portfolio');
      return true;
    } catch (error) {
      console.error('❌ Failed to add file to portfolio:', error);
      return false;
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!fileUpload.title || !fileUpload.file || !fileUpload.deliverable_type) {
      showErrorMessage('Please fill in all required fields and select a file');
      return;
    }

    try {
      const result = await projectAPIClient.uploadProjectFile(
        selectedProject.id, 
        fileUpload, 
        fileUpload.file
      );
      
      if (result.success) {
        showSuccessMessage('File uploaded successfully!');
        
        // Also add the file to the user's portfolio
        const portfolioAdded = await addFileToPortfolio(fileUpload, result.data);
        if (portfolioAdded) {
          showSuccessMessage('File uploaded and added to your Portfolio!');
        }
        
        setShowFileUpload(false);
        setFileUpload({
          title: '',
          description: '',
          project_phase: 'planning',
          deliverable_type: '',
          portfolio_tag: 'culminating-project-planning',
          competency_areas: [],
          is_template_based: false,
          file: null
        });
        loadProjectFiles(selectedProject.id);
      } else {
        showErrorMessage('Failed to upload file: ' + result.error);
      }
    } catch (error) {
      showErrorMessage('Failed to upload file');
    }
  };

  // Helper function to add project note to flightbook
  const addNoteToFlightbook = async (noteData) => {
    try {
      if (!user?.id || !flightbookAPIClient) {
        console.log('No user ID or flightbook client available for flightbook integration');
        return false;
      }

      const flightbookEntry = {
        title: `Project Note: ${noteData.title}`,
        content: noteData.content,
        competency_area: selectedProject?.competency_areas?.[0] || 'culminating_project',
        entry_type: 'project_reflection',
        tags: [
          'culminating-project',
          noteData.note_type,
          noteData.project_phase,
          selectedProject?.title?.toLowerCase().replace(/\s+/g, '-')
        ].filter(Boolean),
        metadata: {
          project_id: selectedProject?.id,
          project_title: selectedProject?.title,
          note_type: noteData.note_type,
          project_phase: noteData.project_phase
        }
      };

      const result = await flightbookAPIClient.createEntry(flightbookEntry);
      if (result.success) {
        console.log('✅ Note successfully added to flightbook');
        return true;
      } else {
        console.error('❌ Failed to add note to flightbook:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to add note to flightbook:', error);
      return false;
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.title || !newNote.content) {
      showErrorMessage('Please fill in title and content');
      return;
    }

    try {
      const result = await projectAPIClient.createProjectNote(selectedProject.id, newNote);
      
      if (result.success) {
        showSuccessMessage('Note created successfully!');
        
        // Also add the note to flightbook
        const flightbookAdded = await addNoteToFlightbook(newNote);
        if (flightbookAdded) {
          showSuccessMessage('Note created and added to your Flightbook!');
        }
        
        setShowNoteModal(false);
        setNewNote({
          title: '',
          content: '',
          note_type: 'reflection',
          project_phase: 'planning',
          tags: []
        });
        loadProjectNotes(selectedProject.id);
      } else {
        showErrorMessage('Failed to create note: ' + result.error);
      }
    } catch (error) {
      showErrorMessage('Failed to create note');
    }
  };

  const projectTypes = [
    'Team Development Program',
    'Culture Transformation Project', 
    'Cross-Department Leadership Initiative'
  ];

  const competencyAreas = [
    'leadership_supervision',
    'financial_management',
    'operational_management',
    'cross_functional_collaboration',
    'strategic_thinking'
  ];

  const deliverableTypes = [
    'Project Charter & Business Case',
    'Implementation Timeline & Resource Plan',
    'Stakeholder Communication Plan',
    'Weekly Progress Reports',
    'Milestone Documentation',
    'Stakeholder Feedback Collection',
    'Financial Impact Analysis',
    'Comprehensive Project Portfolio',
    'Impact Measurement Report',
    'Leadership Growth Reflection',
    'Final Presentation Materials'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Culminating Projects</h1>
          <p className="text-gray-600 mt-2">Manage your leadership legacy initiatives</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Projects</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.total_projects}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Project Files</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.total_files}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Project Notes</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.total_notes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Completion Rate</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.completion_rate}%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {projects.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-600 mb-4">No projects yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedProject?.id === project.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{project.project_type}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      projectAPIClient.getPhaseColor(project.current_phase)
                    }`}>
                      {projectAPIClient.getPhaseDisplayName(project.current_phase)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Details */}
        {selectedProject && (
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedProject.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedProject.description}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  projectAPIClient.getPhaseColor(selectedProject.current_phase)
                }`}>
                  {projectAPIClient.getPhaseDisplayName(selectedProject.current_phase)}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex space-x-6 mt-4">
                {['overview', 'files', 'notes', 'timeline'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCurrentTab(tab)}
                    className={`pb-2 text-sm font-medium capitalize ${
                      currentTab === tab
                        ? 'text-red-600 border-b-2 border-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {currentTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p><span className="font-medium">Type:</span> {selectedProject.project_type}</p>
                      <p><span className="font-medium">Phase:</span> {projectAPIClient.getPhaseDisplayName(selectedProject.current_phase)}</p>
                      <p><span className="font-medium">Created:</span> {new Date(selectedProject.created_at).toLocaleDateString()}</p>
                      <p><span className="font-medium">Competencies:</span> {selectedProject.competency_areas.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Quick Stats</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-blue-600">{projectFiles.length}</div>
                        <div className="text-sm text-blue-600">Files</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-green-600">{projectNotes.length}</div>
                        <div className="text-sm text-green-600">Notes</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedProject.completed_deliverables.length}</div>
                        <div className="text-sm text-purple-600">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'files' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Project Files</h3>
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Upload File
                    </button>
                  </div>

                  {projectFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600">No files uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projectFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="font-medium text-gray-900">{file.title}</p>
                              <p className="text-sm text-gray-600">{file.deliverable_type} • {file.project_phase}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{projectAPIClient.formatFileSize(file.file_size)}</p>
                            <p className="text-xs text-gray-500">{new Date(file.upload_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Project Notes & Reflections</h3>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Add Note
                    </button>
                  </div>

                  {projectNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <p className="text-gray-600">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectNotes.map((note) => (
                        <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{note.title}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {note.note_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          {note.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {note.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Project Timeline</h3>
                  <div className="space-y-3">
                    {selectedProject.phase_history.map((phase, index) => (
                      <div key={index} className="flex items-start">
                        <div className={`w-3 h-3 rounded-full mt-2 mr-3 ${
                          phase.status === 'active' ? 'bg-blue-500' : 
                          phase.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {projectAPIClient.getPhaseDisplayName(phase.phase)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Started: {new Date(phase.started_at).toLocaleDateString()}
                            {phase.completed_at && (
                              <> • Completed: {new Date(phase.completed_at).toLocaleDateString()}</>
                            )}
                          </p>
                          <p className={`text-sm mt-1 ${
                            phase.status === 'active' ? 'text-blue-600' : 
                            phase.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            Status: {phase.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Culminating Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="4"
                  placeholder="Describe your project goals and approach"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <select
                  value={newProject.project_type}
                  onChange={(e) => setNewProject({...newProject, project_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select project type</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competency Areas</label>
                <div className="grid grid-cols-2 gap-2">
                  {competencyAreas.map((area) => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProject.competency_areas.includes(area)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProject({
                              ...newProject, 
                              competency_areas: [...newProject.competency_areas, area]
                            });
                          } else {
                            setNewProject({
                              ...newProject, 
                              competency_areas: newProject.competency_areas.filter(a => a !== area)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{area.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline Start</label>
                  <input
                    type="date"
                    value={newProject.timeline_start}
                    onChange={(e) => setNewProject({...newProject, timeline_start: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline End</label>
                  <input
                    type="date"
                    value={newProject.timeline_end}
                    onChange={(e) => setNewProject({...newProject, timeline_end: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">Upload Project File</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Title</label>
                <input
                  type="text"
                  value={fileUpload.title}
                  onChange={(e) => setFileUpload({...fileUpload, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter file title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={fileUpload.description}
                  onChange={(e) => setFileUpload({...fileUpload, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe this file"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Phase</label>
                  <select
                    value={fileUpload.project_phase}
                    onChange={(e) => setFileUpload({...fileUpload, project_phase: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="planning">Planning</option>
                    <option value="execution">Execution</option>
                    <option value="completion">Completion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deliverable Type</label>
                  <select
                    value={fileUpload.deliverable_type}
                    onChange={(e) => setFileUpload({...fileUpload, deliverable_type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select deliverable type</option>
                    {deliverableTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                <input
                  type="file"
                  onChange={(e) => setFileUpload({...fileUpload, file: e.target.files[0]})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="template-based"
                  checked={fileUpload.is_template_based}
                  onChange={(e) => setFileUpload({...fileUpload, is_template_based: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="template-based" className="text-sm text-gray-700">
                  This file uses a provided template
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFileUpload(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Creation Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">Create Project Note</h2>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter note title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="6"
                  placeholder="Write your reflection or note here..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
                  <select
                    value={newNote.note_type}
                    onChange={(e) => setNewNote({...newNote, note_type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="reflection">Reflection</option>
                    <option value="milestone">Milestone</option>
                    <option value="challenge">Challenge</option>
                    <option value="lesson">Lesson Learned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Phase</label>
                  <select
                    value={newNote.project_phase}
                    onChange={(e) => setNewNote({...newNote, project_phase: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="planning">Planning</option>
                    <option value="execution">Execution</option>
                    <option value="completion">Completion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (optional)</label>
                <input
                  type="text"
                  placeholder="Enter tags separated by commas"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    setNewNote({...newNote, tags});
                  }}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CulminatingProjectsView;