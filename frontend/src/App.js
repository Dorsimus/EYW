import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock current user - in real app this would come from authentication
const CURRENT_USER_ID = "user123";

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [competencies, setCompetencies] = useState({});
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetency, setSelectedCompetency] = useState(null);
  const [competencyTasks, setCompetencyTasks] = useState([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    competency_areas: [],
    tags: [],
    file: null
  });

  // Initialize user if doesn't exist
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Try to get existing user first
      let userData;
      try {
        const response = await axios.get(`${API}/users/${CURRENT_USER_ID}`);
        userData = response.data;
      } catch (error) {
        // User doesn't exist, create new one
        const createResponse = await axios.post(`${API}/users`, {
          email: "demo@earnwings.com",
          name: "Demo Navigator",
          role: "participant",
          level: "navigator"
        });
        userData = createResponse.data;
        
        // Seed sample tasks for demo
        try {
          await axios.post(`${API}/admin/seed-tasks`);
          console.log('Sample tasks seeded');
        } catch (e) {
          console.log('Tasks already seeded or error:', e);
        }
      }
      
      setUser(userData);
      await loadUserData(userData.id);
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      // Load competencies
      const compResponse = await axios.get(`${API}/users/${userId}/competencies`);
      setCompetencies(compResponse.data);
      
      // Load portfolio
      const portfolioResponse = await axios.get(`${API}/users/${userId}/portfolio`);
      setPortfolio(portfolioResponse.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCompetencyTasks = async (competencyArea, subCompetency) => {
    try {
      const userId = user?.id || CURRENT_USER_ID;
      const response = await axios.get(`${API}/users/${userId}/tasks/${competencyArea}/${subCompetency}`);
      setCompetencyTasks(response.data);
      setSelectedCompetency({ area: competencyArea, sub: subCompetency });
    } catch (error) {
      console.error('Error loading tasks:', error);
      setCompetencyTasks([]);
    }
  };

  const completeTask = async (taskId, evidenceDescription = "", file = null) => {
    try {
      const userId = user?.id || CURRENT_USER_ID;
      const formData = new FormData();
      formData.append('task_id', taskId);
      formData.append('evidence_description', evidenceDescription);
      formData.append('notes', '');
      
      if (file) {
        formData.append('file', file);
      }
      
      await axios.post(`${API}/users/${userId}/task-completions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reload data
      await loadUserData(userId);
      if (selectedCompetency) {
        await loadCompetencyTasks(selectedCompetency.area, selectedCompetency.sub);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Error completing task: ' + error.response?.data?.detail || error.message);
    }
  };

  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('title', newPortfolioItem.title);
      formData.append('description', newPortfolioItem.description);
      formData.append('competency_areas', JSON.stringify(newPortfolioItem.competency_areas));
      formData.append('tags', JSON.stringify(newPortfolioItem.tags));
      
      if (newPortfolioItem.file) {
        formData.append('file', newPortfolioItem.file);
      }
      
      const userId = user?.id || CURRENT_USER_ID;
      await axios.post(`${API}/users/${userId}/portfolio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset form
      setNewPortfolioItem({
        title: '',
        description: '',
        competency_areas: [],
        tags: [],
        file: null
      });
      
      // Reload data
      await loadUserData(userId);
      setCurrentView('portfolio');
    } catch (error) {
      console.error('Error adding portfolio item:', error);
    }
  };

  const getOverallProgress = () => {
    if (Object.keys(competencies).length === 0) return 0;
    const totalProgress = Object.values(competencies).reduce((sum, area) => sum + (area.overall_progress || 0), 0);
    return Math.round(totalProgress / Object.keys(competencies).length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">EYW</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Earn Your Wings</h1>
              </div>
              <span className="text-sm text-gray-500">Navigator Level</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Overall Progress: {getOverallProgress()}%</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'DN'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex space-x-8 -mb-px">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'competencies', label: 'Competencies', icon: '🎯' },
              { key: 'portfolio', label: 'Portfolio', icon: '📁' },
              { key: 'add-portfolio', label: 'Add Evidence', icon: '➕' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm ${
                  currentView === item.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <DashboardView 
            user={user}
            competencies={competencies}
            portfolio={portfolio}
            overallProgress={getOverallProgress()}
            onViewCompetencyTasks={loadCompetencyTasks}
          />
        )}
        
        {currentView === 'competencies' && (
          <CompetenciesView 
            competencies={competencies}
            onViewTasks={loadCompetencyTasks}
            selectedCompetency={selectedCompetency}
            competencyTasks={competencyTasks}
            onCompleteTask={completeTask}
          />
        )}
        
        {currentView === 'portfolio' && (
          <PortfolioView portfolio={portfolio} />
        )}
        
        {currentView === 'add-portfolio' && (
          <AddPortfolioView 
            portfolioItem={newPortfolioItem}
            setPortfolioItem={setNewPortfolioItem}
            onSubmit={handlePortfolioSubmit}
            competencies={competencies}
          />
        )}
      </main>
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ user, competencies, portfolio, overallProgress, onViewCompetencyTasks }) => {
  const getTopCompetencies = () => {
    return Object.entries(competencies)
      .sort(([,a], [,b]) => (b.overall_progress || 0) - (a.overall_progress || 0))
      .slice(0, 3);
  };

  const getTotalTasks = () => {
    return Object.values(competencies).reduce((total, area) => {
      return total + Object.values(area.sub_competencies).reduce((subTotal, sub) => {
        return subTotal + (sub.total_tasks || 0);
      }, 0);
    }, 0);
  };

  const getCompletedTasks = () => {
    return Object.values(competencies).reduce((total, area) => {
      return total + Object.values(area.sub_competencies).reduce((subTotal, sub) => {
        return subTotal + (sub.completed_tasks || 0);
      }, 0);
    }, 0);
  };

  const recentPortfolio = portfolio.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}! 🚀</h2>
        <p className="text-lg text-gray-600">Track your progress through task completion and portfolio building</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{overallProgress}%</div>
          <div className="text-sm text-gray-500">Overall Progress</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{getCompletedTasks()}/{getTotalTasks()}</div>
          <div className="text-sm text-gray-500">Tasks Completed</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{portfolio.length}</div>
          <div className="text-sm text-gray-500">Portfolio Items</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">Navigator</div>
          <div className="text-sm text-gray-500">Current Level</div>
        </div>
      </div>

      {/* Top Competencies */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">🎯 Top Competency Areas</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {getTopCompetencies().map(([key, area]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{area.name}</div>
                    <div className="text-sm text-gray-500">{area.description}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${area.overall_progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {area.overall_progress || 0}%
                    </span>
                  </div>
                </div>
                
                {/* Sub-competencies with task counts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {Object.entries(area.sub_competencies).slice(0, 4).map(([subKey, subData]) => (
                    <button
                      key={subKey}
                      onClick={() => onViewCompetencyTasks(key, subKey)}
                      className="text-left p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-800">{subData.name}</div>
                      <div className="text-xs text-gray-600">
                        {subData.completed_tasks || 0}/{subData.total_tasks || 0} tasks completed
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Portfolio Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📁 Recent Portfolio Items</h3>
        </div>
        <div className="p-6">
          {recentPortfolio.length > 0 ? (
            <div className="space-y-4">
              {recentPortfolio.map(item => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-2">
                      {item.competency_areas.map(area => (
                        <span key={area} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {competencies[area]?.name || area}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.upload_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No portfolio items yet. Start building your evidence!</p>
              <button 
                onClick={() => setCurrentView('add-portfolio')}
                className="mt-3 text-blue-600 hover:text-blue-500 font-medium"
              >
                Add your first portfolio item →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Competencies View Component
const CompetenciesView = ({ competencies, onViewTasks, selectedCompetency, competencyTasks, onCompleteTask }) => {
  const [expandedArea, setExpandedArea] = useState(null);
  const [taskModal, setTaskModal] = useState(null);

  const handleViewTasks = (areaKey, subKey) => {
    onViewTasks(areaKey, subKey);
    setTaskModal({ area: areaKey, sub: subKey });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🎯 Navigator Competencies</h2>
        <p className="text-lg text-gray-600">Complete tasks to build competency mastery</p>
      </div>

      <div className="space-y-4">
        {Object.entries(competencies).map(([areaKey, areaData]) => (
          <div key={areaKey} className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedArea(expandedArea === areaKey ? null : areaKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{areaData.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{areaData.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${areaData.overall_progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {areaData.overall_progress || 0}%
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {expandedArea === areaKey ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </div>

            {expandedArea === areaKey && (
              <div className="px-6 py-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(areaData.sub_competencies).map(([subKey, subData]) => (
                    <div key={subKey} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{subData.name}</h4>
                        <button
                          onClick={() => handleViewTasks(areaKey, subKey)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Tasks
                        </button>
                      </div>
                      
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${subData.completion_percentage || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12">
                              {Math.round(subData.completion_percentage || 0)}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{subData.completed_tasks || 0}/{subData.total_tasks || 0} tasks</span>
                            <span>{(subData.evidence_items && subData.evidence_items.length) || 0} evidence items</span>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {taskModal && (
        <TaskModal
          isOpen={!!taskModal}
          onClose={() => setTaskModal(null)}
          tasks={competencyTasks}
          competencyArea={taskModal.area}
          subCompetency={taskModal.sub}
          competencies={competencies}
          onCompleteTask={onCompleteTask}
        />
      )}
    </div>
  );
};

// Task Modal Component
const TaskModal = ({ isOpen, onClose, tasks, competencyArea, subCompetency, competencies, onCompleteTask }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const handleCompleteTask = async (taskId) => {
    await onCompleteTask(taskId, evidenceDescription, evidenceFile);
    setSelectedTask(null);
    setEvidenceDescription('');
    setEvidenceFile(null);
  };

  const getTaskTypeIcon = (type) => {
    switch(type) {
      case 'course_link': return '📚';
      case 'document_upload': return '📄';
      case 'assessment': return '📝';
      case 'shadowing': return '👥';
      case 'meeting': return '🤝';
      case 'project': return '🎯';
      default: return '✅';
    }
  };

  if (!isOpen) return null;

  const competencyName = competencies[competencyArea]?.sub_competencies[subCompetency] || subCompetency;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Tasks for {competencyName}</h3>
              <p className="text-sm text-gray-600 mt-1">Complete these tasks to build your competency</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className={`border rounded-lg p-4 ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{getTaskTypeIcon(task.task_type)}</span>
                      <h4 className="font-medium text-gray-900">{String(task.title || 'Untitled Task')}</h4>
                      {task.completed && <span className="text-green-600 text-sm font-medium">✓ Completed</span>}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{String(task.description)}</p>
                    
                    {task.instructions && (
                      <div className="bg-blue-50 p-3 rounded mb-3">
                        <p className="text-sm text-blue-800">📋 <strong>Instructions:</strong> {String(task.instructions)}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {task.estimated_hours && <span>⏱️ {task.estimated_hours}h</span>}
                      {task.required && <span className="text-red-600">* Required</span>}
                    </div>
                    
                    {task.external_link && (
                      <a 
                        href={task.external_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                      >
                        🔗 Open External Link
                      </a>
                    )}
                  </div>
                  
                  {!task.completed && (
                    <button
                      onClick={() => setSelectedTask(task.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
                
                {task.completed && task.completion_data && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>Completed:</strong> {
                        task.completion_data.completed_at 
                          ? new Date(task.completion_data.completed_at).toLocaleDateString()
                          : 'Date unavailable'
                      }
                    </p>
                    {task.completion_data.evidence_description && (
                      <p className="text-sm text-green-700 mt-1">
                        <strong>Evidence:</strong> {String(task.completion_data.evidence_description)}
                      </p>
                    )}
                    {task.completion_data.notes && (
                      <p className="text-sm text-green-700 mt-1">
                        <strong>Notes:</strong> {String(task.completion_data.notes)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Complete Task</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Description (Optional)
                  </label>
                  <textarea
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Describe how you completed this task..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Evidence (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files[0])}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteTask(selectedTask)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Portfolio View Component  
const PortfolioView = ({ portfolio }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📁 Your Portfolio</h2>
        <p className="text-lg text-gray-600">Document your learning journey and career advancement</p>
      </div>

      {portfolio.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{item.title}</h3>
                  <div className="text-sm text-gray-400">
                    {item.file_path ? '📎' : '📝'}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>
                
                {item.competency_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.competency_areas.map(area => (
                      <span key={area} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-4">
                  Uploaded: {new Date(item.upload_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">📁</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your portfolio is empty</h3>
          <p className="text-gray-600 mb-6">Start building your career advancement portfolio by adding evidence of your competencies</p>
          <button 
            onClick={() => setCurrentView('add-portfolio')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Your First Item
          </button>
        </div>
      )}
    </div>
  );
};

// Add Portfolio View Component
const AddPortfolioView = ({ portfolioItem, setPortfolioItem, onSubmit, competencies }) => {
  const competencyOptions = Object.entries(competencies).map(([key, data]) => ({
    value: key,
    label: data.name
  }));

  const handleCompetencyToggle = (competencyKey) => {
    const updated = portfolioItem.competency_areas.includes(competencyKey)
      ? portfolioItem.competency_areas.filter(c => c !== competencyKey)
      : [...portfolioItem.competency_areas, competencyKey];
    
    setPortfolioItem({ ...portfolioItem, competency_areas: updated });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">➕ Add Portfolio Evidence</h2>
        <p className="text-lg text-gray-600">Document your competency development and achievements</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={portfolioItem.title}
              onChange={(e) => setPortfolioItem({ ...portfolioItem, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Budget Variance Analysis Project"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={portfolioItem.description}
              onChange={(e) => setPortfolioItem({ ...portfolioItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what you did, what you learned, and how it demonstrates your competency development..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Competency Areas
            </label>
            <div className="space-y-2">
              {competencyOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={portfolioItem.competency_areas.includes(option.value)}
                    onChange={() => handleCompetencyToggle(option.value)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              id="tags"
              value={portfolioItem.tags.join(', ')}
              onChange={(e) => setPortfolioItem({ 
                ...portfolioItem, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="leadership, project-management, cost-savings"
            />
            <p className="mt-1 text-sm text-gray-500">Separate tags with commas</p>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Document (optional)
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setPortfolioItem({ ...portfolioItem, file: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.pptx"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload supporting documents, images, or presentations (PDF, Word, Excel, PowerPoint, Images)
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setCurrentView('portfolio')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Add to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;