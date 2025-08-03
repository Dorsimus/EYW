import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock current user - in real app this would come from authentication
// Use localStorage to persist the demo user ID across sessions
// Function to store user ID in localStorage (always use demo-user-123 for consistency)
const setStoredUserId = (userId) => {
  // Always store demo-user-123 for consistent demo experience
  localStorage.setItem('demo_user_id', 'demo-user-123');
};

const getStoredUserId = () => {
  // Always return demo-user-123 for consistent demo experience
  return 'demo-user-123';
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

  // Core Values Data
  const coreValues = {
    believers: {
      title: "WE ARE BELIEVERS",
      description: "We believe in ourselves, our team members, our communities, and our company. By bringing an all-in attitude, we affect positive change through an adaptable mindset. Our belief drives us to embody the unwavering energy necessary to achieve our goals. Believers get things done and inspire others to achieve more than seems possible.",
      icon: "🌟"
    },
    communicate: {
      title: "WE COMMUNICATE AUTHENTICALLY WITH CARE", 
      description: "We champion diverse ideas and contributions of our people and encourage curiosity in learning about others. We foster clear, honest, and transparent dialogue. We seek to understand, assume positive intent, treat people with respect, and respond in a timely manner. Care is at the heart of respectful communication.",
      icon: "💬"
    },
    course: {
      title: "WE STAY THE COURSE",
      description: "We demonstrate relentless optimism, grit, and unyielding determination. In ever-changing market conditions, we recalibrate, sharpen our focus, foster alignment, and dig in together to win. Our purpose, values, and long-term goals define our \"True North,\" and inspire our course.",
      icon: "🧭"
    },
    performance: {
      title: "WE DRIVE PERFORMANCE", 
      description: "We are goal driven, results oriented, and have a high bar of performance. We empower our teams, hold each other accountable, and achieve expected results. We value leadership mindsets, innovation, and continuous improvement. Our purpose, strategy, and culture drive performance through our relentless commitment to our people and world-class service.",
      icon: "🚀"
    }
  };

  // Core Values State
  const [coreValueEntries, setCoreValueEntries] = useState(() => {
    const saved = localStorage.getItem('core_value_entries');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedValue, setExpandedValue] = useState(null);
  const [newEntry, setNewEntry] = useState({ value: '', story: '', date: '' });
  const [showNewEntryForm, setShowNewEntryForm] = useState(null);

  // Competency Task Progress State
  const [competencyTaskProgress, setCompetencyTaskProgress] = useState(() => {
    const saved = localStorage.getItem('competency_task_progress');
    return saved ? JSON.parse(saved) : {};
  });
  const [showTaskModal, setShowTaskModal] = useState(null);
  const [taskNotes, setTaskNotes] = useState('');

  const competencyOptions = [
    { area: 'leadership_supervision', subs: ['team_motivation', 'delegation', 'performance_management', 'coaching_development', 'team_building', 'conflict_resolution', 'difficult_conversations', 'cross_dept_communication', 'resident_resolution', 'crisis_leadership'] },
    { area: 'financial_management', subs: ['budget_creation', 'variance_analysis', 'cost_control', 'roi_decisions', 'revenue_impact', 'pl_understanding', 'kpi_tracking', 'financial_forecasting', 'capex_planning', 'vendor_cost_mgmt'] },
    { area: 'operational_management', subs: ['workflow_optimization', 'technology_utilization', 'quality_control', 'sop_management', 'innovation', 'safety_management', 'policy_enforcement', 'legal_compliance', 'emergency_preparedness', 'documentation'] },
    { area: 'cross_functional_collaboration', subs: ['understanding_other_department', 'unified_resident_experience', 'communication_across_departments', 'stakeholder_relationship_building'] },
    { area: 'strategic_thinking', subs: ['seeing_patterns_anticipating_trends', 'innovation_continuous_improvement', 'problem_solving_future_focus', 'planning_goal_achievement'] }
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
        description: "Leadership Isn't a Title, It's How You Show Up Every Day",
        philosophy: "The Navigator Leadership & Supervision development transforms department supervisors into inspiring people leaders through their daily work. Every task builds real leadership skills while creating tangible value for residents and the property. This is learning in action, not learning in addition.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Curiosity-driven leadership development through authentic work experiences",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "leadership_supervision",
        curiosity_ignition: {
          title: "Leadership Curiosity Assessment",
          description: "Before diving in, spark curiosity about your leadership journey",
          time_required: "5 minutes of thinking",
          reflection_prompts: [
            "What's one leadership moment from this week that I keep thinking about?",
            "If I could ask any great leader three questions, what would they be?",
            "What does leadership look like when no one's watching?",
            "How do I want people to feel after working with me?"
          ],
          setup_requirement: "Create a simple place to capture leadership observations, questions, and 'aha moments' throughout the program."
        },
        sub_competencies: {
          inspiring_team_motivation: {
            name: "Inspiring Team Motivation & Engagement",
            description: "What makes someone excited to come to work for you specifically?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "What makes someone excited to come to work for me specifically?",
            foundation_courses: [
              {
                id: "ls-new-fc-01",
                title: "Employee Motivation",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Why people do what they do"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Leadership Style Discovery",
                in_the_flow_activity: "During your regular one-on-ones, ask each team member:\n• 'When do you feel most energized at work?'\n• 'What kind of support helps you do your best work?'\n• 'How do you like to receive feedback?'\n\nTake notes and then document what you learn below.",
                document: "Simple Leadership Style Notes (10 minutes weekly)",
                reflection: "What patterns do I see in what motivates different people?"
              },
              {
                month: 2,
                title: "Motivation in Action",
                in_the_flow_activity: "Based on what you discovered in the Leadership Style Discovery, create an individualized motivational approach for each team member that you'll implement this month. Create a plan and document it below, along with your results.",
                document: "Motivation Experiment Results (5 minutes weekly)",
                integrations: ["Financial Integration: Track team performance metrics during motivation experiments", "Cross-Functional Integration: Share motivation successes with opposite department Navigator"],
                journal_prompt: "What motivation experiments surprised me? What didn't work as expected?"
              },
              {
                month: 3,
                title: "Sustainable Motivation Systems",
                in_the_flow_activity: "Create simple, sustainable motivational practices for your team. Use the Team Motivation Playbook to help you create a simple, one-page guide.",
                document: "Team Motivation Playbook (one-page guide you actually use)",
                integrations: ["Operational Integration: Connect motivation practices to daily operational routines"],
                curiosity_question: "How can motivation become as natural as breathing in our daily work?"
              }
            ],
            competency_gate: "Team members report higher engagement in brief surveys + Observable behavior changes in team dynamics",
            dive_deeper_resources: [
              {
                title: "The Five Languages of Appreciation in the Workplace",
                type: "Book",
                description: "Understanding different ways people feel valued at work",
                url: "https://www.5lovelanguages.com/languages-of-appreciation/"
              },
              {
                title: "Drive: The Surprising Truth About What Motivates Us",
                type: "Book/Video",
                description: "Dan Pink's research on intrinsic motivation",
                url: "https://www.danpink.com/books/drive/"
              },
              {
                title: "One Minute Manager Meets the Monkey",
                type: "Book",
                description: "Time management and delegation insights",
                url: "#"
              }
            ]
          },
          mastering_difficult_conversations: {
            name: "Mastering Difficult Conversations",
            description: "How do I have conversations that strengthen relationships while raising standards?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I have conversations that strengthen relationships while raising standards?",
            foundation_courses: [
              {
                id: "ls-new-fc-02",
                title: "Performance Management",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "How to have conversations that matter"
              },
              {
                id: "ls-new-fc-03",
                title: "Coaching Foundations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Coaching vs. fixing mindset"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Feedback Foundations",
                in_the_flow_activity: "Give one piece of meaningful feedback to each team member, every week.",
                document: "Weekly Feedback Log - Briefly note what worked well and what didn't go as expected (5 minutes)",
                integrations: ["Leadership Integration: Practice feedback techniques learned in Leadership modules"],
                reflection: "What makes feedback feel helpful vs. hurtful?"
              },
              {
                month: 2,
                title: "Performance Conversations",
                in_the_flow_activity: "Address one performance issue using a structured approach",
                document: "Performance Conversation Template (create a simple framework you'll actually use)",
                integrations: ["Financial Integration: Connect performance conversations to departmental budget impact", "Strategic Integration: Frame performance in context of property goals"],
                journal_prompt: "How do I balance care for the person with accountability for results?"
              },
              {
                month: 3,
                title: "Conflict Resolution Mastery",
                in_the_flow_activity: "Using what you've learned from the coursework, resolve one team or cross-department conflict. Document your successes below.",
                document: "Conflict Resolution Success Story (detailed case study)",
                integrations: ["Cross-Functional Integration: Practice conflict resolution with maintenance/leasing counterpart"],
                curiosity_question: "What if every difficult conversation could actually strengthen our relationship?"
              }
            ],
            competency_gate: "Successfully resolve documented conflict + Team member feedback on conversation quality",
            dive_deeper_resources: [
              {
                title: "Crucial Conversations: Tools for Talking When Stakes Are High",
                type: "Book",
                description: "Master the framework for difficult conversations",
                url: "https://cruciallearning.com/crucial-conversations-book/"
              },
              {
                title: "Difficult Conversations: How to Discuss What Matters Most",
                type: "Book",
                description: "Harvard Negotiation Project insights on tough talks",
                url: "#"
              },
              {
                title: "Nonviolent Communication by Marshall Rosenberg",
                type: "Book/Video",
                description: "Compassionate communication techniques",
                url: "https://www.cnvc.org/"
              }
            ]
          },
          building_collaborative_culture: {
            name: "Building Collaborative Team Culture",
            description: "How do we have high standards AND have fun together?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do we have high standards AND have fun together?",
            foundation_courses: [
              {
                id: "ls-new-fc-04",
                title: "Building a Team Culture",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Creating environments where people thrive"
              },
              {
                id: "ls-new-fc-05",
                title: "Being a Team Player",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Modeling collaboration"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Culture Assessment & Vision",
                in_the_flow_activity: "Observe and document current team culture during regular work",
                document: "Team Culture Snapshot (what you observe + what team members say they want)",
                integrations: ["Cross-Functional Integration: Compare culture observations with opposite department"],
                reflection: "What does our culture feel like day-to-day? What do we want it to feel like?"
              },
              {
                month: 2,
                title: "Culture Building Experiments",
                in_the_flow_activity: "Try one small culture-building practice monthly (team check-ins, celebrations, etc.)",
                document: "Culture Experiment Results (what worked, what didn't, why)",
                integrations: ["Operational Integration: Connect culture practices to daily operational meetings"],
                journal_prompt: "What culture practices actually make work more enjoyable AND more effective?"
              },
              {
                month: 3,
                title: "Sustainable Culture Systems",
                in_the_flow_activity: "Implement one lasting culture practice that requires no extra time",
                document: "Culture Playbook (simple practices that stick)",
                integrations: ["Strategic Integration: Connect culture practices to property-wide goals"],
                curiosity_question: "How can we make positive culture as automatic as our daily routines?"
              }
            ],
            competency_gate: "Team reports improved culture in surveys + Observable changes in team interactions",
            dive_deeper_resources: [
              {
                title: "The Culture Map by Erin Meyer",
                type: "Book",
                description: "Understanding different cultural styles in teamwork",
                url: "#"
              },
              {
                title: "The Advantage by Patrick Lencioni",
                type: "Book",
                description: "Building healthy organizational culture",
                url: "https://www.tablegroup.com/books/advantage"
              },
              {
                title: "Psychological Safety: The Key to Happy, High-Performing Teams",
                type: "Article",
                description: "Creating environments where people can take risks",
                url: "https://www.ccl.org/articles/leading-effectively-articles/psychological-safety-key-happy-high-performing-teams/"
              }
            ]
          },
          developing_others_success: {
            name: "Developing Others for Success",
            description: "How do I help each person become the best version of themselves?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I help each person become the best version of themselves?",
            foundation_courses: [
              {
                id: "ls-new-fc-06",
                title: "Coaching Foundations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Growing people vs. managing tasks"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Individual Development Focus",
                in_the_flow_activity: "Create a simple developmental plan with each team member, starting with one focused goal, during your next one-on-one. Check in each week to track progress.",
                document: "Individual Development Plans (one page per person with their input)",
                integrations: ["Financial Integration: Connect development goals to departmental performance metrics"],
                reflection: "What does each person on my team want to become? How can I help?"
              },
              {
                month: 2,
                title: "Teaching & Mentoring",
                in_the_flow_activity: "Teach each team member one new skill or improve existing skill",
                document: "Teaching Success Stories (what you taught, how, what worked)",
                integrations: ["Cross-Functional Integration: Cross-train team member in opposite department skill"],
                journal_prompt: "What's the difference between telling someone what to do and helping them learn to think?"
              },
              {
                month: 3,
                title: "Development Results & Recognition",
                in_the_flow_activity: "Recognizing good work helps keep people motivated and maintain high standards. Recognize and celebrate each team member's growth, and document your success stories below.",
                document: "Development Success Showcase (evidence of team member growth)",
                integrations: ["Strategic Integration: Connect individual development to property advancement opportunities"],
                curiosity_question: "How can helping others grow become the most rewarding part of my work?"
              }
            ],
            competency_gate: "Team member demonstrates new skill/advancement + Peer recognition of development abilities",
            dive_deeper_resources: [
              {
                title: "The Coaching Habit: Say Less, Ask More & Change the Way You Lead Forever",
                type: "Book",
                description: "Seven essential coaching questions for leaders",
                url: "https://boxofcrayons.com/the-coaching-habit-book/"
              },
              {
                title: "Multipliers: How the Best Leaders Make Everyone Smarter",
                type: "Book",
                description: "Leading in ways that amplify team intelligence",
                url: "#"
              },
              {
                title: "The Talent Code by Daniel Coyle",
                type: "Book",
                description: "How to develop skill and talent in others",
                url: "#"
              }
            ]
          }
        },
        integration_activities: {
          weekly_cm_shadowing: {
            title: "Weekly CM Shadowing",
            time: "30 minutes weekly - rotated focus",
            schedule: [
              { months: "1-3", focus: "Team meetings and motivation techniques" },
              { months: "4-6", focus: "Performance conversations and feedback delivery" },
              { months: "7-9", focus: "Culture building and team development" },
              { months: "10-12", focus: "Advanced leadership and strategic thinking" }
            ]
          },
          cross_department_exchange: {
            title: "Cross-Department Leadership Exchange",
            time: "Monthly - 30 minutes",
            activities: [
              "Share leadership successes and challenges with opposite department Navigator",
              "Practice leadership skills in cross-functional scenarios",
              "Build property-wide leadership perspective"
            ]
          },
          leadership_curiosity_journal: {
            title: "Leadership Curiosity Journal",
            time: "5 minutes weekly",
            activities: [
              "Document leadership observations, questions, and insights",
              "Track 'aha moments' and behavior changes",
              "Reflect on leadership growth and areas for continued development"
            ]
          }
        },
        culminating_project: {
          title: "Leadership Legacy Initiative",
          duration: "Final 2-3 months of program",
          challenge: "Design and implement one leadership initiative that improves both team performance and team satisfaction",
          options: [
            "Team Development Program: Create systematic approach to developing your team members",
            "Culture Transformation Project: Lead significant improvement in team culture and collaboration",
            "Cross-Department Leadership Initiative: Solve problem requiring leadership across departments"
          ],
          deliverables: [
            "Project proposal and implementation plan (2 pages max)",
            "Evidence of positive impact (metrics, feedback, observations)",
            "Leadership lessons learned and future development plan (1 page)"
          ],
          presentation: "15-minute presentation to CM and peer panel on leadership growth and impact"
        },
        validation_criteria: {
          mastery_evidence_portfolio: [
            "Motivation Mastery: Team engagement improvement + sustainable motivation practices",
            "Conversation Excellence: Successful difficult conversations + team feedback",
            "Culture Building: Observable culture improvements + team satisfaction",
            "Development Success: Team member advancement + teaching effectiveness"
          ],
          portfolio_defense: {
            duration: "20 minutes",
            components: [
              "Leadership Journey Story: How you've grown as a leader through the program",
              "Team Transformation Evidence: Specific examples of positive team changes",
              "Leadership Philosophy: Your personal approach to leading others",
              "Future Development Plan: How you'll continue growing as a leader"
            ]
          },
          cm_readiness_indicators: [
            "Proven Team Leadership: Successfully leading team toward consistent results",
            "Difficult Conversation Mastery: Comfortable with all aspects of performance management",
            "Culture Creation: Evidence of intentionally building positive team environment",
            "People Development Track Record: Team members advance and grow under your leadership"
          ]
        }
      },
      financial_management: {
        name: "Financial Management & Business Acumen",
        description: "Every Decision Has a Dollar Impact - Make Them Count",
        philosophy: "The Navigator Financial Management development transforms department supervisors into business-minded leaders who understand the financial impact of their daily decisions. This isn't about becoming an accountant - it's about thinking like an owner while leading your team.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Financial literacy through real department decisions and daily operations",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "financial_management",
        curiosity_ignition: {
          title: "Financial Curiosity Assessment",
          description: "Before diving in, spark curiosity about the money side of your work",
          time_required: "5 minutes of thinking",
          reflection_prompts: [
            "What's one decision I made this week that probably had a financial impact I didn't consider?",
            "If I owned this property, what would keep me up at night financially?",
            "How does my department's work show up in dollars and cents?",
            "What financial questions do I wish I knew how to answer?"
          ],
          setup_requirement: "Create a simple place to capture financial observations, questions, and 'connection moments' throughout the program."
        },
        sub_competencies: {
          property_pl_understanding: {
            name: "Property P&L Understanding",
            description: "How does my department's daily work show up on the property's financial statement?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How does my department's daily work show up on the property's financial statement?",
            foundation_courses: [
              {
                id: "fm-new-fc-01",
                title: "Property Management Financials",
                duration: "1 hour 15 minutes",
                platform: "PerformanceHQ",
                description: "Where the money comes from and goes"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "P&L Detective Work",
                in_the_flow_activity: "During monthly property meetings, identify which P&L line items your department directly affects",
                document: "P&L Impact Map (simple one-page visual showing your department's financial connections)",
                integrations: ["Leadership Integration: Discuss financial impact with team during regular meetings"],
                reflection: "Which of my daily decisions have bigger financial consequences than I realized?"
              },
              {
                month: 2,
                title: "Revenue vs. Expense Awareness",
                in_the_flow_activity: "Track one department decision weekly and estimate its financial impact",
                document: "Financial Impact Log (weekly notes on decisions and estimated dollar effects)",
                integrations: ["Cross-Functional Integration: Compare financial impacts with opposite department Navigator"],
                journal_prompt: "What department decisions feel small but might have big financial ripple effects?"
              },
              {
                month: 3,
                title: "Financial Storytelling",
                in_the_flow_activity: "Explain your department's financial contribution to your team in simple terms",
                document: "Department Financial Story (one-page explanation your team can understand)",
                integrations: ["Strategic Integration: Connect department financials to overall property goals"],
                curiosity_question: "How can I help my team understand that we're not just doing tasks - we're driving financial success?"
              }
            ],
            competency_gate: "Accurately identify 5+ P&L line items your department affects + Explain department's financial role to team",
            dive_deeper_resources: [
              {
                title: "CM Weekly Meeting - Accounting with Mike Mullins",
                type: "Course",
                description: "Real-world accounting application",
                url: "#"
              },
              {
                title: "P&L Reading Guide for Department Leaders",
                type: "Custom Content",
                description: "Simple guide to understanding property financials",
                url: "#"
              },
              {
                title: "Property Management P&L Basics",
                type: "YouTube Video",
                description: "Visual breakdown of property financial statements (15 minutes)",
                url: "https://youtube.com/search?q=property+management+P%26L+basics"
              }
            ]
          },
          departmental_budget_management: {
            name: "Departmental Budget Management", 
            description: "How do I create a budget that challenges us to improve while being realistic about what we can achieve?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I create a budget that challenges us to improve while being realistic about what we can achieve?",
            foundation_courses: [
              {
                id: "fm-new-fc-02",
                title: "Department Budget Basics for Supervisors",
                duration: "45 minutes",
                platform: "Custom Content",
                description: "How to create and manage department budgets"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Budget Reality Check",
                in_the_flow_activity: "Review your current department budget line by line with your CM",
                document: "Budget Understanding Worksheet (what each line item means and how you influence it)",
                integrations: ["Operational Integration: Connect budget categories to daily operational decisions"],
                reflection: "What budget line items surprise me? Where do I have more control than I thought?"
              },
              {
                month: 2,
                title: "Budget Creation Practice",
                in_the_flow_activity: "Create next month's department budget forecast based on current trends",
                document: "Budget Forecast with Rationale (simple forecast with explanation of assumptions)", 
                integrations: ["Financial Integration: Compare forecast accuracy to actual results"],
                journal_prompt: "What factors make budgeting hard? How can I get better at predicting our financial needs?"
              },
              {
                month: 3,
                title: "Budget Communication & Team Involvement",
                in_the_flow_activity: "Share budget goals with your team and get their input on cost-saving ideas",
                document: "Team Budget Engagement Plan (how you involve team in budget awareness)",
                integrations: ["Leadership Integration: Use budget discussions to teach team about business impact"],
                curiosity_question: "How can budget awareness help my team make better daily decisions?"
              }
            ],
            competency_gate: "Create department budget forecast within 10% accuracy + Team demonstrates budget awareness",
            dive_deeper_resources: [
              {
                title: "Creating and Delivering Business Presentations",
                type: "Course",
                description: "Presenting budget information",
                url: "#"
              },
              {
                title: "Performance Management",
                type: "Course", 
                description: "Using metrics to drive performance",
                url: "#"
              },
              {
                title: "Budgeting 101 for Managers",
                type: "YouTube Video",
                description: "Basic budget management principles (12 minutes)",
                url: "https://youtube.com/search?q=budgeting+101+managers"
              }
            ]
          },
          cost_conscious_decision_making: {
            name: "Cost-Conscious Decision Making",
            description: "What's the real cost of this decision, including everything I might not see immediately?",
            duration: "3-4 months",
            weekly_time: "~15 minutes", 
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "What's the real cost of this decision, including everything I might not see immediately?",
            foundation_courses: [
              {
                id: "fm-new-fc-03",
                title: "Business Ethics",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Making decisions that balance multiple interests"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Hidden Costs Detective",
                in_the_flow_activity: "For each major department decision, identify all costs (obvious and hidden)",
                document: "Hidden Costs Discovery Log (weekly examples of costs you found beyond the obvious)",
                integrations: ["Cross-Functional Integration: Discuss hidden costs with maintenance/leasing counterpart"],
                reflection: "What costs do I consistently underestimate? What costs do I not think about at all?"
              },
              {
                month: 2,
                title: "ROI Decision Framework",
                in_the_flow_activity: "Use simple cost-benefit thinking for one department decision weekly",
                document: "ROI Decision Examples (real decisions with simple cost-benefit analysis)",
                integrations: ["Strategic Integration: Connect decisions to long-term property goals"],
                journal_prompt: "What decisions seem expensive upfront but might save money long-term? What cheap decisions might be costly later?"
              },
              {
                month: 3,
                title: "Team Cost Consciousness",
                in_the_flow_activity: "Teach your team to think about costs when making routine decisions",
                document: "Cost-Conscious Culture Examples (how team members started considering costs)",
                integrations: ["Operational Integration: Build cost awareness into daily operational procedures"],
                curiosity_question: "How can cost-conscious thinking become as natural as safety awareness for my team?"
              }
            ],
            competency_gate: "Document 3 decisions with improved financial outcomes + Team demonstrates cost-conscious behavior",
            dive_deeper_resources: [
              {
                title: "Spark: Resident Retention - Turnover Trouble - The High Cost of Vacancy",
                type: "Course",
                description: "Understanding true costs (5 minutes)",
                url: "#"
              },
              {
                title: "ROI Thinking for Department Leaders",
                type: "Custom Content",
                description: "Simple cost-benefit analysis for daily decisions",
                url: "#"
              },
              {
                title: "Cost-Benefit Analysis Simplified",
                type: "YouTube Video", 
                description: "Quick framework for decision making (8 minutes)",
                url: "https://youtube.com/search?q=cost+benefit+analysis+simplified"
              }
            ]
          },
          financial_communication_business_understanding: {
            name: "Financial Communication & Business Understanding",
            description: "How do I explain financial concepts so clearly that anyone can understand and act on them?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I explain financial concepts so clearly that anyone can understand and act on them?",
            foundation_courses: [
              {
                id: "fm-new-fc-04",
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ", 
                description: "Making numbers tell a story"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Financial Translation Skills",
                in_the_flow_activity: "Practice explaining financial concepts to team members in simple terms",
                document: "Financial Translation Examples (complex concepts explained simply)",
                integrations: ["Leadership Integration: Use financial explanations to motivate and educate team"],
                reflection: "What financial jargon do I use that my team doesn't understand? How can I explain things more clearly?"
              },
              {
                month: 2,
                title: "Business Impact Reporting",
                in_the_flow_activity: "Create simple monthly report on your department's business impact for your CM",
                document: "Department Business Impact Reports (simple, visual reports showing value created)",
                integrations: ["Cross-Functional Integration: Compare business impact with opposite department"],
                journal_prompt: "What business value does my department create beyond just completing tasks?"
              },
              {
                month: 3,
                title: "Financial Leadership & Teaching",
                in_the_flow_activity: "Help team members understand how their individual work contributes to financial success",
                document: "Financial Education Success Stories (team members understanding financial connections)",
                integrations: ["Strategic Integration: Connect individual contributions to property-wide financial goals"],
                curiosity_question: "How can financial understanding make my team feel more valued and important?"
              }
            ],
            competency_gate: "Successfully explain department financials to team + Create meaningful business impact report",
            dive_deeper_resources: [
              {
                title: "Business Writing: Grammar Works",
                type: "Course",
                description: "Professional communication (2 hours)",
                url: "#"
              },
              {
                title: "Business Etiquette",
                type: "Course",
                description: "Professional business interactions (1 hour)",
                url: "#"
              },
              {
                title: "How to Explain Financial Information Simply",
                type: "YouTube Video",
                description: "Making complex financial concepts accessible (10 minutes)",
                url: "https://youtube.com/search?q=explain+financial+information+simply"
              }
            ]
          }
        },
        integration_activities: {
          weekly_cm_financial_shadowing: {
            title: "Weekly CM Financial Shadowing",
            time: "15 minutes weekly - rotated focus",
            schedule: [
              { months: "1-3", focus: "P&L review meetings and financial discussions" },
              { months: "4-6", focus: "Budget planning and variance analysis" },
              { months: "7-9", focus: "Cost control decisions and ROI discussions" },
              { months: "10-12", focus: "Financial reporting and strategic financial thinking" }
            ]
          },
          cross_department_financial_exchange: {
            title: "Cross-Department Financial Exchange",
            time: "Monthly - 20 minutes",
            activities: [
              "Share financial insights and challenges with opposite department Navigator",
              "Compare department financial impacts and opportunities",
              "Practice financial communication across departments"
            ]
          },
          financial_curiosity_journal: {
            title: "Financial Curiosity Journal",
            time: "5 minutes weekly",
            activities: [
              "Document financial observations, questions, and insights",
              "Track 'money moments' when financial understanding clicks",
              "Reflect on business thinking growth and financial confidence"
            ]
          }
        },
        culminating_project: {
          title: "Department Financial Optimization Initiative",
          duration: "Final 2-3 months of program",
          challenge: "Identify and implement one financial improvement that benefits both department performance and property profitability",
          options: [
            "Cost Reduction Project: Find ways to reduce department costs without sacrificing quality",
            "Revenue Enhancement Initiative: Improve department practices that drive property revenue", 
            "Efficiency Investment Analysis: Propose investment that improves long-term financial performance"
          ],
          deliverables: [
            "Financial analysis of current state and opportunity (1 page)",
            "Implementation plan with projected financial impact (1 page)",
            "Results documentation with actual financial outcomes (1 page)"
          ],
          presentation: "15-minute presentation to CM and Regional Manager on financial thinking and business impact"
        },
        validation_criteria: {
          mastery_evidence_portfolio: [
            "P&L Understanding: Clear connection between daily work and property financials",
            "Budget Management: Successful department budget creation and management",
            "Cost-Conscious Decisions: Evidence of improved financial decision-making",
            "Financial Communication: Ability to explain financial concepts clearly to others"
          ],
          portfolio_defense: {
            duration: "20 minutes",
            components: [
              "Financial Journey Story: How financial understanding has changed your leadership",
              "Business Impact Evidence: Specific examples of financially-smart decisions and outcomes",
              "Team Financial Development: How you've built financial awareness in your team",
              "Future Financial Goals: How you'll continue developing business acumen"
            ]
          },
          cm_readiness_indicators: [
            "Department Financial Responsibility: Proven ability to manage department finances effectively",
            "Business-Minded Decision Making: Consistently considers financial impact in all decisions",
            "Financial Communication Skills: Can explain property financials to team and stakeholders",
            "Strategic Financial Thinking: Understands how department fits into property financial success"
          ]
        }
      },
      operational_management: {
        name: "Operational Management",
        description: "Great Operations Are Invisible - Bad Operations Are Obvious",
        philosophy: "The Navigator Operational Management development transforms department supervisors into systems thinkers who create smooth, efficient operations that residents and team members barely notice because they work so well. This isn't about following procedures - it's about designing better ways to work.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Systems thinking through daily operational improvements and problem-solving",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "operational_management",
        curiosity_ignition: {
          title: "Operational Curiosity Assessment",
          description: "Before diving in, spark curiosity about how work actually gets done",
          time_required: "5 minutes of thinking",
          reflection_prompts: [
            "What's one thing that happens smoothly every day that residents never have to think about?",
            "If I could fix one operational frustration this week, what would have the biggest impact?",
            "What operational 'magic' do I create that others might not notice?",
            "How do the systems I manage affect everyone else's ability to do great work?"
          ],
          setup_requirement: "Create a simple place to capture operational observations, improvement ideas, and 'systems thinking moments' throughout the program."
        },
        sub_competencies: {
          process_improvement_efficiency: {
            name: "Process Improvement & Efficiency",
            description: "What's one process that could work better if I thought about it differently?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "What's one process that could work better if I thought about it differently?",
            foundation_courses: [
              {
                id: "om-new-fc-01",
                title: "Effective Time Management",
                duration: "35 minutes",
                platform: "PerformanceHQ",
                description: "Making time work for you and your team"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Process Detective Work",
                in_the_flow_activity: "Choose one recurring department process and document how it actually works (not how it's supposed to work)",
                document: "Process Reality Map (simple flowchart showing actual vs. intended process)",
                integrations: ["Leadership Integration: Involve team members in identifying process frustrations"],
                reflection: "Where do our processes create unnecessary work or frustration? What steps could we eliminate or simplify?"
              },
              {
                month: 2,
                title: "One Process Improvement",
                in_the_flow_activity: "Implement one small improvement to the process you mapped, with team input",
                document: "Process Improvement Results (before/after comparison with time/frustration savings)",
                integrations: ["Cross-Functional Integration: Consider how process change affects other departments"],
                journal_prompt: "What made this process improvement successful? How did involving the team change the outcome?"
              },
              {
                month: 3,
                title: "Process Improvement Culture",
                in_the_flow_activity: "Teach your team to spot and suggest process improvements",
                document: "Team Process Ideas Collection (improvements suggested and implemented by team members)",
                integrations: ["Strategic Integration: Connect process improvements to resident experience and property goals"],
                curiosity_question: "How can process improvement become as natural as fixing broken things?"
              }
            ],
            competency_gate: "Implement 1 measurable process improvement + Team generates process improvement ideas",
            dive_deeper_resources: [
              {
                title: "Quick Start: Make Ready Process",
                type: "Course",
                description: "Foundation of property operations (15 minutes)",
                url: "#"
              },
              {
                title: "Preventative Maintenance",
                type: "Course",
                description: "Systematic approach to maintenance (1 hour)",
                url: "#"
              },
              {
                title: "Process Improvement Made Simple",
                type: "YouTube Video",
                description: "Basic process optimization principles (12 minutes)",
                url: "https://youtube.com/search?q=process+improvement+made+simple"
              }
            ]
          },
          quality_control_standards: {
            name: "Quality Control & Standards",
            description: "How do I create quality standards that my team wants to follow because they make sense?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I create quality standards that my team wants to follow because they make sense?",
            foundation_courses: [
              {
                id: "om-new-fc-02",
                title: "Quality Standards That Actually Work",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Creating and maintaining quality that matters to residents"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Quality Reality Check",
                in_the_flow_activity: "Observe your department's work from a resident's perspective and identify quality gaps",
                document: "Quality Gap Analysis (what residents experience vs. what you intend to deliver)",
                integrations: ["Operational Integration: Connect quality observations to daily work routines"],
                reflection: "What quality issues do residents notice that we might miss? Where are we creating quality problems without realizing it?"
              },
              {
                month: 2,
                title: "Simple Quality Standards",
                in_the_flow_activity: "Create one simple, measurable quality standard with your team's input",
                document: "Quality Standard Documentation (clear, simple standard that team helped create)",
                integrations: ["Financial Integration: Connect quality standards to cost savings and revenue protection"],
                journal_prompt: "What makes a quality standard feel helpful vs. burdensome? How do I make quality checking feel like improvement, not inspection?"
              },
              {
                month: 3,
                title: "Quality Culture Building",
                in_the_flow_activity: "Help team members take pride in quality and notice quality improvements",
                document: "Quality Culture Examples (team members demonstrating pride in quality work)",
                integrations: ["Leadership Integration: Use quality discussions to develop team members' professional skills"],
                curiosity_question: "How can quality become something we do for ourselves and residents, not just for management?"
              }
            ],
            competency_gate: "Create and implement 1 effective quality standard + Team demonstrates quality ownership",
            dive_deeper_resources: [
              {
                title: "Fair Housing For Maintenance",
                type: "Course",
                description: "Legal compliance fundamentals (1 hour)",
                url: "#"
              },
              {
                title: "GH Webinar: Risk Management Inspections in Multifamily Housing",
                type: "Course",
                description: "Inspection best practices (1 hour)",
                url: "#"
              },
              {
                title: "Creating Quality Standards That Stick",
                type: "YouTube Video",
                description: "Practical quality management (10 minutes)",
                url: "https://youtube.com/search?q=creating+quality+standards+that+stick"
              }
            ]
          },
          safety_leadership_risk_awareness: {
            name: "Safety Leadership & Risk Awareness",
            description: "How do I make safety something my team cares about because it protects what matters to them?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I make safety something my team cares about because it protects what matters to them?",
            foundation_courses: [
              {
                id: "om-new-fc-03",
                title: "Safety Series: Manage Maintenance Safety",
                duration: "20 minutes",
                platform: "PerformanceHQ",
                description: "Safety leadership basics"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Safety Perspective Shift",
                in_the_flow_activity: "Have safety conversations focused on protecting team members and residents, not just compliance",
                document: "Safety Conversation Examples (how you've connected safety to personal protection)",
                integrations: ["Cross-Functional Integration: Discuss safety concerns that affect both departments"],
                reflection: "What safety risks worry me most for my team? How can I help them see safety as self-protection, not rule-following?"
              },
              {
                month: 2,
                title: "Practical Risk Reduction",
                in_the_flow_activity: "Identify and fix one safety risk that your team identified as important",
                document: "Risk Reduction Success Story (safety improvement made with team involvement)",
                integrations: ["Operational Integration: Build safety awareness into daily operational routines"],
                journal_prompt: "What safety improvements make the biggest difference in how my team feels about their work environment?"
              },
              {
                month: 3,
                title: "Safety Culture Leadership",
                in_the_flow_activity: "Help team members look out for each other's safety and speak up about concerns",
                document: "Safety Culture Development (examples of team members demonstrating safety leadership)",
                integrations: ["Strategic Integration: Connect safety leadership to overall property reputation and success"],
                curiosity_question: "How can safety leadership become something my team does for each other, not just for management?"
              }
            ],
            competency_gate: "Lead 1 meaningful safety improvement + Team demonstrates safety leadership behaviors",
            dive_deeper_resources: [
              {
                title: "Crisis Management: Prevention & Preparation",
                type: "Course",
                description: "Emergency planning (1 hour)",
                url: "#"
              },
              {
                title: "Safety Series: Preventing Slips, Trips, and Falls",
                type: "Course",
                description: "Common hazard prevention (20 minutes)",
                url: "#"
              },
              {
                title: "Safety Leadership for Supervisors",
                type: "YouTube Video",
                description: "Creating safety culture (15 minutes)",
                url: "https://youtube.com/search?q=safety+leadership+for+supervisors"
              }
            ]
          },
          technology_system_optimization: {
            name: "Technology & System Optimization",
            description: "What technology or system could make my team's work easier if we used it better?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "What technology or system could make my team's work easier if we used it better?",
            foundation_courses: [
              {
                id: "om-new-fc-04",
                title: "Technology That Actually Helps",
                duration: "45 minutes",
                platform: "Custom Content",
                description: "Using technology to make work easier, not harder"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Technology Reality Check",
                in_the_flow_activity: "Observe how your team actually uses technology and identify frustrations or missed opportunities",
                document: "Technology Usage Analysis (what works well, what's frustrating, what's underused)",
                integrations: ["Leadership Integration: Involve team in identifying technology pain points and wishes"],
                reflection: "What technology problems slow my team down? What technology capabilities are we not using that could help?"
              },
              {
                month: 2,
                title: "One Technology Improvement",
                in_the_flow_activity: "Implement one technology change or better usage that makes work easier for your team",
                document: "Technology Improvement Results (how the change made work easier or better)",
                integrations: ["Cross-Functional Integration: Consider how technology changes affect other departments"],
                journal_prompt: "What made this technology improvement successful? How did focusing on making work easier change the team's response?"
              },
              {
                month: 3,
                title: "Technology Leadership",
                in_the_flow_activity: "Help team members become comfortable suggesting technology improvements",
                document: "Team Technology Ideas (technology suggestions and implementations from team members)",
                integrations: ["Financial Integration: Connect technology improvements to cost savings or efficiency gains"],
                curiosity_question: "How can technology improvement become something my team drives, not something imposed on them?"
              }
            ],
            competency_gate: "Implement 1 meaningful technology improvement + Team engages in technology optimization",
            dive_deeper_resources: [
              {
                title: "Virtual Leasing: Technology Tools for Virtual Leasing",
                type: "Course",
                description: "Technology integration examples (20 minutes)",
                url: "#"
              },
              {
                title: "Customer Relationship Management",
                type: "Course",
                description: "Using systems for better resident service (2 hours)",
                url: "#"
              },
              {
                title: "Technology Optimization for Busy Managers",
                type: "YouTube Video",
                description: "Practical technology improvement (8 minutes)",
                url: "https://youtube.com/search?q=technology+optimization+for+busy+managers"
              }
            ]
          }
        },
        integration_activities: {
          weekly_cm_operational_shadowing: {
            title: "Weekly CM Operational Shadowing",
            time: "15 minutes weekly - rotated focus",
            schedule: [
              { months: "1-3", focus: "Process improvement and efficiency discussions" },
              { months: "4-6", focus: "Quality control and standards management" },
              { months: "7-9", focus: "Safety leadership and risk management" },
              { months: "10-12", focus: "Technology optimization and systems thinking" }
            ]
          },
          cross_department_operational_exchange: {
            title: "Cross-Department Operational Exchange",
            time: "Monthly - 20 minutes",
            activities: [
              "Share operational improvements and challenges with opposite department Navigator",
              "Identify operational improvements that benefit both departments",
              "Practice systems thinking across departmental boundaries"
            ]
          },
          operational_curiosity_journal: {
            title: "Operational Curiosity Journal",
            time: "5 minutes weekly",
            activities: [
              "Document operational observations, improvement ideas, and insights",
              "Track 'systems thinking moments' when operational connections become clear",
              "Reflect on operational leadership growth and team development"
            ]
          }
        },
        culminating_project: {
          title: "Operational Excellence Initiative",
          duration: "Final 2-3 months of program",
          challenge: "Design and implement one operational improvement that makes work better for your team AND improves resident experience",
          options: [
            "Process Efficiency Project: Streamline a process that affects multiple people",
            "Quality Enhancement Initiative: Improve quality in a way that residents notice",
            "Safety Culture Program: Create lasting safety improvements through culture change",
            "Technology Integration Project: Use technology to solve a persistent operational challenge"
          ],
          deliverables: [
            "Problem analysis and improvement plan (1 page)",
            "Implementation approach with team involvement (1 page)",
            "Results documentation with team and resident impact (1 page)"
          ],
          presentation: "15-minute presentation to CM and peer panel on operational thinking and systems leadership"
        },
        validation_criteria: {
          mastery_evidence_portfolio: [
            "Process Improvement: Evidence of meaningful process improvements with measurable results",
            "Quality Leadership: Successful quality standards that team embraces and maintains",
            "Safety Culture: Examples of safety leadership that protects team and residents",
            "Systems Optimization: Technology or system improvements that make work better"
          ],
          portfolio_defense: {
            duration: "20 minutes",
            components: [
              "Operational Journey Story: How systems thinking has changed your leadership approach",
              "Improvement Evidence: Specific examples of operational improvements and their impact",
              "Team Development: How you've built operational excellence mindset in your team",
              "Future Vision: How you'll continue developing operational leadership skills"
            ]
          },
          cm_readiness_indicators: [
            "Systems Thinking: Understands how operational systems connect across property",
            "Improvement Leadership: Proven ability to identify and implement operational improvements",
            "Quality Standards: Creates and maintains quality standards that actually work",
            "Team Operational Development: Builds operational excellence capability in team members"
          ]
        }
      },
      cross_functional_collaboration: {
        name: "Cross-Functional Collaboration",
        description: "Breaking Down Silos & Building Unified Property Teams",
        philosophy: "We Win Together - One Property, One Team. The Navigator Cross-Functional Collaboration development transforms department-focused leaders into property-wide team builders who understand that exceptional resident experience requires seamless collaboration between all functions. This isn't about getting along - it's about creating something better together than either department could create alone.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Building bridges between departments through shared projects and genuine partnership",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "cross_functional_collaboration",
        curiosity_ignition: {
          title: "🔥 Collaboration Curiosity Assessment",
          subtitle: "Before diving in, spark curiosity about working across departments",
          reflection_prompts: [
            "What's one thing the other department does that I wish I understood better?",
            "When have I seen leasing and maintenance work together in a way that created something amazing?",
            "What resident experience could we create if our departments worked together seamlessly?",
            "What would change if we thought of ourselves as one property team instead of separate departments?"
          ],
          journal_setup: "Create a simple place to capture collaboration observations, partnership ideas, and \"we're stronger together\" moments throughout the program."
        },
        sub_competencies: {
          understanding_other_department: {
            name: "Understanding & Appreciating the Other Department",
            description: "What would help me be a better partner to the other department?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Being a Team Player",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Foundation of collaborative mindset",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Maintenance For Office Staff",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Cross-functional operational understanding",
                available: true
              },
              {
                title: "Walking in Their Shoes",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Understanding what drives success in the other department",
                custom_content_needed: true
              },
              {
                title: "Cross-Functional Teamwork That Actually Works",
                duration: "12 minutes",
                platform: "YouTube",
                description: "Practical collaboration principles"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Department Curiosity Exploration",
                in_flow_activity: "Spend 30 minutes weekly with your opposite department counterpart, just observing and asking curious questions",
                document_section: {
                  title: "Department Discovery Journal", 
                  description: "Insights about how the other department really works",
                  portfolio_integration: true
                },
                leadership_integration: "Share what you're learning with your team to build appreciation",
                journal_prompt: "What surprised me most about how the other department operates? What challenges do they face that I never considered?"
              },
              {
                month: 2,
                title: "Appreciation in Action",
                in_flow_activity: "Find one specific way to make the other department's work easier each week",
                document_section: {
                  title: "Partnership Action Log",
                  description: "Concrete ways you've supported the other department",
                  portfolio_integration: true
                },
                operational_integration: "Build other department considerations into your daily decisions",
                journal_prompt: "What small actions have the biggest impact on our working relationship? How does helping them actually help residents?"
              },
              {
                month: 3,
                title: "Bridge Building",
                in_flow_activity: "Facilitate one conversation between your teams about how to work better together",
                document_section: {
                  title: "Team Bridge-Building Results",
                  description: "Improved understanding and cooperation between teams",
                  portfolio_integration: true
                },
                strategic_integration: "Connect department partnership to property-wide goals",
                curiosity_question: "How can appreciation and understanding become automatic between our departments?"
              }
            ],
            competency_gate: "Demonstrate improved working relationship with opposite department + Teams show increased cooperation"
          },
          unified_resident_experience: {
            name: "Unified Resident Experience Creation",
            description: "How can our departments work together to create resident experiences that neither could create alone?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Customer Relationship Management",
              duration: "2 hours",
              platform: "PerformanceHQ",
              description: "Comprehensive approach to resident service",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Resident Retention",
                duration: "1 hour 30 minutes",
                platform: "PerformanceHQ",
                description: "Holistic resident satisfaction approach",
                available: true
              },
              {
                title: "Customer Service 1: Be Proactive",
                duration: "30 minutes",
                platform: "PerformanceHQ",
                description: "Anticipating resident needs",
                available: true
              },
              {
                title: "Creating Seamless Customer Experience Across Teams",
                duration: "10 minutes",
                platform: "YouTube",
                description: "Cross-functional service excellence"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Resident Journey Mapping",
                in_flow_activity: "Map one resident's experience from move-in to renewal, identifying all touchpoints from both departments",
                document_section: {
                  title: "Resident Experience Map",
                  description: "Visual showing where departments interact with residents",
                  portfolio_integration: true
                },
                cross_functional_integration: "Work with opposite department Navigator to create the map together",
                journal_prompt: "Where in the resident journey do our departments create magic together? Where do we create confusion or frustration?"
              },
              {
                month: 2,
                title: "Coordinated Service Excellence",
                in_flow_activity: "Choose one resident touchpoint where departments can coordinate better and improve it together",
                document_section: {
                  title: "Service Coordination Success Story",
                  description: "Improved resident experience through department coordination",
                  portfolio_integration: true
                },
                financial_integration: "Connect improved coordination to resident satisfaction and retention",
                journal_prompt: "What does great coordination feel like from the resident's perspective? How can we make this coordination feel natural instead of forced?"
              },
              {
                month: 3,
                title: "Proactive Partnership Programs",
                in_flow_activity: "Create one small program or practice that proactively enhances resident experience through department partnership",
                document_section: {
                  title: "Partnership Program Results",
                  description: "Resident feedback and team satisfaction with collaborative initiative",
                  portfolio_integration: true
                },
                leadership_integration: "Involve both teams in designing and implementing the program",
                curiosity_question: "What resident experiences could we create if we always thought like partners instead of separate departments?"
              }
            ],
            competency_gate: "Successfully improve 1 resident touchpoint through collaboration + Measurable resident satisfaction improvement"
          },
          communication_across_departments: {
            name: "Effective Communication Across Departments", 
            description: "How do I communicate in a way that makes the other department want to work with me?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Building a Team Culture",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Creating unified team environment",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Leadership Booster: Communication Skills for Supervisors",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Clear communication techniques",
                available: true
              },
              {
                title: "Conflict Resolution (Supervisor Version)",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Managing disagreements constructively",
                available: true
              },
              {
                title: "Communication That Builds Bridges, Not Walls",
                duration: "8 minutes",
                platform: "YouTube",
                description: "Constructive cross-functional communication"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Communication Bridge Building",
                in_flow_activity: "Establish one regular communication practice with your opposite department counterpart",
                document_section: {
                  title: "Communication Practice Results",
                  description: "Improved information sharing and coordination",
                  portfolio_integration: true
                },
                operational_integration: "Build cross-department communication into routine operational practices",
                journal_prompt: "What communication practices prevent problems vs. create them? How can I make communication feel helpful instead of burdensome?"
              },
              {
                month: 2,
                title: "Collaborative Problem Solving",
                in_flow_activity: "When a problem affects both departments, involve both teams in finding the solution",
                document_section: {
                  title: "Collaborative Problem-Solving Examples",
                  description: "Problems solved better through department partnership",
                  portfolio_integration: true
                },
                strategic_integration: "Frame problems and solutions in terms of property-wide impact",
                journal_prompt: "What makes problem-solving feel collaborative vs. competitive? How do the best solutions consider both departments' needs?"
              },
              {
                month: 3,
                title: "Conflict Prevention & Resolution",
                in_flow_activity: "Address one source of recurring friction between departments and create a better way forward",
                document_section: {
                  title: "Conflict Resolution Success Story",
                  description: "Friction reduced through improved communication and understanding",
                  portfolio_integration: true
                },
                leadership_integration: "Model constructive conflict resolution for both teams",
                curiosity_question: "How can we turn the things that create friction into opportunities for better partnership?"
              }
            ],
            competency_gate: "Establish effective communication practices with other department + Successfully resolve cross-department conflict"
          },
          stakeholder_relationship_building: {
            name: "Stakeholder Relationship Building",
            description: "How do I build relationships where everyone wins and wants to work together again?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Building Relationships That Matter",
              duration: "45 minutes",
              platform: "Custom Content",
              description: "Professional relationship development with internal and external stakeholders",
              custom_content_needed: true
            },
            dive_deeper_resources: [
              {
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Professional communication with stakeholders",
                available: true
              },
              {
                title: "Business Etiquette",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Professional relationship skills",
                available: true
              },
              {
                title: "Building Professional Relationships That Last",
                duration: "15 minutes",
                platform: "YouTube",
                description: "Long-term relationship development"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Internal Stakeholder Partnership",
                in_flow_activity: "Identify key internal stakeholders (CM, other department leaders, home office contacts) and strengthen one relationship",
                document_section: {
                  title: "Stakeholder Relationship Development",
                  description: "Improved working relationships with internal partners",
                  portfolio_integration: true
                },
                cross_functional_integration: "Work with opposite department Navigator on shared stakeholder relationships",
                journal_prompt: "Which internal relationships could make everyone's work easier if they were stronger? What do these stakeholders need from me to be successful?"
              },
              {
                month: 2,
                title: "External Stakeholder Engagement",
                in_flow_activity: "Engage with one external stakeholder (vendor, resident, community partner) in a way that builds the relationship",
                document_section: {
                  title: "External Relationship Building Examples",
                  description: "Improved external partnerships that benefit the property",
                  portfolio_integration: true
                },
                financial_integration: "Connect stakeholder relationships to cost savings or revenue enhancement",
                journal_prompt: "What external relationships could create more value if they were partnerships instead of transactions?"
              },
              {
                month: 3,
                title: "Stakeholder Value Creation",
                in_flow_activity: "Find one way to create value for a stakeholder that also benefits your property",
                document_section: {
                  title: "Mutual Value Creation Examples",
                  description: "Win-win outcomes from stakeholder relationships",
                  portfolio_integration: true
                },
                strategic_integration: "Connect stakeholder relationships to long-term property success",
                curiosity_question: "How can I make every stakeholder interaction feel like the beginning of a valuable partnership?"
              }
            ],
            competency_gate: "Strengthen relationships with 2+ stakeholders + Create measurable value through improved relationships"
          }
        },
        collaboration_integration_activities: {
          weekly_cross_department_partnership: {
            duration: "15 minutes weekly - rotated focus",
            schedule: [
              { months: "1-3", focus: "Department understanding and appreciation building" },
              { months: "4-6", focus: "Resident experience coordination and improvement" },
              { months: "7-9", focus: "Communication and problem-solving collaboration" },
              { months: "10-12", focus: "Stakeholder relationship development and value creation" }
            ]
          },
          monthly_property_team_connection: {
            duration: "20 minutes monthly",
            activities: [
              "Share collaboration successes and challenges with all property team members",
              "Practice collaboration skills in property-wide scenarios",
              "Build property-wide perspective and unified team culture"
            ]
          },
          collaboration_curiosity_journal: {
            duration: "5 minutes weekly",
            focus: [
              "Document collaboration observations, partnership ideas, and insights",
              "Track \"stronger together\" moments when collaboration creates something special",
              "Reflect on collaboration leadership growth and team development"
            ]
          }
        },
        culminating_collaboration_project: {
          title: "Partnership Excellence Initiative",
          timeline: "Final 2-3 months of program",
          challenge: "Design and implement one collaborative initiative that demonstrates the power of departments working together",
          options: [
            "Resident Experience Enhancement: Create exceptional resident experience through seamless department coordination",
            "Operational Efficiency Partnership: Solve operational challenge through cross-department collaboration",
            "Stakeholder Value Creation: Build stakeholder relationship that benefits all parties",
            "Culture Unity Project: Strengthen property-wide team culture through collaborative leadership"
          ],
          deliverables: [
            "Partnership opportunity analysis and plan (1 page)",
            "Implementation approach with both departments involved (1 page)",
            "Results documentation with partnership impact and lessons learned (1 page)"
          ],
          presentation: "15-minute presentation to CM and property team on collaboration leadership and partnership building"
        },
        competency_validation: {
          evidence_portfolio: [
            "Department Partnership: Strong working relationship with opposite department with measurable improvements",
            "Resident Experience Collaboration: Improved resident experience through department coordination",
            "Communication Excellence: Effective communication practices that prevent problems and build relationships",
            "Stakeholder Relationship Success: Strengthened stakeholder relationships that create mutual value"
          ],
          portfolio_defense: {
            duration: "20 minutes",
            components: [
              "Collaboration Journey Story: How partnership thinking has changed your leadership approach",
              "Partnership Evidence: Specific examples of successful collaboration and their impact",
              "Relationship Building: How you've strengthened relationships across departments and with stakeholders",
              "Future Partnership Vision: How you'll continue developing collaboration leadership skills"
            ]
          },
          cm_readiness_indicators: [
            "Property-Wide Perspective: Thinks and acts considering all departments and stakeholders",
            "Relationship Building Excellence: Builds strong working relationships across all functions",
            "Collaborative Problem Solving: Consistently finds solutions that work for multiple parties",
            "Stakeholder Management Competency: Successfully manages complex internal and external relationships"
          ]
        },
        success_metrics: {
          leading_indicators: [
            "Cross-department communication frequency and quality",
            "Collaborative problem-solving attempts and success",
            "Stakeholder relationship engagement and strengthening",
            "Property-wide team culture and collaboration improvement"
          ],
          lagging_indicators: [
            "Resident satisfaction scores related to coordinated service",
            "Cross-department conflict reduction and resolution effectiveness",
            "Stakeholder relationship quality and value creation",
            "Property-wide team engagement and unity"
          ],
          curiosity_growth_indicators: [
            "Partnership questions asked and insights gained",
            "Collaboration experiments attempted and lessons learned",
            "Relationships strengthened and value created",
            "Others developed in collaboration and partnership skills"
          ]
        },
        custom_content_development: {
          high_priority: [
            "Walking in Their Shoes (30 minutes) - Understanding what drives success in the other department",
            "Building Relationships That Matter (45 minutes) - Professional relationship development with stakeholders"
          ],
          medium_priority: [
            "Property management examples for existing collaboration courses",
            "Cross-functional scenario practice materials"
          ],
          low_priority: [
            "Advanced stakeholder management tools",
            "Industry collaboration best practices"
          ]
        },
        program_philosophy: "This refined framework transforms cross-functional collaboration from \"getting along\" into \"creating something better together.\" Every activity focuses on building genuine partnerships that create value for residents, stakeholders, and the property. The goal isn't perfect harmony - it's productive partnership. Each competency builds the relationship skills and collaborative mindset that makes Navigators valuable partners today while preparing them for Community Manager stakeholder management responsibilities. Curiosity drives collaboration. By constantly asking \"how can we be better together?\" and \"what would make this a win for everyone?\", Navigators develop the partnership mindset that creates exceptional property operations. Collaboration is leadership development. The best collaboration comes from leaders who understand that success comes through others, creating collaborative excellence that elevates everyone's performance."
      },
      strategic_thinking: {
        name: "Strategic Thinking",
        description: "Think Beyond Today - Lead for Tomorrow",
        philosophy: "The Navigator Strategic Thinking development transforms department supervisors into future-focused leaders who can see beyond daily tasks to identify opportunities, anticipate challenges, and make decisions that position the property for long-term success. This isn't about becoming a visionary CEO - it's about developing the strategic mindset essential for Community Manager effectiveness.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Strategic thinking through real department decisions and property planning",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "strategic_thinking",
        curiosity_ignition: {
          title: "🔥 Strategic Curiosity Assessment",
          subtitle: "Before diving in, spark curiosity about thinking strategically",
          reflection_prompts: [
            "What's one trend I've noticed at our property that might predict something bigger coming?",
            "If I could change one thing about how we operate that would still matter in two years, what would it be?",
            "What decision did a great leader make that seemed small but had big long-term impact?",
            "How would I run things differently if I knew I'd be here for the next five years?"
          ],
          journal_setup: "Create a simple place to capture strategic observations, pattern recognition, and \"thinking ahead\" moments throughout the program."
        },
        sub_competencies: {
          seeing_patterns_anticipating_trends: {
            name: "Seeing Patterns & Anticipating Trends",
            description: "What patterns in our daily work might tell me something important about our future?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "CM Weekly Meeting - Data Driven Decisions with Martin Knapp",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Using information to see what's coming",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Performance Management",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Using metrics to identify trends",
                available: true
              },
              {
                title: "Pattern Recognition for Property Leaders",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Simple framework for spotting trends in property operations",
                custom_content_needed: true
              },
              {
                title: "How to Spot Trends Before They're Obvious",
                duration: "10 minutes",
                platform: "YouTube",
                description: "Practical trend identification skills"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Pattern Detective Work",
                in_flow_activity: "During weekly property meetings, note one pattern or trend you observe in your department's data",
                document_section: {
                  title: "Pattern Recognition Log",
                  description: "Weekly observations of trends in your department",
                  portfolio_integration: true
                },
                operational_integration: "Connect patterns to daily operational decisions",
                journal_prompt: "What patterns do I see that others might be missing? What do these patterns suggest about what's coming?"
              },
              {
                month: 2,
                title: "Trend Impact Analysis",
                in_flow_activity: "Choose one pattern from Month 1 and think through what it might mean for your department's future",
                document_section: {
                  title: "Trend Impact Assessment",
                  description: "Simple analysis of what one trend could mean",
                  portfolio_integration: true
                },
                cross_functional_integration: "Discuss trend observations with opposite department Navigator",
                journal_prompt: "If this trend continues, what opportunities or challenges might we face? How should we prepare?"
              },
              {
                month: 3,
                title: "Proactive Planning",
                in_flow_activity: "Make one small change in your department based on a trend you've identified",
                document_section: {
                  title: "Proactive Action Results",
                  description: "Change you made based on trend analysis and its outcomes",
                  portfolio_integration: true
                },
                leadership_integration: "Share trend thinking with your team to build strategic awareness",
                curiosity_question: "How can pattern recognition become a natural part of how I think about our work?"
              }
            ],
            competency_gate: "Identify meaningful trend affecting department + Take proactive action based on trend analysis"
          },
          innovation_continuous_improvement: {
            name: "Innovation & Continuous Improvement Thinking",
            description: "What could we do differently that would make our work easier, better, or more effective?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Leadership 201",
              duration: "2 hours 5 minutes",
              platform: "PerformanceHQ",
              description: "Advanced leadership including innovation thinking",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Employee Motivation",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Creating culture that encourages new ideas",
                available: true
              },
              {
                title: "Effective Time Management",
                duration: "35 minutes",
                platform: "PerformanceHQ",
                description: "Finding time for improvement thinking",
                available: true
              },
              {
                title: "Innovation Starts with Small Improvements",
                duration: "8 minutes",
                platform: "YouTube",
                description: "Practical approach to workplace innovation"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Improvement Opportunity Hunting",
                in_flow_activity: "Weekly, identify one thing in your department that could work better",
                document_section: {
                  title: "Improvement Opportunity Log",
                  description: "Weekly ideas for making work better",
                  portfolio_integration: true
                },
                financial_integration: "Consider cost and benefit of improvement ideas",
                journal_prompt: "What improvements would have the biggest impact? What holds us back from making simple improvements?"
              },
              {
                month: 2,
                title: "Small Innovation Testing",
                in_flow_activity: "Try one small improvement or new approach each week",
                document_section: {
                  title: "Innovation Experiment Results",
                  description: "What you tried, what happened, what you learned",
                  portfolio_integration: true
                },
                strategic_integration: "Connect improvements to long-term department goals",
                journal_prompt: "Which small changes made the biggest difference? What did I learn about implementing improvements?"
              },
              {
                month: 3,
                title: "Innovation Culture Building",
                in_flow_activity: "Get your team involved in suggesting and testing improvements",
                document_section: {
                  title: "Team Innovation Examples",
                  description: "Improvements suggested and implemented by team members",
                  portfolio_integration: true
                },
                operational_integration: "Build improvement thinking into regular department operations",
                curiosity_question: "How can continuous improvement become as natural as daily operations for my team?"
              }
            ],
            competency_gate: "Successfully implement 2+ department improvements + Team demonstrates improvement mindset"
          },
          problem_solving_future_focus: {
            name: "Problem-Solving with Future Focus",
            description: "How do I solve this problem in a way that makes similar problems less likely in the future?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "CM Weekly Meeting - Extreme Ownership with Kate Reeves",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Taking ownership of solutions and outcomes",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Conflict Resolution (Supervisor Version)",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Strategic approach to resolving issues",
                available: true
              },
              {
                title: "Future-Focused Problem Solving",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Framework for solving problems in ways that prevent future issues",
                custom_content_needed: true
              },
              {
                title: "Root Cause Analysis Simplified",
                duration: "12 minutes",
                platform: "YouTube",
                description: "Getting to the real source of problems"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Root Cause Thinking",
                in_flow_activity: "When solving routine problems, dig deeper to understand what really caused them",
                document_section: {
                  title: "Root Cause Analysis Examples",
                  description: "Deeper thinking about what causes common problems",
                  portfolio_integration: true
                },
                cross_functional_integration: "Explore root causes that might involve both departments",
                journal_prompt: "What problems keep recurring because we're not addressing the real cause? What patterns do I see in our problems?"
              },
              {
                month: 2,
                title: "Solution Design for Long-Term Impact",
                in_flow_activity: "For each significant problem you solve, design the solution to prevent similar future problems",
                document_section: {
                  title: "Future-Focused Solution Examples",
                  description: "Solutions designed to prevent problem recurrence",
                  portfolio_integration: true
                },
                leadership_integration: "Involve team in designing solutions that address root causes",
                journal_prompt: "What solutions that seemed good short-term might create problems later? How can I think more long-term in my problem-solving?"
              },
              {
                month: 3,
                title: "Systematic Problem Prevention",
                in_flow_activity: "Create one simple system or process that prevents a category of problems",
                document_section: {
                  title: "Problem Prevention System",
                  description: "Process or practice that reduces future problems",
                  portfolio_integration: true
                },
                strategic_integration: "Connect problem prevention to property-wide efficiency goals",
                curiosity_question: "How can problem-solving become problem prevention? What systems could eliminate whole categories of issues?"
              }
            ],
            competency_gate: "Implement solution that addresses root cause + Create system that prevents future problems"
          },
          planning_goal_achievement: {
            name: "Planning & Goal Achievement with Strategic Perspective",
            description: "How do I set goals and make plans that connect our daily work to where we want to be long-term?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Strategic Planning for Department Leaders",
              duration: "45 minutes",
              platform: "Custom Content",
              description: "Simple approach to planning that connects daily work to bigger goals",
              custom_content_needed: true
            },
            dive_deeper_resources: [
              {
                title: "CM Weekly Meeting - Multipliers with Matt",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Strategic leadership that multiplies team effectiveness",
                available: true
              },
              {
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Communicating strategic plans effectively",
                available: true
              },
              {
                title: "Strategic Planning That Actually Works",
                duration: "15 minutes",
                platform: "YouTube",
                description: "Practical strategic planning approach"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Strategic Goal Setting",
                in_flow_activity: "Set one strategic goal for your department that would matter in 6-12 months",
                document_section: {
                  title: "Strategic Goal Development",
                  description: "Goal that connects current work to future success",
                  portfolio_integration: true
                },
                financial_integration: "Connect strategic goal to department and property financial success",
                journal_prompt: "What goal would make the biggest difference for our long-term success? How does this goal connect to daily decisions?"
              },
              {
                month: 2,
                title: "Strategic Planning & Implementation",
                in_flow_activity: "Create simple plan for achieving your strategic goal and start implementing it",
                document_section: {
                  title: "Strategic Implementation Plan",
                  description: "Practical steps toward achieving strategic goal",
                  portfolio_integration: true
                },
                operational_integration: "Build strategic goal progress into regular operational routines",
                journal_prompt: "What's working in my strategic implementation? What obstacles require creative solutions?"
              },
              {
                month: 3,
                title: "Strategic Communication & Team Alignment",
                in_flow_activity: "Get your team involved in understanding and working toward the strategic goal",
                document_section: {
                  title: "Team Strategic Alignment Examples",
                  description: "How team members contribute to strategic goal",
                  portfolio_integration: true
                },
                cross_functional_integration: "Explore how strategic goal might connect with opposite department's goals",
                curiosity_question: "How can strategic thinking become part of how my team naturally thinks about our work?"
              }
            ],
            competency_gate: "Set and make progress on meaningful strategic goal + Team understands and contributes to strategic direction"
          }
        },
        strategic_integration_activities: {
          weekly_cm_strategic_shadowing: {
            duration: "15 minutes weekly - rotated focus",
            schedule: [
              { months: "1-3", focus: "Strategic planning discussions and long-term thinking" },
              { months: "4-6", focus: "Innovation initiatives and improvement planning" },
              { months: "7-9", focus: "Problem-solving and future-focused decision making" },
              { months: "10-12", focus: "Goal setting and strategic implementation" }
            ]
          },
          cross_department_strategic_exchange: {
            duration: "Monthly - 20 minutes",
            activities: [
              "Share strategic insights and planning with opposite department Navigator",
              "Explore strategic opportunities that could benefit both departments",
              "Practice strategic thinking in property-wide scenarios"
            ]
          },
          strategic_curiosity_journal: {
            duration: "5 minutes weekly",
            focus: [
              "Document strategic observations, planning insights, and future-focused thinking",
              "Track \"thinking ahead\" moments when strategic perspective changes decisions",
              "Reflect on strategic leadership growth and long-term thinking development"
            ]
          }
        },
        culminating_strategic_project: {
          title: "Strategic Leadership Initiative",
          timeline: "Final 2-3 months of program",
          challenge: "Design and implement one strategic initiative that positions your department or property for future success",
          options: [
            "Innovation Implementation: Lead innovative change that improves long-term performance",
            "Strategic Process Improvement: Redesign operations for future efficiency and effectiveness", 
            "Future-Readiness Project: Prepare department for anticipated challenges or opportunities",
            "Strategic Partnership Development: Build relationships or systems that create long-term value"
          ],
          deliverables: [
            "Strategic opportunity analysis and initiative plan (1 page)",
            "Implementation approach with timeline and success metrics (1 page)",
            "Results documentation with strategic impact and lessons learned (1 page)"
          ],
          presentation: "15-minute presentation to CM and Regional Manager on strategic thinking and long-term leadership"
        },
        competency_validation: {
          evidence_portfolio: [
            "Pattern Recognition: Demonstrated ability to identify trends and anticipate future implications",
            "Innovation Leadership: Successfully implemented improvements that enhance long-term performance",
            "Strategic Problem Solving: Solved problems in ways that prevent future issues and create lasting improvements",
            "Strategic Planning: Set and achieved goals that connect daily work to long-term success"
          ],
          portfolio_defense: {
            duration: "20 minutes",
            components: [
              "Strategic Thinking Journey: How future-focused thinking has changed your leadership approach",
              "Strategic Impact Evidence: Specific examples of strategic decisions and their long-term benefits",
              "Team Strategic Development: How you've built strategic thinking in your team", 
              "Future Leadership Vision: How you'll continue developing strategic leadership capabilities"
            ]
          },
          cm_readiness_indicators: [
            "Property-Level Strategic Perspective: Consistently thinks beyond department to property-wide strategic implications",
            "Innovation and Improvement Leadership: Leads change that positions property for future success",
            "Strategic Problem-Solving: Addresses challenges in ways that create lasting improvements",
            "Long-Term Planning Capability: Sets and achieves goals that advance property strategic objectives"
          ]
        },
        success_metrics: {
          leading_indicators: [
            "Strategic questions asked and insights developed",
            "Innovation attempts and improvement implementations",
            "Future-focused problem-solving approach",
            "Strategic goal progress and team alignment"
          ],
          lagging_indicators: [
            "Department performance improvements with lasting impact",
            "Innovation success and operational enhancement",
            "Problem recurrence reduction and systematic improvements",
            "Strategic goal achievement and contribution to property success"
          ],
          curiosity_growth_indicators: [
            "Strategic patterns recognized and acted upon",
            "Innovation experiments attempted and lessons learned",
            "Long-term thinking applied to daily decisions",
            "Others developed in strategic thinking and future focus"
          ]
        },
        custom_content_development: {
          high_priority: [
            "Pattern Recognition for Property Leaders (30 minutes) - Simple framework for spotting operational trends",
            "Future-Focused Problem Solving (30 minutes) - Framework for solving problems to prevent recurrence",
            "Strategic Planning for Department Leaders (45 minutes) - Practical strategic planning for department supervisors"
          ],
          medium_priority: [
            "Strategic thinking examples for existing leadership courses",
            "Property management strategic scenarios and case studies"
          ],
          low_priority: [
            "Advanced strategic analysis tools",
            "Industry strategic planning resources"
          ]
        },
        program_philosophy: "This refined framework transforms strategic thinking from \"big picture planning\" into \"future-focused daily decisions.\" Every activity connects to real department leadership while building the strategic mindset needed for Community Manager success. The goal isn't to become a strategic planning expert - it's to think strategically every day. Each competency builds strategic awareness and future-focused thinking that makes Navigators more effective leaders today while preparing them for property-level strategic responsibilities. Curiosity drives strategic development. By constantly asking \"what does this mean for our future?\" and \"how can we be better prepared?\", Navigators develop intuitive strategic thinking. Strategic thinking is practical leadership. The best strategic thinking comes from leaders who can connect daily decisions to long-term success, creating strategic excellence that elevates current performance while building future capability."
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
      
      // First, try to use the consistent demo user
      const demoUserId = "demo-user-123";
      try {
        console.log('Trying to get demo user:', demoUserId);
        const response = await axios.get(`${API}/users/${demoUserId}`, axiosConfig);
        userData = response.data;
        console.log('Found demo user:', userData);
        setStoredUserId(demoUserId); // Store this ID for consistency
      } catch (error) {
        console.log('Demo user not found, trying stored user...');
        
        // If demo user doesn't exist, try stored user
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
      }
        
        // If no demo user exists, create one with the consistent demo ID
        if (!userData) {
          console.log('Creating demo user with consistent ID...');
          const userPayload = {
            id: "demo-user-123", // Use consistent demo ID
            email: "demo@earnwings.com",
            name: "Demo Navigator",
            role: "participant",
            level: "navigator"
          };
          console.log('User payload:', userPayload);
          
          const createResponse = await axios.post(`${API}/users`, userPayload, axiosConfig);
          userData = createResponse.data;
          console.log('Created demo user:', userData);
          setStoredUserId(userData.id);
        }
        console.log('Created new user:', userData);
        setStoredUserId(userData.id);
        
        // Seed sample tasks for demo
        try {
          await axios.post(`${API}/admin/seed-tasks`, {}, axiosConfig);
          console.log('Sample tasks seeded');
        } catch (e) {
          console.log('Tasks already seeded or error:', e.message);
        }
      
      console.log('Setting user data and loading user data...');
      setUser(userData);
      
      // Set up local refined competency structure first
      const refinedCompetencies = await setupRefinedCompetencies();
      
      // Then load progress data from backend
      await loadUserData(userData.id, refinedCompetencies);
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

  const setupRefinedCompetencies = async () => {
    // Set up the refined local competency structure
    const refinedCompetencies = {
      leadership_supervision: {
        name: "Leadership & Supervision",
        description: "Leadership Isn't a Title, It's How You Show Up Every Day",
        philosophy: "The Navigator Leadership & Supervision development transforms department supervisors into inspiring people leaders through their daily work. Every task builds real leadership skills while creating tangible value for residents and the property. This is learning in action, not learning in addition.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Curiosity-driven leadership development through authentic work experiences",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "leadership_supervision",
        curiosity_ignition: {
          title: "Leadership Curiosity Assessment",
          description: "Before diving in, spark curiosity about your leadership journey",
          time_required: "5 minutes of thinking",
          reflection_prompts: [
            "What's one leadership moment from this week that I keep thinking about?",
            "If I could ask any great leader three questions, what would they be?",
            "What does leadership look like when no one's watching?",
            "How do I want people to feel after working with me?"
          ],
          setup_requirement: "Create a simple place to capture leadership observations, questions, and 'aha moments' throughout the program."
        },
        sub_competencies: {
          inspiring_team_motivation: {
            name: "Inspiring Team Motivation & Engagement",
            description: "What makes someone excited to come to work for you specifically?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "What makes someone excited to come to work for me specifically?",
            foundation_courses: [
              {
                title: "Being a Team Player",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Foundation of collaborative mindset",
                link_type: "external",
                url: "https://performancehq.com/team-player"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Motivation Detective Work",
                in_flow_activity: "During your weekly one-on-ones, ask each team member: 'What made you most excited about work this week?'",
                document_section: {
                  title: "Team Motivation Insights",
                  description: "What you're learning about what motivates each person",
                  portfolio_integration: true
                },
                leadership_integration: "Apply motivation insights to daily interactions",
                journal_prompt: "What surprised me about what motivates my team members? How can I use these insights in my daily leadership?"
              },
              {
                month: 2,
                title: "Energy Creation Experiments",
                in_flow_activity: "Try one new approach each week to boost team energy based on what you learned about their motivations",
                document_section: {
                  title: "Motivation Experiment Results",
                  description: "What you tried and how team members responded",
                  portfolio_integration: true
                },
                operational_integration: "Build motivation boosters into regular operations",
                journal_prompt: "Which motivation experiments had the biggest impact? How can I make energy creation a natural part of my leadership style?"
              },
              {
                month: 3,
                title: "Recognition Revolution",
                in_flow_activity: "Develop and implement recognition practices that connect to what each person finds motivating",
                document_section: {
                  title: "Personal Recognition System",
                  description: "Recognition approaches tailored to each team member",
                  portfolio_integration: true
                },
                strategic_integration: "Connect individual recognition to department goals",
                curiosity_question: "How can recognition become so personalized and timely that it feels natural rather than forced?"
              }
            ],
            competency_gate: "Team members can articulate what motivates them + Recognition system implemented"
          },
          mastering_difficult_conversations: {
            name: "Mastering Difficult Conversations",
            description: "How do I turn the conversations I dread into opportunities for stronger relationships?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I turn the conversations I dread into opportunities for stronger relationships?",
            foundation_courses: [
              {
                title: "Conflict Resolution (Supervisor Version)",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Advanced conflict management techniques",
                link_type: "external",
                url: "https://performancehq.com/conflict-resolution"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Conversation Courage Building",
                in_flow_activity: "Practice having one 'slightly difficult' conversation each week with increasing confidence",
                document_section: {
                  title: "Difficult Conversation Practice Log",
                  description: "Conversations you've had and what you learned",
                  portfolio_integration: true
                },
                leadership_integration: "Apply conversation skills to daily interactions",
                journal_prompt: "What makes difficult conversations easier for me? How has my confidence in addressing issues changed?"
              },
              {
                month: 2,
                title: "Relationship-First Approach",
                in_flow_activity: "Focus on strengthening relationships before, during, and after difficult conversations",
                document_section: {
                  title: "Relationship Impact Results",
                  description: "How focusing on relationships changed conversation outcomes",
                  portfolio_integration: true
                },
                cross_functional_integration: "Practice difficult conversations across departments",
                journal_prompt: "How does leading with relationship care change the dynamic of difficult conversations?"
              },
              {
                month: 3,
                title: "Proactive Problem Prevention",
                in_flow_activity: "Develop systems for addressing small issues before they become difficult conversations",
                document_section: {
                  title: "Prevention Systems in Action",
                  description: "Systems you've created to prevent conflicts",
                  portfolio_integration: true
                },
                operational_integration: "Build conflict prevention into regular management practices",
                curiosity_question: "How can I create such open communication that difficult conversations become rare because issues get addressed early?"
              }
            ],
            competency_gate: "Successfully navigate challenging conversation + Demonstrate relationship strengthening"
          },
          building_collaborative_culture: {
            name: "Building Collaborative Team Culture",
            description: "How do I create a team environment where collaboration feels natural, not forced?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I create a team environment where collaboration feels natural, not forced?",
            foundation_courses: [
              {
                title: "Building a Team Culture",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Creating unified team environment",
                link_type: "external",
                url: "https://performancehq.com/team-culture"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Culture Assessment & Vision",
                in_flow_activity: "Observe current team dynamics and involve team in envisioning ideal collaborative culture",
                document_section: {
                  title: "Team Culture Vision",
                  description: "Current state and collaborative vision for your team",
                  portfolio_integration: true
                },
                strategic_integration: "Connect team culture to department and property goals",
                journal_prompt: "What does great collaboration look like in our specific work environment? What cultural shifts would make the biggest difference?"
              },
              {
                month: 2,
                title: "Collaboration Catalyst Activities",
                in_flow_activity: "Implement practices that naturally encourage team collaboration and mutual support",
                document_section: {
                  title: "Collaboration Success Stories",
                  description: "Examples of improved teamwork and collaboration",
                  portfolio_integration: true
                },
                leadership_integration: "Model collaborative leadership behavior",
                journal_prompt: "Which collaboration practices feel most natural to my team? How has increased collaboration affected our work quality?"
              },
              {
                month: 3,
                title: "Culture Sustainability",
                in_flow_activity: "Create systems and practices that maintain collaborative culture over time",
                document_section: {
                  title: "Culture Maintenance Systems",
                  description: "Sustainable practices for maintaining collaborative culture",
                  portfolio_integration: true
                },
                operational_integration: "Build collaboration into routine operations and processes",
                curiosity_question: "How can collaborative culture become so natural that it continues even when I'm not directly involved?"
              }
            ],
            competency_gate: "Measurable improvement in team collaboration + Sustainable culture practices implemented"
          },
          developing_others_success: {
            name: "Developing Others for Success",
            description: "How do I help each team member grow in ways that matter to them and benefit our property?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I help each team member grow in ways that matter to them and benefit our property?",
            foundation_courses: [
              {
                title: "Performance Management",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Developing and managing team performance",
                link_type: "external",
                url: "https://performancehq.com/performance-management"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Individual Development Discovery",
                in_flow_activity: "Have development-focused conversations with each team member to understand their growth interests",
                document_section: {
                  title: "Team Development Plans",
                  description: "Individual development goals and growth opportunities for each team member",
                  portfolio_integration: true
                },
                financial_integration: "Connect individual development to property value creation",
                journal_prompt: "What development opportunities would most benefit each team member and our property? How can I support growth that serves both?"
              },
              {
                month: 2,
                title: "Development in Daily Work",
                in_flow_activity: "Create opportunities for skill building and growth within regular work responsibilities",
                document_section: {
                  title: "Growth-in-Work Examples",
                  description: "How you've created development opportunities within daily operations",
                  portfolio_integration: true
                },
                cross_functional_integration: "Arrange development opportunities with other departments",
                journal_prompt: "How can development become part of how we work rather than something extra? What growth opportunities exist in our daily activities?"
              },
              {
                month: 3,
                title: "Success Celebration & Future Planning",
                in_flow_activity: "Recognize team member growth achievements and plan next development steps",
                document_section: {
                  title: "Development Success Stories",
                  description: "Team member growth achievements and future development plans",
                  portfolio_integration: true
                },
                leadership_integration: "Use team member development to strengthen overall team capability",
                curiosity_question: "How can I make development so integrated into our work that team members constantly grow while delivering great results?"
              }
            ],
            competency_gate: "Each team member has clear development plan + Demonstrated skill/career growth"
          }
        },
        // Additional leadership framework elements...
        leadership_integration_activities: {
          weekly_cm_shadowing: {
            duration: "15 minutes weekly - rotated focus",
            month_1_3: "Leadership style observation and daily leadership decisions",
            month_4_6: "Team development practices and people leadership approaches",
            month_7_9: "Communication effectiveness and relationship building",
            month_10_12: "Leadership challenges and advancement preparation"
          },
          cross_department_collaboration: {
            duration: "Monthly - 20 minutes",
            activities: [
              "Share leadership insights with opposite department Navigator",
              "Collaborate on cross-department team initiatives",
              "Practice leadership in property-wide scenarios"
            ]
          },
          leadership_curiosity_journal: {
            duration: "5 minutes weekly",
            focus: [
              "Document leadership observations, questions, and insights",
              "Track 'aha moments' when leadership approaches work or don't work",
              "Reflect on leadership growth and team development"
            ]
          }
        },
        culminating_leadership_project: {
          title: "Leadership Excellence Initiative",
          timeline: "Final 2-3 months of program",
          challenge: "Design and implement one leadership initiative that demonstrates your growth as a people leader",
          options: [
            "Team Development Program: Create comprehensive development program for your team",
            "Leadership Culture Project: Lead initiative that improves property-wide leadership culture",
            "Succession Planning: Develop and implement plan for developing future leaders",
            "Cross-Department Leadership: Lead initiative requiring leadership across multiple departments"
          ],
          deliverables: [
            "Leadership opportunity analysis and initiative plan (1 page)",
            "Implementation approach with team involvement (1 page)",
            "Results documentation with leadership impact and lessons learned (1 page)"
          ],
          presentation: "15-minute presentation to CM and Regional Manager on leadership development and people impact"
        },
        competency_validation: {
          evidence_portfolio: [
            "Team Motivation: Demonstrated ability to inspire and motivate team members",
            "Difficult Conversations: Successfully navigated challenging conversations with relationship building",
            "Collaborative Culture: Created team environment where collaboration thrives",
            "Development Leadership: Evidence of team member growth and development under your leadership"
          ],
          portfolio_defense: {
            duration: "20 minutes",
            components: [
              "Leadership Journey Story: How your leadership approach has evolved",
              "People Impact Evidence: Specific examples of team development and motivation",
              "Relationship Building: How you've strengthened relationships through leadership",
              "Future Leadership Vision: How you'll continue developing as a people leader"
            ]
          },
          cm_readiness_indicators: [
            "People Leadership: Consistently develops and motivates team members",
            "Relationship Excellence: Builds strong working relationships across all levels",
            "Communication Mastery: Handles difficult conversations with skill and care",
            "Culture Development: Creates positive team environment that drives results"
          ]
        }
      },
      financial_management: {
        name: "Financial Management & Business Acumen",
        description: "Every Decision Has a Dollar Impact - Make Them Count",
        philosophy: "The Navigator Financial Management development transforms department supervisors into financially-savvy leaders who understand the money side of property management. Every activity connects daily decisions to financial outcomes while building the business acumen essential for Community Manager success.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Financial curiosity and business understanding through real budget and revenue work",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "financial_management",
        curiosity_ignition: {
          title: "💰 Financial Curiosity Assessment",
          description: "Before diving in, spark curiosity about the money side of your work",
          time_required: "5 minutes of thinking",
          reflection_prompts: [
            "What's one decision I made this week that probably had a financial impact I didn't consider?",
            "If I owned this property, what would keep me up at night financially?",
            "How does my department's work show up in dollars and cents?",
            "What financial questions do I wish I knew how to answer?"
          ],
          setup_requirement: "Create a simple place to capture financial observations, questions, and 'connection moments' throughout the program."
        },
        sub_competencies: {
          property_pl_understanding: {
            name: "Property P&L Understanding",
            description: "How does my department's daily work show up on the property's financial statement?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How does my department's daily work show up on the property's financial statement?",
            foundation_courses: [
              {
                title: "Property Management Financials",
                duration: "1 hour 15 minutes",
                platform: "PerformanceHQ",
                description: "Understanding property financial statements",
                link_type: "external"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "P&L Connection Discovery",
                in_flow_activity: "Review last month's P&L with your CM and identify where your department's work appears",
                document_section: {
                  title: "Department P&L Impact Map",
                  description: "Where and how your department shows up in property financials",
                  portfolio_integration: true
                },
                leadership_integration: "Share P&L insights with your team to build financial awareness",
                journal_prompt: "Where does my department create revenue and where do we create expenses? What surprised me about our financial impact?"
              },
              {
                month: 2,
                title: "Financial Decision Making",
                in_flow_activity: "For every significant department decision, consider and document the financial impact",
                document_section: {
                  title: "Financial Decision Log",
                  description: "Daily decisions and their financial implications",
                  portfolio_integration: true
                },
                operational_integration: "Build financial thinking into routine decision processes",
                journal_prompt: "How has thinking about money changed the way I make decisions? What decisions have bigger financial impact than I realized?"
              },
              {
                month: 3,
                title: "P&L Improvement Ideas",
                in_flow_activity: "Generate and implement ideas for improving your department's financial contribution",
                document_section: {
                  title: "Financial Improvement Results",
                  description: "Ideas you've implemented to improve department financial performance",
                  portfolio_integration: true
                },
                strategic_integration: "Connect improvement ideas to long-term property financial goals",
                curiosity_question: "What could my department do differently to have an even more positive financial impact on the property?"
              }
            ],
            competency_gate: "Accurately explain department's P&L impact + Implement financial improvement"
          },
          departmental_budget_management: {
            name: "Departmental Budget Management",
            description: "How do I manage my department's money like it's my own?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I manage my department's money like it's my own?",
            foundation_courses: [
              {
                title: "Budgeting Basics",
                duration: "45 minutes",
                platform: "PerformanceHQ",
                description: "Fundamental budgeting principles",
                link_type: "external"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Budget Reality Check",
                in_flow_activity: "Track actual spending vs budget for 4 weeks and understand variance drivers",
                document_section: {
                  title: "Budget Variance Analysis",
                  description: "Where actual spending differs from budget and why",
                  portfolio_integration: true
                },
                financial_integration: "Connect budget management to property-wide financial performance",
                journal_prompt: "What causes our budget variances? How can I better predict and control department spending?"
              },
              {
                month: 2,
                title: "Smart Spending Strategies",
                in_flow_activity: "Implement cost-saving measures while maintaining or improving service quality",
                document_section: {
                  title: "Cost Management Success Stories",
                  description: "Ways you've reduced costs without sacrificing quality",
                  portfolio_integration: true
                },
                cross_functional_integration: "Share cost-saving ideas with other departments",
                journal_prompt: "What spending actually adds value vs. what spending is just habit? How can I be smarter with department money?"
              },
              {
                month: 3,
                title: "Budget Planning & Forecasting",
                in_flow_activity: "Participate in next year's budget planning with data-driven recommendations",
                document_section: {
                  title: "Budget Planning Contribution",
                  description: "Your input and recommendations for department budget planning",
                  portfolio_integration: true
                },
                leadership_integration: "Involve team in budget awareness and cost-conscious decision making",
                curiosity_question: "How can I make budget management feel natural rather than restrictive for my team and me?"
              }
            ],
            competency_gate: "Successfully manage department within budget + Contribute to budget planning process"
          },
          cost_conscious_decision_making: {
            name: "Cost-Conscious Decision Making",
            description: "How do I make every dollar count while still delivering great results?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I make every dollar count while still delivering great results?",
            foundation_courses: [
              {
                title: "Financial Decision Making",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Framework for making cost-conscious decisions",
                custom_content_needed: true
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "ROI Thinking Development",
                in_flow_activity: "For every significant purchase or investment, calculate and document expected return",
                document_section: {
                  title: "ROI Decision Examples",
                  description: "Decisions you've made using return on investment thinking",
                  portfolio_integration: true
                },
                operational_integration: "Build ROI thinking into routine purchasing decisions",
                journal_prompt: "What purchases or investments have delivered the best return? How has ROI thinking changed my decision making?"
              },
              {
                month: 2,
                title: "Value vs. Cost Analysis",
                in_flow_activity: "Practice distinguishing between cost (what we pay) and value (what we get) in department decisions",
                document_section: {
                  title: "Value Creation Examples",
                  description: "How you've maximized value while managing costs",
                  portfolio_integration: true
                },
                strategic_integration: "Connect value thinking to long-term property strategy",
                journal_prompt: "Where are we getting great value for our money? Where are we overpaying for what we get?"
              },
              {
                month: 3,
                title: "Cost-Conscious Culture",
                in_flow_activity: "Develop team practices that naturally consider cost and value in daily decisions",
                document_section: {
                  title: "Cost-Conscious Team Practices",
                  description: "How your team has embraced cost-conscious decision making",
                  portfolio_integration: true
                },
                leadership_integration: "Teach and model cost-conscious thinking for your team",
                curiosity_question: "How can cost-consciousness become a natural part of how my team thinks rather than a restriction?"
              }
            ],
            competency_gate: "Demonstrate consistent ROI-based decision making + Team shows cost-conscious behavior"
          },
          financial_communication_business_understanding: {
            name: "Financial Communication & Business Understanding",
            description: "How do I speak confidently about money and business impact?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I speak confidently about money and business impact?",
            foundation_courses: [
              {
                title: "Business Communication Essentials",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Professional business communication skills",
                link_type: "external"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Financial Vocabulary Building",
                in_flow_activity: "Learn and practice using financial terms and concepts in daily conversations",
                document_section: {
                  title: "Financial Communication Growth",
                  description: "How your comfort with financial discussions has improved",
                  portfolio_integration: true
                },
                cross_functional_integration: "Practice financial discussions with other department leaders",
                journal_prompt: "How has my comfort with financial conversations changed? What financial concepts do I now understand that I didn't before?"
              },
              {
                month: 2,
                title: "Business Impact Storytelling",
                in_flow_activity: "Practice explaining your department's work in terms of business impact and value creation",
                document_section: {
                  title: "Business Impact Stories",
                  description: "How you've learned to communicate department value in business terms",
                  portfolio_integration: true
                },
                leadership_integration: "Help team members understand and communicate their business impact",
                journal_prompt: "How can I tell our department's story in a way that clearly shows business value? What impact are we having that others might not see?"
              },
              {
                month: 3,
                title: "Financial Presentation & Reporting",
                in_flow_activity: "Present financial information or business case to CM with confidence and clarity",
                document_section: {
                  title: "Financial Presentation Success",
                  description: "Financial presentations or business cases you've delivered",
                  portfolio_integration: true
                },
                strategic_integration: "Connect financial communication to property strategic discussions",
                curiosity_question: "How can I make financial discussions feel natural and valuable rather than intimidating?"
              }
            ],
            competency_gate: "Successfully present financial information to leadership + Demonstrate business acumen in discussions"
          }
        },
        // Additional financial framework elements would be added here...
      },
      operational_management: {
        name: "Operational Management",
        description: "Great Operations Are Invisible - Bad Operations Are Obvious",
        philosophy: "The Navigator Operational Management development transforms department supervisors into systems-thinking leaders who create operational excellence through daily work. Every activity builds understanding of how processes, systems, and efficiency create exceptional resident experience while reducing costs and complexity.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Systems thinking through daily operational improvements",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "operational_management",
        curiosity_ignition: {
          title: "⚙️ Operations Curiosity Assessment",
          description: "Before diving in, spark curiosity about how work actually gets done",
          time_required: "5 minutes of thinking",
          reflection_prompts: [
            "What's one thing that happens smoothly every day that residents never have to think about?",
            "If I could fix one operational frustration this week, what would have the biggest impact?",
            "What operational 'magic' do I create that others might not notice?",
            "How do the systems I manage affect everyone else's ability to do great work?"
          ],
          setup_requirement: "Create a simple place to capture operational observations, improvement ideas, and 'systems thinking moments' throughout the program."
        },
        sub_competencies: {
          process_improvement_efficiency: {
            name: "Process Improvement & Efficiency",
            description: "What's one process that could work better if I thought about it differently?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "What's one process that could work better if I thought about it differently?",
            foundation_courses: [
              {
                title: "Process Improvement Fundamentals",
                duration: "45 minutes",
                platform: "PerformanceHQ",
                description: "Basic process analysis and improvement techniques",
                link_type: "external"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Process Mapping & Analysis",
                in_flow_activity: "Map out one key department process and identify bottlenecks or inefficiencies",
                document_section: {
                  title: "Process Improvement Opportunities",
                  description: "Process maps and improvement opportunities you've identified",
                  portfolio_integration: true
                },
                operational_integration: "Build process thinking into daily workflow management",
                journal_prompt: "What processes work smoothly vs. create frustration? Where are the biggest opportunities for improvement?"
              },
              {
                month: 2,
                title: "Efficiency Implementation",
                in_flow_activity: "Implement and test one process improvement each week",
                document_section: {
                  title: "Process Improvement Results",
                  description: "Improvements you've tested and their impact",
                  portfolio_integration: true
                },
                leadership_integration: "Involve team in identifying and implementing process improvements",
                journal_prompt: "Which process improvements made the biggest difference? How can I make process improvement a regular part of how we work?"
              },
              {
                month: 3,
                title: "Systems Integration",
                in_flow_activity: "Look for ways your improved processes can work better with other departments",
                document_section: {
                  title: "Cross-Department Process Coordination",
                  description: "How your process improvements benefit other departments",
                  portfolio_integration: true
                },
                cross_functional_integration: "Share process improvements with other department leaders",
                curiosity_question: "How can process improvement become automatic rather than something I have to remember to do?"
              }
            ],
            competency_gate: "Successfully implement measurable process improvement + Document impact on efficiency"
          },
          quality_control_standards: {
            name: "Quality Control & Standards",
            description: "How do I create quality standards that actually get followed?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I create quality standards that actually get followed?",
            foundation_courses: [
              {
                title: "Quality Management Principles",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Creating and maintaining quality standards",
                link_type: "external"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Quality Standards Development",
                in_flow_activity: "Work with team to define clear, practical quality standards for key work",
                document_section: {
                  title: "Quality Standards Documentation",
                  description: "Quality standards you've developed with your team",
                  portfolio_integration: true
                },
                strategic_integration: "Connect quality standards to resident satisfaction and property goals",
                journal_prompt: "What does 'quality work' mean in our department? How can we make standards clear and achievable?"
              },
              {
                month: 2,
                title: "Quality Monitoring & Feedback",
                in_flow_activity: "Implement simple systems to monitor quality and provide helpful feedback",
                document_section: {
                  title: "Quality Monitoring System",
                  description: "How you track and maintain quality standards",
                  portfolio_integration: true
                },
                operational_integration: "Build quality monitoring into routine operations",
                journal_prompt: "What quality monitoring actually helps vs. feels bureaucratic? How can quality feedback be helpful rather than punitive?"
              },
              {
                month: 3,
                title: "Continuous Quality Improvement",
                in_flow_activity: "Use quality data to continuously improve standards and processes",
                document_section: {
                  title: "Quality Improvement Examples",
                  description: "How quality monitoring has led to actual improvements",
                  portfolio_integration: true
                },
                leadership_integration: "Engage team in quality improvement and standard evolution",
                curiosity_question: "How can quality standards evolve and improve rather than just stay static?"
              }
            ],
            competency_gate: "Implement quality standards that team follows + Demonstrate continuous improvement"
          },
          safety_leadership_risk_awareness: {
            name: "Safety Leadership & Risk Awareness",
            description: "How do I create a department where safety is automatic, not an afterthought?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I create a department where safety is automatic, not an afterthought?",
            foundation_courses: [
              {
                title: "Safety Leadership",
                duration: "1 hour 30 minutes",
                platform: "PerformanceHQ",
                description: "Leading safety culture and risk management",
                link_type: "external"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Risk Assessment & Safety Culture",
                in_flow_activity: "Conduct thorough safety assessment and work with team to build safety awareness",
                document_section: {
                  title: "Safety Assessment & Culture Plan",
                  description: "Safety risks you've identified and culture improvements planned",
                  portfolio_integration: true
                },
                financial_integration: "Connect safety improvements to cost reduction and liability management",
                journal_prompt: "What safety risks exist that we might not be seeing? How can I make safety discussions productive rather than scary?"
              },
              {
                month: 2,
                title: "Proactive Safety Measures",
                in_flow_activity: "Implement preventive safety measures and systems to reduce risk",
                document_section: {
                  title: "Safety Improvement Implementation",
                  description: "Preventive safety measures you've put in place",
                  portfolio_integration: true
                },
                operational_integration: "Build safety considerations into all operational procedures",
                journal_prompt: "Which safety improvements have made the biggest difference? How can safety become automatic in our daily work?"
              },
              {
                month: 3,
                title: "Safety Leadership & Training",
                in_flow_activity: "Develop team safety leadership and create ongoing safety training",
                document_section: {
                  title: "Safety Leadership Development",
                  description: "How you've built safety leadership in your team",
                  portfolio_integration: true
                },
                cross_functional_integration: "Share safety improvements and practices with other departments",
                curiosity_question: "How can I make everyone on my team feel responsible for safety rather than it being just my job?"
              }
            ],
            competency_gate: "Implement measurable safety improvements + Team demonstrates safety leadership"
          },
          technology_system_optimization: {
            name: "Technology & System Optimization",
            description: "How do I make technology work for us instead of against us?",
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            core_learning_question: "How do I make technology work for us instead of against us?",
            foundation_courses: [
              {
                title: "Technology Management for Leaders",
                duration: "45 minutes",
                platform: "Custom Content",
                description: "Using technology to improve operations",
                custom_content_needed: true
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Technology Assessment & Optimization",
                in_flow_activity: "Evaluate current technology use and identify optimization opportunities",
                document_section: {
                  title: "Technology Optimization Plan",
                  description: "Technology improvements and optimizations you've identified",
                  portfolio_integration: true
                },
                strategic_integration: "Connect technology optimization to long-term operational strategy",
                journal_prompt: "Where is technology helping us vs. creating extra work? What technology opportunities might we be missing?"
              },
              {
                month: 2,
                title: "System Integration & Efficiency",
                in_flow_activity: "Improve how different systems work together to reduce manual work",
                document_section: {
                  title: "System Integration Improvements",
                  description: "Ways you've improved system integration and efficiency",
                  portfolio_integration: true
                },
                operational_integration: "Build system optimization into routine technology management",
                journal_prompt: "How can our systems work together better? Where are we doing manual work that technology could handle?"
              },
              {
                month: 3,
                title: "Technology Leadership & Training",
                in_flow_activity: "Develop team technology skills and create systems for ongoing optimization",
                document_section: {
                  title: "Technology Leadership Results",
                  description: "How you've built technology capability and optimization in your team",
                  portfolio_integration: true
                },
                leadership_integration: "Help team members become more effective with technology",
                curiosity_question: "How can technology continue to evolve and improve our operations rather than just stay static?"
              }
            ],
            competency_gate: "Implement technology improvements that measurably improve efficiency + Team demonstrates improved technology use"
          }
        }
        // Additional operational framework elements would be added here...
      },
      cross_functional_collaboration: {
        name: "Cross-Functional Collaboration",
        description: "Breaking Down Silos & Building Unified Property Teams",
        philosophy: "We Win Together - One Property, One Team. The Navigator Cross-Functional Collaboration development transforms department-focused leaders into property-wide team builders who understand that exceptional resident experience requires seamless collaboration between all functions. This isn't about getting along - it's about creating something better together than either department could create alone.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Building bridges between departments through shared projects and genuine partnership",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "cross_functional_collaboration",
        curiosity_ignition: {
          title: "🔥 Collaboration Curiosity Assessment",
          subtitle: "Before diving in, spark curiosity about working across departments",
          reflection_prompts: [
            "What's one thing the other department does that I wish I understood better?",
            "When have I seen leasing and maintenance work together in a way that created something amazing?",
            "What resident experience could we create if our departments worked together seamlessly?",
            "What would change if we thought of ourselves as one property team instead of separate departments?"
          ],
          journal_setup: "Create a simple place to capture collaboration observations, partnership ideas, and \"we're stronger together\" moments throughout the program."
        },
        sub_competencies: {
          understanding_other_department: {
            name: "Understanding & Appreciating the Other Department",
            description: "What would help me be a better partner to the other department?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Being a Team Player",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Foundation of collaborative mindset",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Maintenance For Office Staff",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Cross-functional operational understanding",
                available: true
              },
              {
                title: "Walking in Their Shoes",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Understanding what drives success in the other department",
                custom_content_needed: true
              },
              {
                title: "Cross-Functional Teamwork That Actually Works",
                duration: "12 minutes",
                platform: "YouTube",
                description: "Practical collaboration principles"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Department Curiosity Exploration",
                in_flow_activity: "Spend 30 minutes weekly with your opposite department counterpart, just observing and asking curious questions",
                document_section: {
                  title: "Department Discovery Journal", 
                  description: "Insights about how the other department really works",
                  portfolio_integration: true
                },
                leadership_integration: "Share what you're learning with your team to build appreciation",
                journal_prompt: "What surprised me most about how the other department operates? What challenges do they face that I never considered?"
              },
              {
                month: 2,
                title: "Appreciation in Action",
                in_flow_activity: "Find one specific way to make the other department's work easier each week",
                document_section: {
                  title: "Partnership Action Log",
                  description: "Concrete ways you've supported the other department",
                  portfolio_integration: true
                },
                operational_integration: "Build other department considerations into your daily decisions",
                journal_prompt: "What small actions have the biggest impact on our working relationship? How does helping them actually help residents?"
              },
              {
                month: 3,
                title: "Bridge Building",
                in_flow_activity: "Facilitate one conversation between your teams about how to work better together",
                document_section: {
                  title: "Team Bridge-Building Results",
                  description: "Improved understanding and cooperation between teams",
                  portfolio_integration: true
                },
                strategic_integration: "Connect department partnership to property-wide goals",
                curiosity_question: "How can appreciation and understanding become automatic between our departments?"
              }
            ],
            competency_gate: "Demonstrate improved working relationship with opposite department + Teams show increased cooperation"
          },
          unified_resident_experience: {
            name: "Unified Resident Experience Creation",
            description: "How can our departments work together to create resident experiences that neither could create alone?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Customer Relationship Management",
              duration: "2 hours",
              platform: "PerformanceHQ",
              description: "Comprehensive approach to resident service",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Resident Retention",
                duration: "1 hour 30 minutes",
                platform: "PerformanceHQ",
                description: "Holistic resident satisfaction approach",
                available: true
              },
              {
                title: "Customer Service 1: Be Proactive",
                duration: "30 minutes",
                platform: "PerformanceHQ",
                description: "Anticipating resident needs",
                available: true
              },
              {
                title: "Creating Seamless Customer Experience Across Teams",
                duration: "10 minutes",
                platform: "YouTube",
                description: "Cross-functional service excellence"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Resident Journey Mapping",
                in_flow_activity: "Map one resident's experience from move-in to renewal, identifying all touchpoints from both departments",
                document_section: {
                  title: "Resident Experience Map",
                  description: "Visual showing where departments interact with residents",
                  portfolio_integration: true
                },
                cross_functional_integration: "Work with opposite department Navigator to create the map together",
                journal_prompt: "Where in the resident journey do our departments create magic together? Where do we create confusion or frustration?"
              },
              {
                month: 2,
                title: "Coordinated Service Excellence",
                in_flow_activity: "Choose one resident touchpoint where departments can coordinate better and improve it together",
                document_section: {
                  title: "Service Coordination Success Story",
                  description: "Improved resident experience through department coordination",
                  portfolio_integration: true
                },
                financial_integration: "Connect improved coordination to resident satisfaction and retention",
                journal_prompt: "What does great coordination feel like from the resident's perspective? How can we make this coordination feel natural instead of forced?"
              },
              {
                month: 3,
                title: "Proactive Partnership Programs",
                in_flow_activity: "Create one small program or practice that proactively enhances resident experience through department partnership",
                document_section: {
                  title: "Partnership Program Results",
                  description: "Resident feedback and team satisfaction with collaborative initiative",
                  portfolio_integration: true
                },
                leadership_integration: "Involve both teams in designing and implementing the program",
                curiosity_question: "What resident experiences could we create if we always thought like partners instead of separate departments?"
              }
            ],
            competency_gate: "Successfully improve 1 resident touchpoint through collaboration + Measurable resident satisfaction improvement"
          },
          communication_across_departments: {
            name: "Effective Communication Across Departments", 
            description: "How do I communicate in a way that makes the other department want to work with me?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Building a Team Culture",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Creating unified team environment",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Leadership Booster: Communication Skills for Supervisors",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Clear communication techniques",
                available: true
              },
              {
                title: "Conflict Resolution (Supervisor Version)",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Managing disagreements constructively",
                available: true
              },
              {
                title: "Communication That Builds Bridges, Not Walls",
                duration: "8 minutes",
                platform: "YouTube",
                description: "Constructive cross-functional communication"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Communication Bridge Building",
                in_flow_activity: "Establish one regular communication practice with your opposite department counterpart",
                document_section: {
                  title: "Communication Practice Results",
                  description: "Improved information sharing and coordination",
                  portfolio_integration: true
                },
                operational_integration: "Build cross-department communication into routine operational practices",
                journal_prompt: "What communication practices prevent problems vs. create them? How can I make communication feel helpful instead of burdensome?"
              },
              {
                month: 2,
                title: "Collaborative Problem Solving",
                in_flow_activity: "When a problem affects both departments, involve both teams in finding the solution",
                document_section: {
                  title: "Collaborative Problem-Solving Examples",
                  description: "Problems solved better through department partnership",
                  portfolio_integration: true
                },
                strategic_integration: "Frame problems and solutions in terms of property-wide impact",
                journal_prompt: "What makes problem-solving feel collaborative vs. competitive? How do the best solutions consider both departments' needs?"
              },
              {
                month: 3,
                title: "Conflict Prevention & Resolution",
                in_flow_activity: "Address one source of recurring friction between departments and create a better way forward",
                document_section: {
                  title: "Conflict Resolution Success Story",
                  description: "Friction reduced through improved communication and understanding",
                  portfolio_integration: true
                },
                leadership_integration: "Model constructive conflict resolution for both teams",
                curiosity_question: "How can we turn the things that create friction into opportunities for better partnership?"
              }
            ],
            competency_gate: "Establish effective communication practices with other department + Successfully resolve cross-department conflict"
          },
          stakeholder_relationship_building: {
            name: "Stakeholder Relationship Building",
            description: "How do I build relationships where everyone wins and wants to work together again?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Building Relationships That Matter",
              duration: "45 minutes",
              platform: "Custom Content",
              description: "Professional relationship development with internal and external stakeholders",
              custom_content_needed: true
            },
            dive_deeper_resources: [
              {
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Professional communication with stakeholders",
                available: true
              },
              {
                title: "Business Etiquette",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Professional relationship skills",
                available: true
              },
              {
                title: "Building Professional Relationships That Last",
                duration: "15 minutes",
                platform: "YouTube",
                description: "Long-term relationship development"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Internal Stakeholder Partnership",
                in_flow_activity: "Identify key internal stakeholders (CM, other department leaders, home office contacts) and strengthen one relationship",
                document_section: {
                  title: "Stakeholder Relationship Development",
                  description: "Improved working relationships with internal partners",
                  portfolio_integration: true
                },
                cross_functional_integration: "Work with opposite department Navigator on shared stakeholder relationships",
                journal_prompt: "Which internal relationships could make everyone's work easier if they were stronger? What do these stakeholders need from me to be successful?"
              },
              {
                month: 2,
                title: "External Stakeholder Engagement",
                in_flow_activity: "Engage with one external stakeholder (vendor, resident, community partner) in a way that builds the relationship",
                document_section: {
                  title: "External Relationship Building Examples",
                  description: "Improved external partnerships that benefit the property",
                  portfolio_integration: true
                },
                financial_integration: "Connect stakeholder relationships to cost savings or revenue enhancement",
                journal_prompt: "What external relationships could create more value if they were partnerships instead of transactions?"
              },
              {
                month: 3,
                title: "Stakeholder Value Creation",
                in_flow_activity: "Find one way to create value for a stakeholder that also benefits your property",
                document_section: {
                  title: "Mutual Value Creation Examples",
                  description: "Win-win outcomes from stakeholder relationships",
                  portfolio_integration: true
                },
                strategic_integration: "Connect stakeholder relationships to long-term property success",
                curiosity_question: "How can I make every stakeholder interaction feel like the beginning of a valuable partnership?"
              }
            ],
            competency_gate: "Strengthen relationships with 2+ stakeholders + Create measurable value through improved relationships"
          }
        }
        // Additional collaboration framework elements would be added here...
      },
      strategic_thinking: {
        name: "Strategic Thinking",
        description: "Think Beyond Today - Lead for Tomorrow",
        philosophy: "The Navigator Strategic Thinking development transforms department supervisors into future-focused leaders who can see beyond daily tasks to identify opportunities, anticipate challenges, and make decisions that position the property for long-term success. This isn't about becoming a visionary CEO - it's about developing the strategic mindset essential for Community Manager effectiveness.",
        time_commitment: "~12 minutes per week + natural work integration",
        duration: "12-15 months (competency-based progression)",
        focus: "Strategic thinking through real department decisions and property planning",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 16,
        competency_area: "strategic_thinking",
        curiosity_ignition: {
          title: "🔥 Strategic Curiosity Assessment",
          subtitle: "Before diving in, spark curiosity about thinking strategically",
          reflection_prompts: [
            "What's one trend I've noticed at our property that might predict something bigger coming?",
            "If I could change one thing about how we operate that would still matter in two years, what would it be?",
            "What decision did a great leader make that seemed small but had big long-term impact?",
            "How would I run things differently if I knew I'd be here for the next five years?"
          ],
          journal_setup: "Create a simple place to capture strategic observations, pattern recognition, and \"thinking ahead\" moments throughout the program."
        },
        sub_competencies: {
          seeing_patterns_anticipating_trends: {
            name: "Seeing Patterns & Anticipating Trends",
            description: "What patterns in our daily work might tell me something important about our future?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "CM Weekly Meeting - Data Driven Decisions with Martin Knapp",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Using information to see what's coming",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Performance Management",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Using metrics to identify trends",
                available: true
              },
              {
                title: "Pattern Recognition for Property Leaders",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Simple framework for spotting trends in property operations",
                custom_content_needed: true
              },
              {
                title: "How to Spot Trends Before They're Obvious",
                duration: "10 minutes",
                platform: "YouTube",
                description: "Practical trend identification skills"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Pattern Detective Work",
                in_flow_activity: "During weekly property meetings, note one pattern or trend you observe in your department's data",
                document_section: {
                  title: "Pattern Recognition Log",
                  description: "Weekly observations of trends in your department",
                  portfolio_integration: true
                },
                operational_integration: "Connect patterns to daily operational decisions",
                journal_prompt: "What patterns do I see that others might be missing? What do these patterns suggest about what's coming?"
              },
              {
                month: 2,
                title: "Trend Impact Analysis",
                in_flow_activity: "Choose one pattern from Month 1 and think through what it might mean for your department's future",
                document_section: {
                  title: "Trend Impact Assessment",
                  description: "Simple analysis of what one trend could mean",
                  portfolio_integration: true
                },
                cross_functional_integration: "Discuss trend observations with opposite department Navigator",
                journal_prompt: "If this trend continues, what opportunities or challenges might we face? How should we prepare?"
              },
              {
                month: 3,
                title: "Proactive Planning",
                in_flow_activity: "Make one small change in your department based on a trend you've identified",
                document_section: {
                  title: "Proactive Action Results",
                  description: "Change you made based on trend analysis and its outcomes",
                  portfolio_integration: true
                },
                leadership_integration: "Share trend thinking with your team to build strategic awareness",
                curiosity_question: "How can pattern recognition become a natural part of how I think about our work?"
              }
            ],
            competency_gate: "Identify meaningful trend affecting department + Take proactive action based on trend analysis"
          },
          innovation_continuous_improvement: {
            name: "Innovation & Continuous Improvement Thinking",
            description: "What could we do differently that would make our work easier, better, or more effective?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Leadership 201",
              duration: "2 hours 5 minutes",
              platform: "PerformanceHQ",
              description: "Advanced leadership including innovation thinking",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Employee Motivation",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Creating culture that encourages new ideas",
                available: true
              },
              {
                title: "Effective Time Management",
                duration: "35 minutes",
                platform: "PerformanceHQ",
                description: "Finding time for improvement thinking",
                available: true
              },
              {
                title: "Innovation Starts with Small Improvements",
                duration: "8 minutes",
                platform: "YouTube",
                description: "Practical approach to workplace innovation"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Improvement Opportunity Hunting",
                in_flow_activity: "Weekly, identify one thing in your department that could work better",
                document_section: {
                  title: "Improvement Opportunity Log",
                  description: "Weekly ideas for making work better",
                  portfolio_integration: true
                },
                financial_integration: "Consider cost and benefit of improvement ideas",
                journal_prompt: "What improvements would have the biggest impact? What holds us back from making simple improvements?"
              },
              {
                month: 2,
                title: "Small Innovation Testing",
                in_flow_activity: "Try one small improvement or new approach each week",
                document_section: {
                  title: "Innovation Experiment Results",
                  description: "What you tried, what happened, what you learned",
                  portfolio_integration: true
                },
                strategic_integration: "Connect improvements to long-term department goals",
                journal_prompt: "Which small changes made the biggest difference? What did I learn about implementing improvements?"
              },
              {
                month: 3,
                title: "Innovation Culture Building",
                in_flow_activity: "Get your team involved in suggesting and testing improvements",
                document_section: {
                  title: "Team Innovation Examples",
                  description: "Improvements suggested and implemented by team members",
                  portfolio_integration: true
                },
                operational_integration: "Build improvement thinking into regular department operations",
                curiosity_question: "How can continuous improvement become as natural as daily operations for my team?"
              }
            ],
            competency_gate: "Successfully implement 2+ department improvements + Team demonstrates improvement mindset"
          },
          problem_solving_future_focus: {
            name: "Problem-Solving with Future Focus",
            description: "How do I solve this problem in a way that makes similar problems less likely in the future?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "CM Weekly Meeting - Extreme Ownership with Kate Reeves",
              duration: "1 hour",
              platform: "PerformanceHQ",
              description: "Taking ownership of solutions and outcomes",
              available: true
            },
            dive_deeper_resources: [
              {
                title: "Conflict Resolution (Supervisor Version)",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Strategic approach to resolving issues",
                available: true
              },
              {
                title: "Future-Focused Problem Solving",
                duration: "30 minutes",
                platform: "Custom Content",
                description: "Framework for solving problems in ways that prevent future issues",
                custom_content_needed: true
              },
              {
                title: "Root Cause Analysis Simplified",
                duration: "12 minutes",
                platform: "YouTube",
                description: "Getting to the real source of problems"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Root Cause Thinking",
                in_flow_activity: "When solving routine problems, dig deeper to understand what really caused them",
                document_section: {
                  title: "Root Cause Analysis Examples",
                  description: "Deeper thinking about what causes common problems",
                  portfolio_integration: true
                },
                cross_functional_integration: "Explore root causes that might involve both departments",
                journal_prompt: "What problems keep recurring because we're not addressing the real cause? What patterns do I see in our problems?"
              },
              {
                month: 2,
                title: "Solution Design for Long-Term Impact",
                in_flow_activity: "For each significant problem you solve, design the solution to prevent similar future problems",
                document_section: {
                  title: "Future-Focused Solution Examples",
                  description: "Solutions designed to prevent problem recurrence",
                  portfolio_integration: true
                },
                leadership_integration: "Involve team in designing solutions that address root causes",
                journal_prompt: "What solutions that seemed good short-term might create problems later? How can I think more long-term in my problem-solving?"
              },
              {
                month: 3,
                title: "Systematic Problem Prevention",
                in_flow_activity: "Create one simple system or process that prevents a category of problems",
                document_section: {
                  title: "Problem Prevention System",
                  description: "Process or practice that reduces future problems",
                  portfolio_integration: true
                },
                strategic_integration: "Connect problem prevention to property-wide efficiency goals",
                curiosity_question: "How can problem-solving become problem prevention? What systems could eliminate whole categories of issues?"
              }
            ],
            competency_gate: "Implement solution that addresses root cause + Create system that prevents future problems"
          },
          planning_goal_achievement: {
            name: "Planning & Goal Achievement with Strategic Perspective",
            description: "How do I set goals and make plans that connect our daily work to where we want to be long-term?",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 4,
            duration: "3-4 months",
            weekly_time: "~15 minutes",
            foundation_course: {
              title: "Strategic Planning for Department Leaders",
              duration: "45 minutes",
              platform: "Custom Content",
              description: "Simple approach to planning that connects daily work to bigger goals",
              custom_content_needed: true
            },
            dive_deeper_resources: [
              {
                title: "CM Weekly Meeting - Multipliers with Matt",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Strategic leadership that multiplies team effectiveness",
                available: true
              },
              {
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Communicating strategic plans effectively",
                available: true
              },
              {
                title: "Strategic Planning That Actually Works",
                duration: "15 minutes",
                platform: "YouTube",
                description: "Practical strategic planning approach"
              }
            ],
            monthly_activities: [
              {
                month: 1,
                title: "Strategic Goal Setting",
                in_flow_activity: "Set one strategic goal for your department that would matter in 6-12 months",
                document_section: {
                  title: "Strategic Goal Development",
                  description: "Goal that connects current work to future success",
                  portfolio_integration: true
                },
                financial_integration: "Connect strategic goal to department and property financial success",
                journal_prompt: "What goal would make the biggest difference for our long-term success? How does this goal connect to daily decisions?"
              },
              {
                month: 2,
                title: "Strategic Planning & Implementation",
                in_flow_activity: "Create simple plan for achieving your strategic goal and start implementing it",
                document_section: {
                  title: "Strategic Implementation Plan",
                  description: "Practical steps toward achieving strategic goal",
                  portfolio_integration: true
                },
                operational_integration: "Build strategic goal progress into regular operational routines",
                journal_prompt: "What's working in my strategic implementation? What obstacles require creative solutions?"
              },
              {
                month: 3,
                title: "Strategic Communication & Team Alignment",
                in_flow_activity: "Get your team involved in understanding and working toward the strategic goal",
                document_section: {
                  title: "Team Strategic Alignment Examples",
                  description: "How team members contribute to strategic goal",
                  portfolio_integration: true
                },
                cross_functional_integration: "Explore how strategic goal might connect with opposite department's goals",
                curiosity_question: "How can strategic thinking become part of how my team naturally thinks about our work?"
              }
            ],
            competency_gate: "Set and make progress on meaningful strategic goal + Team understands and contributes to strategic direction"
          }
        }
        // Additional strategic framework elements would be added here...
      }
    };
    
    setCompetencies(refinedCompetencies);
    return refinedCompetencies;
  };

  const loadUserData = async (userId, refinedCompetencies = null) => {
    try {
      // Load competencies progress from backend
      const compResponse = await axios.get(`${API}/users/${userId}/competencies`);
      const backendProgress = compResponse.data;
      
      // Use provided refined competencies or current state
      const baseCompetencies = refinedCompetencies || competencies;
      
      // Merge backend progress with local refined competency structure
      const mergedCompetencies = { ...baseCompetencies };
      
      // Update progress data from backend while keeping local structure
      Object.keys(backendProgress).forEach(areaKey => {
        if (mergedCompetencies[areaKey]) {
          // Update overall progress from backend
          mergedCompetencies[areaKey].overall_progress = backendProgress[areaKey].overall_progress || 0;
          mergedCompetencies[areaKey].completion_percentage = backendProgress[areaKey].overall_progress || 0;
          
          // Update sub-competency progress from backend
          const backendSubCompetencies = backendProgress[areaKey].sub_competencies || {};
          Object.keys(backendSubCompetencies).forEach(subKey => {
            if (mergedCompetencies[areaKey].sub_competencies && mergedCompetencies[areaKey].sub_competencies[subKey]) {
              const backendSubData = backendSubCompetencies[subKey];
              mergedCompetencies[areaKey].sub_competencies[subKey] = {
                ...mergedCompetencies[areaKey].sub_competencies[subKey],
                progress_percentage: backendSubData.completion_percentage || 0,
                completed_tasks: backendSubData.completed_tasks || 0,
                total_tasks: backendSubData.total_tasks || mergedCompetencies[areaKey].sub_competencies[subKey].total_tasks || 4
              };
            }
          });
        }
      });
      
      setCompetencies(mergedCompetencies);
      
      // Load portfolio with separate error handling
      try {
        console.log(`Loading portfolio for user: ${userId}`);
        const portfolioResponse = await axios.get(`${API}/users/${userId}/portfolio`);
        console.log('Portfolio response:', portfolioResponse.data);
        setPortfolio(portfolioResponse.data);
        console.log(`Successfully loaded ${portfolioResponse.data.length} portfolio items`);
      } catch (portfolioError) {
        console.error('Error loading portfolio:', portfolioError);
        // Initialize with empty portfolio if loading fails
        setPortfolio([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Keep using local refined competency structure if backend fails
    }
  };

  // Function to reload portfolio data
  const reloadPortfolio = async () => {
    if (!user?.id) return;
    
    try {
      console.log(`Reloading portfolio for user: ${user.id}`);
      const portfolioResponse = await axios.get(`${API}/users/${user.id}/portfolio`);
      console.log('Portfolio reload response:', portfolioResponse.data);
      setPortfolio(portfolioResponse.data);
      console.log(`Successfully reloaded ${portfolioResponse.data.length} portfolio items`);
    } catch (error) {
      console.error('Error reloading portfolio:', error);
      setPortfolio([]);
    }
  };

  // Function to automatically create portfolio item from task completion
  const createPortfolioFromTaskCompletion = async (taskData, competencyArea, evidenceDescription, evidenceFile = null) => {
    if (!user?.id) return null;

    try {
      const portfolioData = {
        title: `${taskData.title} - Evidence`,
        description: evidenceDescription,
        competency_areas: [competencyArea],
        tags: ['task-evidence', 'auto-generated'],
        visibility: 'private'
      };

      const formData = new FormData();
      Object.keys(portfolioData).forEach(key => {
        if (key === 'competency_areas' || key === 'tags') {
          formData.append(key, JSON.stringify(portfolioData[key]));
        } else {
          formData.append(key, portfolioData[key]);
        }
      });

      if (evidenceFile) {
        formData.append('file', evidenceFile);
      }

      const response = await axios.post(`${API}/users/${user.id}/portfolio`, formData);
      console.log('Auto-created portfolio item from task completion:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating portfolio item from task completion:', error);
      return null;
    }
  };

  // Function to automatically create flightbook entry from task completion
  const createFlightbookFromTaskCompletion = async (taskData, competencyArea, notes) => {
    if (!user?.id || !notes || notes.trim().length === 0) return null;

    try {
      // This will be expanded when we implement the full flightbook backend
      const flightbookEntry = {
        title: `${taskData.title} - Reflection`,
        content: notes,
        competency: competencyArea,
        type: 'task_reflection',
        source: 'task_completion',
        tags: ['task-reflection', 'auto-generated'],
        date: new Date()
      };

      console.log('Would create flightbook entry:', flightbookEntry);
      // TODO: Implement backend endpoint for flightbook entries
      
      return flightbookEntry;
    } catch (error) {
      console.error('Error creating flightbook entry from task completion:', error);
      return null;
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
      
      // Submit task completion
      const response = await axios.post(`${API}/users/${user.id}/tasks/complete`, formData);
      
      // Get task details for automatic portfolio/flightbook creation
      const taskData = competencyTasks.find(t => t.id === taskId);
      const competencyArea = selectedCompetency?.area;
      
      if (taskData && competencyArea) {
        // Automatically create portfolio item if there's evidence/file
        if (evidenceDescription.trim() || file) {
          console.log('Creating portfolio item from task completion...');
          await createPortfolioFromTaskCompletion(taskData, competencyArea, evidenceDescription, file);
        }
        
        // Automatically create flightbook entry if there are notes/reflections
        if (evidenceDescription.trim()) {
          console.log('Creating flightbook entry from task completion...');
          await createFlightbookFromTaskCompletion(taskData, competencyArea, evidenceDescription);
        }
      }
      
      // Reload competency progress and portfolio
      if (selectedCompetency) {
        await loadCompetencyTasks(selectedCompetency.area, selectedCompetency.sub);
      }
      await reloadPortfolio();
      
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  // Core Values Functions
  const handleAddCoreValueEntry = (valueKey) => {
    if (!newEntry.story.trim()) return;
    
    const entry = {
      id: Date.now(),
      story: newEntry.story,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    const updatedEntries = {
      ...coreValueEntries,
      [valueKey]: [...(coreValueEntries[valueKey] || []), entry]
    };
    
    setCoreValueEntries(updatedEntries);
    localStorage.setItem('core_value_entries', JSON.stringify(updatedEntries));
    
    // Reset form
    setNewEntry({ value: '', story: '', date: '' });
    setShowNewEntryForm(null);
  };

  const handleDeleteCoreValueEntry = (valueKey, entryId) => {
    const updatedEntries = {
      ...coreValueEntries,
      [valueKey]: coreValueEntries[valueKey].filter(entry => entry.id !== entryId)
    };
    
    setCoreValueEntries(updatedEntries);
    localStorage.setItem('core_value_entries', JSON.stringify(updatedEntries));
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
      formData.append('visibility', 'private'); // Default to private
      
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
      
      // Reload portfolio data directly
      const portfolioResponse = await axios.get(`${API}/users/${user.id}/portfolio`);
      setPortfolio(portfolioResponse.data);
      
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

  // Competency Task Management Functions
  const calculateCompetencyProgress = (areaKey, subKey) => {
    console.log(`Calculating progress for ${areaKey} -> ${subKey}`);
    
    // Get all tasks for this sub-competency
    const areaData = competencies[areaKey];
    if (!areaData) {
      console.log(`No area data found for ${areaKey}`);
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const subData = areaData.sub_competencies[subKey];
    if (!subData) {
      console.log(`No sub data found for ${subKey}`);
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Count Foundation Courses
    if (subData.foundation_courses) {
      totalTasks += subData.foundation_courses.length;
      console.log(`Foundation courses: ${subData.foundation_courses.length}`);
      
      subData.foundation_courses.forEach(course => {
        const isComplete = isCompetencyTaskComplete(areaKey, subKey, course.id);
        console.log(`Course ${course.id}: ${isComplete ? 'COMPLETE' : 'incomplete'}`);
        if (isComplete) {
          completedTasks++;
        }
      });
    }
    
    // Count Phase Activities and Deliverables
    if (subData.signature_activity?.phases) {
      console.log(`Found ${subData.signature_activity.phases.length} phases`);
      
      subData.signature_activity.phases.forEach(phase => {
        const phaseProgress = getCompetencyTaskNotes(areaKey, subKey, `phase_${phase.phase}_progress`) || '{}';
        let parsedProgress = {};
        try {
          parsedProgress = JSON.parse(phaseProgress);
        } catch (e) {
          parsedProgress = {};
        }
        
        // Count activities in this phase
        if (phase.activities) {
          totalTasks += phase.activities.length;
          phase.activities.forEach((activity, actIndex) => {
            const activityKey = `activity_${actIndex}`;
            if (parsedProgress[activityKey]?.completed) {
              completedTasks++;
            }
          });
        }
        
        // Count deliverables in this phase
        if (phase.deliverables) {
          totalTasks += phase.deliverables.length;
          phase.deliverables.forEach((deliverable, delIndex) => {
            const deliverableKey = `deliverable_${delIndex}`;
            if (parsedProgress[deliverableKey]?.completed) {
              completedTasks++;
            }
          });
        }
      });
    }
    
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    console.log(`Progress: ${completedTasks}/${totalTasks} = ${percentage}%`);
    return { completed: completedTasks, total: totalTasks, percentage };
  };

  const updateCompetencyProgress = () => {
    console.log('Updating competency progress...');
    const updatedCompetencies = { ...competencies };
    
    Object.keys(updatedCompetencies).forEach(areaKey => {
      const areaData = updatedCompetencies[areaKey];
      let areaCompletedTasks = 0;
      let areaTotalTasks = 0;
      
      // Calculate progress for each sub-competency
      Object.keys(areaData.sub_competencies || {}).forEach(subKey => {
        const subProgress = calculateCompetencyProgress(areaKey, subKey);
        
        areaCompletedTasks += subProgress.completed;
        areaTotalTasks += subProgress.total;
        
        // Update sub-competency progress
        updatedCompetencies[areaKey].sub_competencies[subKey] = {
          ...updatedCompetencies[areaKey].sub_competencies[subKey],
          progress_percentage: subProgress.percentage,
          completed_tasks: subProgress.completed,
          total_tasks: subProgress.total
        };
      });
      
      // Update area overall progress
      const areaPercentage = areaTotalTasks > 0 ? Math.round((areaCompletedTasks / areaTotalTasks) * 100) : 0;
      console.log(`Area ${areaKey}: ${areaCompletedTasks}/${areaTotalTasks} = ${areaPercentage}%`);
      
      updatedCompetencies[areaKey] = {
        ...updatedCompetencies[areaKey],
        overall_progress: areaPercentage,
        completion_percentage: areaPercentage,
        completed_tasks: areaCompletedTasks,
        total_tasks: areaTotalTasks
      };
    });
    
    console.log('Setting updated competencies:', updatedCompetencies);
    setCompetencies(updatedCompetencies);
  };

  // Function to handle journal reflection input changes (only updates localStorage, no flightbook creation)
  const handleJournalReflectionChange = (areaKey, subKey, taskId, notes, taskType = 'curiosity_reflection') => {
    const taskKey = `${areaKey}_${subKey}_${taskId}`;
    const updatedProgress = {
      ...competencyTaskProgress,
      [taskKey]: {
        completed: false, // Not completed until user blurs/finishes editing
        notes: notes,
        taskType: taskType,
        lastUpdated: new Date().toISOString()
      }
    };
    
    setCompetencyTaskProgress(updatedProgress);
    localStorage.setItem('competency_task_progress', JSON.stringify(updatedProgress));
  };

  // Function to handle when user finishes editing a journal reflection (onBlur)
  const handleJournalReflectionComplete = async (areaKey, subKey, taskId, notes, taskType = 'curiosity_reflection') => {
    console.log(`Finalizing journal reflection: ${areaKey} -> ${subKey} -> ${taskId}`);
    const taskKey = `${areaKey}_${subKey}_${taskId}`;
    
    // Update task as completed
    const updatedProgress = {
      ...competencyTaskProgress,
      [taskKey]: {
        completed: true,
        completedAt: new Date().toISOString(),
        notes: notes,
        taskType: taskType
      }
    };
    
    setCompetencyTaskProgress(updatedProgress);
    localStorage.setItem('competency_task_progress', JSON.stringify(updatedProgress));
    
    // Create or update flightbook entry for ANY meaningful journal/reflection entry
    if (notes && notes.trim().length > 10) {
      console.log(`Creating/updating flightbook entry from ${taskType} with content:`, notes.substring(0, 50) + '...');
      await createOrUpdateFlightbookFromJournalReflection(areaKey, subKey, taskId, notes, taskType);
    }
    
    // Update competency progress percentages
    setTimeout(() => {
      console.log('Triggering progress update with fresh data...');
      updateCompetencyProgressWithData(updatedProgress);
    }, 500);
  };

  const handleCompleteCompetencyTask = async (areaKey, subKey, taskId, notes = '', taskType = 'course') => {
    console.log(`Completing task: ${areaKey} -> ${subKey} -> ${taskId}`);
    const taskKey = `${areaKey}_${subKey}_${taskId}`;
    const updatedProgress = {
      ...competencyTaskProgress,
      [taskKey]: {
        completed: true,
        completedAt: new Date().toISOString(),
        notes: notes,
        taskType: taskType
      }
    };
    
    console.log('Updated progress object:', updatedProgress);
    setCompetencyTaskProgress(updatedProgress);
    localStorage.setItem('competency_task_progress', JSON.stringify(updatedProgress));
    
    // Automatically create flightbook entry for ANY meaningful journal/reflection entry
    if (notes && notes.trim().length > 10) {
      console.log(`Creating flightbook entry from ${taskType} with content:`, notes.substring(0, 50) + '...');
      await createFlightbookFromJournalReflection(areaKey, subKey, taskId, notes, taskType);
    }
    
    setShowTaskModal(null);
    setTaskNotes('');
    
    // Update competency progress percentages immediately with the new progress data
    setTimeout(() => {
      console.log('Triggering progress update with fresh data...');
      updateCompetencyProgressWithData(updatedProgress);
    }, 500);
  };

  // Function to automatically create or update flightbook entry from journal reflection
  const createOrUpdateFlightbookFromJournalReflection = async (areaKey, subKey, taskId, notes, taskType = 'curiosity_reflection') => {
    if (!user?.id || !notes || notes.trim().length === 0) return null;

    try {
      // Get the specific prompt text or activity description
      const competencyData = competencies[areaKey];
      let promptText = '';
      let entryTitle = 'Leadership Reflection';
      
      // Check if this is a curiosity ignition prompt
      if (subKey === 'curiosity_ignition' && competencyData?.curiosity_ignition?.reflection_prompts) {
        const promptIndex = parseInt(taskId.replace('prompt_', ''));
        promptText = competencyData.curiosity_ignition.reflection_prompts[promptIndex] || '';
        entryTitle = promptText ? `${promptText}` : 'Curiosity Reflection';
      }
      // Check if this is a monthly activity reflection
      else if (taskId.includes('_reflection') && competencyData?.sub_competencies?.[subKey]?.monthly_activities) {
        const activityKey = taskId.replace('_reflection', '');
        const monthlyActivities = competencyData.sub_competencies[subKey].monthly_activities;
        
        // Find the activity by searching through months
        for (const activity of monthlyActivities) {
          if (activity.id === activityKey) {
            promptText = activity.reflection || activity.journal_prompt || activity.curiosity_question || '';
            entryTitle = `Monthly Activity: ${activity.title}`;
            break;
          }
        }
      } 
      // Handle task evidence/notes
      else if (taskType === 'task_evidence') {
        entryTitle = `Task Evidence: ${taskId}`;
        promptText = 'Task completion evidence and learning notes';
      }
      // Generic reflection
      else {
        entryTitle = `${taskType.replace('_', ' ')}: ${subKey.replace('_', ' ')}`;
      }
      
      // Generate unique key for this journal entry based on its context
      const entryKey = `${areaKey}_${subKey}_${taskId}`;
      
      // Get existing entries and look for an existing entry for this context
      const existingEntries = JSON.parse(localStorage.getItem('flightbook_entries') || '[]');
      const existingEntryIndex = existingEntries.findIndex(entry => entry.entry_key === entryKey);
      
      const currentTime = new Date();
      
      if (existingEntryIndex >= 0) {
        // Update existing entry and add to version history
        const existingEntry = existingEntries[existingEntryIndex];
        
        // Only update if content has actually changed
        if (existingEntry.content !== notes) {
          // Initialize version history if it doesn't exist
          if (!existingEntry.version_history) {
            existingEntry.version_history = [{
              version: 1,
              content: existingEntry.content,
              updated_at: existingEntry.date || existingEntry.created_at || currentTime,
              change_summary: 'Original version'
            }];
          }
          
          // Add current content to version history
          existingEntry.version_history.push({
            version: existingEntry.version_history.length + 1,
            content: notes,
            updated_at: currentTime,
            change_summary: `Updated via ${taskType.replace('_', ' ')}`
          });
          
          // Update the main entry
          existingEntry.content = notes;
          existingEntry.updated_at = currentTime;
          existingEntry.version = (existingEntry.version_history.length);
          
          console.log(`Updated existing flightbook entry (v${existingEntry.version}):`, entryTitle);
        } else {
          console.log('Flightbook entry content unchanged, no update needed');
          return existingEntry;
        }
      } else {
        // Create new flightbook entry structure
        const flightbookEntry = {
          id: `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entry_key: entryKey, // Unique key for identifying this journal context
          title: entryTitle,
          content: notes,
          competency: areaKey,
          type: taskType.replace('_', '_'),
          source: 'competency_work',
          original_prompt: promptText,
          tags: [taskType.replace('_', '-'), 'reflection', 'auto-generated'],
          date: currentTime,
          created_at: currentTime,
          updated_at: currentTime,
          version: 1,
          competency_area: areaKey,
          sub_competency: subKey,
          task_id: taskId,
          version_history: [{
            version: 1,
            content: notes,
            updated_at: currentTime,
            change_summary: 'Initial version'
          }]
        };

        existingEntries.push(flightbookEntry);
        console.log('Created new flightbook entry:', entryTitle);
      }
      
      // Save updated entries back to localStorage
      localStorage.setItem('flightbook_entries', JSON.stringify(existingEntries));
      
      // TODO: Later add backend API call to save flightbook entry
      // await axios.post(`${API}/users/${user.id}/flightbook`, flightbookEntry);
      
      return existingEntries[existingEntryIndex >= 0 ? existingEntryIndex : existingEntries.length - 1];
    } catch (error) {
      console.error('Error creating/updating flightbook entry from journal reflection:', error);
      return null;
    }
  };

  // Legacy function name for backward compatibility - now calls the new function
  const createFlightbookFromJournalReflection = createOrUpdateFlightbookFromJournalReflection;

  const updateCompetencyProgressWithData = (progressData) => {
    console.log('Updating competency progress with provided data...');
    const updatedCompetencies = { ...competencies };
    
    Object.keys(updatedCompetencies).forEach(areaKey => {
      const areaData = updatedCompetencies[areaKey];
      let areaCompletedTasks = 0;
      let areaTotalTasks = 0;
      
      // Calculate progress for each sub-competency
      Object.keys(areaData.sub_competencies || {}).forEach(subKey => {
        const subProgress = calculateCompetencyProgressWithData(areaKey, subKey, progressData);
        
        areaCompletedTasks += subProgress.completed;
        areaTotalTasks += subProgress.total;
        
        // Update sub-competency progress
        updatedCompetencies[areaKey].sub_competencies[subKey] = {
          ...updatedCompetencies[areaKey].sub_competencies[subKey],
          progress_percentage: subProgress.percentage,
          completed_tasks: subProgress.completed,
          total_tasks: subProgress.total
        };
      });
      
      // Update area overall progress
      const areaPercentage = areaTotalTasks > 0 ? Math.round((areaCompletedTasks / areaTotalTasks) * 100) : 0;
      console.log(`Area ${areaKey}: ${areaCompletedTasks}/${areaTotalTasks} = ${areaPercentage}%`);
      
      updatedCompetencies[areaKey] = {
        ...updatedCompetencies[areaKey],
        overall_progress: areaPercentage,
        completion_percentage: areaPercentage,
        completed_tasks: areaCompletedTasks,
        total_tasks: areaTotalTasks
      };
    });
    
    console.log('Setting updated competencies with fresh data:', updatedCompetencies);
    setCompetencies(updatedCompetencies);
  };

  const calculateCompetencyProgressWithData = (areaKey, subKey, progressData) => {
    console.log(`Calculating progress for ${areaKey} -> ${subKey} with fresh data`);
    
    // Get all tasks for this sub-competency
    const areaData = competencies[areaKey];
    if (!areaData) {
      console.log(`No area data found for ${areaKey}`);
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const subData = areaData.sub_competencies[subKey];
    if (!subData) {
      console.log(`No sub data found for ${subKey}`);
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Count Foundation Courses
    if (subData.foundation_courses) {
      totalTasks += subData.foundation_courses.length;
      console.log(`Foundation courses: ${subData.foundation_courses.length}`);
      
      subData.foundation_courses.forEach(course => {
        const taskKey = `${areaKey}_${subKey}_${course.id}`;
        const isComplete = progressData[taskKey]?.completed || false;
        console.log(`Course ${course.id}: ${isComplete ? 'COMPLETE' : 'incomplete'} (using fresh data)`);
        if (isComplete) {
          completedTasks++;
        }
      });
    }
    
    // Count Phase Activities and Deliverables
    if (subData.signature_activity?.phases) {
      console.log(`Found ${subData.signature_activity.phases.length} phases`);
      
      subData.signature_activity.phases.forEach(phase => {
        const phaseTaskKey = `${areaKey}_${subKey}_phase_${phase.phase}_progress`;
        const phaseProgress = progressData[phaseTaskKey]?.notes || '{}';
        let parsedProgress = {};
        try {
          parsedProgress = JSON.parse(phaseProgress);
        } catch (e) {
          parsedProgress = {};
        }
        
        // Count activities in this phase
        if (phase.activities) {
          totalTasks += phase.activities.length;
          phase.activities.forEach((activity, actIndex) => {
            const activityKey = `activity_${actIndex}`;
            if (parsedProgress[activityKey]?.completed) {
              completedTasks++;
            }
          });
        }
        
        // Count deliverables in this phase
        if (phase.deliverables) {
          totalTasks += phase.deliverables.length;
          phase.deliverables.forEach((deliverable, delIndex) => {
            const deliverableKey = `deliverable_${delIndex}`;
            if (parsedProgress[deliverableKey]?.completed) {
              completedTasks++;
            }
          });
        }
      });
    }
    
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    console.log(`Progress with fresh data: ${completedTasks}/${totalTasks} = ${percentage}%`);
    return { completed: completedTasks, total: totalTasks, percentage };
  };

  const isCompetencyTaskComplete = (areaKey, subKey, taskId) => {
    const taskKey = `${areaKey}_${subKey}_${taskId}`;
    const isComplete = competencyTaskProgress[taskKey]?.completed || false;
    console.log(`Checking task completion: ${taskKey} = ${isComplete ? 'COMPLETE' : 'incomplete'}`);
    console.log('Available task keys:', Object.keys(competencyTaskProgress));
    return isComplete;
  };

  const getCompetencyTaskNotes = (areaKey, subKey, taskId) => {
    const taskKey = `${areaKey}_${subKey}_${taskId}`;
    return competencyTaskProgress[taskKey]?.notes || '';
  };

  // Remove problematic useEffect - replaced with manual progress updates

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
      <header className="redstone-glass-card py-1 fade-in">
        <div className="max-w-7xl mx-auto px-6 -my-2">
          <div className="flex justify-between items-center w-full -my-1">
            {/* Left - Earn Your Wings Title (Centered in left half) */}
            <div className="flex-1 flex justify-center items-center text-center">
              <div>
                <h1 className="text-3xl font-black text-gray-600">Earn Your Wings</h1>
                <p className="text-base font-medium text-gray-500">Redstone Employee Development</p>
              </div>
            </div>
            
            {/* Center - MASSIVE Winged Emblem (OVERDONE TIGHT!) */}
            <div className="flex-shrink-0 flex items-center justify-center -my-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_navigator-platform/artifacts/0rr43l7c_20250723_1404_Winged%20Emblem_remix_01k0we1tpnettvcv336sfsv4p1.png" 
                alt="Winged Emblem" 
                className="w-80 h-80 object-contain drop-shadow-2xl -my-6"
              />
            </div>
            
            {/* Right - User Info (Centered in right half) */}
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <p className="font-bold text-lg text-gray-800">
                  {isAdmin ? 'Admin Control' : user?.name}
                </p>
                <div className="flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#ff3443'}}></div>
                  <p className="text-sm font-medium text-gray-800">
                    {isAdmin ? 'Full Access' : `${getOverallProgress()}% Complete`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* REDSTONE NAVIGATION - Pushed up closer to emblem */}
          <nav className="flex justify-between items-center -mt-8 mb-4">
            <div className="flex space-x-3 flex-wrap">
            {/* REGULAR USER NAVIGATION */}
            {!isAdmin && [
              { key: 'dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'competencies', label: 'Competencies', icon: '🎯' },
              { key: 'portfolio', label: 'Portfolio', icon: '📁' },
              { key: 'flightbook', label: 'My Leadership Flightbook', icon: '✈️' },
              { key: 'core-values', label: 'Core Values', icon: '💖' },
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
            </div>
            
            {/* Navigator Program / Level Status - Right Side */}
            {!isAdmin && (
              <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 border">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-600">
                  {user?.current_level || 'Navigator Program'}
                </span>
              </div>
            )}
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
            competencyTaskProgress={competencyTaskProgress}
            onCompleteCompetencyTask={handleCompleteCompetencyTask}
            onJournalReflectionChange={handleJournalReflectionChange}
            onJournalReflectionComplete={handleJournalReflectionComplete}
            isCompetencyTaskComplete={isCompetencyTaskComplete}
            getCompetencyTaskNotes={getCompetencyTaskNotes}

            showTaskModal={showTaskModal}
            setShowTaskModal={setShowTaskModal}
            taskNotes={taskNotes}
            setTaskNotes={setTaskNotes}
          />
        )}
        
        {currentView === 'portfolio' && !isAdmin && (
          <PortfolioView 
            portfolio={portfolio} 
            setCurrentView={setCurrentView} 
            competencies={competencies}
            reloadPortfolio={reloadPortfolio}
          />
        )}
        
        {currentView === 'flightbook' && !isAdmin && (
          <LeadershipFlightbookView 
            competencies={competencies}
            portfolio={portfolio}
            setCurrentView={setCurrentView}
            key={`flightbook-${Date.now()}`} // Force re-render to reload entries
          />
        )}
        
        {currentView === 'core-values' && !isAdmin && (
          <CoreValuesView 
            coreValues={coreValues}
            coreValueEntries={coreValueEntries}
            expandedValue={expandedValue}
            setExpandedValue={setExpandedValue}
            newEntry={newEntry}
            setNewEntry={setNewEntry}
            showNewEntryForm={showNewEntryForm}
            setShowNewEntryForm={setShowNewEntryForm}
            onAddEntry={handleAddCoreValueEntry}
            onDeleteEntry={handleDeleteCoreValueEntry}
          />
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

      {/* Competency Task Completion Modal */}
      {showTaskModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
          onClick={() => setShowTaskModal(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {showTaskModal.taskType === 'phase_activity' ? 'Add Notes for Activity' : 
                 showTaskModal.taskType === 'course' ? 'Complete Course' : 'Complete Task'}: {showTaskModal.task.title}
              </h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showTaskModal.taskType === 'phase_activity' ? 'Activity Notes' : 'Task Notes'} 
                  {showTaskModal.taskType !== 'phase_activity' && ' (Required)'}
                </label>
                <textarea
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder={showTaskModal.taskType === 'phase_activity' ? 
                    "Add your thoughts, insights, or observations about this activity..." :
                    "Describe your key learnings, insights, or how you applied this knowledge..."}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTaskModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showTaskModal.taskType === 'phase_activity') {
                      // Handle phase activity notes
                      const phaseProgress = getCompetencyTaskNotes(showTaskModal.areaKey, showTaskModal.subKey, `phase_${showTaskModal.phase}_progress`) || '{}';
                      let parsedProgress = {};
                      try {
                        parsedProgress = JSON.parse(phaseProgress);
                      } catch (e) {
                        parsedProgress = {};
                      }
                      
                      const newProgress = {
                        ...parsedProgress,
                        [showTaskModal.activityKey]: {
                          ...parsedProgress[showTaskModal.activityKey],
                          notes: taskNotes.trim()
                        }
                      };
                      
                      handleCompleteCompetencyTask(
                        showTaskModal.areaKey, 
                        showTaskModal.subKey, 
                        `phase_${showTaskModal.phase}_progress`, 
                        JSON.stringify(newProgress), 
                        'phase_activity'
                      );
                    } else if (taskNotes.trim()) {
                      // Handle regular task completion
                      handleCompleteCompetencyTask(
                        showTaskModal.areaKey, 
                        showTaskModal.subKey, 
                        showTaskModal.task.id, 
                        taskNotes.trim(), 
                        showTaskModal.taskType
                      );
                    }
                  }}
                  disabled={showTaskModal.taskType !== 'phase_activity' && !taskNotes.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {showTaskModal.taskType === 'phase_activity' ? 'Save Notes' : 'Mark Complete'}
                </button>
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
              <p className="text-gray-500">No portfolio items yet. Start building your professional portfolio!</p>
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
const CompetenciesView = ({ 
  competencies, 
  onViewTasks, 
  selectedCompetency, 
  competencyTasks, 
  onCompleteTask,
  competencyTaskProgress,
  onCompleteCompetencyTask,
  onJournalReflectionChange,
  onJournalReflectionComplete,
  isCompetencyTaskComplete,
  getCompetencyTaskNotes,

  showTaskModal,
  setShowTaskModal,
  taskNotes,
  setTaskNotes
}) => {
  const [expandedArea, setExpandedArea] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [selectedCulminatingTask, setSelectedCulminatingTask] = useState(null);
  const [culminatingProgress, setCulminatingProgress] = useState(() => {
    // Initialize from localStorage or default to empty
    const saved = localStorage.getItem('culminating_project_progress');
    return saved ? JSON.parse(saved) : {};
  });

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
          portfolioConnection: "Strategic Thinking work samples",
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
          portfolioConnection: "Financial Management + Strategic Thinking contributions",
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
          portfolioConnection: "Leadership & Communication achievements",
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
          portfolioConnection: "Operational Management deliverables",
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
          portfolioConnection: "Cross-Functional Collaboration outcomes",
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
          portfolioConnection: "Leadership & Supervision + Operational Management accomplishments",
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
          portfolioConnection: "Financial Management + Strategic Thinking contributions",
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
          portfolioConnection: "Work samples from all competency areas",
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
          portfolioConnection: "Leadership & Communication achievements",
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
          portfolioConnection: "Culmination of all competency achievements",
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

            {(expandedArea === areaKey || expandedArea?.startsWith(`${areaKey}_`)) && (
              <div className="px-6 py-4 bg-gray-50">
                {/* Philosophy Section for Leadership & Supervision */}
                {areaKey === 'leadership_supervision' && areaData.philosophy && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-900 mb-2">🎯 Core Philosophy</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {areaData.philosophy}
                    </p>
                  </div>
                )}
                
                {/* Curiosity Ignition Section for Leadership & Supervision */}
                {areaKey === 'leadership_supervision' && areaData.curiosity_ignition && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-orange-400">
                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                      🔥 {areaData.curiosity_ignition.title}
                    </h4>
                    <p className="text-sm text-orange-800 mb-3">
                      {areaData.curiosity_ignition.description}
                    </p>
                    <p className="text-xs text-orange-700 mb-4 font-medium">
                      ⏱️ {areaData.curiosity_ignition.time_required}
                    </p>
                    
                    <div className="mb-4">
                      <h5 className="font-semibold text-orange-900 mb-2">💭 Reflection Prompts:</h5>
                      <div className="space-y-2">
                        {areaData.curiosity_ignition.reflection_prompts.map((prompt, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-orange-200">
                            <p className="text-sm text-orange-800 font-medium mb-2">{index + 1}. "{prompt}"</p>
                            <textarea
                              placeholder="Write your reflection here..."
                              className="w-full p-2 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              rows="2"
                              value={getCompetencyTaskNotes(areaKey, 'curiosity_ignition', `prompt_${index}`) || ''}
                              onChange={(e) => {
                                // Only update localStorage on change, don't create flightbook entries yet
                                onJournalReflectionChange(areaKey, 'curiosity_ignition', `prompt_${index}`, e.target.value, 'curiosity_reflection');
                              }}
                              onBlur={(e) => {
                                // Create or update flightbook entry when user finishes editing
                                onJournalReflectionComplete(areaKey, 'curiosity_ignition', `prompt_${index}`, e.target.value, 'curiosity_reflection');
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-orange-100 p-3 rounded border border-orange-200">
                      <h5 className="font-semibold text-orange-900 mb-2">📝 Setup Requirement:</h5>
                      <p className="text-sm text-orange-800">{areaData.curiosity_ignition.setup_requirement}</p>
                    </div>
                  </div>
                )}
                
                {/* Integration Activities Section for Leadership & Supervision */}
                {areaKey === 'leadership_supervision' && areaData.integration_activities && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-l-4 border-purple-400">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                      🔗 Leadership Integration Activities
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Weekly CM Shadowing */}
                      {areaData.integration_activities.weekly_cm_shadowing && (
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h5 className="font-semibold text-purple-900 mb-2">
                            👥 {areaData.integration_activities.weekly_cm_shadowing.title}
                          </h5>
                          <p className="text-xs text-purple-700 mb-2">
                            {areaData.integration_activities.weekly_cm_shadowing.time}
                          </p>
                          <div className="space-y-1">
                            {areaData.integration_activities.weekly_cm_shadowing.schedule.map((item, index) => (
                              <div key={index} className="text-xs text-purple-800">
                                <span className="font-medium">Months {item.months}:</span> {item.focus}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Cross-Department Exchange */}
                      {areaData.integration_activities.cross_department_exchange && (
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h5 className="font-semibold text-purple-900 mb-2">
                            🤝 {areaData.integration_activities.cross_department_exchange.title}
                          </h5>
                          <p className="text-xs text-purple-700 mb-2">
                            {areaData.integration_activities.cross_department_exchange.time}
                          </p>
                          <div className="space-y-1">
                            {areaData.integration_activities.cross_department_exchange.activities.map((activity, index) => (
                              <p key={index} className="text-xs text-purple-800">• {activity}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Leadership Curiosity Journal */}
                      {areaData.integration_activities.leadership_curiosity_journal && (
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <h5 className="font-semibold text-purple-900 mb-2">
                            📖 {areaData.integration_activities.leadership_curiosity_journal.title}
                          </h5>
                          <p className="text-xs text-purple-700 mb-2">
                            {areaData.integration_activities.leadership_curiosity_journal.time}
                          </p>
                          <div className="space-y-1">
                            {areaData.integration_activities.leadership_curiosity_journal.activities.map((activity, index) => (
                              <p key={index} className="text-xs text-purple-800">• {activity}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-6">
                  {Object.entries(areaData.sub_competencies).map(([subKey, subData]) => (
                    <div key={subKey} className="sub-competency-card bg-white rounded-lg shadow-sm border border-gray-200" data-subkey={`${areaKey}_${subKey}`}>
                      {/* Sub-competency Header */}
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-1">
                              {typeof subData === 'object' && subData?.name ? subData.name : 'Unknown Competency'}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {subData?.description || 'No description available'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-gray-700">
                                {subData?.completed_tasks || 0}/{subData?.total_tasks || 0}
                              </div>
                              <div className="text-xs text-gray-500">tasks</div>
                            </div>
                            <button
                              onClick={() => {
                                const newExpandedArea = expandedArea === `${areaKey}_${subKey}` ? areaKey : `${areaKey}_${subKey}`;
                                setExpandedArea(newExpandedArea);
                                
                                // If expanding (not collapsing), scroll to the top of this sub-competency
                                if (newExpandedArea === `${areaKey}_${subKey}`) {
                                  setTimeout(() => {
                                    const element = document.querySelector(`[data-subkey="${areaKey}_${subKey}"]`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }, 100);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border"
                            >
                              {expandedArea === `${areaKey}_${subKey}` ? 'Collapse' : 'View Details'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex items-center space-x-2 mt-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="progress-bar h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(subData?.progress_percentage || 0)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {(subData?.progress_percentage || 0)}%
                          </span>
                        </div>
                      </div>

                      {/* Expanded Sub-competency Details */}
                      {expandedArea === `${areaKey}_${subKey}` && (
                        <div className="px-6 py-4 space-y-6">
                          {/* Foundation Courses */}
                          {subData?.foundation_courses && subData.foundation_courses.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                📚 <span className="ml-2">Foundation Courses (PerformanceHQ)</span>
                              </h5>
                              <div className="grid grid-cols-1 gap-3">
                                {subData.foundation_courses.map((course, index) => {
                                  const isCompleted = isCompetencyTaskComplete(areaKey, subKey, course.id);
                                  const courseNotes = getCompetencyTaskNotes(areaKey, subKey, course.id);
                                  
                                  return (
                                    <div key={index} className={`rounded-lg p-4 border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <div className="flex items-center mb-2">
                                            {isCompleted && <span className="text-green-600 mr-2">✅</span>}
                                            <h6 className="font-semibold text-sm text-gray-900">
                                              {course.title}
                                            </h6>
                                          </div>
                                          <p className="text-xs text-gray-600 mb-2">
                                            {course.description}
                                          </p>
                                          <div className="flex items-center space-x-3 text-xs text-gray-500 mb-3">
                                            <span>⏱️ {course.duration}</span>
                                            <span>•</span>
                                            <span>{course.platform}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          {/* LMS Link Button */}
                                          <a 
                                            href={`https://performancehq.com/courses/${course.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                                          >
                                            🔗 Open in LMS
                                          </a>
                                          
                                          {/* Notes Button */}
                                          <button
                                            onClick={() => {
                                              setShowTaskModal({ areaKey, subKey, task: course, taskType: 'course' });
                                              const existingNotes = getCompetencyTaskNotes(areaKey, subKey, course.id);
                                              setTaskNotes(existingNotes);
                                            }}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                                          >
                                            📝 {courseNotes ? 'View Notes' : 'Add Notes'}
                                          </button>
                                        </div>
                                        
                                        {/* Mark Complete Button */}
                                        {!isCompleted && (
                                          <button
                                            onClick={() => {
                                              setShowTaskModal({ areaKey, subKey, task: course, taskType: 'course' });
                                              const existingNotes = getCompetencyTaskNotes(areaKey, subKey, course.id);
                                              setTaskNotes(existingNotes);
                                            }}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 transition-colors"
                                          >
                                            ✓ Mark Complete
                                          </button>
                                        )}
                                        
                                        {isCompleted && (
                                          <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md">
                                            ✅ Completed
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Show notes if they exist */}
                                      {courseNotes && (
                                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                          <p className="font-medium text-yellow-800 mb-1">📝 Your Notes:</p>
                                          <p className="text-yellow-700">{courseNotes}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Monthly Activities - New Leadership Format */}
                          {subData?.monthly_activities && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                📅 Monthly Development Activities
                              </h5>
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-sm text-blue-800 mb-4 font-medium">
                                  🎯 Core Learning Question: "{subData.core_learning_question}"
                                </p>
                                <p className="text-xs text-blue-700 mb-4">
                                  Duration: {subData.duration} • Time: {subData.weekly_time}
                                </p>
                                
                                <div className="space-y-4">
                                  {subData.monthly_activities.map((monthActivity, monthIndex) => {
                                    const activityKey = `monthly_activity_${monthActivity.month}`;
                                    const isCompleted = isCompetencyTaskComplete(areaKey, subKey, activityKey);
                                    const activityNotes = getCompetencyTaskNotes(areaKey, subKey, activityKey);
                                    
                                    return (
                                      <div key={monthIndex} className={`p-4 rounded-lg border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                              {monthActivity.month}
                                            </div>
                                            <div>
                                              <h6 className={`font-bold text-lg ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                                                {monthActivity.title}
                                              </h6>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            {!isCompleted && (
                                              <button
                                                onClick={() => {
                                                  setShowTaskModal({ 
                                                    areaKey, 
                                                    subKey, 
                                                    task: {
                                                      ...monthActivity,
                                                      id: activityKey,
                                                      title: monthActivity.title,
                                                      type: 'monthly_activity'
                                                    }, 
                                                    taskType: 'monthly_activity' 
                                                  });
                                                  setTaskNotes(activityNotes);
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                              >
                                                ✓ Mark Complete
                                              </button>
                                            )}
                                            
                                            {isCompleted && (
                                              <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md">
                                                ✅ Completed
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* In-the-Flow Activity */}
                                        <div className="mb-4">
                                          <h6 className="text-sm font-semibold text-gray-700 mb-2 block">🔄 In-the-Flow Activity:</h6>
                                          <div className="text-sm text-gray-800 bg-blue-50 p-3 rounded border border-blue-100">
                                            {monthActivity.in_the_flow_activity.split('\n').map((line, lineIndex) => {
                                              if (line.startsWith('•')) {
                                                return (
                                                  <div key={lineIndex} className="flex items-start mb-1">
                                                    <span className="mr-2 text-blue-600">•</span>
                                                    <span>{line.substring(1).trim()}</span>
                                                  </div>
                                                );
                                              } else {
                                                return (
                                                  <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                                                    {line}
                                                  </p>
                                                );
                                              }
                                            })}
                                          </div>
                                        </div>
                                        
                                        {/* Document Section */}
                                        <div className="mb-4">
                                          <h6 className="text-sm font-semibold text-gray-700 mb-2 block">📄 Document:</h6>
                                          <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                            <p className="text-sm text-gray-800 mb-3">
                                              {monthActivity.document}
                                            </p>
                                            
                                            {/* Document Action Buttons */}
                                            <div className="flex items-center space-x-2 flex-wrap gap-2">
                                              {/* Add to Portfolio Button */}
                                              <button
                                                onClick={() => {
                                                  // Handle portfolio addition
                                                  setShowTaskModal({ 
                                                    areaKey, 
                                                    subKey, 
                                                    task: {
                                                      ...monthActivity,
                                                      id: `${activityKey}_document`,
                                                      title: `${monthActivity.title} - Document`,
                                                      type: 'portfolio_document'
                                                    }, 
                                                    taskType: 'portfolio_document' 
                                                  });
                                                  setTaskNotes(getCompetencyTaskNotes(areaKey, subKey, `${activityKey}_document`) || '');
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors"
                                              >
                                                📂 Add to Portfolio
                                              </button>
                                              
                                              {/* Download Template Button (where applicable) */}
                                              {(monthActivity.document.includes('Template') || monthActivity.document.includes('Playbook') || monthActivity.document.includes('Framework')) && (
                                                <button
                                                  onClick={() => {
                                                    // Handle template download
                                                    const templateName = monthActivity.title.replace(/\s+/g, '_').toLowerCase();
                                                    console.log(`Downloading template: ${templateName}`);
                                                    // Here would be actual template download logic
                                                  }}
                                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                                                >
                                                  📄 Download Template
                                                </button>
                                              )}
                                              
                                              {/* Upload Completed Document Button */}
                                              <button
                                                onClick={() => {
                                                  // Handle document upload
                                                  const input = document.createElement('input');
                                                  input.type = 'file';
                                                  input.accept = '.pdf,.doc,.docx,.txt';
                                                  input.onchange = (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                      // Here would be actual file upload logic
                                                      console.log(`Uploading document: ${file.name}`);
                                                      // Save file reference to competency task notes
                                                      onCompleteCompetencyTask(areaKey, subKey, `${activityKey}_uploaded_doc`, file.name, 'document_upload');
                                                    }
                                                  };
                                                  input.click();
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-md hover:bg-purple-200 transition-colors"
                                              >
                                                📤 Upload Document
                                              </button>
                                            </div>
                                            
                                            {/* Show uploaded document if exists */}
                                            {getCompetencyTaskNotes(areaKey, subKey, `${activityKey}_uploaded_doc`) && (
                                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                                <p className="font-medium text-green-800 mb-1">📎 Uploaded Document:</p>
                                                <p className="text-green-700">{getCompetencyTaskNotes(areaKey, subKey, `${activityKey}_uploaded_doc`)}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Reflection/Journal Prompt */}
                                        {(monthActivity.reflection || monthActivity.journal_prompt || monthActivity.curiosity_question) && (
                                          <div className="mb-4">
                                            <h6 className="text-sm font-semibold text-gray-700 mb-2 block">
                                              {monthActivity.reflection && '🤔 Reflection:'}
                                              {monthActivity.journal_prompt && '📖 Journal Prompt:'}
                                              {monthActivity.curiosity_question && '💡 Curiosity Question:'}
                                            </h6>
                                            <p className="text-sm text-purple-800 bg-purple-50 p-3 rounded border border-purple-100 italic">
                                              "{monthActivity.reflection || monthActivity.journal_prompt || monthActivity.curiosity_question}"
                                            </p>
                                            
                                            {/* Journal/Reflection Input Area */}
                                            <div className="mt-3">
                                              <textarea
                                                placeholder="Share your thoughts and reflections here..."
                                                className="w-full p-3 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                rows="3"
                                                value={getCompetencyTaskNotes(areaKey, subKey, `${activityKey}_reflection`) || ''}
                                                onChange={(e) => {
                                                  // Only update localStorage on change, don't create flightbook entries yet
                                                  onJournalReflectionChange(areaKey, subKey, `${activityKey}_reflection`, e.target.value, 'reflection');
                                                }}
                                                onBlur={(e) => {
                                                  // Create or update flightbook entry when user finishes editing
                                                  onJournalReflectionComplete(areaKey, subKey, `${activityKey}_reflection`, e.target.value, 'reflection');
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Integration Connections */}
                                        {monthActivity.integrations && (
                                          <div className="mb-4">
                                            <h6 className="text-sm font-semibold text-gray-700 mb-2 block">🔗 Competency Integrations:</h6>
                                            <div className="space-y-2">
                                              {monthActivity.integrations.map((integration, intIndex) => (
                                                <div key={intIndex} className="bg-gradient-to-r from-orange-50 to-red-50 p-2 rounded border border-orange-200">
                                                  <p className="text-xs text-orange-800">{integration}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Show notes if they exist */}
                                        {activityNotes && (
                                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                            <p className="font-medium text-yellow-800 mb-1">📝 Your Work Notes:</p>
                                            <p className="text-yellow-700">{activityNotes}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Competency Gate */}
                                {subData.competency_gate && (
                                  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                    <h6 className="font-semibold text-emerald-800 mb-2 block">🎯 Competency Gate:</h6>
                                    <p className="text-sm text-emerald-700">{subData.competency_gate}</p>
                                  </div>
                                )}
                                
                                {/* Dive Deeper Resources */}
                                {subData.dive_deeper_resources && (
                                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                                    <h6 className="font-semibold text-indigo-800 mb-3 block flex items-center">
                                      📚 Dive Deeper Resources
                                    </h6>
                                    <div className="space-y-3">
                                      {subData.dive_deeper_resources.map((resource, resourceIndex) => (
                                        <div key={resourceIndex} className="bg-white p-3 rounded border border-indigo-100">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                              <h6 className="font-semibold text-sm text-indigo-900 mb-1">
                                                {resource.title}
                                              </h6>
                                              <p className="text-xs text-indigo-700 mb-2">
                                                {resource.description}
                                              </p>
                                              <span className="inline-block px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded">
                                                {resource.type}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2 mt-2">
                                            {resource.url && resource.url !== '#' && (
                                              <a 
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                              >
                                                🔗 View Resource
                                              </a>
                                            )}
                                            
                                            <button
                                              onClick={() => {
                                                setShowTaskModal({ 
                                                  areaKey, 
                                                  subKey, 
                                                  task: {
                                                    ...resource,
                                                    id: `resource_${resourceIndex}`,
                                                    type: 'resource_notes'
                                                  }, 
                                                  taskType: 'resource_notes' 
                                                });
                                                setTaskNotes(getCompetencyTaskNotes(areaKey, subKey, `resource_${resourceIndex}_notes`) || '');
                                              }}
                                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                                            >
                                              📝 Add Notes
                                            </button>
                                          </div>
                                          
                                          {/* Show notes if they exist */}
                                          {getCompetencyTaskNotes(areaKey, subKey, `resource_${resourceIndex}_notes`) && (
                                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                              <p className="font-medium text-yellow-800 mb-1">📝 Your Notes:</p>
                                              <p className="text-yellow-700">{getCompetencyTaskNotes(areaKey, subKey, `resource_${resourceIndex}_notes`)}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Signature Activity */}
                          {subData?.signature_activity && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                {subData.signature_activity.icon || '🚀'} 
                                <span className="ml-2">Signature Development Activity</span>
                              </h5>
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                                <h6 className="font-bold text-lg text-purple-900 mb-2">
                                  {subData.signature_activity.title}
                                </h6>
                                <p className="text-sm text-purple-800 mb-4 leading-relaxed">
                                  {subData.signature_activity.description}
                                </p>
                                
                                {/* Interactive Development Phases */}
                                {subData.signature_activity.phases && (
                                  <div className="space-y-6">
                                    <h6 className="font-semibold text-purple-900 text-lg">🗺️ Your Leadership Journey - Development Phases</h6>
                                    <p className="text-sm text-purple-700 italic">Track every step of your 3-month leadership evolution journey!</p>
                                    
                                    {subData.signature_activity.phases.map((phase, phaseIndex) => {
                                      const phaseKey = `${areaKey}_${subKey}_phase_${phase.phase}`;
                                      const phaseProgress = getCompetencyTaskNotes(areaKey, subKey, `phase_${phase.phase}_progress`) || '{}';
                                      let parsedProgress = {};
                                      try {
                                        parsedProgress = JSON.parse(phaseProgress);
                                      } catch (e) {
                                        parsedProgress = {};
                                      }
                                      
                                      return (
                                        <div key={phaseIndex} className="bg-gradient-to-br from-white to-purple-50 rounded-lg p-6 border-2 border-purple-200 shadow-sm">
                                          <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center">
                                              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                                                {phase.phase}
                                              </div>
                                              <div>
                                                <h6 className="font-bold text-xl text-gray-900">
                                                  {phase.title}
                                                </h6>
                                                <p className="text-sm text-purple-700 font-medium">{phase.duration}</p>
                                              </div>
                                            </div>
                                            <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                                              📅 {phase.duration}
                                            </span>
                                          </div>
                                          
                                          {/* Key Activities Checklist */}
                                          {phase.activities && (
                                            <div className="mb-6">
                                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                ✅ Key Activities
                                              </h4>
                                              <div className="space-y-3">
                                                {phase.activities.map((activity, actIndex) => {
                                                  const activityKey = `activity_${actIndex}`;
                                                  const isCompleted = parsedProgress[activityKey]?.completed || false;
                                                  const activityNotes = parsedProgress[activityKey]?.notes || '';
                                                  
                                                  return (
                                                    <div key={actIndex} className={`p-4 rounded-lg border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                                      <div className="flex items-start space-x-3">
                                                        <input
                                                          type="checkbox"
                                                          checked={isCompleted}
                                                          onChange={(e) => {
                                                            const newProgress = {
                                                              ...parsedProgress,
                                                              [activityKey]: {
                                                                ...parsedProgress[activityKey],
                                                                completed: e.target.checked,
                                                                completedAt: e.target.checked ? new Date().toISOString() : null
                                                              }
                                                            };
                                                            onCompleteCompetencyTask(areaKey, subKey, `phase_${phase.phase}_progress`, JSON.stringify(newProgress), 'phase_activity');
                                                          }}
                                                          className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                        />
                                                        <div className="flex-1">
                                                          <p className={`text-sm font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                                            {activity}
                                                          </p>
                                                          {isCompleted && (
                                                            <p className="text-xs text-green-600 mt-1">
                                                              ✅ Completed {parsedProgress[activityKey]?.completedAt ? new Date(parsedProgress[activityKey].completedAt).toLocaleDateString() : ''}
                                                            </p>
                                                          )}
                                                          
                                                          {/* Activity Notes */}
                                                          <div className="mt-2">
                                                            <button
                                                              onClick={() => {
                                                                setShowTaskModal({ 
                                                                  areaKey, 
                                                                  subKey, 
                                                                  task: { id: `phase_${phase.phase}_activity_${actIndex}`, title: activity }, 
                                                                  taskType: 'phase_activity',
                                                                  activityKey,
                                                                  phase: phase.phase
                                                                });
                                                                setTaskNotes(activityNotes);
                                                              }}
                                                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                                            >
                                                              📝 {activityNotes ? 'Edit Notes' : 'Add Notes'}
                                                            </button>
                                                            {activityNotes && (
                                                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                                                <p className="font-medium text-yellow-800">📝 Your Notes:</p>
                                                                <p className="text-yellow-700 mt-1">{activityNotes}</p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Deliverables Section */}
                                          {phase.deliverables && (
                                            <div className="mb-6">
                                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                📄 Deliverables
                                              </h4>
                                              <div className="space-y-3">
                                                {phase.deliverables.map((deliverable, delIndex) => {
                                                  const deliverableKey = `deliverable_${delIndex}`;
                                                  const isCompleted = parsedProgress[deliverableKey]?.completed || false;
                                                  const hasFile = parsedProgress[deliverableKey]?.fileName || false;
                                                  
                                                  return (
                                                    <div key={delIndex} className={`p-4 rounded-lg border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3 flex-1">
                                                          <input
                                                            type="checkbox"
                                                            checked={isCompleted}
                                                            onChange={(e) => {
                                                              const newProgress = {
                                                                ...parsedProgress,
                                                                [deliverableKey]: {
                                                                  ...parsedProgress[deliverableKey],
                                                                  completed: e.target.checked,
                                                                  completedAt: e.target.checked ? new Date().toISOString() : null
                                                                }
                                                              };
                                                              onCompleteCompetencyTask(areaKey, subKey, `phase_${phase.phase}_progress`, JSON.stringify(newProgress), 'phase_deliverable');
                                                            }}
                                                            className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                          />
                                                          <div className="flex-1">
                                                            <p className={`text-sm font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                                              {deliverable}
                                                            </p>
                                                            {isCompleted && (
                                                              <p className="text-xs text-green-600 mt-1">
                                                                ✅ Completed {parsedProgress[deliverableKey]?.completedAt ? new Date(parsedProgress[deliverableKey].completedAt).toLocaleDateString() : ''}
                                                              </p>
                                                            )}
                                                            {hasFile && (
                                                              <p className="text-xs text-blue-600 mt-1">
                                                                📎 File: {parsedProgress[deliverableKey].fileName}
                                                              </p>
                                                            )}
                                                          </div>
                                                        </div>
                                                        
                                                        {/* File Upload Button */}
                                                        <div className="ml-3">
                                                          <input
                                                            type="file"
                                                            id={`file_${phaseKey}_${deliverableKey}`}
                                                            className="hidden"
                                                            onChange={(e) => {
                                                              const file = e.target.files[0];
                                                              if (file) {
                                                                const newProgress = {
                                                                  ...parsedProgress,
                                                                  [deliverableKey]: {
                                                                    ...parsedProgress[deliverableKey],
                                                                    fileName: file.name,
                                                                    uploadedAt: new Date().toISOString()
                                                                  }
                                                                };
                                                                onCompleteCompetencyTask(areaKey, subKey, `phase_${phase.phase}_progress`, JSON.stringify(newProgress), 'phase_deliverable');
                                                              }
                                                            }}
                                                          />
                                                          <label
                                                            htmlFor={`file_${phaseKey}_${deliverableKey}`}
                                                            className="cursor-pointer text-xs px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                                                          >
                                                            📎 {hasFile ? 'Update File' : 'Upload File'}
                                                          </label>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Journal Prompt Section */}
                                          {phase.journal_prompt && (
                                            <div className="mb-4">
                                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                📖 Leadership Journal Prompt
                                              </h4>
                                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                                                <p className="text-sm text-orange-800 font-medium italic mb-3">
                                                  "{phase.journal_prompt}"
                                                </p>
                                                <div className="space-y-2">
                                                  <textarea
                                                    value={parsedProgress.journal_response || ''}
                                                    onChange={(e) => {
                                                      const newProgress = {
                                                        ...parsedProgress,
                                                        journal_response: e.target.value,
                                                        last_journal_update: new Date().toISOString()
                                                      };
                                                      onCompleteCompetencyTask(areaKey, subKey, `phase_${phase.phase}_progress`, JSON.stringify(newProgress), 'phase_journal');
                                                    }}
                                                    placeholder="Write your reflective response here... Take your time to think deeply about your leadership journey."
                                                    className="w-full p-3 border border-orange-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
                                                    rows={4}
                                                  />
                                                  {parsedProgress.journal_response && (
                                                    <p className="text-xs text-orange-600">
                                                      ✍️ Last updated: {parsedProgress.last_journal_update ? new Date(parsedProgress.last_journal_update).toLocaleDateString() : 'Unknown'}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Reflection Questions */}
                                          {phase.reflection_questions && (
                                            <div>
                                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                🤔 Reflection Questions
                                              </h4>
                                              <div className="space-y-3">
                                                {phase.reflection_questions.map((question, qIndex) => {
                                                  const questionKey = `reflection_${qIndex}`;
                                                  
                                                  return (
                                                    <div key={qIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                      <p className="text-sm font-medium text-blue-800 mb-2">
                                                        Q{qIndex + 1}: {question}
                                                      </p>
                                                      <textarea
                                                        value={parsedProgress[questionKey] || ''}
                                                        onChange={(e) => {
                                                          const newProgress = {
                                                            ...parsedProgress,
                                                            [questionKey]: e.target.value,
                                                            [`${questionKey}_updated`]: new Date().toISOString()
                                                          };
                                                          onCompleteCompetencyTask(areaKey, subKey, `phase_${phase.phase}_progress`, JSON.stringify(newProgress), 'phase_reflection');
                                                        }}
                                                        placeholder="Share your thoughts and insights..."
                                                        className="w-full p-2 border border-blue-200 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        rows={2}
                                                      />
                                                      {parsedProgress[questionKey] && (
                                                        <p className="text-xs text-blue-600 mt-1">
                                                          ✍️ Last updated: {parsedProgress[`${questionKey}_updated`] ? new Date(parsedProgress[`${questionKey}_updated`]).toLocaleDateString() : 'Unknown'}
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Validation Criteria for Leadership & Supervision */}
                {areaKey === 'leadership_supervision' && areaData.validation_criteria && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <h4 className="font-semibold text-green-900 mb-3">✅ Competency Validation & Advancement Criteria</h4>
                    
                    {/* Mastery Gates */}
                    {areaData.validation_criteria.mastery_gates && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-800 mb-2">Leadership & Supervision Mastery Gates:</h5>
                        <ul className="text-sm text-green-700 space-y-1 ml-4">
                          {areaData.validation_criteria.mastery_gates.map((gate, index) => (
                            <li key={index} className="list-disc">
                              {gate}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Portfolio Defense */}
                    {areaData.validation_criteria.portfolio_defense && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-800 mb-2">
                          🎤 {areaData.validation_criteria.portfolio_defense.title}
                        </h5>
                        <p className="text-sm text-green-700 mb-2">
                          {areaData.validation_criteria.portfolio_defense.duration}
                        </p>
                        <ul className="text-sm text-green-700 space-y-1 ml-4">
                          {areaData.validation_criteria.portfolio_defense.components.map((component, index) => (
                            <li key={index} className="list-disc">
                              {component}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* CM Readiness Indicators */}
                    {areaData.validation_criteria.cm_readiness_indicators && (
                      <div>
                        <h5 className="font-medium text-green-800 mb-2">🏆 Community Manager Readiness - Leadership Indicators:</h5>
                        <ul className="text-sm text-green-700 space-y-1 ml-4">
                          {areaData.validation_criteria.cm_readiness_indicators.map((indicator, index) => (
                            <li key={index} className="list-disc">
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
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
                      "Competency Integration: Demonstration of applying all core competency areas", 
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
                Project Notes & Reflections (Required)
              </label>
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                placeholder="Share your insights, key accomplishments, and learning outcomes from this project phase..."
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
                Upload project deliverables, screenshots, reports, or other supporting documentation
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

  // Helper function to get varied task notes prompts
  const getTaskNotesPrompt = () => {
    const prompts = [
      "Describe your key takeaways from this task...",
      "What did you learn or accomplish with this task?",
      "Share your insights and outcomes from completing this...",
      "Reflect on your experience with this task...",
      "What were the main results or learnings from this work?"
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

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
                        <strong>Notes:</strong> {String(task.completion_data.evidence_description)}
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
                    Task Notes (Required)
                  </label>
                  <textarea
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder={getTaskNotesPrompt()}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Supporting Documentation (Optional)
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
                  disabled={!evidenceDescription.trim()}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    evidenceDescription.trim() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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

// Enhanced Portfolio View Component with Accordion Organization
const PortfolioView = ({ portfolio, setCurrentView, competencies, reloadPortfolio }) => {
  const [expandedSections, setExpandedSections] = useState({});
  
  // Reload portfolio when component mounts
  useEffect(() => {
    if (reloadPortfolio) {
      reloadPortfolio();
    }
  }, [reloadPortfolio]);

  // Helper function to get competency color scheme
  const getCompetencyColor = (competencyKey) => {
    const colorMap = {
      'leadership_supervision': 'blue',
      'financial_management': 'green', 
      'operational_management': 'purple',
      'cross_functional_collaboration': 'orange',
      'strategic_thinking': 'red'
    };
    return colorMap[competencyKey] || 'gray';
  };

  // Helper function to get competency display name
  const getCompetencyName = (competencyKey) => {
    return competencies[competencyKey]?.name || competencyKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Function to handle document viewing
  const handleDocumentView = (item) => {
    if (item.file_path) {
      // Create a download/view link for the file
      const fileUrl = `${API}/files/portfolio/${item.id}`;
      window.open(fileUrl, '_blank');
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Group portfolio items by competency areas
  const organizePortfolioByCompetency = () => {
    const organized = {};
    const culminatingProject = [];
    const unassigned = [];

    portfolio.forEach(item => {
      // Check if this is a culminating project item
      if (item.tags && item.tags.includes('culminating-project')) {
        culminatingProject.push(item);
      } else if (item.competency_areas && item.competency_areas.length > 0) {
        item.competency_areas.forEach(competencyKey => {
          if (!organized[competencyKey]) {
            organized[competencyKey] = [];
          }
          organized[competencyKey].push(item);
        });
      } else {
        unassigned.push(item);
      }
    });

    return { organized, culminatingProject, unassigned };
  };

  const { organized, culminatingProject, unassigned } = organizePortfolioByCompetency();
  const totalItems = portfolio.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">📁 Your Portfolio</h2>
        <p className="text-lg text-gray-600 mb-4">Document your learning journey and career advancement</p>
        <div className="flex justify-center space-x-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-blue-800 font-medium">{totalItems} Portfolio Items</span>
          </div>
          <button 
            onClick={() => setCurrentView('add-portfolio')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ➕ Add New Item
          </button>
        </div>
      </div>

      {totalItems > 0 ? (
        <div className="space-y-4">
          {/* Culminating Project Section - Featured at Top */}
          {culminatingProject.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-yellow-200">
              <button
                onClick={() => toggleSection('culminating_project')}
                className="w-full p-4 text-left border-l-4 border-yellow-500 bg-yellow-50 rounded-t-lg hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {expandedSections['culminating_project'] ? '🏆' : '🎯'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-900">
                        🎯 Culminating Project
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {culminatingProject.length} project document{culminatingProject.length !== 1 ? 's' : ''} • Your capstone leadership project
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {culminatingProject.length}
                    </div>
                    <span className="text-yellow-600 text-lg">
                      {expandedSections['culminating_project'] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </button>

              {expandedSections['culminating_project'] && (
                <div className="border-t border-gray-200">
                  <div className="p-4 space-y-3">
                    {culminatingProject.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="text-2xl">
                            {item.file_path ? '📋' : '📝'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">
                              {item.description}
                            </p>
                            {item.file_path && (
                              <p className="text-xs text-yellow-600 font-medium">
                                📎 {item.original_filename} 
                                {item.file_size_formatted && ` (${item.file_size_formatted})`}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {item.file_path && (
                            <button
                              onClick={() => handleDocumentView(item)}
                              className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-200 rounded hover:bg-yellow-300 transition-colors"
                            >
                              📖 View
                            </button>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(item.upload_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Competency-Organized Accordion Sections */}
          {Object.entries(organized).map(([competencyKey, items]) => {
            const color = getCompetencyColor(competencyKey);
            const competencyName = getCompetencyName(competencyKey);
            const itemCount = items.length;
            const isExpanded = expandedSections[competencyKey];

            return (
              <div key={competencyKey} className="bg-white rounded-lg shadow border">
                {/* Competency Section Header - Clickable */}
                <button
                  onClick={() => toggleSection(competencyKey)}
                  className={`w-full p-4 text-left border-l-4 border-${color}-500 bg-${color}-50 rounded-t-lg hover:bg-${color}-100 transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {isExpanded ? '📂' : '📁'}
                      </span>
                      <div>
                        <h3 className={`text-lg font-bold text-${color}-900`}>
                          {competencyName}
                        </h3>
                        <p className={`text-sm text-${color}-700`}>
                          {itemCount} document{itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm font-medium`}>
                        {itemCount}
                      </div>
                      <span className={`text-${color}-600 text-lg`}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4 space-y-3">
                      {items.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Document Icon */}
                            <div className="text-2xl">
                              {item.file_path ? '📄' : '📝'}
                            </div>
                            
                            {/* Document Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">
                                {item.description}
                              </p>
                              {item.file_path && (
                                <p className="text-xs text-blue-600">
                                  📎 {item.original_filename} 
                                  {item.file_size_formatted && ` (${item.file_size_formatted})`}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {item.file_path && (
                              <button
                                onClick={() => handleDocumentView(item)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              >
                                📖 View
                              </button>
                            )}
                            <div className="text-xs text-gray-500">
                              {new Date(item.upload_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned Items Section */}
          {unassigned.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <button
                onClick={() => toggleSection('unassigned')}
                className="w-full p-4 text-left border-l-4 border-gray-400 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {expandedSections['unassigned'] ? '📂' : '📁'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        📋 Unassigned Items
                      </h3>
                      <p className="text-sm text-gray-700">
                        {unassigned.length} document{unassigned.length !== 1 ? 's' : ''} not linked to competencies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {unassigned.length}
                    </div>
                    <span className="text-gray-600 text-lg">
                      {expandedSections['unassigned'] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </button>

              {expandedSections['unassigned'] && (
                <div className="border-t border-gray-200">
                  <div className="p-4 space-y-3">
                    {unassigned.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="text-2xl">
                            {item.file_path ? '📄' : '📝'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">
                              {item.description}
                            </p>
                            {item.file_path && (
                              <p className="text-xs text-blue-600">
                                📎 {item.original_filename}
                                {item.file_size_formatted && ` (${item.file_size_formatted})`}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {item.file_path && (
                            <button
                              onClick={() => handleDocumentView(item)}
                              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                            >
                              📖 View
                            </button>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(item.upload_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
    { area: 'cross_functional_collaboration', subs: ['understanding_other_department', 'unified_resident_experience', 'communication_across_departments', 'stakeholder_relationship_building'] },
    { area: 'strategic_thinking', subs: ['seeing_patterns_anticipating_trends', 'innovation_continuous_improvement', 'problem_solving_future_focus', 'planning_goal_achievement'] }
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

// Core Values View Component
const CoreValuesView = ({ 
  coreValues, 
  coreValueEntries, 
  expandedValue, 
  setExpandedValue,
  newEntry,
  setNewEntry,
  showNewEntryForm,
  setShowNewEntryForm,
  onAddEntry,
  onDeleteEntry 
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl mr-6 shadow-lg">
            💖
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Core Values</h1>
            <p className="text-lg text-gray-600">Living our values through everyday actions</p>
          </div>
        </div>
        
        {/* Description */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 max-w-4xl mx-auto">
          <p className="text-gray-700 text-lg leading-relaxed">
            This is your space to reflect on and document how you've embodied our core values in your daily work and interactions. 
            Think of this as a personal journal where you can capture meaningful moments, challenges overcome, and ways you've 
            brought our values to life. Each story you share becomes part of your professional portfolio, showcasing your 
            character and growth journey.
          </p>
          <p className="text-gray-600 mt-3 text-sm">
            💡 <strong>How to use:</strong> Click on any value below to expand it, then share your stories about how you've lived that value. 
            Multiple entries are encouraged – the more you reflect, the more you grow!
          </p>
        </div>
      </div>

      {/* Core Values List */}
      <div className="space-y-4">
        {Object.entries(coreValues).map(([valueKey, value]) => {
          const entries = coreValueEntries[valueKey] || [];
          const isExpanded = expandedValue === valueKey;
          
          return (
            <div key={valueKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Value Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedValue(isExpanded ? null : valueKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{value.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      {entries.length} {entries.length === 1 ? 'story' : 'stories'}
                    </span>
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ⬇️
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-6 space-y-4">
                    {/* Add New Entry Button */}
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900">Your Stories</h4>
                      <button
                        onClick={() => setShowNewEntryForm(showNewEntryForm === valueKey ? null : valueKey)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                      >
                        {showNewEntryForm === valueKey ? 'Cancel' : '+ Add Story'}
                      </button>
                    </div>

                    {/* New Entry Form */}
                    {showNewEntryForm === valueKey && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h5 className="font-medium text-gray-900 mb-3">Share Your Story</h5>
                        <textarea
                          value={newEntry.story}
                          onChange={(e) => setNewEntry({ ...newEntry, story: e.target.value })}
                          placeholder="Tell us about a time you embodied this value... What was the situation? What actions did you take? What was the impact?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={4}
                        />
                        <div className="flex justify-end space-x-3 mt-3">
                          <button
                            onClick={() => setShowNewEntryForm(null)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => onAddEntry(valueKey)}
                            disabled={!newEntry.story.trim()}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              newEntry.story.trim() 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Save Story
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing Entries */}
                    {entries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="text-lg font-medium">No stories yet</p>
                        <p className="text-sm">Share your first story about living this value!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {entries.map((entry) => (
                          <div key={entry.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm text-gray-500">
                                📅 {new Date(entry.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <button
                                onClick={() => onDeleteEntry(valueKey, entry.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete story"
                              >
                                ❌
                              </button>
                            </div>
                            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {entry.story}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Admin Analytics View Component
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

// My Leadership Flightbook View Component with Accordion Organization
const LeadershipFlightbookView = ({ competencies, portfolio, setCurrentView }) => {
  const [flightbookEntries, setFlightbookEntries] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // Load flightbook entries when component mounts
  useEffect(() => {
    loadFlightbookEntries();
  }, []);

  const loadFlightbookEntries = () => {
    try {
      // Get entries from localStorage (journal reflections)
      const storedEntries = JSON.parse(localStorage.getItem('flightbook_entries') || '[]');
      
      // Convert date strings back to Date objects for stored entries
      const processedStoredEntries = storedEntries.map(entry => ({
        ...entry,
        date: entry.date ? new Date(entry.date) : new Date(),
        updated_at: entry.updated_at ? new Date(entry.updated_at) : (entry.date ? new Date(entry.date) : new Date()),
        created_at: entry.created_at ? new Date(entry.created_at) : (entry.date ? new Date(entry.date) : new Date())
      }));
      
      // Example structure for existing sample data
      const exampleEntries = [
        {
          id: 'entry-1',
          date: new Date(Date.now() - 86400000), // Yesterday
          competency: 'leadership_supervision',
          type: 'reflection',
          title: 'Team Meeting Leadership Reflection',
          content: 'Today I facilitated a challenging team meeting where we had to discuss budget cuts. I noticed how important it was to acknowledge everyone\'s concerns first before moving to solutions. The team responded much better when I started by validating their feelings.',
          tags: ['team-management', 'difficult-conversations'],
          source: 'task_completion'
        },
        {
          id: 'entry-2', 
          date: new Date(Date.now() - 172800000), // 2 days ago
          competency: 'financial_management',
          type: 'learning',
          title: 'Budget Analysis Insights',
          content: 'While reviewing the quarterly budget, I discovered patterns in our maintenance costs that could save us $15K annually. The key was looking at timing - we were doing preventive maintenance right before peak seasons when costs are highest.',
          tags: ['budget-analysis', 'cost-management'],
          source: 'portfolio_reflection'
        }
      ];
      
      // Combine stored entries with example entries
      const allEntries = [...processedStoredEntries, ...exampleEntries];
      
      // Sort by date (most recent first)
      const sorted = allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFlightbookEntries(sorted);
      
      console.log(`Loaded ${allEntries.length} flightbook entries (${processedStoredEntries.length} from journal, ${exampleEntries.length} examples)`);
    } catch (error) {
      console.error('Error loading flightbook entries:', error);
      setFlightbookEntries([]);
    }
  };

  // Helper function to get competency color scheme (same as Portfolio)
  const getCompetencyColor = (competencyKey) => {
    const colorMap = {
      'leadership_supervision': 'blue',
      'financial_management': 'green', 
      'operational_management': 'purple',
      'cross_functional_collaboration': 'orange',
      'strategic_thinking': 'red'
    };
    return colorMap[competencyKey] || 'gray';
  };

  // Helper function to get competency display name
  const getCompetencyName = (competencyKey) => {
    return competencies[competencyKey]?.name || competencyKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Start editing an entry
  const startEditing = (entry) => {
    setEditingEntry(entry.id);
    setEditContent(entry.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingEntry(null);
    setEditContent('');
  };

  // Save edited entry
  const saveEditedEntry = async (entryId) => {
    try {
      const existingEntries = JSON.parse(localStorage.getItem('flightbook_entries') || '[]');
      const entryIndex = existingEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex >= 0) {
        const existingEntry = existingEntries[entryIndex];
        
        // Only update if content has actually changed
        if (existingEntry.content !== editContent.trim()) {
          // Initialize version history if it doesn't exist
          if (!existingEntry.version_history) {
            existingEntry.version_history = [{
              version: 1,
              content: existingEntry.content,
              updated_at: existingEntry.date || existingEntry.created_at || new Date(),
              change_summary: 'Original version'
            }];
          }
          
          // Add current content to version history
          existingEntry.version_history.push({
            version: existingEntry.version_history.length + 1,
            content: editContent.trim(),
            updated_at: new Date(),
            change_summary: 'Updated via Flightbook edit'
          });
          
          // Update the main entry
          existingEntry.content = editContent.trim();
          existingEntry.updated_at = new Date();
          existingEntry.version = (existingEntry.version_history.length);
          
          // Save back to localStorage
          localStorage.setItem('flightbook_entries', JSON.stringify(existingEntries));
          
          // Update competency_task_progress if this is a journal reflection
          if (existingEntry.entry_key) {
            const competencyProgress = JSON.parse(localStorage.getItem('competency_task_progress') || '{}');
            if (competencyProgress[existingEntry.entry_key]) {
              competencyProgress[existingEntry.entry_key].notes = editContent.trim();
              localStorage.setItem('competency_task_progress', JSON.stringify(competencyProgress));
            }
          }
          
          console.log(`Flightbook entry updated (v${existingEntry.version}):`, existingEntry.title);
          
          // Reload entries to reflect changes
          loadFlightbookEntries();
        }
      }
      
      // Exit edit mode
      setEditingEntry(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving edited entry:', error);
    }
  };

  // Group flightbook entries by competency areas
  const organizeFlightbookByCompetency = () => {
    const organized = {};
    const unassigned = [];

    flightbookEntries.forEach(entry => {
      const competencyKey = entry.competency || entry.competency_area;
      if (competencyKey && competencies[competencyKey]) {
        if (!organized[competencyKey]) {
          organized[competencyKey] = [];
        }
        organized[competencyKey].push(entry);
      } else {
        unassigned.push(entry);
      }
    });

    return { organized, unassigned };
  };

  // Extract journal entries and reflections from various sources
  const getJournalEntries = () => {
    return flightbookEntries;
  };

  const { organized, unassigned } = organizeFlightbookByCompetency();
  const journalEntries = getJournalEntries();
  const totalEntries = journalEntries.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">✈️ My Leadership Flightbook</h2>
        <p className="text-lg text-gray-600 mb-4">Your personal journey log of leadership experiences, insights, and growth moments</p>
        <div className="flex justify-center space-x-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-blue-800 font-medium">{totalEntries} Flight Log Entries</span>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            ✏️ New Flight Log Entry
          </button>
          <button 
            onClick={() => {
              // Test function to create a sample flightbook entry
              const testEntry = {
                id: `test_${Date.now()}`,
                title: 'Test: Manual Flightbook Entry',
                content: 'This is a test entry to verify the flightbook system is working correctly.',
                competency: 'leadership_supervision',
                type: 'manual_test',
                source: 'manual_entry',
                tags: ['test', 'manual'],
                date: new Date()
              };
              const existingEntries = JSON.parse(localStorage.getItem('flightbook_entries') || '[]');
              existingEntries.push(testEntry);
              localStorage.setItem('flightbook_entries', JSON.stringify(existingEntries));
              loadFlightbookEntries(); // Reload to show new entry
              console.log('Test flightbook entry created');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            🧪 Test Entry
          </button>
        </div>
      </div>

      {totalEntries > 0 ? (
        <div className="space-y-4">
          {/* Competency-Organized Accordion Sections */}
          {Object.entries(organized).map(([competencyKey, entries]) => {
            const color = getCompetencyColor(competencyKey);
            const competencyName = getCompetencyName(competencyKey);
            const entryCount = entries.length;
            const isExpanded = expandedSections[competencyKey];

            return (
              <div key={competencyKey} className="bg-white rounded-lg shadow border">
                {/* Competency Section Header - Clickable */}
                <button
                  onClick={() => toggleSection(competencyKey)}
                  className={`w-full p-4 text-left border-l-4 border-${color}-500 bg-${color}-50 rounded-t-lg hover:bg-${color}-100 transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {isExpanded ? '✈️' : '🛩️'}
                      </span>
                      <div>
                        <h3 className={`text-lg font-bold text-${color}-900`}>
                          {competencyName}
                        </h3>
                        <p className={`text-sm text-${color}-700`}>
                          {entryCount} flight log {entryCount !== 1 ? 'entries' : 'entry'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm font-medium`}>
                        {entryCount}
                      </div>
                      <span className={`text-${color}-600 text-lg`}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4 space-y-4">
                      {entries.map((entry) => (
                        <div key={entry.id} className={`p-4 border-l-4 border-${color}-500 bg-${color}-25 rounded-r-lg`}>
                          {/* Entry Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{entry.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                                  {entry.type?.replace('_', ' ') || 'reflection'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mb-3">
                                📅 {entry.date && entry.date.toLocaleDateString ? entry.date.toLocaleDateString() : 'Recent'} • Source: {entry.source ? entry.source.replace('_', ' ') : 'manual entry'}
                              </div>
                            </div>
                          </div>

                          {/* Entry Content */}
                          <div className="prose max-w-none mb-4">
                            <p className="text-gray-700 leading-relaxed">{entry.content}</p>
                          </div>

                          {/* Tags */}
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {entry.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Entry Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex space-x-3">
                              <button className={`text-sm text-${color}-600 hover:text-${color}-800`}>✏️ Edit</button>
                              <button className="text-sm text-green-600 hover:text-green-800">📁 Add to Portfolio</button>
                              <button className="text-sm text-purple-600 hover:text-purple-800">🔗 Link to Task</button>
                            </div>
                            <div className="text-xs text-gray-500">
                              Last updated: {entry.date && entry.date.toLocaleDateString ? entry.date.toLocaleDateString() : 'Recent'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned Entries Section */}
          {unassigned.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <button
                onClick={() => toggleSection('unassigned')}
                className="w-full p-4 text-left border-l-4 border-gray-400 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {expandedSections['unassigned'] ? '✈️' : '🛩️'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        📋 General Reflections
                      </h3>
                      <p className="text-sm text-gray-700">
                        {unassigned.length} {unassigned.length !== 1 ? 'entries' : 'entry'} not linked to specific competencies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {unassigned.length}
                    </div>
                    <span className="text-gray-600 text-lg">
                      {expandedSections['unassigned'] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </button>

              {expandedSections['unassigned'] && (
                <div className="border-t border-gray-200">
                  <div className="p-4 space-y-4">
                    {unassigned.map((entry) => (
                      <div key={entry.id} className="p-4 border-l-4 border-gray-400 bg-gray-25 rounded-r-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{entry.title}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {entry.type?.replace('_', ' ') || 'reflection'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mb-3">
                              📅 {entry.date && entry.date.toLocaleDateString ? entry.date.toLocaleDateString() : 'Recent'} • Source: {entry.source ? entry.source.replace('_', ' ') : 'manual entry'}
                            </div>
                          </div>
                        </div>

                        {/* Content display or editing interface */}
                        {editingEntry === entry.id ? (
                          // Editing mode
                          <div className="mb-4">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows="6"
                              placeholder="Edit your reflection..."
                            />
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => saveEditedEntry(entry.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                              >
                                💾 Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <div className="prose max-w-none mb-4">
                            <p className="text-gray-700 leading-relaxed">{entry.content}</p>
                          </div>
                        )}

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {entry.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex space-x-3">
                            <button className="text-sm text-gray-600 hover:text-gray-800">✏️ Edit</button>
                            <button className="text-sm text-green-600 hover:text-green-800">📁 Add to Portfolio</button>
                            <button className="text-sm text-purple-600 hover:text-purple-800">🔗 Link to Task</button>
                            {entry.version_history && entry.version_history.length > 1 && (
                              <button className="text-sm text-indigo-600 hover:text-indigo-800">📚 View History (v{entry.version})</button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last updated: {entry.updated_at && entry.updated_at.toLocaleDateString ? 
                              entry.updated_at.toLocaleDateString() : 
                              (entry.date && entry.date.toLocaleDateString ? entry.date.toLocaleDateString() : 'Recent')}
                            {entry.version && entry.version > 1 && (
                              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                v{entry.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">✈️</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your Leadership Flightbook is ready for takeoff!</h3>
          <p className="text-gray-600 mb-6">Start documenting your leadership journey, insights, and growth moments.</p>
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            ✏️ Write Your First Flight Log Entry
          </button>
        </div>
      )}
    </div>
  );
};

export default App;