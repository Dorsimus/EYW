import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock current user - in real app this would come from authentication
// Use localStorage to persist the demo user ID across sessions
const getStoredUserId = () => localStorage.getItem('demo_user_id');
const setStoredUserId = (id) => localStorage.setItem('demo_user_id', id);

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
                in_the_flow_activity: "Create one simple, sustainable motivation practice for your team",
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
                in_the_flow_activity: "Give meaningful feedback to one team member weekly (something you should already be doing!)",
                document: "Weekly Feedback Log - just note what worked/didn't work (5 minutes)",
                integrations: ["Leadership Integration: Practice feedback techniques learned in Leadership modules"],
                reflection: "What makes feedback feel helpful vs. hurtful?"
              },
              {
                month: 2,
                title: "Performance Conversations",
                in_the_flow_activity: "Address one performance issue using structured approach",
                document: "Performance Conversation Template (create a simple framework you'll actually use)",
                integrations: ["Financial Integration: Connect performance conversations to departmental budget impact", "Strategic Integration: Frame performance in context of property goals"],
                journal_prompt: "How do I balance care for the person with accountability for results?"
              },
              {
                month: 3,
                title: "Conflict Resolution Mastery",
                in_the_flow_activity: "Resolve one team or cross-department conflict using learned techniques",
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
                description: "Master framework for difficult conversations",
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
                in_the_flow_activity: "Create simple development goal with each team member during regular meetings",
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
                in_the_flow_activity: "Recognize and celebrate each team member's growth",
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
        description: "Building Department Leaders Who Understand Business Impact - Core Philosophy: Department Leaders Who Understand Numbers Make Better Decisions", 
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 85,
        competency_area: "financial_management",
        sub_competencies: {
          departmental_financial_responsibility: {
            name: "Departmental Financial Responsibility & P&L Understanding",
            description: "Learn to read property P&L statements and understand your department's financial impact",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 21,
            foundation_courses: [
              {
                id: "fm-fc-01",
                title: "Property Management Financials",
                duration: "1 hour 15 minutes",
                platform: "PerformanceHQ",
                description: "Core financial concepts for property management"
              },
              {
                id: "fm-fc-02",
                title: "CM Weekly Meeting - Accounting with Mike Mullins",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Real-world accounting application"
              },
              {
                id: "fm-fc-03",
                title: "CM Weekly Meeting - Accounting with Steph & Mike",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Advanced accounting concepts"
              }
            ],
            signature_activity: {
              title: "Department Financial Impact Mastery",
              icon: "🔢",
              description: "Three-month journey to master P&L reading and understand your department's financial impact",
              phases: [
                {
                  phase: 1,
                  title: "P&L Reading & Department Connection",
                  duration: "Month 1",
                  activities: [
                    "Learn to read property P&L statements and identify your department's impact on each line item",
                    "CM Shadowing Focus: Observe CM reviewing monthly P&L and asking questions about line items (1 hour monthly)",
                    "Practice P&L analysis with department focus for 3 consecutive months"
                  ],
                  deliverables: [
                    "P&L Reading Practice (annotated P&L showing department's impact on each relevant line)",
                    "Department Impact Analysis (how leasing/maintenance decisions show up financially)",
                    "Monthly P&L Review Notes (3 months of observations and questions)"
                  ],
                  journal_prompt: "Which P&L line items do I directly influence through my daily decisions? How can I better understand the financial impact of my department's work?",
                  custom_materials: [
                    "Navigator's P&L Reading Guide - How to read and interpret property P&L statements with department focus",
                    "Department Impact Mapping - Which P&L lines your department directly affects",
                    "Student Housing P&L Basics - Key differences in student housing financial statements"
                  ]
                },
                {
                  phase: 2,
                  title: "Revenue vs. Expense Understanding",
                  duration: "Month 2",
                  activities: [
                    "Develop clear understanding of how your department drives revenue and manages expenses",
                    "CM Shadowing Focus: Participate in monthly revenue/expense review focusing on your department",
                    "Analyze 3 months of department revenue and expense patterns"
                  ],
                  deliverables: [
                    "Revenue Impact Analysis (how your department contributes to property revenue)",
                    "Department Expense Breakdown (categorizing and understanding all department expenses)",
                    "Cost-Per-Unit Calculations (understanding department costs on per-unit basis)"
                  ],
                  journal_prompt: "How does my department generate or protect revenue? What expenses do I have control over, and how can I manage them more effectively?",
                  custom_materials: [
                    "Revenue Drivers by Department - How leasing drives revenue, how maintenance protects revenue",
                    "Expense Category Management - Understanding controllable vs. uncontrollable expenses",
                    "Cost Per Unit Thinking - Breaking down department costs on a per-unit basis"
                  ]
                },
                {
                  phase: 3,
                  title: "Financial Trend Awareness",
                  duration: "Month 3",
                  activities: [
                    "Learn to identify financial patterns that affect your department and property",
                    "Peer Learning: Compare financial patterns with Navigator from different property type",
                    "Develop predictive awareness of seasonal and cyclical financial changes"
                  ],
                  deliverables: [
                    "Seasonal Trend Analysis (identifying patterns in your department's financial performance)",
                    "Variance Explanation Practice (explaining why department numbers were different than expected)",
                    "Financial Improvement Opportunities (realistic ways to improve department financial performance)"
                  ],
                  journal_prompt: "What financial patterns do I see in my department? How can I anticipate and prepare for predictable financial changes?",
                  custom_materials: [
                    "Seasonal Financial Patterns in Student Housing - Understanding predictable financial cycles",
                    "Financial Red Flags for Department Leaders - Early warning signs to watch for",
                    "Month-to-Month Variance Analysis - Understanding why numbers change and what to do"
                  ]
                }
              ]
            }
          },
          departmental_budget_management: {
            name: "Departmental Budget Creation & Management",
            description: "Master the creation and ongoing management of department budgets",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 17,
            foundation_courses: [
              {
                id: "fm-fc-04",
                title: "Performance Management",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Using metrics to drive performance"
              },
              {
                id: "fm-fc-05",
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Presenting financial information effectively"
              }
            ],
            signature_activity: {
              title: "Department Budget Mastery",
              icon: "💰",
              description: "Three-month intensive on creating, tracking, and communicating department budgets",
              phases: [
                {
                  phase: 1,
                  title: "Budget Basics & Department Planning",
                  duration: "Month 1",
                  activities: [
                    "Learn to create realistic departmental budgets based on historical data and operational needs",
                    "CM Shadowing Focus: Participate in department budget planning discussions with CM",
                    "Complete comprehensive historical analysis and budget creation process"
                  ],
                  deliverables: [
                    "Department Budget Creation Process (your methodology for building budgets)",
                    "Historical Analysis Worksheet (3 years of department performance with trends)",
                    "Budget Proposal (next year's department budget with line-by-line justifications)"
                  ],
                  journal_prompt: "What drives the costs in my department? How can I create a budget that's both realistic and helps us improve performance?",
                  custom_materials: [
                    "Department Budget Creation Guide - Step-by-step process for building department budgets",
                    "Historical Data Analysis for Budgeting - Using past performance to predict future needs",
                    "Budget Justification Templates - How to explain and defend budget requests"
                  ]
                },
                {
                  phase: 2,
                  title: "Monthly Budget Tracking & Management",
                  duration: "Month 2",
                  activities: [
                    "Develop systems for monitoring department budget performance and taking corrective action",
                    "CM Shadowing Focus: Observe monthly budget review meetings and variance discussions",
                    "Implement and test monthly budget tracking and variance analysis systems"
                  ],
                  deliverables: [
                    "Monthly Budget Tracking System (how you monitor and report department spending)",
                    "Budget Variance Analysis (3 months of explaining why actual differed from budget)",
                    "Cost Control Implementation (specific actions taken to manage department expenses)"
                  ],
                  journal_prompt: "How do I stay on top of my department's budget without micromanaging every expense? What cost control measures actually work in day-to-day operations?",
                  custom_materials: [
                    "Monthly Budget Tracking Templates - Simple tools for monitoring department spending",
                    "Budget Variance Management - When to worry about budget differences and what to do",
                    "Cost Control Strategies by Department - Practical ways to manage expenses without hurting operations"
                  ]
                },
                {
                  phase: 3,
                  title: "Budget Communication & Team Involvement",
                  duration: "Month 3",
                  activities: [
                    "Learn to communicate budget expectations to your team and involve them in budget management",
                    "Team Implementation: Lead team meeting about department budget and cost consciousness",
                    "Develop team engagement strategies for financial performance improvement"
                  ],
                  deliverables: [
                    "Team Budget Communication Plan (how you share budget information and expectations)",
                    "Team Financial Goals (budget-related goals for department team members)",
                    "Budget Success Stories (examples of team members contributing to better financial performance)"
                  ],
                  journal_prompt: "How can I get my team excited about managing costs and improving financial performance? What budget information helps them do their jobs better?",
                  custom_materials: [
                    "Budget Communication for Teams - How to explain budget constraints and goals to your team",
                    "Team Involvement in Cost Management - Getting your team to care about financial performance",
                    "Department Financial Goals Setting - Creating budget-related goals that motivate rather than restrict"
                  ]
                }
              ]
            }
          },
          cost_conscious_decision_making: {
            name: "Cost-Conscious Decision Making & Basic ROI Thinking",
            description: "Develop skills in evaluating financial impact of decisions and basic ROI analysis",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 17,
            foundation_courses: [
              {
                id: "fm-fc-06",
                title: "Business Ethics",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Ethical decision-making in business contexts"
              },
              {
                id: "fm-fc-07",
                title: "Spark: Resident Retention - Turnover Trouble - The High Cost of Vacancy",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Understanding true costs of vacancy and turnover"
              }
            ],
            signature_activity: {
              title: "Smart Financial Decision Making",
              icon: "📊",
              description: "Three-month development of cost-benefit analysis and ROI thinking skills",
              phases: [
                {
                  phase: 1,
                  title: "Cost-Benefit Analysis for Daily Decisions",
                  duration: "Month 1",
                  activities: [
                    "Learn to evaluate the financial impact of routine department decisions",
                    "CM Shadowing Focus: Observe CM making operational decisions and considering financial implications",
                    "Practice cost-benefit analysis on 5 recent department decisions"
                  ],
                  deliverables: [
                    "Decision-Making Framework (your process for considering financial impact in daily decisions)",
                    "Cost-Benefit Analysis Examples (5 recent department decisions with financial analysis)",
                    "ROI Calculation Practice (3 scenarios with complete financial analysis)"
                  ],
                  journal_prompt: "What's the real cost of the decisions I make daily? How can I get better at seeing the full financial picture before deciding?",
                  custom_materials: [
                    "Department Decision Cost-Benefit Guide - Simple framework for evaluating daily decisions financially",
                    "Hidden Costs Checklist - Finding all the costs associated with department decisions",
                    "ROI Templates for Department Leaders - Basic ROI calculations for common situations"
                  ]
                },
                {
                  phase: 2,
                  title: "Department Investment Decisions",
                  duration: "Month 2",
                  activities: [
                    "Develop skills in evaluating department-level investments and improvements",
                    "Peer Collaboration: Work with opposite department Navigator on joint investment analysis",
                    "Complete investment analysis for 2-3 potential department improvements"
                  ],
                  deliverables: [
                    "Investment Analysis Examples (2-3 department investments with complete financial analysis)",
                    "Quality vs. Cost Evaluations (decisions where you balanced financial and operational needs)",
                    "Payback Period Calculations (showing when investments will pay for themselves)"
                  ],
                  journal_prompt: "How do I balance immediate costs with long-term benefits? What investments in my department would really pay off?",
                  custom_materials: [
                    "Department Investment Analysis - How to evaluate equipment, technology, or process investments",
                    "Payback Period Calculations - Simple method for determining if investments make sense",
                    "Quality vs. Cost Decision Framework - Balancing financial and operational considerations"
                  ]
                },
                {
                  phase: 3,
                  title: "Efficiency and Process Improvement ROI",
                  duration: "Month 3",
                  activities: [
                    "Identify and quantify the financial benefits of department efficiency improvements",
                    "Cross-Department Project: Identify efficiency improvement that benefits both leasing and maintenance",
                    "Implement and measure ROI of process improvements"
                  ],
                  deliverables: [
                    "Process Efficiency Analysis (identifying improvement opportunities with financial impact)",
                    "Efficiency Improvement Implementation (changes made with before/after financial comparison)",
                    "Time-Savings ROI Calculations (showing financial value of process improvements)"
                  ],
                  journal_prompt: "What process improvements could save time AND money? How do I implement changes that actually stick and provide lasting financial benefits?",
                  custom_materials: [
                    "Efficiency Improvement Financial Analysis - How to calculate the dollar value of time and process savings",
                    "Department Process Cost Analysis - Understanding the true cost of current processes",
                    "Improvement Implementation Planning - Making changes that actually improve financial performance"
                  ]
                }
              ]
            }
          },
          financial_communication: {
            name: "Financial Communication & Team Education",
            description: "Develop ability to communicate financial concepts to teams and leadership",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 17,
            foundation_courses: [
              {
                id: "fm-fc-08",
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Presenting data effectively"
              },
              {
                id: "fm-fc-09",
                title: "Business Writing: Grammar Works",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Professional communication skills"
              }
            ],
            signature_activity: {
              title: "Financial Communication Skills",
              icon: "📈",
              description: "Three-month development of financial communication and education abilities",
              phases: [
                {
                  phase: 1,
                  title: "Explaining Financial Information to Your Team",
                  duration: "Month 1",
                  activities: [
                    "Develop ability to communicate financial concepts and department performance to team members",
                    "CM Shadowing Focus: Observe how CM communicates financial information in team settings",
                    "Practice explaining financial concepts in team meetings"
                  ],
                  deliverables: [
                    "Team Financial Communication Examples (how you explain budget and financial performance)",
                    "Department Performance Reports (simple financial updates you share with your team)",
                    "Financial Goal Documentation (budget-related goals set with team members)"
                  ],
                  journal_prompt: "How can I help my team understand how their work affects the property's financial success? What financial information helps them do their jobs better?",
                  custom_materials: [
                    "Financial Communication for Non-Financial People - How to explain numbers without overwhelming people",
                    "Department Performance Reporting - Creating simple, understandable financial updates for your team",
                    "Financial Goal Setting with Teams - Making budget goals meaningful and motivating"
                  ]
                },
                {
                  phase: 2,
                  title: "Department Financial Reporting to CM",
                  duration: "Month 2",
                  activities: [
                    "Learn to create clear, useful financial reports and updates for your Community Manager",
                    "Presentation Practice: Present monthly department financial update to CM",
                    "Develop systematic approach to financial reporting and variance explanation"
                  ],
                  deliverables: [
                    "Monthly Financial Reports (regular updates you provide to CM about department performance)",
                    "Variance Explanations (examples of explaining budget differences with recommendations)",
                    "Financial Recommendations (suggestions you've made to CM based on financial analysis)"
                  ],
                  journal_prompt: "What financial information does my CM need from me? How can I present financial updates that are helpful rather than just informational?",
                  custom_materials: [
                    "Department Financial Reporting Templates - Standard formats for updating CM on department financial performance",
                    "Variance Explanation Guidelines - How to explain why actual performance differed from budget",
                    "Financial Recommendation Framework - How to present financially-based suggestions to CM"
                  ]
                },
                {
                  phase: 3,
                  title: "Cross-Department Financial Collaboration",
                  duration: "Month 3",
                  activities: [
                    "Develop skills in discussing financial impact and decisions with other departments",
                    "Collaborative Project: Work with opposite department on shared financial goal or challenge",
                    "Practice cross-department financial communication and conflict resolution"
                  ],
                  deliverables: [
                    "Cross-Department Financial Discussions (examples of working through financial decisions with other departments)",
                    "Joint Planning Examples (collaborative financial planning with leasing/maintenance counterpart)",
                    "Resource Allocation Decisions (how you've worked through competing financial priorities)"
                  ],
                  journal_prompt: "How can leasing and maintenance work together to improve property financial performance? What financial conversations do I need to have with other departments?",
                  custom_materials: [
                    "Cross-Department Financial Communication - How to discuss financial implications with leasing/maintenance counterparts",
                    "Joint Financial Planning - Working together on decisions that affect both departments financially",
                    "Financial Conflict Resolution - Handling disagreements about resources and spending"
                  ]
                }
              ]
            }
          },
          operational_efficiency: {
            name: "Operational Efficiency & Department Cost Control",
            description: "Master cost control and waste reduction while maintaining operational quality",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 13,
            foundation_courses: [
              {
                id: "fm-fc-10",
                title: "Business Etiquette",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Professional business interactions"
              },
              {
                id: "fm-fc-11",
                title: "Express: Customer Service - Responding to Residents Facing Financial Hardship",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Balancing business and resident needs"
              }
            ],
            signature_activity: {
              title: "Department Financial Optimization",
              icon: "🎯",
              description: "Three-month intensive on cost control, efficiency improvement, and preventive financial management",
              phases: [
                {
                  phase: 1,
                  title: "Cost Control & Waste Reduction",
                  duration: "Month 1",
                  activities: [
                    "Identify and eliminate waste in department operations while maintaining quality",
                    "CM Shadowing Focus: Observe CM making cost control decisions and balancing priorities",
                    "Conduct comprehensive department cost analysis and implement waste reduction measures"
                  ],
                  deliverables: [
                    "Department Cost Analysis (comprehensive review of all department expenses)",
                    "Waste Reduction Implementation (specific changes made to reduce unnecessary costs)",
                    "Quality Maintenance Plan (how you maintain standards while controlling costs)"
                  ],
                  journal_prompt: "Where is my department wasting money without adding value? How can I control costs without sacrificing the quality of our work?",
                  custom_materials: [
                    "Department Cost Control Strategies - Practical ways to manage expenses without hurting operations",
                    "Waste Identification and Elimination - Finding and fixing financial waste in daily operations",
                    "Quality vs. Cost Balance - Maintaining service standards while controlling costs"
                  ]
                },
                {
                  phase: 2,
                  title: "Resource Optimization & Efficiency",
                  duration: "Month 2",
                  activities: [
                    "Improve department efficiency to get better results with the same or fewer resources",
                    "Team Implementation: Lead department efficiency improvement project with measurable results",
                    "Implement cross-training initiatives and measure financial benefits"
                  ],
                  deliverables: [
                    "Resource Optimization Plan (how you're getting more from existing department resources)",
                    "Efficiency Improvement Results (measurable improvements in department productivity)",
                    "Cross-Training Cost-Benefit Analysis (financial benefits of having cross-trained team members)"
                  ],
                  journal_prompt: "How can my department accomplish more with the same resources? What efficiency improvements would have the biggest financial impact?",
                  custom_materials: [
                    "Department Resource Optimization - Getting more from existing resources (people, equipment, supplies)",
                    "Efficiency Measurement and Improvement - Tracking and improving department productivity",
                    "Cross-Training Financial Benefits - How cross-training can improve financial performance"
                  ]
                },
                {
                  phase: 3,
                  title: "Preventive Financial Management",
                  duration: "Month 3",
                  activities: [
                    "Develop proactive approaches to prevent costly problems and maintain financial performance",
                    "Implementation: Implement preventive measures that save money over time",
                    "Create comprehensive emergency financial procedures for unexpected situations"
                  ],
                  deliverables: [
                    "Preventive Management Plan (proactive steps to prevent costly department problems)",
                    "Financial Risk Assessment (potential financial risks in your department and prevention strategies)",
                    "Emergency Financial Procedures (how your department manages costs during unexpected situations)"
                  ],
                  journal_prompt: "What proactive steps can I take to prevent expensive problems in my department? How do I balance prevention costs with potential savings?",
                  custom_materials: [
                    "Preventive Cost Management - Preventing expensive problems through proactive management",
                    "Financial Risk Identification - Spotting potential financial problems before they become expensive",
                    "Department Emergency Financial Planning - Managing department finances during unexpected situations"
                  ]
                }
              ]
            }
          }
        },
        validation_criteria: {
          mastery_gates: [
            "P&L Reading Competency: Demonstrate ability to read property P&L and explain department's impact on key line items",
            "Department Budget Management: Successfully create and manage department budget within 5% of target for 6+ months",
            "ROI Decision Making: Complete 3 different department-level ROI analyses with sound reasoning and implementation",
            "Cost Control Evidence: Document measurable cost savings or efficiency improvements in department operations"
          ],
          portfolio_defense: {
            title: "Portfolio Defense - Financial Focus",
            duration: "20-minute presentation to CM and peer panel",
            components: [
              "P&L Understanding: Explain how department impacts property P&L and identify improvement opportunities",
              "Budget Management: Present department budget management approach and results",
              "Cost-Conscious Decision Making: Present examples of decisions made with financial impact consideration",
              "Q&A on Financial Scenarios: Handle department-level financial decision-making scenarios"
            ]
          },
          cm_readiness_indicators: [
            "Department Financial Responsibility: Proven ability to manage department budget and financial performance",
            "Cost-Conscious Leadership: Consistently makes decisions considering financial impact",
            "Financial Communication: Can explain financial concepts to team members and peers",
            "Operational Efficiency: Implements improvements that enhance both operations and financial performance",
            "Cross-Department Financial Collaboration: Works effectively with other departments on financial decisions"
          ]
        }
      },
      operational_management: {
        name: "Operational Management & Process Excellence",
        description: "Core Philosophy: Efficient Operations + Quality Standards = Resident Satisfaction + Business Success - Optimizing department operations, ensuring compliance and safety, and building operational expertise",
        overall_progress: 0,
        completion_percentage: 0, 
        completed_tasks: 0,
        total_tasks: 82,
        competency_area: "operational_management",
        sub_competencies: {
          process_optimization: {
            name: "Process Optimization & Standard Operating Procedures",
            description: "Analyze, improve, and standardize department processes for maximum efficiency",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 19,
            foundation_courses: [
              {
                id: "om-fc-01",
                title: "Quick Start: Make Ready Process",
                duration: "15 minutes",
                platform: "PerformanceHQ",
                description: "Foundation of property operations"
              },
              {
                id: "om-fc-02",
                title: "Preventative Maintenance",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Systematic approach to maintenance operations"
              },
              {
                id: "om-fc-03",
                title: "Maintenance For Office Staff",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Cross-functional operational understanding"
              },
              {
                id: "om-fc-04",
                title: "Effective Time Management",
                duration: "35 minutes",
                platform: "PerformanceHQ",
                description: "Personal and team efficiency"
              }
            ],
            signature_activity: {
              title: "Operational Excellence Systems",
              icon: "⚙️",
              description: "Three-month journey to analyze, improve, and standardize all department processes",
              phases: [
                {
                  phase: 1,
                  title: "Current Process Assessment & Documentation",
                  duration: "Month 1",
                  activities: [
                    "Analyze and document all current department processes to identify improvement opportunities",
                    "CM Shadowing Focus: Observe CM reviewing and improving property-wide operational processes (1 hour weekly)",
                    "Complete comprehensive process mapping and efficiency analysis for all major workflows"
                  ],
                  deliverables: [
                    "Current Process Maps (visual documentation of all major department workflows)",
                    "Process Efficiency Analysis (time studies and bottleneck identification)",
                    "SOP Gap Assessment (identifying processes that need documented procedures)"
                  ],
                  journal_prompt: "Which of our current processes work well, and which create frustration or waste time? How can I document our best practices so they're consistent across the team?",
                  custom_materials: [
                    "Process Mapping for Department Leaders - How to document and analyze current workflows",
                    "SOP Creation Templates for Property Management - Standard formats for creating procedures",
                    "Efficiency Assessment Tools - Methods for measuring current process effectiveness"
                  ]
                },
                {
                  phase: 2,
                  title: "Process Improvement Implementation",
                  duration: "Month 2",
                  activities: [
                    "Design and implement improved processes with measurable efficiency gains",
                    "CM Shadowing Focus: Participate in property-wide process improvement discussions and implementation",
                    "Lead implementation of 3+ process improvements with team buy-in and measurement"
                  ],
                  deliverables: [
                    "Process Improvement Plans (detailed plans for 3+ process improvements with timelines)",
                    "Implementation Results (before/after comparisons showing efficiency gains)",
                    "Team Feedback on Changes (how process improvements affected team satisfaction and performance)"
                  ],
                  journal_prompt: "What process improvements are having the biggest impact on our efficiency? How do I ensure changes stick and don't revert to old ways?",
                  custom_materials: [
                    "Process Improvement Methodology - Step-by-step approach to improving workflows",
                    "Change Management for Operational Improvements - Getting team buy-in for process changes",
                    "Efficiency Measurement and Tracking - How to measure and maintain process improvements"
                  ]
                },
                {
                  phase: 3,
                  title: "Standard Operating Procedure Creation & Training",
                  duration: "Month 3",
                  activities: [
                    "Create comprehensive SOPs and train team members on standardized processes",
                    "Team Training Leadership: Lead training sessions for team members on new/improved processes",
                    "Develop SOP maintenance system to keep procedures current and effective"
                  ],
                  deliverables: [
                    "Complete SOP Library (documented procedures for all major department processes)",
                    "Training Materials (guides, checklists, and resources for teaching procedures)",
                    "SOP Implementation Results (evidence of improved consistency and quality)"
                  ],
                  journal_prompt: "How do I create procedures that people actually follow rather than ignore? What makes an SOP useful vs. bureaucratic?",
                  custom_materials: [
                    "SOP Writing Best Practices - Creating procedures that are actually followed",
                    "Training Design for Operational Procedures - How to teach processes effectively",
                    "SOP Maintenance and Updates - Keeping procedures current and relevant"
                  ]
                }
              ]
            }
          },
          quality_compliance: {
            name: "Quality Control & Compliance Management",
            description: "Establish quality standards and ensure regulatory compliance across all operations",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 17,
            foundation_courses: [
              {
                id: "om-fc-05",
                title: "Fair Housing For Maintenance",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Legal compliance for maintenance operations"
              },
              {
                id: "om-fc-06",
                title: "Express: Leasing - Tour Safely, Fairly and in Compliance With Laws",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Leasing compliance basics"
              },
              {
                id: "om-fc-07",
                title: "Reducing Risk through Policies and Procedures",
                duration: "15 minutes",
                platform: "PerformanceHQ",
                description: "Risk management through procedures"
              },
              {
                id: "om-fc-08",
                title: "GH Webinar: Risk Management Inspections in Multifamily Housing",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Property inspection best practices"
              }
            ],
            signature_activity: {
              title: "Quality & Compliance Mastery",
              icon: "✅",
              description: "Three-month intensive on quality standards, compliance management, and inspection leadership",
              phases: [
                {
                  phase: 1,
                  title: "Quality Standards Development & Implementation",
                  duration: "Month 1",
                  activities: [
                    "Establish clear quality standards for all department operations and implement measurement systems",
                    "CM Shadowing Focus: Observe CM conducting quality inspections and addressing quality issues",
                    "Develop and implement quality control systems with measurable standards"
                  ],
                  deliverables: [
                    "Department Quality Standards (clear, measurable criteria for all major work outputs)",
                    "Quality Control Checklists (tools for consistent quality measurement)",
                    "Quality Performance Tracking (data showing quality improvements over time)"
                  ],
                  journal_prompt: "What does 'quality' really mean in my department? How can I measure and maintain quality standards that residents actually notice and appreciate?",
                  custom_materials: [
                    "Quality Standards Creation for Property Management - Developing measurable quality criteria",
                    "Quality Control Checklists by Department - Practical tools for maintaining standards",
                    "Customer Experience Quality Metrics - Measuring quality from resident perspective"
                  ]
                },
                {
                  phase: 2,
                  title: "Compliance Management & Risk Prevention",
                  duration: "Month 2",
                  activities: [
                    "Master compliance requirements and develop proactive systems to prevent violations",
                    "CM Shadowing Focus: Participate in compliance reviews and regulatory discussions",
                    "Create comprehensive compliance monitoring and risk prevention systems"
                  ],
                  deliverables: [
                    "Compliance Checklist (comprehensive list of all applicable regulations and requirements)",
                    "Compliance Monitoring System (process for staying current with regulatory changes)",
                    "Risk Prevention Plan (proactive measures to avoid violations and legal issues)"
                  ],
                  journal_prompt: "What compliance requirements apply to my department, and how do I stay on top of changes? What proactive steps can I take to prevent violations before they happen?",
                  custom_materials: [
                    "Compliance Requirements by Department - Key legal and regulatory requirements for leasing/maintenance",
                    "Compliance Monitoring Systems - Tools for staying on top of regulatory requirements",
                    "Risk Prevention Strategies - Proactive approaches to avoiding compliance violations"
                  ]
                },
                {
                  phase: 3,
                  title: "Inspection & Audit Management",
                  duration: "Month 3",
                  activities: [
                    "Develop expertise in conducting thorough inspections and preparing for external audits",
                    "Implementation: Lead department inspections and coordinate corrective actions",
                    "Build systems for managing inspections and audit preparation effectively"
                  ],
                  deliverables: [
                    "Internal Inspection System (regular inspection schedules and procedures)",
                    "Audit Preparation Process (systematic approach to preparing for external inspections)",
                    "Corrective Action Examples (how you've addressed inspection findings and prevented recurrence)"
                  ],
                  journal_prompt: "How can I make inspections valuable learning opportunities rather than just compliance exercises? What inspection approach helps us improve rather than just check boxes?",
                  custom_materials: [
                    "Internal Inspection Protocols - Systematic approaches to property and department inspections",
                    "Audit Preparation and Management - Preparing for external inspections and audits",
                    "Corrective Action Planning - Addressing inspection findings and preventing recurrence"
                  ]
                }
              ]
            }
          },
          safety_leadership: {
            name: "Safety Leadership & Risk Management",
            description: "Create and lead strong safety culture while managing operational risks effectively",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 18,
            foundation_courses: [
              {
                id: "om-fc-09",
                title: "Safety Series: Manage Maintenance Safety",
                duration: "20 minutes",
                platform: "PerformanceHQ",
                description: "Safety leadership fundamentals"
              },
              {
                id: "om-fc-10",
                title: "Safety Series: Personal Protective Equipment",
                duration: "20 minutes",
                platform: "PerformanceHQ",
                description: "PPE requirements and usage"
              },
              {
                id: "om-fc-11",
                title: "Safety Series: Preventing Slips, Trips, and Falls",
                duration: "20 minutes",
                platform: "PerformanceHQ",
                description: "Common hazard prevention"
              },
              {
                id: "om-fc-12",
                title: "Safety Series: Required OSHA Recordkeeping - OSHA 300",
                duration: "20 minutes",
                platform: "PerformanceHQ",
                description: "Documentation requirements"
              },
              {
                id: "om-fc-13",
                title: "Crisis Management: Prevention & Preparation",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Emergency response planning"
              }
            ],
            signature_activity: {
              title: "Safety Leadership Program",
              icon: "🛡️",
              description: "Three-month development of safety culture, risk management, and emergency response leadership",
              phases: [
                {
                  phase: 1,
                  title: "Safety Culture Development",
                  duration: "Month 1",
                  activities: [
                    "Create and lead a strong safety culture within your department and property",
                    "CM Shadowing Focus: Observe CM handling safety issues and conducting safety meetings",
                    "Develop and implement safety training and communication programs"
                  ],
                  deliverables: [
                    "Department Safety Culture Assessment (current state and improvement plan)",
                    "Safety Training Materials (presentations, handouts, and activities you've created)",
                    "Safety Communication Examples (how you promote safety awareness in daily operations)"
                  ],
                  journal_prompt: "How do I make safety a priority that people embrace rather than resent? What safety practices actually protect people vs. just satisfy requirements?",
                  custom_materials: [
                    "Safety Culture Assessment and Development - Building safety-first mindset in teams",
                    "Safety Training Design and Delivery - How to conduct effective safety training",
                    "Safety Communication Strategies - Making safety engaging rather than boring"
                  ]
                },
                {
                  phase: 2,
                  title: "Risk Assessment & Hazard Management",
                  duration: "Month 2",
                  activities: [
                    "Develop expertise in identifying, assessing, and mitigating operational risks",
                    "CM Shadowing Focus: Participate in risk assessments and incident investigations",
                    "Create comprehensive risk management and hazard mitigation systems"
                  ],
                  deliverables: [
                    "Risk Assessment Documentation (comprehensive review of department and property hazards)",
                    "Risk Mitigation Plans (specific actions to reduce identified risks)",
                    "Incident Analysis Examples (investigations you've conducted with prevention recommendations)"
                  ],
                  journal_prompt: "What risks exist in our operations that I might be overlooking? How can I be more proactive about preventing incidents rather than just responding to them?",
                  custom_materials: [
                    "Property Risk Assessment Techniques - Systematic approaches to identifying hazards",
                    "Risk Mitigation Planning - Developing practical solutions to reduce risks",
                    "Incident Investigation and Prevention - Learning from safety incidents to prevent recurrence"
                  ]
                },
                {
                  phase: 3,
                  title: "Emergency Response Leadership",
                  duration: "Month 3",
                  activities: [
                    "Build capability to lead team and property response during emergency situations",
                    "Implementation: Lead emergency response drills and coordinate with local emergency services",
                    "Develop comprehensive emergency response and business continuity capabilities"
                  ],
                  deliverables: [
                    "Emergency Response Plans (detailed procedures for various emergency scenarios)",
                    "Crisis Leadership Examples (situations where you've led during emergencies or high-stress events)",
                    "Business Continuity Procedures (how to maintain essential operations during disruptions)"
                  ],
                  journal_prompt: "How do I stay calm and decisive during emergencies while keeping my team safe and focused? What emergency scenarios are we not adequately prepared for?",
                  custom_materials: [
                    "Emergency Response Planning for Property Management - Creating comprehensive emergency plans",
                    "Crisis Leadership Techniques - Leading teams effectively during high-stress situations",
                    "Business Continuity Planning - Maintaining operations during and after emergencies"
                  ]
                }
              ]
            }
          },
          technology_utilization: {
            name: "Technology Utilization & System Management",
            description: "Optimize technology usage and lead digital innovation for operational efficiency",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 14,
            foundation_courses: [
              {
                id: "om-fc-14",
                title: "Virtual Leasing: Technology Tools for Virtual Leasing",
                duration: "20 minutes",
                platform: "PerformanceHQ",
                description: "Technology integration in leasing"
              },
              {
                id: "om-fc-15",
                title: "Customer Relationship Management",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "CRM systems and resident communication technology"
              }
            ],
            signature_activity: {
              title: "Technology Optimization Project",
              icon: "💻",
              description: "Three-month technology leadership development focusing on optimization, automation, and innovation",
              phases: [
                {
                  phase: 1,
                  title: "Current Technology Assessment & Optimization",
                  duration: "Month 1",
                  activities: [
                    "Evaluate current technology usage and identify optimization opportunities",
                    "CM Shadowing Focus: Observe CM using property management technology and data analysis tools",
                    "Develop comprehensive technology assessment and improvement plan"
                  ],
                  deliverables: [
                    "Technology Usage Assessment (how your department currently uses available technology)",
                    "Optimization Opportunities (ways to better utilize existing technology)",
                    "Technology Training Plan (how to improve team technology skills)"
                  ],
                  journal_prompt: "What technology tools are we underutilizing that could make our work more efficient? How can I help my team get better at using technology to improve their performance?",
                  custom_materials: [
                    "Property Management Technology Assessment - How to evaluate technology effectiveness",
                    "Software Optimization for Department Leaders - Getting more from existing systems",
                    "Technology Training Design - Teaching team members to use technology effectively"
                  ]
                },
                {
                  phase: 2,
                  title: "System Integration & Process Automation",
                  duration: "Month 2",
                  activities: [
                    "Implement system integrations and automated processes to improve efficiency",
                    "Implementation: Lead technology improvement project that benefits both leasing and maintenance",
                    "Create data reporting and automation systems for improved decision making"
                  ],
                  deliverables: [
                    "Automation Implementation (processes you've automated or streamlined using technology)",
                    "System Integration Examples (how you've connected different tools for better efficiency)",
                    "Data Reporting Systems (reports and dashboards you've created to track department performance)"
                  ],
                  journal_prompt: "What repetitive tasks could be automated to free up time for higher-value work? How can I use data and reporting to make better operational decisions?",
                  custom_materials: [
                    "Process Automation Opportunities in Property Management - Identifying tasks that can be automated",
                    "System Integration Best Practices - Connecting different software systems effectively",
                    "Data Management and Reporting - Using technology to track and report performance"
                  ]
                },
                {
                  phase: 3,
                  title: "Technology Leadership & Innovation",
                  duration: "Month 3",
                  activities: [
                    "Become the technology leader for your department and contribute to property-wide technology initiatives",
                    "Presentation: Present technology improvement recommendations to CM and property team",
                    "Lead innovation initiatives and technology adoption across the property"
                  ],
                  deliverables: [
                    "Technology Leadership Examples (times you've led technology adoption or problem-solving)",
                    "Innovation Implementation (new technology solutions you've researched, proposed, or implemented)",
                    "Technology ROI Analysis (financial impact of technology improvements you've made)"
                  ],
                  journal_prompt: "How can I be a technology leader who helps others embrace improvements rather than resist change? What technology innovations could significantly improve our operations?",
                  custom_materials: [
                    "Technology Change Management - Leading technology adoption and changes",
                    "Digital Innovation in Property Management - Identifying and implementing new technology solutions",
                    "Technology ROI Analysis - Evaluating technology investments and improvements"
                  ]
                }
              ]
            }
          },
          vendor_relations: {
            name: "Vendor Relations & Contract Oversight",
            description: "Master vendor relationship management and contract oversight for optimal service delivery",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 14,
            foundation_courses: [
              {
                id: "om-fc-16",
                title: "2025 Student Turns Training - Session 1: Vendor Procurement",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Vendor selection and management"
              },
              {
                id: "om-fc-17",
                title: "GH Webinar: The Property Manager's Survival Guide - Mastering Maintenance Without a Lead Tech",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Working with external contractors"
              }
            ],
            signature_activity: {
              title: "Vendor Management Excellence",
              icon: "🤝",
              description: "Three-month development of vendor relationship management, contract oversight, and strategic partnership skills",
              phases: [
                {
                  phase: 1,
                  title: "Vendor Relationship Development & Management",
                  duration: "Month 1",
                  activities: [
                    "Build expertise in selecting, managing, and optimizing vendor relationships",
                    "CM Shadowing Focus: Observe CM managing vendor relationships and resolving vendor issues",
                    "Develop systematic approach to vendor evaluation and relationship management"
                  ],
                  deliverables: [
                    "Vendor Evaluation Process (criteria and methods for selecting contractors and suppliers)",
                    "Vendor Relationship Management Plan (how you build and maintain productive vendor relationships)",
                    "Vendor Performance Tracking (systems for monitoring and improving vendor performance)"
                  ],
                  journal_prompt: "What makes a vendor relationship successful vs. problematic? How can I get better performance from contractors while maintaining good working relationships?",
                  custom_materials: [
                    "Vendor Selection and Evaluation Criteria - How to choose the right contractors and suppliers",
                    "Vendor Relationship Management - Building productive working relationships with contractors",
                    "Vendor Performance Monitoring - Tracking and improving vendor performance"
                  ]
                },
                {
                  phase: 2,
                  title: "Contract Management & Cost Control",
                  duration: "Month 2",
                  activities: [
                    "Develop skills in contract oversight, cost management, and vendor accountability",
                    "CM Shadowing Focus: Participate in contract negotiations and vendor performance reviews",
                    "Implement contract management and cost control systems"
                  ],
                  deliverables: [
                    "Contract Management Process (how you oversee vendor contracts and ensure compliance)",
                    "Cost Control Examples (specific strategies you've used to manage vendor costs)",
                    "Vendor Accountability Systems (how you hold contractors accountable for quality and performance)"
                  ],
                  journal_prompt: "How do I balance cost control with quality requirements when managing vendors? What contract terms and oversight practices actually protect our interests?",
                  custom_materials: [
                    "Contract Basics for Property Management - Understanding key contract terms and requirements",
                    "Vendor Cost Management Strategies - Controlling costs while maintaining quality",
                    "Contract Compliance Monitoring - Ensuring vendors meet their contractual obligations"
                  ]
                },
                {
                  phase: 3,
                  title: "Strategic Vendor Partnership Development",
                  duration: "Month 3",
                  activities: [
                    "Build strategic partnerships with key vendors that provide long-term value",
                    "Cross-Department Project: Work with opposite department to optimize shared vendor relationships",
                    "Develop vendor improvement programs and risk management strategies"
                  ],
                  deliverables: [
                    "Strategic Partnership Examples (vendor relationships you've developed that provide exceptional value)",
                    "Vendor Improvement Programs (how you've helped vendors improve their service to your property)",
                    "Risk Management Plans (how you minimize risks from vendor relationships)"
                  ],
                  journal_prompt: "Which vendor relationships could become strategic partnerships that benefit both parties? How can I help vendors succeed while ensuring they deliver excellent service to us?",
                  custom_materials: [
                    "Strategic Vendor Partnership Development - Moving beyond transactional relationships",
                    "Vendor Performance Improvement Programs - Helping vendors provide better service",
                    "Vendor Risk Management - Reducing risks associated with vendor relationships"
                  ]
                }
              ]
            }
          }
        },
        validation_criteria: {
          mastery_gates: [
            "Process Improvement Evidence: Document at least 3 operational improvements with measurable efficiency gains",
            "Quality & Compliance Competency: Demonstrate thorough knowledge of department compliance requirements and maintain quality standards",
            "Safety Leadership: Lead safety initiatives and demonstrate effective emergency response capabilities",
            "Technology Utilization: Successfully implement technology improvements that enhance department operations",
            "Vendor Management: Manage vendor relationships effectively with evidence of cost control and quality maintenance"
          ],
          portfolio_defense: {
            title: "Portfolio Defense - Operational Focus",
            duration: "25-minute presentation to CM and peer panel",
            components: [
              "Process Optimization: Present operational improvements with before/after results",
              "Quality & Compliance Management: Demonstrate knowledge of compliance requirements and quality control systems",
              "Safety Leadership: Present safety culture development and emergency response capabilities",
              "Technology & Vendor Management: Show examples of technology optimization and effective vendor relationships",
              "Q&A on Operational Scenarios: Handle complex operational challenges and decision-making scenarios"
            ]
          },
          cm_readiness_indicators: [
            "Systems Thinking: Understands how all operational systems connect and affect each other",
            "Process Leadership: Proven ability to analyze, improve, and standardize operational processes",
            "Compliance Expertise: Thorough knowledge of legal and regulatory requirements",
            "Technology Proficiency: Effective at using and optimizing technology for operational efficiency",
            "Vendor Management Skills: Successfully manages contractor and supplier relationships",
            "Safety Leadership: Creates and maintains strong safety culture and emergency preparedness"
          ]
        }
      },
      cross_functional_collaboration: {
        name: "Cross-Functional Collaboration",
        description: "We Win Together - No Department Is an Island",
        philosophy: "The Navigator Cross-Functional Collaboration development transforms department-focused leaders into property-wide team builders who understand that exceptional resident experience requires seamless collaboration between all functions. This section emphasizes breaking down leasing/maintenance silos while building broader stakeholder relationship skills.",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 68,
        competency_area: "cross_functional_collaboration", 
        sub_competencies: {
          interdepartmental_partnership: {
            name: "Inter-Departmental Partnership & Communication",
            description: "Build bridges between departments to create seamless resident experience",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 16,
            foundation_courses: [
              {
                id: "cf-fc-01",
                title: "Being a Team Player",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Foundation of collaborative mindset"
              },
              {
                id: "cf-fc-02",
                title: "Building a Team Culture",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Creating unified team environment"
              },
              {
                id: "cf-fc-03",
                title: "Express: People Skills - The Win-Win of Being a Team Player",
                duration: "4 minutes",
                platform: "PerformanceHQ",
                description: "Quick collaboration tips"
              },
              {
                id: "cf-fc-04",
                title: "Leadership Booster: Communication Skills for Supervisors",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Cross-functional communication"
              }
            ],
            signature_activity: {
              title: "Department Bridge Builder Challenge",
              icon: "🤝",
              description: "Three-month journey developing cross-department partnership and communication skills",
              phases: [
                {
                  phase: 1,
                  title: "Understanding the Other Side",
                  duration: "Month 1",
                  activities: [
                    "Deep dive into understanding how the opposite department operates and what drives their success",
                    "Cross-Department Shadowing: Spend 5 hours weekly for 4 weeks with opposite department Navigator",
                    "Week 1: Shadow daily operations and routine tasks",
                    "Week 2: Observe customer interaction and problem-solving",
                    "Week 3: Participate in department meetings and planning",
                    "Week 4: Work together on shared challenges"
                  ],
                  deliverables: [
                    "Cross-Department Learning Journal (detailed observations from 20 hours of shadowing opposite department)",
                    "Process Impact Analysis (how your department's work affects the other department's success)",
                    "Collaboration Opportunity Assessment (specific ways departments could work better together)"
                  ],
                  journal_prompt: "What surprised me most about how the other department operates? How do my daily decisions make their job easier or harder?",
                  custom_materials: [
                    "Leasing Operations Guide for Maintenance Leaders - Complete overview of leasing processes, challenges, and success metrics",
                    "Maintenance Operations Guide for Leasing Leaders - Comprehensive maintenance workflow, priorities, and quality standards",
                    "Resident Journey Mapping Across Departments - How leasing and maintenance touchpoints create the complete resident experience"
                  ]
                },
                {
                  phase: 2,
                  title: "Communication Bridge Building",
                  duration: "Month 2",
                  activities: [
                    "Establish regular communication systems and collaborative workflows between departments",
                    "Weekly Cross-Department Check-ins: 30-minute meetings with opposite department counterpart",
                    "Joint Problem-Solving Sessions: Address challenges that affect both departments",
                    "Shared Goal Setting: Create goals that require both departments to succeed"
                  ],
                  deliverables: [
                    "Communication System Implementation (new processes for information sharing between departments)",
                    "Joint Meeting Leadership (agendas, notes, and outcomes from meetings you've facilitated)",
                    "Collaborative Decision Examples (decisions made jointly that improved overall property performance)"
                  ],
                  journal_prompt: "What communication practices are most effective at preventing misunderstandings? How can we make information sharing automatic rather than manual?",
                  custom_materials: [
                    "Cross-Department Communication Protocols - Standards for information sharing and coordination",
                    "Joint Meeting Facilitation Guide - Running effective meetings with both departments",
                    "Collaborative Decision-Making Framework - Making decisions that benefit both departments"
                  ]
                },
                {
                  phase: 3,
                  title: "Partnership Innovation",
                  duration: "Month 3",
                  activities: [
                    "Create innovative partnerships and joint initiatives that demonstrate the power of collaboration",
                    "Collaborative Project: Design and execute major initiative requiring both departments (e.g., resident experience enhancement, operational efficiency improvement, emergency response protocol)",
                    "Peer Learning: Partner with Navigator pair from different property to compare collaboration approaches"
                  ],
                  deliverables: [
                    "Joint Initiative Results (collaborative projects with measurable positive outcomes)",
                    "Partnership Innovation Examples (creative ways you've connected department operations)",
                    "Team Collaboration Development (how you've encouraged collaboration within your team)"
                  ],
                  journal_prompt: "What collaborative initiatives have had the biggest impact on resident satisfaction and property performance? How can we make collaboration the norm rather than the exception?",
                  custom_materials: [
                    "Joint Initiative Planning and Execution - Designing projects that require both departments",
                    "Partnership Success Measurement - Tracking the impact of collaborative efforts",
                    "Collaboration Culture Expansion - Spreading collaborative mindset to team members"
                  ]
                }
              ]
            }
          },
          resident_experience_collaboration: {
            name: "Resident Experience Collaboration",
            description: "Create unified resident experience through seamless department coordination",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 15,
            foundation_courses: [
              {
                id: "cf-fc-05",
                title: "Customer Relationship Management",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Comprehensive customer service approach"
              },
              {
                id: "cf-fc-06",
                title: "Resident Retention",
                duration: "1 hour 30 minutes",
                platform: "PerformanceHQ",
                description: "Holistic approach to resident satisfaction"
              },
              {
                id: "cf-fc-07",
                title: "Customer Service 1-4 Series",
                duration: "1 hour 30 minutes total",
                platform: "PerformanceHQ",
                description: "Proactive, professional, prompt, personal service"
              },
              {
                id: "cf-fc-08",
                title: "Spark: Customer Service: Creating a Thriving Community Through Exceptional Customer Service",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Community-focused service mindset"
              }
            ],
            signature_activity: {
              title: "Unified Resident Experience Project",
              icon: "🏠",
              description: "Three-month development focused on creating seamless resident experience through department collaboration",
              phases: [
                {
                  phase: 1,
                  title: "Resident Journey Analysis & Touchpoint Mapping",
                  duration: "Month 1",
                  activities: [
                    "Map complete resident experience from prospect to move-out, identifying all department touchpoints",
                    "Resident Feedback Collection: Conduct resident interviews and surveys focusing on cross-department experience",
                    "CM Shadowing Focus: Observe CM handling complex resident issues requiring department coordination"
                  ],
                  deliverables: [
                    "Resident Journey Map (complete visual mapping of resident experience with all department touchpoints)",
                    "Touchpoint Quality Analysis (assessment of resident experience at each interaction point)",
                    "Experience Gap Identification (specific areas where department coordination could improve resident satisfaction)"
                  ],
                  journal_prompt: "Where in the resident journey do we create friction because departments aren't coordinating? What would a seamless resident experience look like?",
                  custom_materials: [
                    "Complete Resident Journey Mapping - Comprehensive resident experience from first contact to move-out",
                    "Touchpoint Quality Assessment - Evaluating resident interactions across all departments",
                    "Resident Experience Gap Analysis - Identifying disconnects and improvement opportunities"
                  ]
                },
                {
                  phase: 2,
                  title: "Coordinated Service Excellence",
                  duration: "Month 2",
                  activities: [
                    "Implement coordinated service approaches that improve resident experience through department collaboration",
                    "Joint Resident Meetings: Attend resident meetings with opposite department counterpart",
                    "Coordinated Problem Resolution: Work together on complex resident issues",
                    "Unified Communication Approach: Ensure residents receive consistent information"
                  ],
                  deliverables: [
                    "Coordinated Service Implementation (new processes for departments to work together on resident requests)",
                    "Communication Coordination Examples (how departments ensure consistent resident communication)",
                    "Service Recovery Success Stories (problems solved through cross-department collaboration)"
                  ],
                  journal_prompt: "How does better department coordination actually improve what residents experience? What coordination efforts have the biggest impact on resident satisfaction?",
                  custom_materials: [
                    "Coordinated Service Delivery Protocols - Systems for departments to work together on resident needs",
                    "Resident Communication Coordination - Ensuring consistent messaging across departments",
                    "Service Recovery Through Collaboration - Fixing problems that cross department boundaries"
                  ]
                },
                {
                  phase: 3,
                  title: "Proactive Resident Experience Enhancement",
                  duration: "Month 3",
                  activities: [
                    "Create proactive programs that enhance resident experience through intentional collaboration",
                    "Collaborative Program Leadership: Lead resident experience program requiring both department participation",
                    "Resident Success Stories: Document specific examples of exceptional resident experience created through collaboration"
                  ],
                  deliverables: [
                    "Proactive Experience Programs (initiatives you've created that proactively enhance resident experience)",
                    "Community Building Results (collaborative efforts that strengthened resident community)",
                    "Innovation Implementation (creative resident experience improvements through department partnership)"
                  ],
                  journal_prompt: "What proactive steps can we take together to make residents feel valued and supported? How can department collaboration create experiences that residents remember and share with others?",
                  custom_materials: [
                    "Proactive Resident Experience Programs - Creating initiatives that anticipate and exceed resident expectations",
                    "Community Building Through Department Collaboration - Using teamwork to create stronger resident community",
                    "Resident Experience Innovation - Creative approaches to exceptional resident service"
                  ]
                }
              ]
            }
          },
          property_team_culture: {
            name: "Property-Wide Team Building & Culture",
            description: "Create unified culture and team identity across all departments",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 12,
            foundation_courses: [
              {
                id: "cf-fc-09",
                title: "Team Retention Strategies Series",
                duration: "25 minutes",
                platform: "PerformanceHQ",
                description: "Keeping good team members engaged"
              },
              {
                id: "cf-fc-10",
                title: "Leadership Booster: Building Psychological Safety in Teams",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Safe collaboration environment"
              },
              {
                id: "cf-fc-11",
                title: "CM Weekly Meeting - Extreme Ownership with Kate Reeves",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Accountability across teams"
              }
            ],
            signature_activity: {
              title: "Unity Culture Champion",
              icon: "🌟",
              description: "Three-month intensive on building unified property culture and team identity",
              phases: [
                {
                  phase: 1,
                  title: "Property-Wide Culture Assessment & Vision",
                  duration: "Month 1",
                  activities: [
                    "Assess current property culture and create vision for unified team environment",
                    "Team Engagement: Facilitate discussions with all property team members about desired culture",
                    "CM Shadowing Focus: Observe how CM builds and maintains culture across different departments"
                  ],
                  deliverables: [
                    "Property Culture Assessment (comprehensive evaluation of current team culture across all departments)",
                    "Unity Culture Vision (shared vision for property-wide team culture with specific behavioral expectations)",
                    "Culture Building Strategy (detailed plan for creating more unified property culture)"
                  ],
                  journal_prompt: "What does a truly unified property team look like? How can we create culture where everyone feels part of one team rather than separate departments?",
                  custom_materials: [
                    "Property Culture Assessment Tools - Methods for evaluating team culture across departments",
                    "Unity Culture Vision Development - Creating shared vision for property-wide team culture",
                    "Cross-Department Culture Building Strategies - Practical approaches to building unified culture"
                  ]
                },
                {
                  phase: 2,
                  title: "Unity Initiative Implementation",
                  duration: "Month 2",
                  activities: [
                    "Implement specific initiatives that build unity and shared identity across property",
                    "All-Team Meetings: Facilitate property-wide team meetings focused on unity",
                    "Cross-Department Projects: Lead initiatives requiring multiple departments",
                    "Shared Celebrations: Organize celebrations that include all team members"
                  ],
                  deliverables: [
                    "Unity Initiative Results (team building activities and programs you've implemented)",
                    "Shared Goal Achievement (goals that required all departments working together)",
                    "Cross-Department Recognition Examples (how you've celebrated collaboration and teamwork)"
                  ],
                  journal_prompt: "What initiatives actually bring people together vs. feel forced? How can we celebrate shared successes and create genuine team unity?",
                  custom_materials: [
                    "Property-Wide Team Building Activities - Events and practices that bring departments together",
                    "Shared Goal Setting Across Departments - Creating goals that unite rather than divide teams",
                    "Cross-Department Recognition Programs - Celebrating collaboration and mutual support"
                  ]
                },
                {
                  phase: 3,
                  title: "Culture Sustainability & Growth",
                  duration: "Month 3",
                  activities: [
                    "Build systems to maintain and evolve unified culture over time",
                    "Leadership Development: Train team members to be culture champions in their areas",
                    "Long-term Impact Assessment: Measure sustained improvements in teamwork and collaboration"
                  ],
                  deliverables: [
                    "Culture Sustainability Plan (systems and processes for maintaining unified culture)",
                    "Culture Evolution Strategy (how culture will adapt and grow over time)",
                    "Culture Leadership Examples (how you've developed others as culture champions)"
                  ],
                  journal_prompt: "How do we maintain strong culture during busy periods, staff changes, and challenges? What makes culture resilient and sustainable?",
                  custom_materials: [
                    "Culture Maintenance Systems - Processes for sustaining positive culture during changes",
                    "Culture Evolution Planning - Adapting culture as team and property changes",
                    "Culture Leadership Development - Training others to champion unified culture"
                  ]
                }
              ]
            }
          },
          stakeholder_relationship_management: {
            name: "External Stakeholder Relationship Management",
            description: "Build and maintain strong relationships with external partners and stakeholders",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 12,
            foundation_courses: [
              {
                id: "cf-fc-12",
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Communicating with external stakeholders"
              },
              {
                id: "cf-fc-13",
                title: "GH Webinar: Staying Calm Under Pressure: Proven Strategies for Diffusing Stressful Customer Interactions",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Managing difficult stakeholder situations"
              },
              {
                id: "cf-fc-14",
                title: "CM Weekly Meeting - Handling Agency Visits with Confidence",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "External stakeholder management"
              }
            ],
            signature_activity: {
              title: "Stakeholder Relationship Excellence",
              icon: "🌐",
              description: "Three-month development of external stakeholder relationship management skills",
              phases: [
                {
                  phase: 1,
                  title: "Stakeholder Mapping & Relationship Assessment",
                  duration: "Month 1",
                  activities: [
                    "Identify all external stakeholders and assess current relationship quality",
                    "Stakeholder Interviews: Conduct conversations with key external stakeholders to understand their needs",
                    "CM Shadowing Focus: Observe CM interactions with various external stakeholders"
                  ],
                  deliverables: [
                    "Stakeholder Map (comprehensive identification of all external parties affecting property)",
                    "Relationship Assessment (current quality of relationships with key stakeholders)",
                    "Communication Preferences Analysis (how different stakeholders prefer to receive information and interact)"
                  ],
                  journal_prompt: "Who are all the external stakeholders that affect our property success? How can we better understand and serve their needs while achieving our goals?",
                  custom_materials: [
                    "Property Stakeholder Mapping Guide - Identifying all external parties who affect property success",
                    "Relationship Quality Assessment Tools - Evaluating current stakeholder relationships",
                    "Stakeholder Communication Preferences - Understanding how different stakeholders prefer to interact"
                  ]
                },
                {
                  phase: 2,
                  title: "Professional Relationship Development",
                  duration: "Month 2",
                  activities: [
                    "Build stronger professional relationships with key external stakeholders",
                    "Regular Stakeholder Check-ins: Establish regular communication with key external partners",
                    "Value-Added Interactions: Find ways to provide value beyond minimum requirements",
                    "Professional Networking: Participate in industry or community networking opportunities"
                  ],
                  deliverables: [
                    "Relationship Development Plan (strategy for strengthening relationships with key stakeholders)",
                    "Value Creation Examples (ways you've created mutual value with external partners)",
                    "Communication Adaptation Examples (how you've adjusted communication for different stakeholder needs)"
                  ],
                  journal_prompt: "What do our external stakeholders really need from us? How can we exceed their expectations while achieving our property goals?",
                  custom_materials: [
                    "Professional Relationship Building Strategies - Developing trust and rapport with external parties",
                    "Stakeholder Value Creation - Finding win-win solutions with external partners",
                    "Professional Communication Across Different Audiences - Adapting communication style for different stakeholder types"
                  ]
                },
                {
                  phase: 3,
                  title: "Strategic Partnership Development",
                  duration: "Month 3",
                  activities: [
                    "Develop strategic partnerships that provide long-term value to property and stakeholders",
                    "Strategic Initiative Leadership: Lead initiative that involves multiple external stakeholders",
                    "Industry Engagement: Participate in industry events or committees as property representative"
                  ],
                  deliverables: [
                    "Strategic Partnership Examples (relationships you've developed that provide exceptional mutual value)",
                    "Collaboration Innovation Results (creative partnerships that benefited both property and stakeholders)",
                    "Partnership Value Documentation (measurable benefits from strategic stakeholder relationships)"
                  ],
                  journal_prompt: "Which stakeholder relationships could become true strategic partnerships? How can we create relationships that provide ongoing value for everyone involved?",
                  custom_materials: [
                    "Strategic Partnership Development - Moving from transactional to strategic relationships",
                    "Stakeholder Collaboration Innovation - Creative approaches to working with external partners",
                    "Partnership Performance Measurement - Tracking the value of strategic relationships"
                  ]
                }
              ]
            }
          },
          conflict_resolution_collaboration: {
            name: "Conflict Resolution & Joint Problem Solving",
            description: "Master collaborative problem solving and mediation across multiple parties",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 13,
            foundation_courses: [
              {
                id: "cf-fc-15",
                title: "Conflict Resolution (Supervisor Version)",
                duration: "2 hours",
                platform: "PerformanceHQ",
                description: "Advanced conflict management"
              },
              {
                id: "cf-fc-16",
                title: "Amanda Ripley on Why We Get Trapped in Conflict and How We Get Out",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Understanding conflict psychology"
              },
              {
                id: "cf-fc-17",
                title: "Spark: Resident Retention - Handling Mediation Between Two Residents",
                duration: "5 minutes",
                platform: "PerformanceHQ",
                description: "Mediation skills"
              }
            ],
            signature_activity: {
              title: "Collaborative Problem Solving Mastery",
              icon: "⚖️",
              description: "Three-month intensive development of advanced conflict resolution and collaborative problem solving skills",
              phases: [
                {
                  phase: 1,
                  title: "Conflict Prevention & Early Intervention",
                  duration: "Month 1",
                  activities: [
                    "Develop systems to prevent conflicts and address issues before they escalate",
                    "Proactive Monitoring: Implement systems to identify potential conflicts early",
                    "CM Shadowing Focus: Observe CM preventing and addressing early-stage conflicts"
                  ],
                  deliverables: [
                    "Conflict Prevention Plan (systems for identifying and preventing common conflicts)",
                    "Early Intervention Examples (situations where early action prevented larger problems)",
                    "Conflict Pattern Analysis (common sources of friction and prevention strategies)"
                  ],
                  journal_prompt: "What patterns of conflict do I see between departments or with stakeholders? How can we address root causes rather than just symptoms?",
                  custom_materials: [
                    "Conflict Prevention Systems - Identifying and addressing potential conflicts early",
                    "Cross-Department Conflict Patterns - Common sources of friction between leasing and maintenance",
                    "Early Intervention Techniques - Addressing small issues before they become big problems"
                  ]
                },
                {
                  phase: 2,
                  title: "Collaborative Problem Solving",
                  duration: "Month 2",
                  activities: [
                    "Master techniques for solving complex problems that require multiple parties working together",
                    "Joint Problem Solving Sessions: Facilitate sessions with multiple departments/stakeholders",
                    "Solution Testing and Refinement: Pilot collaborative solutions and adjust based on results",
                    "Follow-up and Accountability: Ensure collaborative solutions are implemented and maintained"
                  ],
                  deliverables: [
                    "Problem Solving Process (methodology for collaborative problem solving)",
                    "Multi-Party Solution Examples (complex problems solved through collaboration)",
                    "Implementation Success Stories (collaborative solutions that achieved lasting results)"
                  ],
                  journal_prompt: "What problem-solving approaches get everyone invested in the solution? How can we ensure collaborative solutions actually get implemented and maintained?",
                  custom_materials: [
                    "Collaborative Problem Solving Framework - Step-by-step process for joint problem solving",
                    "Multi-Party Negotiation Techniques - Finding solutions when multiple interests are involved",
                    "Solution Implementation and Follow-up - Ensuring collaborative solutions actually work"
                  ]
                },
                {
                  phase: 3,
                  title: "Mediation & Advanced Conflict Resolution",
                  duration: "Month 3",
                  activities: [
                    "Develop advanced skills in mediating conflicts and facilitating resolution between parties",
                    "Advanced Practice: Mediate complex conflicts involving multiple parties or departments",
                    "Mentorship: Begin mentoring others in conflict resolution and collaborative problem solving"
                  ],
                  deliverables: [
                    "Mediation Success Examples (conflicts you've successfully mediated)",
                    "Advanced Resolution Techniques (methods you've used for complex conflicts)",
                    "Relationship Repair Results (how you've rebuilt trust and collaboration after conflicts)"
                  ],
                  journal_prompt: "How do I help conflicting parties find common ground and rebuild trust? What makes the difference between resolving conflicts and actually strengthening relationships?",
                  custom_materials: [
                    "Mediation Skills for Property Leaders - Facilitating resolution between conflicting parties",
                    "Advanced Conflict Resolution Techniques - Handling complex, multi-party conflicts",
                    "Relationship Repair and Trust Building - Rebuilding working relationships after conflicts"
                  ]
                }
              ]
            }
          }
        },
        validation_criteria: {
          mastery_gates: [
            "Department Partnership Excellence: Demonstrate strong working relationship with opposite department counterpart with measurable improvements in coordination",
            "Resident Experience Collaboration: Lead initiatives that improve resident experience through department collaboration",
            "Stakeholder Relationship Management: Successfully manage relationships with multiple external stakeholders",
            "Conflict Resolution Competency: Successfully resolve 3+ complex conflicts involving multiple parties",
            "Culture Building Leadership: Lead initiatives that strengthen property-wide team unity and collaboration"
          ],
          portfolio_defense: {
            challenge: "30-minute presentation to panel including CM, opposite department counterpart, and external stakeholder",
            components: [
              "Partnership Development: Present examples of successful cross-department collaboration with measurable results",
              "Resident Experience Enhancement: Show how collaboration improved resident satisfaction and experience",
              "Stakeholder Relationship Success: Demonstrate effective management of external relationships",
              "Conflict Resolution Case Study: Present complex conflict successfully resolved through collaborative approach",
              "Q&A with Multi-Party Panel: Handle questions and scenarios involving multiple stakeholders"
            ]
          },
          cm_readiness_indicators: [
            "Property-Wide Perspective: Thinks and acts considering all departments and stakeholders",
            "Relationship Building Excellence: Builds strong working relationships across all functions and with external parties",
            "Conflict Resolution Leadership: Effectively mediates conflicts and facilitates collaborative solutions",
            "Culture Development Skills: Creates and maintains unified team culture across departments",
            "Stakeholder Management Competency: Successfully manages complex stakeholder relationships",
            "Collaborative Problem Solving: Consistently finds solutions that work for multiple parties"
          ]
        }
      },
      strategic_thinking: {
        name: "Strategic Thinking",
        description: "Think Like an Owner, Act Like a Leader, Plan Like a Strategist",
        philosophy: "The Navigator Strategic Thinking development transforms tactical department leaders into strategic thinkers who understand property-wide implications, anticipate challenges and opportunities, and make decisions that position the property for long-term success. This section builds the strategic mindset essential for Community Manager effectiveness.",
        overall_progress: 0,
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 66,
        competency_area: "strategic_thinking",
        sub_competencies: {
          strategic_analysis_planning: {
            name: "Property-Level Strategic Analysis & Planning",
            description: "Develop comprehensive understanding of property strategy and create effective strategic plans",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 14,
            foundation_courses: [
              {
                id: "st-fc-01",
                title: "CM Weekly Meeting - Data Driven Decisions with Martin Knapp",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Using data for strategic decisions"
              },
              {
                id: "st-fc-02",
                title: "CM Weekly Meeting - Extreme Ownership with Kate Reeves",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Taking ownership of strategic outcomes"
              },
              {
                id: "st-fc-03",
                title: "CM Weekly Meeting - Multipliers with Matt",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Strategic leadership that multiplies team effectiveness"
              },
              {
                id: "st-fc-04",
                title: "Leadership 201",
                duration: "2 hours 5 minutes",
                platform: "PerformanceHQ",
                description: "Advanced strategic leadership concepts"
              }
            ],
            signature_activity: {
              title: "Property Strategist Development",
              icon: "🎯",
              description: "Three-month journey developing strategic thinking and planning capabilities for property leadership",
              phases: [
                {
                  phase: 1,
                  title: "Strategic Situation Analysis",
                  duration: "Month 1",
                  activities: [
                    "Develop comprehensive understanding of property's strategic position, challenges, and opportunities",
                    "CM Shadowing Focus: Observe CM conducting strategic planning sessions and long-term property planning (1 hour weekly)"
                  ],
                  deliverables: [
                    "Property Strategic Analysis (comprehensive assessment of property's current strategic position)",
                    "SWOT Analysis Documentation (detailed strengths, weaknesses, opportunities, threats analysis)",
                    "Strategic Challenge Identification (key challenges requiring strategic thinking and planning)"
                  ],
                  journal_prompt: "What are the biggest strategic challenges and opportunities facing our property? How do short-term operational decisions affect long-term strategic success?",
                  custom_materials: [
                    "Property Strategic Analysis Framework - Comprehensive methodology for assessing property's strategic position",
                    "SWOT Analysis for Property Management - Identifying strengths, weaknesses, opportunities, and threats",
                    "Strategic Planning Fundamentals for Property Leaders - Basic strategic planning concepts and tools"
                  ]
                },
                {
                  phase: 2,
                  title: "Strategic Goal Setting & Planning",
                  duration: "Month 2",
                  activities: [
                    "Create strategic goals and develop comprehensive plans to achieve them",
                    "CM Shadowing Focus: Participate in strategic planning meetings and goal-setting sessions with Regional Manager"
                  ],
                  deliverables: [
                    "Strategic Goals Framework (long-term goals for property with clear success metrics)",
                    "Strategic Plan Development (comprehensive plan for achieving strategic objectives)",
                    "Strategic Initiative Design (specific initiatives that support strategic goals)"
                  ],
                  journal_prompt: "What strategic goals would position our property for long-term success? How do I break down big strategic objectives into actionable departmental initiatives?",
                  custom_materials: [
                    "Strategic Goal Setting for Property Management - Creating goals that drive long-term success",
                    "Strategic Planning Process Guide - Step-by-step approach to developing strategic plans",
                    "Strategic Initiative Design and Implementation - Turning strategic thinking into actionable plans"
                  ]
                },
                {
                  phase: 3,
                  title: "Strategic Implementation & Monitoring",
                  duration: "Month 3",
                  activities: [
                    "Implement strategic initiatives and develop systems for monitoring strategic progress",
                    "Regional Manager Shadowing: Observe strategic discussions and decision-making at regional level (if possible)"
                  ],
                  deliverables: [
                    "Strategic Implementation Results (progress on strategic initiatives with measurable outcomes)",
                    "Strategic Monitoring Systems (tools and processes for tracking strategic progress)",
                    "Strategic Adaptation Examples (how you've adjusted strategies based on results and changing conditions)"
                  ],
                  journal_prompt: "How do I ensure strategic plans actually get executed rather than just planned? What strategic adjustments have been most important for our property's success?",
                  custom_materials: [
                    "Strategic Implementation Management - Executing strategic plans effectively",
                    "Strategic Performance Monitoring - Tracking progress toward strategic objectives",
                    "Strategic Adaptation and Course Correction - Adjusting strategies based on results and changing conditions"
                  ]
                }
              ]
            }
          },
          data_driven_decisions: {
            name: "Data-Driven Decision Making & Insights",
            description: "Master using data analysis to generate strategic insights and drive decision making",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 12,
            foundation_courses: [
              {
                id: "st-fc-05",
                title: "Property Management Financials",
                duration: "1 hour 15 minutes",
                platform: "PerformanceHQ",
                description: "Using financial data strategically"
              },
              {
                id: "st-fc-06",
                title: "Performance Management",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Data-driven performance improvement"
              },
              {
                id: "st-fc-07",
                title: "Creating and Delivering Business Presentations",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Communicating data insights effectively"
              }
            ],
            signature_activity: {
              title: "Strategic Data Intelligence Program",
              icon: "📊",
              description: "Three-month intensive development of data analysis and strategic insight generation capabilities",
              phases: [
                {
                  phase: 1,
                  title: "Data Collection & Analysis Systems",
                  duration: "Month 1",
                  activities: [
                    "Develop comprehensive systems for collecting, analyzing, and interpreting property performance data",
                    "CM Shadowing Focus: Observe CM using data analysis tools and making data-driven strategic decisions"
                  ],
                  deliverables: [
                    "Data Collection System (comprehensive approach to gathering strategic property data)",
                    "Performance Analytics Examples (analysis of property data revealing strategic insights)",
                    "Data Interpretation Framework (methodology for turning data into strategic decisions)"
                  ],
                  journal_prompt: "What data tells the real story about our property's performance? How can I use data to identify strategic opportunities and challenges before they become obvious?",
                  custom_materials: [
                    "Strategic Data Collection Framework - Identifying and gathering data that drives strategic decisions",
                    "Property Performance Analytics - Analyzing property data to identify trends and insights",
                    "Data Interpretation for Strategic Decision Making - Turning data into actionable strategic insights"
                  ]
                },
                {
                  phase: 2,
                  title: "Competitive Intelligence & Market Analysis",
                  duration: "Month 2",
                  activities: [
                    "Develop capability to analyze market conditions and competitive landscape for strategic positioning",
                    "Market Research Project: Conduct comprehensive market analysis including competitor research and trend identification",
                    "CM Shadowing Focus: Participate in market analysis discussions and competitive positioning decisions"
                  ],
                  deliverables: [
                    "Competitive Analysis Report (comprehensive analysis of key competitors and market position)",
                    "Market Trends Analysis (identification of market trends affecting property strategy)",
                    "Strategic Positioning Recommendations (how property should position itself based on market intelligence)"
                  ],
                  journal_prompt: "What market trends and competitive factors should influence our strategic decisions? How can we position our property for competitive advantage?",
                  custom_materials: [
                    "Competitive Intelligence for Property Management - Gathering and analyzing competitor information",
                    "Market Analysis Techniques - Understanding market trends and conditions",
                    "Strategic Positioning Based on Market Intelligence - Using market analysis for strategic advantage"
                  ]
                },
                {
                  phase: 3,
                  title: "Predictive Analytics & Strategic Insights",
                  duration: "Month 3",
                  activities: [
                    "Develop advanced analytical skills to predict trends and generate strategic insights",
                    "Executive Presentation: Present strategic insights and recommendations to CM and Regional Manager"
                  ],
                  deliverables: [
                    "Predictive Analysis Models (using historical data to forecast future performance and trends)",
                    "Strategic Insights Documentation (key insights generated from data analysis)",
                    "Data-Driven Recommendations (strategic recommendations based on analytical findings)"
                  ],
                  journal_prompt: "What patterns in our data predict future challenges and opportunities? How can analytical insights drive better strategic decisions?",
                  custom_materials: [
                    "Predictive Analytics for Property Management - Using historical data to predict future trends",
                    "Strategic Insight Development - Generating actionable insights from data analysis",
                    "Data-Driven Strategic Recommendations - Creating strategic recommendations based on analytical insights"
                  ]
                }
              ]
            }
          },
          market_competitive_positioning: {
            name: "Market Awareness & Competitive Positioning",
            description: "Understand market dynamics and position property for competitive advantage",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 13,
            foundation_courses: [
              {
                id: "st-fc-08",
                title: "CM Weekly Meeting - Marketing with Steele Palombo & Adrienne Wilcox",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Strategic marketing approach"
              },
              {
                id: "st-fc-09",
                title: "CM Weekly Meeting - Google Reviews with Heidi Rice",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Online reputation as competitive advantage"
              },
              {
                id: "st-fc-10",
                title: "GH Webinar: Reputation Management - Micro-Moments are Everywhere",
                duration: "30 minutes",
                platform: "PerformanceHQ",
                description: "Strategic reputation management"
              }
            ],
            signature_activity: {
              title: "Market Leadership Initiative",
              icon: "🏆",
              description: "Three-month program developing market awareness and competitive positioning expertise",
              phases: [
                {
                  phase: 1,
                  title: "Market Position Assessment & Competitive Analysis",
                  duration: "Month 1",
                  activities: [
                    "Thoroughly understand property's current market position and competitive landscape",
                    "Market Research Activities: Conduct mystery shopping of competitors, analyze online reviews, and assess market positioning",
                    "CM Shadowing Focus: Observe CM making strategic decisions based on competitive intelligence"
                  ],
                  deliverables: [
                    "Market Position Assessment (comprehensive analysis of property's current market standing)",
                    "Competitive Landscape Map (detailed analysis of competitors, their strengths, and market strategies)",
                    "Market Opportunity Analysis (identification of unmet market needs and competitive gaps)"
                  ],
                  journal_prompt: "How do residents and prospects perceive our property compared to competitors? What market opportunities are we not capitalizing on?",
                  custom_materials: [
                    "Property Market Positioning Analysis - Assessing current competitive position and market perception",
                    "Competitive Landscape Mapping - Comprehensive analysis of direct and indirect competitors",
                    "Market Opportunity Identification - Finding gaps and opportunities in current market"
                  ]
                },
                {
                  phase: 2,
                  title: "Strategic Differentiation & Value Proposition Development",
                  duration: "Month 2",
                  activities: [
                    "Develop clear strategic differentiation and unique value proposition for property",
                    "Implementation: Lead initiatives that strengthen property's competitive differentiation",
                    "CM Shadowing Focus: Participate in marketing strategy discussions and brand positioning decisions"
                  ],
                  deliverables: [
                    "Strategic Differentiation Strategy (how property will differentiate itself from competitors)",
                    "Value Proposition Documentation (clear articulation of property's unique value to residents)",
                    "Brand Positioning Plan (strategic approach to property branding and market positioning)"
                  ],
                  journal_prompt: "What makes our property truly different and better than competitors? How can we strengthen our unique value proposition?",
                  custom_materials: [
                    "Strategic Differentiation Development - Creating unique competitive advantages",
                    "Value Proposition Design for Property Management - Articulating property's unique value",
                    "Brand Positioning Strategy - Strategic approach to property branding and positioning"
                  ]
                },
                {
                  phase: 3,
                  title: "Market Leadership & Innovation",
                  duration: "Month 3",
                  activities: [
                    "Position property as market leader through innovation and strategic market initiatives",
                    "Industry Leadership: Participate in industry events or committees as property representative",
                    "Innovation Project: Lead innovative initiative that could influence market standards"
                  ],
                  deliverables: [
                    "Market Leadership Strategy (plan for establishing property as market leader)",
                    "Innovation Implementation (innovative approaches that differentiate property from competitors)",
                    "Market Initiative Results (strategic initiatives that enhanced market position)"
                  ],
                  journal_prompt: "How can our property lead the market rather than just compete in it? What innovations could position us as the property others aspire to emulate?",
                  custom_materials: [
                    "Market Leadership Strategies - Becoming the property that others follow",
                    "Innovation in Property Management - Leading market change through innovation",
                    "Strategic Market Initiative Development - Creating initiatives that establish market leadership"
                  ]
                }
              ]
            }
          },
          innovation_continuous_improvement: {
            name: "Innovation & Continuous Improvement Leadership",
            description: "Lead innovation initiatives and create culture of continuous improvement",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 13,
            foundation_courses: [
              {
                id: "st-fc-11",
                title: "Leadership 201",
                duration: "2 hours 5 minutes",
                platform: "PerformanceHQ",
                description: "Advanced leadership including innovation leadership"
              },
              {
                id: "st-fc-12",
                title: "Effective Time Management",
                duration: "35 minutes",
                platform: "PerformanceHQ",
                description: "Efficiency and productivity improvement"
              },
              {
                id: "st-fc-13",
                title: "Employee Motivation",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Motivating teams toward continuous improvement"
              }
            ],
            signature_activity: {
              title: "Innovation Leadership Program",
              icon: "💡",
              description: "Three-month intensive program developing innovation leadership and continuous improvement capabilities",
              phases: [
                {
                  phase: 1,
                  title: "Innovation Culture Development",
                  duration: "Month 1",
                  activities: [
                    "Create culture that encourages innovation and continuous improvement throughout property",
                    "Team Engagement: Facilitate innovation sessions with property team members",
                    "CM Shadowing Focus: Observe CM encouraging innovation and managing improvement initiatives"
                  ],
                  deliverables: [
                    "Innovation Culture Assessment (current state of innovation mindset and improvement culture)",
                    "Innovation Culture Development Plan (strategy for building innovation culture across property)",
                    "Innovation Leadership Examples (how you've encouraged innovative thinking in your team)"
                  ],
                  journal_prompt: "How can I create an environment where people feel safe to suggest new ideas and improvements? What innovations have had the biggest impact on our property?",
                  custom_materials: [
                    "Innovation Culture Assessment and Development - Building innovation mindset in property teams",
                    "Continuous Improvement Philosophy - Creating systematic approach to ongoing improvement",
                    "Innovation Leadership Techniques - Leading teams toward innovative thinking and solutions"
                  ]
                },
                {
                  phase: 2,
                  title: "Strategic Innovation Implementation",
                  duration: "Month 2",
                  activities: [
                    "Lead strategic innovation initiatives that improve property performance and resident experience",
                    "Innovation Leadership: Lead major innovation project that affects multiple departments or stakeholders",
                    "Cross-Property Learning: Share innovations with other properties and learn from their innovations"
                  ],
                  deliverables: [
                    "Strategic Innovation Plan (identification and planning of high-impact innovation opportunities)",
                    "Innovation Implementation Results (successful implementation of innovative ideas with measurable outcomes)",
                    "Innovation ROI Analysis (financial and operational impact of innovation initiatives)"
                  ],
                  journal_prompt: "What innovations would have the biggest strategic impact on our property? How do I balance innovation with operational stability?",
                  custom_materials: [
                    "Strategic Innovation Planning - Identifying and planning high-impact innovations",
                    "Innovation Project Management - Successfully implementing innovative ideas",
                    "Innovation ROI Assessment - Measuring the impact and value of innovations"
                  ]
                },
                {
                  phase: 3,
                  title: "Systematic Improvement & Innovation Sustainability",
                  duration: "Month 3",
                  activities: [
                    "Create systems for ongoing innovation and continuous improvement that persist over time",
                    "System Implementation: Create ongoing innovation and improvement systems for property",
                    "Innovation Mentoring: Begin mentoring others in innovation thinking and continuous improvement"
                  ],
                  deliverables: [
                    "Innovation System Design (ongoing processes for generating, evaluating, and implementing innovations)",
                    "Innovation Sustainability Plan (ensuring innovations continue and evolve over time)",
                    "Innovation Mentorship Examples (how you've developed innovation capability in others)"
                  ],
                  journal_prompt: "How do I create innovation systems that continue even when I'm not directly involved? What makes innovation sustainable rather than just temporary?",
                  custom_materials: [
                    "Systematic Innovation Processes - Creating ongoing systems for innovation and improvement",
                    "Innovation Sustainability Strategies - Ensuring innovations continue and evolve over time",
                    "Innovation Knowledge Transfer - Sharing innovations and building innovation capability in others"
                  ]
                }
              ]
            }
          },
          vision_goal_achievement: {
            name: "Long-Term Vision & Goal Achievement",
            description: "Develop and communicate compelling vision while creating systems for goal achievement",
            progress_percentage: 0,
            completed_tasks: 0,
            total_tasks: 14,
            foundation_courses: [
              {
                id: "st-fc-14",
                title: "Leadership 101",
                duration: "45 minutes",
                platform: "PerformanceHQ",
                description: "Vision development and communication"
              },
              {
                id: "st-fc-15",
                title: "Goal Setting and Achievement",
                duration: "1 hour",
                platform: "PerformanceHQ",
                description: "Strategic approach to achieving objectives"
              },
              {
                id: "st-fc-16",
                title: "Business Planning",
                duration: "1 hour 30 minutes",
                platform: "PerformanceHQ",
                description: "Long-term business planning concepts"
              }
            ],
            signature_activity: {
              title: "Visionary Leadership Development",
              icon: "🔮",
              description: "Three-month program developing visionary leadership and goal achievement mastery",
              phases: [
                {
                  phase: 1,
                  title: "Vision Development & Communication",
                  duration: "Month 1",
                  activities: [
                    "Develop clear long-term vision for property and department, and master communicating vision effectively",
                    "Vision Communication: Present vision to property team and stakeholders",
                    "CM Shadowing Focus: Observe CM communicating vision and making vision-based decisions"
                  ],
                  deliverables: [
                    "Property Vision Statement (compelling long-term vision for property's future)",
                    "Vision Communication Plan (strategy for sharing and reinforcing vision throughout property)",
                    "Vision-Based Decision Examples (decisions made based on long-term vision rather than short-term convenience)"
                  ],
                  journal_prompt: "What does our property look like in 5 years if we're successful? How can I communicate this vision in a way that inspires and motivates others?",
                  custom_materials: [
                    "Vision Development for Property Leaders - Creating compelling long-term vision",
                    "Vision Communication Strategies - Effectively sharing vision to inspire and align teams",
                    "Vision-Based Decision Making - Using vision to guide strategic decisions"
                  ]
                },
                {
                  phase: 2,
                  title: "Strategic Goal Alignment & Achievement Systems",
                  duration: "Month 2",
                  activities: [
                    "Create systems that align all activities with long-term vision and ensure goal achievement",
                    "Implementation: Implement goal alignment systems across department and encourage property-wide adoption",
                    "Regional Manager Exposure: Present long-term goals and achievement systems to Regional Manager"
                  ],
                  deliverables: [
                    "Goal Alignment System (process for ensuring all activities support long-term vision)",
                    "Achievement Methodology (systematic approach to reaching strategic objectives)",
                    "Strategic Performance Tracking (systems for monitoring progress toward long-term goals)"
                  ],
                  journal_prompt: "How do I ensure daily decisions and activities actually move us toward our long-term vision? What goal achievement systems work best for sustaining long-term focus?",
                  custom_materials: [
                    "Strategic Goal Alignment Systems - Ensuring all activities support long-term vision",
                    "Goal Achievement Methodology - Systematic approach to achieving strategic objectives",
                    "Performance Measurement for Strategic Success - Tracking progress toward long-term goals"
                  ]
                },
                {
                  phase: 3,
                  title: "Legacy Building & Succession Planning",
                  duration: "Month 3",
                  activities: [
                    "Think beyond immediate tenure to build lasting positive impact and prepare others for leadership",
                    "Mentorship Leadership: Mentor multiple team members in strategic thinking and visionary leadership",
                    "Long-term Impact Assessment: Measure and document lasting improvements attributable to strategic thinking"
                  ],
                  deliverables: [
                    "Legacy Building Plan (how you'll create lasting positive impact on property and team)",
                    "Succession Development Examples (how you've prepared others for leadership roles)",
                    "Knowledge Transfer Systems (ensuring strategic thinking and vision transfer to future leaders)"
                  ],
                  journal_prompt: "What lasting positive impact do I want to have on this property and these people? How can I ensure the strategic vision and improvements continue after I advance to my next role?",
                  custom_materials: [
                    "Legacy Leadership Development - Building positive impact that lasts beyond current role",
                    "Succession Planning for Property Leaders - Preparing others to continue strategic vision",
                    "Strategic Knowledge Transfer - Ensuring strategic thinking and vision continue with leadership changes"
                  ]
                }
              ]
            }
          }
        },
        validation_criteria: {
          mastery_gates: [
            "Strategic Analysis Competency: Demonstrate ability to analyze property's strategic position and develop comprehensive strategic plans",
            "Data-Driven Decision Making: Consistently use data analysis to generate strategic insights and recommendations",
            "Market Leadership Initiative: Successfully implement initiative that positions property competitively in the market",
            "Innovation Leadership: Lead strategic innovations that improve property performance and resident experience",
            "Visionary Leadership: Develop and communicate compelling vision that aligns and motivates teams toward long-term success"
          ],
          portfolio_defense: {
            challenge: "45-minute presentation to executive panel including Regional Manager and senior leadership",
            components: [
              "Strategic Analysis Mastery: Present comprehensive strategic analysis of property with recommendations",
              "Data-Driven Insights: Demonstrate analytical skills through data-based strategic recommendations",
              "Market Positioning Strategy: Present competitive analysis and strategic positioning recommendations",
              "Innovation Leadership: Show examples of strategic innovations with measurable impact",
              "Visionary Leadership: Communicate long-term vision and strategic goal achievement systems",
              "Executive Q&A: Handle complex strategic scenarios and high-level strategic questions"
            ]
          },
          cm_readiness_indicators: [
            "Property-Level Strategic Thinking: Consistently thinks beyond department to property-wide strategic implications",
            "Data-Driven Leadership: Uses analytical insights to drive strategic decisions and recommendations",
            "Market Awareness: Understands competitive landscape and positions property strategically",
            "Innovation Leadership: Leads change and improvement initiatives that create competitive advantage",
            "Visionary Communication: Articulates compelling vision and aligns teams toward long-term success",
            "Strategic Implementation: Turns strategic thinking into measurable results and sustainable improvements"
          ]
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

  const handleCompleteCompetencyTask = (areaKey, subKey, taskId, notes = '', taskType = 'course') => {
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
    setShowTaskModal(null);
    setTaskNotes('');
    
    // Update competency progress percentages immediately with the new progress data
    setTimeout(() => {
      console.log('Triggering progress update with fresh data...');
      updateCompetencyProgressWithData(updatedProgress);
    }, 500);
  };

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
            isCompetencyTaskComplete={isCompetencyTaskComplete}
            getCompetencyTaskNotes={getCompetencyTaskNotes}

            showTaskModal={showTaskModal}
            setShowTaskModal={setShowTaskModal}
            taskNotes={taskNotes}
            setTaskNotes={setTaskNotes}
          />
        )}
        
        {currentView === 'portfolio' && !isAdmin && (
          <PortfolioView portfolio={portfolio} setCurrentView={setCurrentView} />
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
                                onCompleteCompetencyTask(areaKey, 'curiosity_ignition', `prompt_${index}`, e.target.value, 'curiosity_reflection');
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
                    <div key={subKey} className="sub-competency-card bg-white rounded-lg shadow-sm border border-gray-200">
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
                              onClick={() => setExpandedArea(expandedArea === `${areaKey}_${subKey}` ? areaKey : `${areaKey}_${subKey}`)}
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
                                          <p className="text-sm text-gray-800 bg-blue-50 p-3 rounded border border-blue-100">
                                            {monthActivity.in_the_flow_activity}
                                          </p>
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
                                                  onCompleteCompetencyTask(areaKey, subKey, `${activityKey}_reflection`, e.target.value, 'reflection');
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

export default App;