import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock current user - in real app this would come from authentication
// Use localStorage to persist the demo user ID across sessions
const getStoredUserId = () => localStorage.getItem('demo_user_id');
const setStoredUserId = (id) => localStorage.setItem('demo_user_id', id);

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [competencies, setCompetencies] = useState({});
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetency, setSelectedCompetency] = useState(null);
  const [competencyTasks, setCompetencyTasks] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); // Add flag to prevent double initialization
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'course_link',
    competency_area: 'leadership_supervision',
    sub_competency: 'team_motivation',
    order: 1,
    required: true,
    estimated_hours: 1.0,
    external_link: '',
    instructions: ''
  });
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    competency_areas: [],
    tags: [],
    file: null
  });

  const competencyOptions = [
    { area: 'leadership_supervision', subs: ['team_motivation', 'delegation', 'performance_management', 'coaching_development', 'team_building', 'conflict_resolution', 'difficult_conversations', 'cross_dept_communication', 'resident_resolution', 'crisis_leadership'] },
    { area: 'financial_management', subs: ['budget_creation', 'variance_analysis', 'cost_control', 'roi_decisions', 'revenue_impact', 'pl_understanding', 'kpi_tracking', 'financial_forecasting', 'capex_planning', 'vendor_cost_mgmt'] },
    { area: 'operational_management', subs: ['workflow_optimization', 'technology_utilization', 'quality_control', 'sop_management', 'innovation', 'safety_management', 'policy_enforcement', 'legal_compliance', 'emergency_preparedness', 'documentation'] },
    { area: 'cross_functional', subs: ['interdept_understanding', 'resident_journey', 'revenue_awareness', 'collaborative_problem_solving', 'joint_planning', 'resource_sharing', 'communication_protocols', 'dept_conflict_resolution', 'success_metrics'] },
    { area: 'strategic_thinking', subs: ['market_awareness', 'trend_identification', 'opportunity_recognition', 'problem_anticipation', 'longterm_planning', 'change_leadership', 'stakeholder_management', 'project_management', 'innovation_adoption', 'continuous_improvement'] }
  ];

  // TEMPORARY BYPASS: Set demo data to allow UI testing and text visibility fixes
  useEffect(() => {
    console.log('Setting up demo environment for UI fixes...');
    
    // Set demo user data
    setUser({
      id: "demo-user-123",
      email: "demo@earnwings.com", 
      name: "Demo Navigator",
      role: "participant",
      level: "navigator",
      is_admin: false,
      created_at: new Date().toISOString()
    });
    
    // Set demo competencies with PROPER structure matching what UI expects
    setCompetencies({
      leadership_supervision: {
        name: "Leadership & Supervision",
        description: "Lead teams effectively and supervise staff performance",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 3,
        competency_area: "leadership_supervision",
        sub_competencies: {
          team_motivation: {
            name: "Team Motivation",
            description: "Motivate and inspire team members",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          },
          delegation: {
            name: "Delegation",
            description: "Effectively delegate tasks and responsibilities",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          },
          performance_management: {
            name: "Performance Management", 
            description: "Manage team performance and provide feedback",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          }
        }
      },
      financial_management: {
        name: "Financial Management",
        description: "Manage budgets, analyze costs, and make financial decisions", 
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 3,
        competency_area: "financial_management",
        sub_competencies: {
          budget_creation: {
            name: "Budget Creation",
            description: "Create and manage operational budgets",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          },
          variance_analysis: {
            name: "Variance Analysis",
            description: "Analyze budget vs actual performance",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          },
          cost_control: {
            name: "Cost Control",
            description: "Monitor and control operational costs",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          }
        }
      },
      operational_management: {
        name: "Operational Management",
        description: "Optimize workflows and manage daily operations",
        overall_progress: 0,
        completion_percentage: 0, 
        completed_tasks: 0,
        total_tasks: 2,
        competency_area: "operational_management",
        sub_competencies: {
          workflow_optimization: {
            name: "Workflow Optimization",
            description: "Streamline processes and improve efficiency",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          },
          technology_utilization: {
            name: "Technology Utilization",
            description: "Leverage technology for operational improvements",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          }
        }
      },
      cross_functional_collaboration: {
        name: "Cross-Functional Collaboration",
        description: "Work effectively across departments and teams",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 1,
        competency_area: "cross_functional_collaboration", 
        sub_competencies: {
          stakeholder_management: {
            name: "Stakeholder Management",
            description: "Build relationships with key stakeholders",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          }
        }
      },
      strategic_thinking: {
        name: "Strategic Thinking",
        description: "Think strategically and plan for long-term success",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 1,
        competency_area: "strategic_thinking",
        sub_competencies: {
          strategic_planning: {
            name: "Strategic Planning", 
            description: "Develop and execute strategic plans",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 1
          }
        }
      }
    });
    
    // Set empty portfolio
    setPortfolio([]);
    
    // Clear loading state
    setLoading(false);
    console.log('Demo environment ready - can now fix text visibility issues');
  }, []);

  // Handle admin token changes  
  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      // Set demo admin data if we have a token
      if (!adminStats) {
        setAdminStats({
          total_users: 45,
          total_tasks: 10,
          total_completions: 2,
          completion_rate: 0.44,
          active_competency_areas: 5
        });
      }
    } else {
      setIsAdmin(false);
    }
  }, [adminToken]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${adminToken}` };
      
      // Load admin stats
      const statsResponse = await axios.get(`${API}/admin/stats`, { headers });
      setAdminStats(statsResponse.data);
      
      // Load all tasks
      const tasksResponse = await axios.get(`${API}/admin/tasks`, { headers });
      setAllTasks(tasksResponse.data);
      
      // Load all users
      const usersResponse = await axios.get(`${API}/admin/users`, { headers });
      setAllUsers(usersResponse.data);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        setAdminToken(null);
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeUser = async () => {
    console.log('initializeUser starting...');
    try {
      setLoading(true);
      console.log('Loading set to true');
      
      // Configure axios with timeout for this request
      const axiosConfig = {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Try to get existing user from localStorage first
      let storedUserId = getStoredUserId();
      console.log('Stored user ID:', storedUserId);
      let userData;
      
      if (storedUserId) {
        try {
          console.log('Trying to get existing user...');
          const response = await axios.get(`${API}/users/${storedUserId}`, axiosConfig);
          userData = response.data;
          console.log('Found existing user:', userData);
        } catch (error) {
          console.log('Stored user not found, creating new one. Error:', error.message);
          // Stored user doesn't exist anymore, clear localStorage
          localStorage.removeItem('demo_user_id');
          storedUserId = null;
        }
      }
      
      // If no stored user or stored user doesn't exist, create new one
      if (!userData) {
        console.log('Creating new user...');
        const userPayload = {
          email: "demo@earnwings.com",
          name: "Demo Navigator",
          role: "participant",
          level: "navigator"
        };
        console.log('User payload:', userPayload);
        
        const createResponse = await axios.post(`${API}/users`, userPayload, axiosConfig);
        userData = createResponse.data;
        console.log('Created new user:', userData);
        setStoredUserId(userData.id);
        
        // Seed sample tasks for demo
        try {
          await axios.post(`${API}/admin/seed-tasks`, {}, axiosConfig);
          console.log('Sample tasks seeded');
        } catch (e) {
          console.log('Tasks already seeded or error:', e.message);
        }
      }
      
      console.log('Setting user data and loading user data...');
      setUser(userData);
      await loadUserData(userData.id);
      console.log('User initialization completed successfully');
    } catch (error) {
      console.error('Error initializing user:', error);
      console.error('Full error:', error);
      // Set loading to false even on error
      setLoading(false);
    } finally {
      console.log('Setting loading to false...');
      setLoading(false);
      console.log('Loading set to false - initialization complete');
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
      if (!user?.id) return;
      const response = await axios.get(`${API}/users/${user.id}/tasks/${competencyArea}/${subCompetency}`);
      setCompetencyTasks(response.data);
      setSelectedCompetency({ area: competencyArea, sub: subCompetency });
    } catch (error) {
      console.error('Error loading tasks:', error);
      setCompetencyTasks([]);
    }
  };

  const completeTask = async (taskId, evidenceDescription = "", file = null) => {
    try {
      if (!user?.id) return;
      const formData = new FormData();
      formData.append('task_id', taskId);
      formData.append('evidence_description', evidenceDescription);
      formData.append('notes', '');
      
      if (file) {
        formData.append('file', file);
      }
      
      await axios.post(`${API}/users/${user.id}/task-completions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reload data
      await loadUserData(user.id);
      if (selectedCompetency) {
        await loadCompetencyTasks(selectedCompetency.area, selectedCompetency.sub);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Error completing task: ' + error.response?.data?.detail || error.message);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      // DEMO ADMIN LOGIN - bypass API call for now
      if (email === "admin@earnwings.com" && password === "admin123") {
        console.log('Demo admin login successful');
        
        // Set demo admin token
        const demoToken = "demo-admin-token-12345";
        localStorage.setItem('admin_token', demoToken);
        setAdminToken(demoToken);
        setIsAdmin(true);
        setShowAdminLogin(false);
        setCurrentView('admin-dashboard');
        
        // Set demo admin data
        setAdminStats({
          total_users: 45,
          total_tasks: 10,
          total_completions: 2,
          completion_rate: 0.44,
          active_competency_areas: 5
        });
        
        // Set demo tasks for admin management
        setAllTasks([
          {
            id: "task-1",
            title: "Team Leadership Workshop",
            description: "Complete leadership training focused on team motivation",
            task_type: "course_link",
            competency_area: "leadership_supervision",
            sub_competency: "team_motivation",
            order: 1,
            required: true,
            estimated_hours: 2.0,
            external_link: "https://example.com/leadership",
            instructions: "Complete the online workshop and submit reflection",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-2", 
            title: "Budget Analysis Project",
            description: "Analyze quarterly budget variance and create improvement plan",
            task_type: "project",
            competency_area: "financial_management",
            sub_competency: "budget_creation",
            order: 1,
            required: true,
            estimated_hours: 4.0,
            instructions: "Use provided template to analyze Q3 budget data",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-3",
            title: "Delegation Skills Assessment", 
            description: "Self-assessment on delegation effectiveness",
            task_type: "assessment",
            competency_area: "leadership_supervision",
            sub_competency: "delegation",
            order: 2,
            required: false,
            estimated_hours: 1.0,
            instructions: "Complete self-evaluation form",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-4",
            title: "Process Optimization Review",
            description: "Review and optimize key operational workflows", 
            task_type: "document_upload",
            competency_area: "operational_management",
            sub_competency: "workflow_optimization",
            order: 1,
            required: true,
            estimated_hours: 3.0,
            instructions: "Document current processes and suggest improvements",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-5",
            title: "Stakeholder Communication Plan",
            description: "Develop communication strategy for key stakeholders",
            task_type: "project",
            competency_area: "cross_functional_collaboration", 
            sub_competency: "stakeholder_management",
            order: 1,
            required: true,
            estimated_hours: 2.5,
            instructions: "Create comprehensive stakeholder engagement plan",
            active: true,
            created_by: "admin-123"
          }
        ]);
        
        // Set demo users for admin management
        setAllUsers([
          {
            id: "user-1",
            email: "john.doe@earnwings.com",
            name: "John Doe",
            role: "participant", 
            level: "navigator",
            completed_tasks: 2,
            overall_progress: 20,
            created_at: "2024-01-15T00:00:00Z"
          },
          {
            id: "user-2",
            email: "jane.smith@earnwings.com", 
            name: "Jane Smith",
            role: "participant",
            level: "navigator",
            completed_tasks: 1,
            overall_progress: 10,
            created_at: "2024-01-20T00:00:00Z"
          },
          {
            id: "user-3",
            email: "mike.johnson@earnwings.com",
            name: "Mike Johnson", 
            role: "mentor",
            level: "navigator",
            completed_tasks: 5,
            overall_progress: 50,
            created_at: "2024-01-10T00:00:00Z"
          },
          {
            id: "user-4",
            email: "demo@earnwings.com",
            name: "Demo Navigator",
            role: "participant",
            level: "navigator", 
            completed_tasks: 0,
            overall_progress: 0,
            created_at: "2024-01-25T00:00:00Z"
          }
        ]);
        
        return true;
      } else {
        console.error('Invalid admin credentials');
        return false;
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      return false;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
    setIsAdmin(false);
    setShowAdminLogin(false);
    setCurrentView('dashboard');
    initializeUser();
  };

  const createTask = async (taskData) => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      await axios.post(`${API}/admin/tasks`, taskData, { headers });
      await loadAdminData(); // Reload admin data
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      await axios.put(`${API}/admin/tasks/${taskId}`, taskData, { headers });
      await loadAdminData(); // Reload admin data
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      await axios.delete(`${API}/admin/tasks/${taskId}`, { headers });
      await loadAdminData(); // Reload admin data
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
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
      
      if (!user?.id) return;
      await axios.post(`${API}/users/${user.id}/portfolio`, formData, {
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
      await loadUserData(user.id);
      setCurrentView('portfolio');
    } catch (error) {
      console.error('Error adding portfolio item:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = editingTask 
      ? await updateTask(editingTask.id, newTask)
      : await createTask(newTask);
    
    if (success) {
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        task_type: 'course_link',
        competency_area: 'leadership_supervision',
        sub_competency: 'team_motivation',
        order: 1,
        required: true,
        estimated_hours: 1.0,
        external_link: '',
        instructions: ''
      });
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
      {/* REDSTONE HEADER */}
      <header className="redstone-glass-card p-6 mb-8 fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 via-red-500 to-blue-800 rounded-2xl flex items-center justify-center text-white font-black text-xl mr-6 shadow-lg" style={{background: 'linear-gradient(135deg, #ff3443 0%, #0127a2 100%)'}}>
                <span className="tracking-wider">EYW</span>
              </div>
              <div>
                <h1 className="redstone-heading text-3xl font-black">Earn Your Wings</h1>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-800">
                    {isAdmin ? 'System Administrator' : 'Navigator Program'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="font-bold text-lg text-gray-800">
                  {isAdmin ? 'Admin Control' : user?.name}
                </p>
                <div className="flex items-center justify-end mt-1">
                  <div className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#ff3443'}}></div>
                  <p className="text-sm font-medium text-gray-800">
                    {isAdmin ? 'Full Access' : `${getOverallProgress()}% Complete`}
                  </p>
                </div>
              </div>
              <div className="redstone-avatar w-12 h-12 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {isAdmin ? 'AD' : user?.name?.split(' ').map(n => n[0]).join('') || 'DN'}
                </span>
              </div>
              
              {/* REDSTONE ADMIN BUTTON */}
              {isAdmin ? (
                <button
                  onClick={adminLogout}
                  className="redstone-btn-primary flex items-center space-x-3"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="redstone-btn-primary flex items-center space-x-3"
                >
                  <span>👑</span>
                  <span>Admin</span>
                </button>
              )}
            </div>
          </div>
          
          {/* REDSTONE NAVIGATION */}
          <nav className="flex space-x-3 flex-wrap">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'competencies', label: 'Competencies', icon: '🎯' },
              { key: 'portfolio', label: 'Portfolio', icon: '📁' },
              { key: 'add-portfolio', label: '', icon: '➕' }
            ].filter(tab => !isAdmin || ['dashboard'].includes(tab.key)).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key)}
                className={`redstone-nav-tab ${currentView === tab.key ? 'active' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="redstone-icon">
                    {tab.icon}
                  </div>
                  <span className="font-semibold text-sm">
                    {tab.label}
                  </span>
                </div>
              </button>
            ))}
            
            {/* ADMIN NAVIGATION */}
            {isAdmin && [
              { key: 'admin-dashboard', label: 'Dashboard', icon: '🎛️' },
              { key: 'admin-tasks', label: 'Tasks', icon: '⚙️' },
              { key: 'admin-users', label: 'Users', icon: '👥' },
              { key: 'admin-analytics', label: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key)}
                className={`redstone-nav-tab ${currentView === tab.key ? 'active' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="redstone-icon">
                    {tab.icon}
                  </div>
                  <span className="font-semibold text-sm">
                    {tab.label}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Views */}
        {currentView === 'admin-dashboard' && isAdmin && (
          <AdminDashboardView 
            stats={adminStats} 
            onNavigate={setCurrentView}
          />
        )}
        
        {currentView === 'admin-tasks' && isAdmin && (
          <AdminTasksView 
            tasks={allTasks}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            showCreateTask={showCreateTask}
            setShowCreateTask={setShowCreateTask}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
            newTask={newTask}
            setNewTask={setNewTask}
          />
        )}
        
        {currentView === 'admin-users' && isAdmin && (
          <AdminUsersView users={allUsers} />
        )}
        
        {currentView === 'admin-analytics' && isAdmin && (
          <AdminAnalyticsView 
            stats={adminStats} 
            tasks={allTasks} 
            users={allUsers} 
          />
        )}

        {/* User Views */}
        {currentView === 'dashboard' && !isAdmin && (
          <DashboardView 
            user={user}
            competencies={competencies}
            portfolio={portfolio}
            overallProgress={getOverallProgress()}
            onViewCompetencyTasks={loadCompetencyTasks}
          />
        )}
        
        {currentView === 'competencies' && !isAdmin && (
          <CompetenciesView 
            competencies={competencies}
            onViewTasks={loadCompetencyTasks}
            selectedCompetency={selectedCompetency}
            competencyTasks={competencyTasks}
            onCompleteTask={completeTask}
          />
        )}
        
        {currentView === 'portfolio' && !isAdmin && (
          <PortfolioView portfolio={portfolio} setCurrentView={setCurrentView} />
        )}
        
        {currentView === 'add-portfolio' && !isAdmin && (
          <AddPortfolioView 
            portfolioItem={newPortfolioItem}
            setPortfolioItem={setNewPortfolioItem}
            onSubmit={handlePortfolioSubmit}
            competencies={competencies}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLoginModal
          onLogin={adminLogin}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay fixed inset-0 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-full max-w-4xl">
            <div className="modal-content bounce-in">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                      📝
                    </div>
                    <div>
                      <h3 className="gradient-text text-2xl font-bold">Edit Task</h3>
                      <p className="text-gray-600">{editingTask.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 text-xl transition-all duration-200 hover:scale-110"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="gradient-text">Task Title *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="form-input w-full"
                        placeholder="Enter task title..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="gradient-text">Task Type *</span>
                      </label>
                      <select
                        value={newTask.task_type}
                        onChange={(e) => setNewTask({...newTask, task_type: e.target.value})}
                        className="form-input w-full"
                      >
                        <option value="course_link">📚 Course Link</option>
                        <option value="document_upload">📄 Document Upload</option>
                        <option value="assessment">📝 Assessment</option>
                        <option value="shadowing">👥 Shadowing</option>
                        <option value="meeting">🤝 Meeting</option>
                        <option value="project">🎯 Project</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <span className="gradient-text">Description *</span>
                    </label>
                    <textarea
                      required
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="form-input w-full resize-none"
                      placeholder="Describe what this task involves..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="gradient-text">Competency Area *</span>
                      </label>
                      <select
                        value={newTask.competency_area}
                        onChange={(e) => {
                          setNewTask({...newTask, competency_area: e.target.value, sub_competency: competencyOptions.find(c => c.area === e.target.value)?.subs[0] || ''});
                        }}
                        className="form-input w-full"
                      >
                        {competencyOptions.map(option => (
                          <option key={option.area} value={option.area}>
                            {option.area.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="gradient-text">Sub-Competency *</span>
                      </label>
                      <select
                        value={newTask.sub_competency}
                        onChange={(e) => setNewTask({...newTask, sub_competency: e.target.value})}
                        className="form-input w-full"
                      >
                        {competencyOptions.find(c => c.area === newTask.competency_area)?.subs.map(sub => (
                          <option key={sub} value={sub}>
                            {sub.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="gradient-text">Order</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newTask.order}
                        onChange={(e) => setNewTask({...newTask, order: parseInt(e.target.value)})}
                        className="form-input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="gradient-text">Estimated Hours</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newTask.estimated_hours}
                        onChange={(e) => setNewTask({...newTask, estimated_hours: parseFloat(e.target.value)})}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <span className="gradient-text">External Link</span>
                    </label>
                    <input
                      type="url"
                      value={newTask.external_link}
                      onChange={(e) => setNewTask({...newTask, external_link: e.target.value})}
                      className="form-input w-full"
                      placeholder="https://your-lms.com/course"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <span className="gradient-text">Instructions</span>
                    </label>
                    <textarea
                      rows="4"
                      value={newTask.instructions}
                      onChange={(e) => setNewTask({...newTask, instructions: e.target.value})}
                      className="form-input w-full resize-none"
                      placeholder="Detailed instructions for completing this task..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="required-edit"
                      checked={newTask.required}
                      onChange={(e) => setNewTask({...newTask, required: e.target.checked})}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                    />
                    <label htmlFor="required-edit" className="text-gray-700 font-medium">
                      Required Task
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="btn-secondary px-6 py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-6 py-3 flex items-center"
                    >
                      <span className="mr-2">💾</span>
                      Update Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Redstone Admin Login Modal Component
const AdminLoginModal = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await onLogin(email, password);
    if (!success) {
      setError('Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="redstone-modal-overlay fixed inset-0 flex items-center justify-center z-50">
      <div className="redstone-modal-content max-w-md w-full mx-4 bounce-in">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="redstone-icon-xl mr-4">
                👑
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{color: '#0127a2'}}>Admin Access</h2>
                <p className="text-gray-600 text-sm">Secure administrator login</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 text-xl transition-all duration-200 hover:scale-110"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold mb-3" style={{color: '#0127a2'}}>
                Administrator Email
              </label>
              <input
                type="email"
                id="admin-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="redstone-form-input w-full"
                placeholder="admin@earnwings.com"
              />
            </div>
            
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold mb-3" style={{color: '#0127a2'}}>
                Security Password
              </label>
              <input
                type="password"
                id="admin-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="redstone-form-input w-full"
                placeholder="Enter secure password"
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg font-medium">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="redstone-btn-primary w-full py-3 flex items-center justify-center space-x-3"
            >
              <span>🔐</span>
              <span>{loading ? 'Authenticating...' : 'Access System'}</span>
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold" style={{color: '#0127a2'}}>Demo Access Credentials:</p>
            <p className="text-sm text-gray-600">Email: admin@earnwings.com</p>
            <p className="text-sm text-gray-600">Password: admin123</p>
          </div>
        </div>
      </div>
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
      {/* Hero Section */}
      <div className="text-center mb-8 fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{color: '#0127a2'}}>
          Welcome back, {user?.name}! 🚀
        </h1>
        <p className="text-lg md:text-xl font-medium" style={{color: '#333333'}}>
          Track your progress through task completion and portfolio building
        </p>
      </div>

      {/* REDSTONE STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="redstone-stat-card text-center bounce-in">
          <div className="flex justify-center mb-4">
            <div className="redstone-icon-xl">
              📊
            </div>
          </div>
          <div className="stat-number text-4xl font-bold mb-2">{overallProgress}%</div>
          <div className="stat-label text-lg font-semibold mb-3">Overall Progress</div>
          <div className="redstone-progress-bar mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="redstone-progress-bar h-full rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="stat-detail mt-3 text-sm">
            Your learning journey
          </div>
        </div>
        
        <div className="redstone-stat-card text-center bounce-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-center mb-4">
            <div className="redstone-icon-xl">
              ✅
            </div>
          </div>
          <div className="stat-number text-4xl font-bold mb-2">{getCompletedTasks()}/{getTotalTasks()}</div>
          <div className="stat-label text-lg font-semibold mb-3">Tasks Completed</div>
          <div className="stat-detail mt-3 text-sm" style={{color: '#333333'}}>
            {getTotalTasks() - getCompletedTasks()} remaining
          </div>
        </div>
        
        <div className="redstone-stat-card text-center bounce-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-center mb-4">
            <div className="redstone-icon-xl">
              📚
            </div>
          </div>
          <div className="stat-number text-4xl font-bold mb-2">{portfolio.length}</div>
          <div className="stat-label text-lg font-semibold mb-3">Portfolio Items</div>
          <div className="stat-detail mt-3 text-sm" style={{color: '#333333'}}>
            Evidence collection
          </div>
        </div>
        
        <div className="redstone-stat-card text-center bounce-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-center mb-4">
            <div className="redstone-icon-xl">
              🏆
            </div>
          </div>
          <div className="stat-number text-4xl font-bold mb-2">Navigator</div>
          <div className="stat-label text-lg font-semibold mb-3">Current Level</div>
          <div className="stat-detail mt-3 text-sm" style={{color: '#333333'}}>
            Property Management
          </div>
        </div>
      </div>

      {/* FIXED COMPETENCY SECTION */}
      <div className="content-card fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="p-8">
          <div className="flex items-center mb-8">
            <div className="redstone-icon-xl mr-4">
              🎯
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">Top Competency Areas</h3>
              <p className="mt-1" style={{color: '#333333'}}>Track your professional development progress</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {getTopCompetencies().map(([key, area]) => (
              <div key={key} className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3"></div>
                      <h4 className="text-xl font-bold text-gray-800">{area.name}</h4>
                    </div>
                    <p className="text-gray-600 text-base">{area.description}</p>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-3xl font-bold" style={{color: '#0127a2'}}>{Math.round(area.overall_progress || 0)}%</div>
                    <div className="text-sm font-medium" style={{color: '#333333'}}>Complete</div>
                  </div>
                </div>
                
                {/* Progress Visualization */}
                <div className="relative mb-6">
                  <div className="redstone-progress-bar h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="redstone-progress-bar h-full rounded-full transition-all duration-1000"
                      style={{ width: `${area.overall_progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(area.sub_competencies).slice(0, 4).map(([subKey, subData]) => (
                    <div
                      key={subKey}
                      onClick={() => onViewCompetencyTasks(key, subKey)}
                      className="redstone-sub-competency"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 rounded-full mr-2" style={{background: 'linear-gradient(135deg, #10b981 0%, #0127a2 100%)'}}></div>
                            <div className="font-semibold text-gray-800">
                              {typeof subData === 'string' ? subData : (subData?.name || subKey)}
                            </div>
                          </div>
                          <div className="text-sm ml-5" style={{color: '#333333'}}>
                            {(subData?.completed_tasks || 0)}/{(subData?.total_tasks || 0)} tasks • {Math.round(subData?.progress_percentage || 0)}% complete
                          </div>
                        </div>
                        <div className="ml-4 text-lg font-bold" style={{color: '#0127a2'}}>
                          {Math.round(subData?.progress_percentage || 0)}%
                        </div>
                      </div>
                    </div>
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
                        <h4 className="font-medium text-gray-900">
                          {typeof subData === 'object' && subData?.name ? subData.name : 'Unknown Competency'}
                        </h4>
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
                                style={{ width: `${(subData?.completion_percentage || 0)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12">
                              {Math.round(subData?.completion_percentage || 0)}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{(subData?.completed_tasks || 0)}/{(subData?.total_tasks || 0)} tasks</span>
                            <span>{(subData?.evidence_items?.length || 0)} evidence items</span>
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

  const competencyData = competencies[competencyArea]?.sub_competencies[subCompetency];
  const competencyName = typeof competencyData === 'object' && competencyData?.name 
    ? competencyData.name 
    : (subCompetency || 'Unknown Competency');

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
const PortfolioView = ({ portfolio, setCurrentView }) => {
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">➕ Add to My Portfolio</h2>
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

// Redstone Admin Dashboard Component
const AdminDashboardView = ({ stats, onNavigate }) => {
  if (!stats) return (
    <div className="flex justify-center items-center min-h-64">
      <div className="loading-shimmer w-32 h-8 rounded-lg"></div>
    </div>
  );

  return (
    <div className="space-y-8 fade-in">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{color: '#0127a2'}}>🎛️ Admin Dashboard</h2>
        <p className="text-white text-lg md:text-xl font-medium opacity-90">Manage your Earn Your Wings platform</p>
      </div>

      {/* Redstone Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="redstone-admin-card text-center bounce-in">
          <div className="text-4xl font-bold mb-2" style={{color: '#0127a2'}}>{stats.total_users}</div>
          <div className="text-gray-800 font-medium">Total Users</div>
          <div className="mt-3 text-sm text-gray-600">
            👥 Platform community
          </div>
        </div>
        
        <div className="redstone-admin-card text-center bounce-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-4xl font-bold mb-2" style={{color: '#ff3443'}}>{stats.total_tasks}</div>
          <div className="text-gray-800 font-medium">Active Tasks</div>
          <div className="mt-3 text-sm text-gray-600">
            ⚙️ Learning activities
          </div>
        </div>
        
        <div className="redstone-admin-card text-center bounce-in" style={{ animationDelay: '0.2s' }}>
          <div className="text-4xl font-bold mb-2" style={{color: '#0127a2'}}>{stats.total_completions}</div>
          <div className="text-gray-800 font-medium">Task Completions</div>
          <div className="mt-3 text-sm text-gray-600">
            🎯 Progress achievements
          </div>
        </div>
        
        <div className="redstone-admin-card text-center bounce-in" style={{ animationDelay: '0.3s' }}>
          <div className="text-4xl font-bold mb-2" style={{color: '#ff3443'}}>{stats.completion_rate}%</div>
          <div className="text-gray-800 font-medium">Completion Rate</div>
          <div className="redstone-progress-bar mt-3 h-2 bg-gray-200 rounded-full">
            <div 
              className="redstone-progress-bar h-full rounded-full"
              style={{ width: `${stats.completion_rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Redstone Quick Actions */}
      <div className="redstone-glass-card fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="redstone-icon-xl mr-4">
              ⚡
            </div>
            <h3 className="text-2xl font-bold" style={{color: '#0127a2'}}>Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => onNavigate('admin-tasks')}
              className="redstone-quick-action group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform" style={{background: 'linear-gradient(135deg, #0127a2 0%, #ff3443 100%)', color: 'white'}}>
                ⚙️
              </div>
              <div className="font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">Manage Tasks</div>
              <div className="text-sm text-gray-500">Create and edit learning tasks</div>
            </button>
            
            <button
              onClick={() => onNavigate('admin-users')}
              className="redstone-quick-action group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform" style={{background: 'linear-gradient(135deg, #ff3443 0%, #0127a2 100%)', color: 'white'}}>
                👥
              </div>
              <div className="font-bold text-gray-800 mb-2 group-hover:text-red-700 transition-colors">View Users</div>
              <div className="text-sm text-gray-500">Monitor user progress</div>
            </button>
            
            <button
              onClick={() => onNavigate('admin-analytics')}
              className="redstone-quick-action group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform" style={{background: 'linear-gradient(135deg, #0127a2 0%, #ff3443 100%)', color: 'white'}}>
                📊
              </div>
              <div className="font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">View Analytics</div>
              <div className="text-sm text-gray-500">Platform performance metrics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Tasks Management Component
const AdminTasksView = ({ tasks, onCreateTask, onUpdateTask, onDeleteTask, showCreateTask, setShowCreateTask, editingTask, setEditingTask, newTask, setNewTask }) => {
  const COMPETENCY_OPTIONS = [
    { area: 'leadership_supervision', subs: ['team_motivation', 'delegation', 'performance_management', 'coaching_development', 'team_building', 'conflict_resolution', 'difficult_conversations', 'cross_dept_communication', 'resident_resolution', 'crisis_leadership'] },
    { area: 'financial_management', subs: ['budget_creation', 'variance_analysis', 'cost_control', 'roi_decisions', 'revenue_impact', 'pl_understanding', 'kpi_tracking', 'financial_forecasting', 'capex_planning', 'vendor_cost_mgmt'] },
    { area: 'operational_management', subs: ['workflow_optimization', 'technology_utilization', 'quality_control', 'sop_management', 'innovation', 'safety_management', 'policy_enforcement', 'legal_compliance', 'emergency_preparedness', 'documentation'] },
    { area: 'cross_functional', subs: ['interdept_understanding', 'resident_journey', 'revenue_awareness', 'collaborative_problem_solving', 'joint_planning', 'resource_sharing', 'communication_protocols', 'dept_conflict_resolution', 'success_metrics'] },
    { area: 'strategic_thinking', subs: ['market_awareness', 'trend_identification', 'opportunity_recognition', 'problem_anticipation', 'longterm_planning', 'change_leadership', 'stakeholder_management', 'project_management', 'innovation_adoption', 'continuous_improvement'] }
  ];

  const handleEdit = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      competency_area: task.competency_area,
      sub_competency: task.sub_competency,
      order: task.order,
      required: task.required,
      estimated_hours: task.estimated_hours,
      external_link: task.external_link || '',
      instructions: task.instructions || ''
    });
    // Don't set showCreateTask, we'll use a separate modal for editing
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await onDeleteTask(taskId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">⚙️ Manage Tasks</h2>
          <p className="text-lg text-gray-600">Create and manage learning tasks</p>
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Task</span>
        </button>
      </div>

      {/* Create/Edit Task Form */}
      {showCreateTask && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                <select
                  value={newTask.task_type}
                  onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="course_link">📚 Course Link</option>
                  <option value="document_upload">📄 Document Upload</option>
                  <option value="assessment">📝 Assessment</option>
                  <option value="shadowing">👥 Shadowing</option>
                  <option value="meeting">🤝 Meeting</option>
                  <option value="project">🎯 Project</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                required
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Task description"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Competency Area</label>
                <select
                  value={newTask.competency_area}
                  onChange={(e) => setNewTask({ ...newTask, competency_area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {COMPETENCY_OPTIONS.map(comp => (
                    <option key={comp.area} value={comp.area}>{comp.area}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Competency</label>
                <select
                  value={newTask.sub_competency}
                  onChange={(e) => setNewTask({ ...newTask, sub_competency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {COMPETENCY_OPTIONS.find(c => c.area === newTask.competency_area)?.subs.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({ ...newTask, estimated_hours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">External Link (optional)</label>
              <input
                type="url"
                value={newTask.external_link}
                onChange={(e) => setNewTask({ ...newTask, external_link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://your-lms.com/course"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (optional)</label>
              <textarea
                rows={3}
                value={newTask.instructions}
                onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Detailed instructions for completing this task"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={newTask.required}
                onChange={(e) => setNewTask({ ...newTask, required: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="required" className="text-sm text-gray-700">Required Task</label>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateTask(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Tasks ({tasks.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.map(task => (
            <div key={task.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">
                      {task.task_type === 'course_link' && '📚'}
                      {task.task_type === 'document_upload' && '📄'}
                      {task.task_type === 'assessment' && '📝'}
                      {task.task_type === 'shadowing' && '👥'}
                      {task.task_type === 'meeting' && '🤝'}
                      {task.task_type === 'project' && '🎯'}
                    </span>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Type: {task.task_type}</span>
                    <span>Area: {task.competency_area}</span>
                    <span>Sub: {task.sub_competency}</span>
                    {task.estimated_hours && <span>Hours: {task.estimated_hours}</span>}
                    <span className={task.required ? 'text-red-600' : 'text-gray-500'}>
                      {task.required ? 'Required' : 'Optional'}
                    </span>
                    <span className={task.active ? 'text-green-600' : 'text-red-600'}>
                      {task.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded border border-red-300 hover:border-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Admin Users View Component
const AdminUsersView = ({ users }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">👥 User Management</h2>
        <p className="text-lg text-gray-600">Monitor user progress and engagement</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${user.overall_progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{user.overall_progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.completed_tasks || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Admin Analytics Component
const AdminAnalyticsView = ({ stats, tasks, users }) => {
  const getTasksByType = () => {
    const types = {};
    tasks.forEach(task => {
      types[task.task_type] = (types[task.task_type] || 0) + 1;
    });
    return types;
  };

  const getTasksByCompetency = () => {
    const competencies = {};
    tasks.forEach(task => {
      competencies[task.competency_area] = (competencies[task.competency_area] || 0) + 1;
    });
    return competencies;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">📈 Platform Analytics</h2>
        <p className="text-lg text-gray-600">Insights and performance metrics</p>
      </div>

      {/* Task Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Type</h3>
          <div className="space-y-3">
            {Object.entries(getTasksByType()).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {type === 'course_link' && '📚'}
                    {type === 'document_upload' && '📄'}
                    {type === 'assessment' && '📝'}
                    {type === 'shadowing' && '👥'}
                    {type === 'meeting' && '🤝'}
                    {type === 'project' && '🎯'}
                  </span>
                  <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Competency</h3>
          <div className="space-y-3">
            {Object.entries(getTasksByCompetency()).map(([competency, count]) => (
              <div key={competency} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{competency.replace('_', ' ')}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Progress Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Progress Distribution</h3>
        <div className="space-y-4">
          {users.slice(0, 10).map(user => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${user.overall_progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {user.completed_tasks || 0} tasks • {user.overall_progress || 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.total_users || 0}</div>
            <div className="text-sm text-gray-500">Active Learners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats?.total_tasks || 0}</div>
            <div className="text-sm text-gray-500">Learning Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats?.total_completions || 0}</div>
            <div className="text-sm text-gray-500">Total Completions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats?.completion_rate || 0}%</div>
            <div className="text-sm text-gray-500">Platform Engagement</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;