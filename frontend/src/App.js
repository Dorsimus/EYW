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

  // BYPASS DEMO ENVIRONMENT: Set admin on page load if token exists
  useEffect(() => {
    console.log('Setting up demo environment...');
    
    // Check if we have admin token
    const existingToken = localStorage.getItem('admin_token');
    if (existingToken) {
      console.log('Found existing admin token, setting admin state...');
      setIsAdmin(true);
      setCurrentView('admin-dashboard');
      
      // Set all admin demo data including COMPREHENSIVE TASK LIBRARY
      setAdminStats({
        total_users: 45,
        total_tasks: 26, // Updated for comprehensive library  
        total_completions: 18,
        completion_rate: 2.4,
        active_competency_areas: 5
      });
      
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
      
      setLoading(false);
      console.log('Admin demo environment ready with 5 tasks and 4 users');
    } else {
      // Regular user demo data
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
    }
  }, []);

  // Handle admin token changes - FIXED: Stable admin state management  
  useEffect(() => {
    if (adminToken && !isAdmin) {
      // Only set admin state if we're not already admin
      console.log('Setting admin state from token...');
      setIsAdmin(true);
      setCurrentView('admin-dashboard');
      
      // Set demo admin data only once
      setAdminStats({
        total_users: 45,
        total_tasks: 10,
        total_completions: 2,
        completion_rate: 0.44,
        active_competency_areas: 5
      });
    } else if (!adminToken && isAdmin) {
      // Only clear admin state if we were admin
      console.log('Clearing admin state...');
      setIsAdmin(false);
      setCurrentView('dashboard');
    }
  }, [adminToken]); // Remove isAdmin from dependencies to prevent loops

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
      // DEMO ADMIN LOGIN - Enhanced persistence
      if (email === "admin@earnwings.com" && password === "admin123") {
        console.log('Demo admin login successful - setting persistent state');
        
        // Set demo admin token with timestamp
        const demoToken = `demo-admin-token-${Date.now()}`;
        localStorage.setItem('admin_token', demoToken);
        setAdminToken(demoToken);
        setIsAdmin(true);
        setShowAdminLogin(false);
        setCurrentView('admin-dashboard');
        
        // Force set admin data immediately to ensure persistence
        setAdminStats({
          total_users: 45,
          total_tasks: 10,
          total_completions: 2,
          completion_rate: 0.44,
          active_competency_areas: 5
        });
        
        // Load COMPREHENSIVE TASK LIBRARY - 25+ Professional Tasks
        console.log('Setting comprehensive task library...');
        setAllTasks([
          // LEADERSHIP & SUPERVISION TASKS (8 tasks)
          {
            id: "task-l01",
            title: "Team Leadership Workshop",
            description: "Complete comprehensive leadership training focused on team motivation and engagement",
            task_type: "course_link",
            competency_area: "leadership_supervision",
            sub_competency: "team_motivation",
            order: 1,
            required: true,
            estimated_hours: 2.5,
            external_link: "https://example.com/leadership",
            instructions: "Complete the online workshop and submit reflection essay",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l02",
            title: "Delegation Skills Assessment", 
            description: "Self-assessment and practice exercises on effective delegation techniques",
            task_type: "assessment",
            competency_area: "leadership_supervision",
            sub_competency: "delegation",
            order: 2,
            required: false,
            estimated_hours: 1.5,
            instructions: "Complete self-evaluation form and practice scenarios",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l03",
            title: "Performance Management Case Study",
            description: "Analyze real performance management scenarios and develop improvement plans",
            task_type: "project",
            competency_area: "leadership_supervision",
            sub_competency: "performance_management",
            order: 3,
            required: true,
            estimated_hours: 4.0,
            instructions: "Review provided case studies and create detailed performance improvement plans",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l04",
            title: "Conflict Resolution Training",
            description: "Interactive training on resolving workplace conflicts and difficult conversations",
            task_type: "course_link",
            competency_area: "leadership_supervision", 
            sub_competency: "conflict_resolution",
            order: 4,
            required: true,
            estimated_hours: 3.0,
            external_link: "https://example.com/conflict-resolution",
            instructions: "Complete training modules and role-playing exercises",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l05",
            title: "Team Building Activity Planning",
            description: "Design and implement team building activities for your department",
            task_type: "project",
            competency_area: "leadership_supervision",
            sub_competency: "team_building",
            order: 5,
            required: false,
            estimated_hours: 2.0,
            instructions: "Plan, execute, and document team building activities",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l06",
            title: "Coaching Skills Development",
            description: "Learn and practice professional coaching techniques for employee development",
            task_type: "course_link",
            competency_area: "leadership_supervision",
            sub_competency: "coaching_development",
            order: 6,
            required: true,
            estimated_hours: 3.5,
            external_link: "https://example.com/coaching",
            instructions: "Complete coaching certification and practice with team members",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l07",
            title: "Crisis Leadership Simulation",
            description: "Participate in simulated crisis scenarios to develop emergency leadership skills",
            task_type: "assessment",
            competency_area: "leadership_supervision",
            sub_competency: "crisis_leadership",
            order: 7,
            required: true,
            estimated_hours: 2.5,
            instructions: "Complete crisis simulation exercises and debrief sessions",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-l08",
            title: "Cross-Department Communication Plan",
            description: "Develop communication strategies for cross-departmental collaboration",
            task_type: "document_upload",
            competency_area: "leadership_supervision",
            sub_competency: "cross_dept_communication",
            order: 8,
            required: true,
            estimated_hours: 3.0,
            instructions: "Create comprehensive communication plan document",
            active: true,
            created_by: "admin-123"
          },

          // FINANCIAL MANAGEMENT TASKS (6 tasks)
          {
            id: "task-f01",
            title: "Budget Creation & Planning",
            description: "Create comprehensive annual budget for your department or property",
            task_type: "project",
            competency_area: "financial_management",
            sub_competency: "budget_creation",
            order: 1,
            required: true,
            estimated_hours: 5.0,
            instructions: "Use provided templates to create detailed budget with justifications",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-f02",
            title: "Variance Analysis Report",
            description: "Analyze quarterly budget variance and identify improvement opportunities",
            task_type: "document_upload",
            competency_area: "financial_management",
            sub_competency: "variance_analysis",
            order: 2,
            required: true,
            estimated_hours: 3.5,
            instructions: "Submit detailed variance analysis with recommendations",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-f03",
            title: "Cost Control Initiative",
            description: "Implement cost control measures and track their effectiveness",
            task_type: "project",
            competency_area: "financial_management",
            sub_competency: "cost_control",
            order: 3,
            required: true,
            estimated_hours: 4.0,
            instructions: "Design, implement, and measure cost reduction strategies",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-f04",
            title: "ROI Decision Analysis",
            description: "Evaluate major investment decisions using ROI and financial metrics",
            task_type: "assessment",
            competency_area: "financial_management",
            sub_competency: "roi_decisions",
            order: 4,
            required: true,
            estimated_hours: 2.5,
            instructions: "Complete ROI analysis exercises for various scenarios",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-f05",
            title: "P&L Understanding Workshop",
            description: "Deep dive into profit & loss statement analysis and interpretation",
            task_type: "course_link",
            competency_area: "financial_management",
            sub_competency: "pl_understanding",
            order: 5,
            required: true,
            estimated_hours: 2.0,
            external_link: "https://example.com/pl-analysis",
            instructions: "Complete P&L workshop and analysis exercises",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-f06",
            title: "Financial Forecasting Model",
            description: "Build predictive financial models for future planning",
            task_type: "project",
            competency_area: "financial_management",
            sub_competency: "financial_forecasting",
            order: 6,
            required: false,
            estimated_hours: 4.5,
            instructions: "Create Excel-based forecasting models with scenario analysis",
            active: true,
            created_by: "admin-123"
          },

          // OPERATIONAL MANAGEMENT TASKS (5 tasks)
          {
            id: "task-o01",
            title: "Workflow Optimization Project",
            description: "Analyze and optimize key operational workflows for efficiency",
            task_type: "project",
            competency_area: "operational_management",
            sub_competency: "workflow_optimization",
            order: 1,
            required: true,
            estimated_hours: 4.0,
            instructions: "Document current processes, identify bottlenecks, and implement improvements",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-o02",
            title: "Technology Implementation Plan",
            description: "Evaluate and plan technology solutions for operational improvements",
            task_type: "document_upload",
            competency_area: "operational_management",
            sub_competency: "technology_utilization",
            order: 2,
            required: true,
            estimated_hours: 3.0,
            instructions: "Submit technology assessment and implementation roadmap",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-o03",
            title: "Quality Control Standards Development",
            description: "Establish quality control procedures and monitoring systems",
            task_type: "project",
            competency_area: "operational_management",
            sub_competency: "quality_control",
            order: 3,
            required: true,
            estimated_hours: 3.5,
            instructions: "Create quality standards, checklists, and monitoring procedures",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-o04",
            title: "Safety Management Certification",
            description: "Complete safety management training and certification program",
            task_type: "course_link",
            competency_area: "operational_management",
            sub_competency: "safety_management",
            order: 4,
            required: true,
            estimated_hours: 4.0,
            external_link: "https://example.com/safety-cert",
            instructions: "Complete safety certification and implement safety protocols",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-o05",
            title: "Emergency Preparedness Plan",
            description: "Develop comprehensive emergency response procedures and training",
            task_type: "document_upload",
            competency_area: "operational_management",
            sub_competency: "emergency_preparedness",
            order: 5,
            required: true,
            estimated_hours: 3.0,
            instructions: "Create detailed emergency response plan with training materials",
            active: true,
            created_by: "admin-123"
          },

          // CROSS-FUNCTIONAL COLLABORATION TASKS (3 tasks)
          {
            id: "task-c01",
            title: "Stakeholder Engagement Strategy",
            description: "Develop comprehensive strategy for engaging key stakeholders",
            task_type: "project",
            competency_area: "cross_functional_collaboration",
            sub_competency: "stakeholder_management",
            order: 1,
            required: true,
            estimated_hours: 3.5,
            instructions: "Create stakeholder map, engagement plan, and communication strategy",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-c02",
            title: "Interdepartmental Project Management",
            description: "Lead cross-functional project involving multiple departments",
            task_type: "project",
            competency_area: "cross_functional_collaboration",
            sub_competency: "joint_planning",
            order: 2,
            required: true,
            estimated_hours: 5.0,
            instructions: "Plan and execute project with stakeholders from at least 3 departments",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-c03",
            title: "Collaborative Problem Solving Workshop",
            description: "Facilitate cross-departmental problem solving sessions",
            task_type: "meeting",
            competency_area: "cross_functional_collaboration", 
            sub_competency: "collaborative_problem_solving",
            order: 3,
            required: false,
            estimated_hours: 2.0,
            instructions: "Organize and facilitate collaborative problem solving sessions",
            active: true,
            created_by: "admin-123"
          },

          // STRATEGIC THINKING TASKS (4 tasks)
          {
            id: "task-s01",
            title: "Market Analysis & Trends",
            description: "Conduct comprehensive market analysis and identify emerging trends",
            task_type: "document_upload",
            competency_area: "strategic_thinking",
            sub_competency: "market_awareness",
            order: 1,
            required: true,
            estimated_hours: 4.0,
            instructions: "Submit detailed market analysis report with trend predictions",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-s02",
            title: "Strategic Planning Workshop",
            description: "Participate in strategic planning process for long-term goals",
            task_type: "meeting",
            competency_area: "strategic_thinking",
            sub_competency: "longterm_planning",
            order: 2,
            required: true,
            estimated_hours: 6.0,
            instructions: "Attend strategic planning sessions and contribute to 5-year plan",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-s03",
            title: "Innovation Initiative",
            description: "Lead innovation project to improve operations or resident experience", 
            task_type: "project",
            competency_area: "strategic_thinking",
            sub_competency: "innovation_adoption",
            order: 3,
            required: true,
            estimated_hours: 5.5,
            instructions: "Identify, plan, and implement innovative solution or process",
            active: true,
            created_by: "admin-123"
          },
          {
            id: "task-s04",
            title: "Change Leadership Program",
            description: "Complete change management certification and lead change initiative",
            task_type: "course_link",
            competency_area: "strategic_thinking",
            sub_competency: "change_leadership", 
            order: 4,
            required: true,
            estimated_hours: 4.5,
            external_link: "https://example.com/change-management",
            instructions: "Complete certification and apply change management principles",
            active: true,
            created_by: "admin-123"
          }
        ]);

        // Update admin stats to reflect the new comprehensive task library
        setAdminStats({
          total_users: 45,
          total_tasks: 26, // Updated to reflect our comprehensive task library
          total_completions: 18,
          completion_rate: 2.4,
          active_competency_areas: 5
        });
        
        console.log('Admin login complete with persistent data');
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

  // Helper function to get competency color class
  const getCompetencyClass = (areaKey) => {
    const classMap = {
      'financial_management': 'competency-financial',
      'leadership_supervision': 'competency-leadership', 
      'operational_management': 'competency-operational',
      'cross_functional_collaboration': 'competency-cross-functional',
      'strategic_thinking': 'competency-strategic'
    };
    return classMap[areaKey] || '';
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
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-white font-black text-xl mr-6 shadow-lg">
                <img 
                  src="https://customer-assets.emergentagent.com/job_navigator-platform/artifacts/6hbbx0pn_20250722_1548_Red%20Triangle%20Emblem_remix_01k0t1kk52fbvs6xn4fyjwqp26.png" 
                  alt="Red Triangle Emblem" 
                  className="w-12 h-12 object-contain"
                />
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
            {/* REGULAR USER NAVIGATION */}
            {!isAdmin && [
              { key: 'dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'competencies', label: 'Competencies', icon: '🎯' },
              { key: 'portfolio', label: 'Portfolio', icon: '📁' },
              { key: 'add-portfolio', label: '', icon: '➕' }
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
            
            {/* ADMIN NAVIGATION - FIXED: Only one dashboard */}
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
            handleSubmit={handleSubmit}
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
            setCurrentView={setCurrentView}
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
            setCurrentView={setCurrentView}
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
const DashboardView = ({ user, competencies, portfolio, overallProgress, onViewCompetencyTasks, setCurrentView }) => {
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
            Your Work
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
  const [selectedCulminatingTask, setSelectedCulminatingTask] = useState(null);
  const [culminatingProgress, setCulminatingProgress] = useState(() => {
    // Initialize from localStorage or default to empty
    const saved = localStorage.getItem('culminating_project_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Helper function to get competency color class
  const getCompetencyClass = (areaKey) => {
    const classMap = {
      'financial_management': 'competency-financial',
      'leadership_supervision': 'competency-leadership', 
      'operational_management': 'competency-operational',
      'cross_functional_collaboration': 'competency-cross-functional',
      'strategic_thinking': 'competency-strategic'
    };
    return classMap[areaKey] || '';
  };

  const handleViewTasks = (areaKey, subKey) => {
    if (areaKey === 'culminating_project') {
      // Handle culminating project phases
      const phaseData = culminatingProjectTasks[subKey];
      if (phaseData) {
        setTaskModal({ 
          area: areaKey, 
          sub: subKey,
          isProjectPhase: true,
          phaseName: phaseData.name,
          phaseDescription: phaseData.description,
          tasks: phaseData.tasks
        });
      }
    } else {
      // Handle regular competency areas
      onViewTasks(areaKey, subKey);
      setTaskModal({ area: areaKey, sub: subKey });
    }
  };

  const handleCompleteCulminatingTask = async (taskId, evidenceDescription = "", file = null) => {
    try {
      // Mark task as complete
      const updatedProgress = {
        ...culminatingProgress,
        [taskId]: {
          completed: true,
          completedAt: new Date().toISOString(),
          evidenceDescription,
          file: file ? file.name : null
        }
      };
      
      setCulminatingProgress(updatedProgress);
      localStorage.setItem('culminating_project_progress', JSON.stringify(updatedProgress));
      setSelectedCulminatingTask(null);
      
      console.log(`Culminating project task ${taskId} marked complete`);
    } catch (error) {
      console.error('Error completing culminating task:', error);
    }
  };

  const getCompletedCulminatingTasks = () => {
    const allPhases = ['planning', 'execution', 'completion'];
    let totalCompleted = 0;
    
    allPhases.forEach(phase => {
      const progress = getPhaseProgress(phase);
      totalCompleted += progress.completed;
    });
    
    return totalCompleted;
  };

  const getTotalCulminatingTasks = () => {
    const allPhases = ['planning', 'execution', 'completion'];
    let totalTasks = 0;
    
    allPhases.forEach(phase => {
      const progress = getPhaseProgress(phase);
      totalTasks += progress.total;
    });
    
    return totalTasks;
  };

  const isCulminatingTaskComplete = (taskId) => {
    return culminatingProgress[taskId]?.completed || false;
  };

  const getPhaseProgress = (phase) => {
    const phaseData = culminatingProjectTasks[`${phase}_phase`];
    if (!phaseData) return { completed: 0, total: 0 };
    
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    
    phaseData.tasks.forEach(task => {
      if (task.tasks && task.tasks.length > 0) {
        // Count subtasks
        totalSubtasks += task.tasks.length;
        
        // Count completed subtasks
        task.tasks.forEach((subtask, index) => {
          const subtaskId = `${task.id}-subtask-${index}`;
          if (isCulminatingTaskComplete(subtaskId)) {
            completedSubtasks++;
          }
        });
      } else {
        // If no subtasks, count the main task
        totalSubtasks += 1;
        if (isCulminatingTaskComplete(task.id)) {
          completedSubtasks++;
        }
      }
    });
    
    return { completed: completedSubtasks, total: totalSubtasks };
  };

  // Define the culminating project tasks data
  const culminatingProjectTasks = {
    planning_phase: {
      name: "Planning Phase",
      description: "Identify opportunities and develop business case",
      tasks: [
        {
          id: 1,
          title: "Opportunity Identification & Analysis",
          time: "1-2 weeks",
          type: "Analysis + Documentation",
          objective: "Identify and analyze potential improvement opportunities at your property",
          deliverable: "Opportunity Analysis Report (2-3 pages)",
          portfolioConnection: "Strategic Thinking evidence",
          tasks: [
            "Conduct property walkthrough and operations assessment",
            "Review property performance data (financial, operational, resident satisfaction)",
            "Interview team members from both leasing and maintenance departments",
            "Identify 3-5 potential improvement opportunities",
            "Document findings in Opportunity Analysis Template"
          ]
        },
        {
          id: 2,
          title: "Project Selection & Business Case Development", 
          time: "1 week",
          type: "Strategic Planning + Financial Analysis",
          objective: "Select one opportunity and build compelling business case",
          deliverable: "Business Case Proposal (3-4 pages)",
          portfolioConnection: "Financial Management + Strategic Thinking evidence",
          tasks: [
            "Evaluate opportunities against impact/effort matrix",
            "Select primary project focus",
            "Calculate current state costs/inefficiencies",
            "Estimate potential ROI and timeline for results",
            "Define success metrics and measurement plan",
            "Create preliminary resource requirements"
          ]
        },
        {
          id: 3,
          title: "Manager Review & Project Approval",
          time: "3-5 days", 
          type: "Presentation + Approval Gate",
          objective: "Present business case and gain manager approval to proceed",
          deliverable: "Signed Project Approval Form + Revised Scope (if applicable)",
          portfolioConnection: "Leadership & Communication evidence",
          tasks: [
            "Schedule approval meeting with direct manager",
            "Present business case with clear ROI and success metrics",
            "Address manager questions and concerns",
            "Incorporate feedback and adjust scope if needed",
            "Obtain formal written approval to proceed"
          ]
        },
        {
          id: 4,
          title: "Detailed Project Planning",
          time: "1 week",
          type: "Project Management + Stakeholder Planning", 
          objective: "Create comprehensive execution plan",
          deliverable: "Complete Project Plan Document",
          portfolioConnection: "Operational Management evidence",
          tasks: [
            "Develop detailed project timeline with milestones",
            "Identify all stakeholders and their roles/responsibilities",
            "Create communication plan and meeting schedule",
            "Define resource requirements and budget (if applicable)",
            "Identify potential risks and mitigation strategies",
            "Create implementation checklist"
          ]
        }
      ]
    },
    execution_phase: {
      name: "Execution Phase", 
      description: "Implement project and measure results",
      tasks: [
        {
          id: 5,
          title: "Stakeholder Alignment & Kickoff",
          time: "3-5 days",
          type: "Meeting + Communication",
          objective: "Align all stakeholders and officially launch project", 
          deliverable: "Kickoff Meeting Notes + Stakeholder Commitment Documentation",
          portfolioConnection: "Cross-Functional Collaboration evidence",
          tasks: [
            "Schedule and conduct project kickoff meeting",
            "Present project plan to all involved team members",
            "Confirm roles, responsibilities, and timeline commitments",
            "Address questions and concerns from team members", 
            "Document agreements and next steps",
            "Send kickoff summary to all participants"
          ]
        },
        {
          id: 6,
          title: "Project Execution & Management",
          time: "6-8 weeks",
          type: "Implementation + Ongoing Management",
          objective: "Execute project plan while managing progress and obstacles",
          deliverable: "Weekly Progress Reports + Implementation Documentation",
          portfolioConnection: "Leadership & Supervision + Operational Management evidence",
          tasks: [
            "Implement project activities according to timeline",
            "Conduct regular check-ins with team members",
            "Monitor progress against success metrics",
            "Document challenges and solutions",
            "Adjust approach as needed while staying true to objectives",
            "Maintain regular communication with manager/mentor"
          ]
        },
        {
          id: 7,
          title: "Results Measurement & Analysis",
          time: "1 week",
          type: "Data Analysis + Impact Assessment",
          objective: "Measure and analyze project outcomes against original goals",
          deliverable: "Results Analysis Report with quantified impact",
          portfolioConnection: "Financial Management + Strategic Thinking evidence",
          tasks: [
            "Collect data on all defined success metrics",
            "Compare results to baseline/target performance",
            "Calculate actual ROI and business impact",
            "Gather qualitative feedback from team members and residents (if applicable)",
            "Document lessons learned and unexpected outcomes",
            "Identify opportunities for further improvement"
          ]
        }
      ]
    },
    completion_phase: {
      name: "Completion Phase",
      description: "Document results and present to committee", 
      tasks: [
        {
          id: 8,
          title: "Project Documentation & Portfolio Development",
          time: "3-5 days",
          type: "Documentation + Portfolio Building",
          objective: "Create comprehensive project documentation for portfolio",
          deliverable: "Complete Project Portfolio Package",
          portfolioConnection: "Evidence for all competency areas",
          tasks: [
            "Compile all project materials into organized portfolio section",
            "Create project summary highlighting key achievements",
            "Document competencies demonstrated throughout project",
            "Gather testimonials from team members/stakeholders",
            "Prepare visual materials (charts, before/after photos, etc.)",
            "Write reflection on personal development and learning"
          ]
        },
        {
          id: 9,
          title: "Final Presentation Preparation",
          time: "1 week",
          type: "Presentation Development",
          objective: "Prepare compelling presentation for EYW Committee",
          deliverable: "Final Presentation Deck + Speaker Notes",
          portfolioConnection: "Leadership & Communication evidence",
          tasks: [
            "Create presentation slides following EYW template",
            "Structure narrative: Challenge → Solution → Results → Learning",
            "Include quantified business impact and ROI",
            "Prepare for potential committee questions",
            "Practice presentation delivery",
            "Gather any final supporting materials"
          ]
        },
        {
          id: 10,
          title: "EYW Committee Presentation",
          time: "1-2 hours",
          type: "Formal Presentation + Assessment",
          objective: "Present project results and demonstrate readiness for advancement",
          deliverable: "Completed Presentation + Committee Evaluation",
          portfolioConnection: "Culmination of all competency evidence",
          tasks: [
            "Deliver 15-20 minute presentation to EYW Committee",
            "Present project challenge, approach, and business results",
            "Demonstrate competencies developed and applied",
            "Share key learnings and insights gained",
            "Answer committee questions about project and development",
            "Receive feedback and advancement recommendation"
          ]
        }
      ]
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🎯 Navigator Competencies</h2>
        <p className="text-lg text-gray-600">Complete tasks to build competency mastery</p>
      </div>

      <div className="space-y-4">
        {Object.entries(competencies).map(([areaKey, areaData]) => (
          <div key={areaKey} className={`bg-white rounded-lg shadow overflow-hidden ${getCompetencyClass(areaKey)}`}>
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
                        className="progress-bar h-3 rounded-full transition-all duration-500"
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
                    <div key={subKey} className="sub-competency-card bg-white rounded-lg p-4 shadow-sm">
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
                                className="progress-bar h-2 rounded-full transition-all duration-300"
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

        {/* CULMINATING PROJECT - Navigator Level Capstone */}
        <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg shadow-lg border-2 border-dashed border-red-200 overflow-hidden">
          <div 
            className="px-6 py-6 cursor-pointer hover:from-red-100 hover:to-blue-100 transition-all duration-300"
            onClick={() => setExpandedArea(expandedArea === 'culminating_project' ? null : 'culminating_project')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xl font-bold text-gray-900">Culminating Project</h3>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">CAPSTONE</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Integrate all competencies in a real-world property operations improvement initiative</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-600">
                    {getCompletedCulminatingTasks()}/{getTotalCulminatingTasks()} Subtasks
                  </div>
                  <div className="text-xs text-gray-500">6-12 weeks</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getTotalCulminatingTasks() > 0 ? (getCompletedCulminatingTasks() / getTotalCulminatingTasks()) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {getTotalCulminatingTasks() > 0 ? Math.round((getCompletedCulminatingTasks() / getTotalCulminatingTasks()) * 100) : 0}%
                  </span>
                </div>
                <span className="text-gray-400 text-xl">
                  {expandedArea === 'culminating_project' ? '▼' : '▶'}
                </span>
              </div>
            </div>
          </div>

          {expandedArea === 'culminating_project' && (
            <div className="px-6 py-6 bg-white border-t border-red-200">
              {/* Overview Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Project Overview</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This culminating project integrates all competencies developed throughout the Navigator level, requiring demonstration of leadership, financial acumen, operational excellence, and strategic thinking in a real-world property operations improvement initiative.
                </p>
              </div>

              {/* Project Phases - Matching other competency format */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Planning Phase */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">📋 Planning Phase</h4>
                      <p className="text-xs text-gray-600 mb-2">Identify opportunities and develop business case</p>
                    </div>
                    <button
                      onClick={() => handleViewTasks('culminating_project', 'planning_phase')}
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
                          style={{ width: `${getPhaseProgress('planning').total > 0 ? (getPhaseProgress('planning').completed / getPhaseProgress('planning').total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {getPhaseProgress('planning').total > 0 ? Math.round((getPhaseProgress('planning').completed / getPhaseProgress('planning').total) * 100) : 0}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{getPhaseProgress('planning').completed}/{getPhaseProgress('planning').total} tasks</span>
                      <span>3-4 weeks</span>
                    </div>
                  </div>
                </div>

                {/* Execution Phase */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">⚡ Execution Phase</h4>
                      <p className="text-xs text-gray-600 mb-2">Implement project and measure results</p>
                    </div>
                    <button
                      onClick={() => handleViewTasks('culminating_project', 'execution_phase')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Tasks
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getPhaseProgress('execution').total > 0 ? (getPhaseProgress('execution').completed / getPhaseProgress('execution').total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {getPhaseProgress('execution').total > 0 ? Math.round((getPhaseProgress('execution').completed / getPhaseProgress('execution').total) * 100) : 0}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{getPhaseProgress('execution').completed}/{getPhaseProgress('execution').total} tasks</span>
                      <span>7-9 weeks</span>
                    </div>
                  </div>
                </div>

                {/* Completion Phase */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">🎯 Completion Phase</h4>
                      <p className="text-xs text-gray-600 mb-2">Document results and present to committee</p>
                    </div>
                    <button
                      onClick={() => handleViewTasks('culminating_project', 'completion_phase')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Tasks
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getPhaseProgress('completion').total > 0 ? (getPhaseProgress('completion').completed / getPhaseProgress('completion').total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {getPhaseProgress('completion').total > 0 ? Math.round((getPhaseProgress('completion').completed / getPhaseProgress('completion').total) * 100) : 0}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{getPhaseProgress('completion').completed}/{getPhaseProgress('completion').total} tasks</span>
                      <span>1-2 weeks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Criteria & Project Examples */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Success Criteria */}
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">✅ Success Criteria for Advancement</h4>
                  <ul className="space-y-2">
                    {[
                      "Business Impact: Demonstrated measurable improvement to property operations",
                      "Competency Integration: Evidence of applying all core competency areas", 
                      "Leadership Growth: Clear examples of leading through influence and collaboration",
                      "Financial Acumen: Understanding and quantification of business impact",
                      "Learning Mindset: Thoughtful reflection on challenges and growth opportunities",
                      "Presentation Quality: Professional delivery with compelling storytelling"
                    ].map((criteria, index) => (
                      <li key={index} className="text-sm text-green-800 flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Project Examples */}
                <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-3">💡 Project Examples (Navigator Level)</h4>
                  <p className="text-sm text-yellow-800 mb-3">Previous Navigator projects have included:</p>
                  <ul className="space-y-2">
                    {[
                      "Cross-departmental workflow optimization reducing unit turn time by 20%",
                      "Resident retention program increasing renewal rates by 8%",
                      "Preventative maintenance scheduling system reducing emergency work orders by 25%",
                      "Team training program improving customer service scores by 15%",
                      "Cost reduction initiative saving $12,000 annually while maintaining quality"
                    ].map((example, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start">
                        <span className="text-yellow-500 mr-2">💡</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-3 font-medium italic">
                    Remember: The best projects address real property challenges while allowing you to demonstrate growth in all competency areas!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal - Updated to handle both regular and culminating project tasks */}
      {taskModal && (
        <TaskModal
          area={taskModal.area}
          sub={taskModal.sub}
          tasks={taskModal.isProjectPhase ? taskModal.tasks : competencyTasks}
          onClose={() => setTaskModal(null)}
          onComplete={onCompleteTask}
          isProjectPhase={taskModal.isProjectPhase}
          phaseName={taskModal.phaseName}
          phaseDescription={taskModal.phaseDescription}
          onCompleteProjectTask={handleCompleteCulminatingTask}
          culminatingProgress={culminatingProgress}
        />
      )}

      {/* Culminating Project Task Completion Modal */}
      {selectedCulminatingTask && (
        <CulminatingTaskCompletionModal
          taskId={selectedCulminatingTask}
          onComplete={handleCompleteCulminatingTask}
          onClose={() => setSelectedCulminatingTask(null)}
        />
      )}
    </div>
  );
};

// Culminating Project Task Completion Modal
const CulminatingTaskCompletionModal = ({ taskId, onComplete, onClose }) => {
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taskNames = {
    1: "Opportunity Identification & Analysis",
    2: "Project Selection & Business Case Development", 
    3: "Manager Review & Project Approval",
    4: "Detailed Project Planning",
    5: "Stakeholder Alignment & Kickoff",
    6: "Project Execution & Management",
    7: "Results Measurement & Analysis",
    8: "Project Documentation & Portfolio Development",
    9: "Final Presentation Preparation",
    10: "EYW Committee Presentation"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onComplete(taskId, evidenceDescription, evidenceFile);
      onClose();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 font-bold rounded-full">
              🏆
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">Complete Subtask {taskId}</h4>
              <p className="text-sm text-gray-600">{taskNames[taskId]}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Notes & Evidence Description
              </label>
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                placeholder="Describe your progress, key outcomes, lessons learned, or attach relevant documentation..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documentation (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload project deliverables, screenshots, reports, or other evidence
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Task Modal Component - Enhanced for both regular and culminating project tasks
const TaskModal = ({ area, sub, tasks, onClose, onComplete, isProjectPhase, phaseName, phaseDescription, onCompleteProjectTask, culminatingProgress }) => {
  // Helper function to get competency color class for tasks
  const getTaskCompetencyClass = (area) => {
    const classMap = {
      'financial_management': 'competency-financial',
      'leadership_supervision': 'competency-leadership', 
      'operational_management': 'competency-operational',
      'cross_functional_collaboration': 'competency-cross-functional',
      'strategic_thinking': 'competency-strategic'
    };
    return classMap[area] || '';
  };

  const formatCompetencyName = (area, sub) => {
    const areaNames = {
      leadership_supervision: "Leadership & Supervision",
      financial_management: "Financial Management", 
      operational_management: "Operational Management",
      cross_functional_collaboration: "Cross-Functional Collaboration",
      strategic_thinking: "Strategic Thinking"
    };

    const subNames = {
      team_motivation: "Team Motivation",
      delegation: "Delegation",
      performance_management: "Performance Management",
      budget_creation: "Budget Creation", 
      variance_analysis: "Variance Analysis",
      cost_control: "Cost Control",
      workflow_optimization: "Workflow Optimization",
      technology_utilization: "Technology Utilization",
      stakeholder_management: "Stakeholder Management",
      strategic_planning: "Strategic Planning"
    };

    return {
      area: areaNames[area] || area,
      sub: subNames[sub] || sub
    };
  };

  const getTitle = () => {
    if (isProjectPhase) {
      return `${phaseName} Tasks`;
    } else {
      const names = formatCompetencyName(area, sub);
      return `Tasks for ${names.sub}`;
    }
  };

  const getDescription = () => {
    if (isProjectPhase) {
      return phaseDescription;
    } else {
      return "Complete these tasks to demonstrate your competency and earn points toward your portfolio.";
    }
  };

  const isTaskComplete = (taskId) => {
    if (isProjectPhase) {
      return culminatingProgress && culminatingProgress[taskId]?.completed;
    }
    return false; // Regular task completion would be handled differently
  };

  const getTaskTypeIcon = (type) => {
    switch(type) {
      case 'course_link': return '📚';
      case 'document_upload': return '📄';
      case 'assessment': return '📝';
      case 'shadowing': return '👥';
      case 'meeting': return '🤝';
      case 'project': return '🎯';
      // Culminating project task types
      case 'Analysis + Documentation': return '🔍';
      case 'Strategic Planning + Financial Analysis': return '💰';
      case 'Presentation + Approval Gate': return '🎤';
      case 'Project Management + Stakeholder Planning': return '📋';
      case 'Meeting + Communication': return '🤝';
      case 'Implementation + Ongoing Management': return '⚙️';
      case 'Data Analysis + Impact Assessment': return '📊';
      case 'Documentation + Portfolio Building': return '📁';
      case 'Presentation Development': return '📽️';
      case 'Formal Presentation + Assessment': return '🏆';
      default: return '✅';
    }
  };

  const [selectedTask, setSelectedTask] = useState(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const handleCompleteTask = async (taskId) => {
    if (isProjectPhase && onCompleteProjectTask) {
      await onCompleteProjectTask(taskId, evidenceDescription, evidenceFile);
    } else if (onComplete) {
      await onComplete(taskId, evidenceDescription, evidenceFile);
    }
    setSelectedTask(null);
    setEvidenceDescription('');
    setEvidenceFile(null);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // Click outside to close
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
              <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
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
              <div key={task.id} className={`task-card border rounded-lg p-4 ${getTaskCompetencyClass(area)} ${isTaskComplete(task.id) || task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{getTaskTypeIcon(task.task_type || task.type)}</span>
                      <h4 className="font-medium text-gray-900">{String(task.title || 'Untitled Task')}</h4>
                      {(isTaskComplete(task.id) || task.completed) && <span className="text-green-600 text-sm font-medium">✓ Completed</span>}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {String(task.description || task.objective || 'No description available')}
                    </p>
                    
                    {task.instructions && (
                      <div className="bg-blue-50 p-3 rounded mb-3">
                        <p className="text-sm text-blue-800">📋 <strong>Instructions:</strong> {String(task.instructions)}</p>
                      </div>
                    )}
                    
                    {/* Additional info for culminating project tasks */}
                    {isProjectPhase && (
                      <div className="space-y-2 mb-3">
                        {task.deliverable && (
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm text-green-800">📦 <strong>Deliverable:</strong> {String(task.deliverable)}</p>
                          </div>
                        )}
                        {task.portfolioConnection && (
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-sm text-purple-800">📂 <strong>Portfolio Connection:</strong> {String(task.portfolioConnection)}</p>
                          </div>
                        )}
                        {task.tasks && task.tasks.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-800 font-medium mb-3">📋 Subtasks:</p>
                            <div className="space-y-3">
                              {task.tasks.map((subtask, index) => {
                                const subtaskId = `${task.id}-subtask-${index}`;
                                const isSubtaskComplete = culminatingProgress && culminatingProgress[subtaskId]?.completed;
                                
                                return (
                                  <div key={index} className={`border rounded p-3 ${isSubtaskComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-gray-600 text-xs font-medium">#{index + 1}</span>
                                          <p className="text-sm text-gray-800">{String(subtask)}</p>
                                          {isSubtaskComplete && <span className="text-green-600 text-xs font-medium">✓ Completed</span>}
                                        </div>
                                        
                                        {isSubtaskComplete && culminatingProgress[subtaskId] && (
                                          <div className="mt-2 pt-2 border-t border-green-200">
                                            <p className="text-xs text-green-700">
                                              <strong>Completed:</strong> {new Date(culminatingProgress[subtaskId].completedAt).toLocaleDateString()}
                                            </p>
                                            {culminatingProgress[subtaskId].evidenceDescription && (
                                              <p className="text-xs text-green-700 mt-1">
                                                <strong>Evidence:</strong> {culminatingProgress[subtaskId].evidenceDescription}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {!isSubtaskComplete && (
                                        <button
                                          onClick={() => setSelectedTask(subtaskId)}
                                          className="ml-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                        >
                                          Mark Complete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {(task.estimated_hours || task.time) && (
                        <span>⏱️ {task.estimated_hours ? `${task.estimated_hours}h` : task.time}</span>
                      )}
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
                  
                  {!(isTaskComplete(task.id) || task.completed) && (
                    <button
                      onClick={() => setSelectedTask(task.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
                
                {(task.completed || isTaskComplete(task.id)) && task.completion_data && (
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Complete {selectedTask && selectedTask.includes('subtask') ? 'Subtask' : 'Task'}
              </h4>
              
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
const AddPortfolioView = ({ portfolioItem, setPortfolioItem, onSubmit, competencies, setCurrentView }) => {
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
const AdminTasksView = ({ tasks, onCreateTask, onUpdateTask, onDeleteTask, showCreateTask, setShowCreateTask, editingTask, setEditingTask, newTask, setNewTask, handleSubmit }) => {
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