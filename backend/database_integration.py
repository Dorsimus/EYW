"""
Database Integration Module
Integrates the new MongoDB schema with the existing backend system
"""

import os
import asyncio
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from services.user_service import UserService
from services.competency_service import CompetencyService
from services.portfolio_service import PortfolioService
from services.flightbook_service import FlightbookService
from services.project_service import ProjectService

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'earn_your_wings')

class DatabaseManager:
    """Centralized database management for all services"""
    
    def __init__(self):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        
        # Initialize services
        self.user_service = UserService(self.db)
        self.competency_service = CompetencyService(self.db)
        self.portfolio_service = PortfolioService(self.db)
        self.flightbook_service = FlightbookService(self.db)
        self.project_service = ProjectService(self.db)
        
    async def initialize(self):
        """Initialize all database services and indexes"""
        print("🔧 Initializing database services...")
        
        try:
            # Test database connection
            await self.db.command('ping')
            print(f"✅ Connected to MongoDB: {db_name}")
            
            # Initialize all service indexes
            await self.user_service.ensure_indexes()
            await self.competency_service.ensure_indexes()
            await self.portfolio_service.ensure_indexes()
            await self.flightbook_service.ensure_indexes()
            
            print("✅ Database initialization completed successfully")
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            raise e
    
    async def close(self):
        """Close database connections"""
        if self.client:
            self.client.close()
            print("🔌 Database connections closed")

# Navigator Level Competency Framework - matches frontend structure
NAVIGATOR_COMPETENCIES = {
    "leadership_supervision": {
        "name": "Leadership & Supervision",
        "description": "Leadership Isn't a Title, It's How You Show Up Every Day",
        "sub_competencies": {
            "inspiring_team_motivation": "Inspiring Team Motivation & Engagement",
            "mastering_difficult_conversations": "Mastering Difficult Conversations",
            "building_collaborative_culture": "Building Collaborative Team Culture",
            "developing_others_success": "Developing Others for Success"
        }
    },
    "financial_management": {
        "name": "Financial Management & Business Acumen",
        "description": "Every Decision Has a Dollar Impact - Make Them Count",
        "sub_competencies": {
            "property_pl_understanding": "Property P&L Understanding",
            "departmental_budget_management": "Departmental Budget Management",
            "cost_conscious_decision_making": "Cost-Conscious Decision Making",
            "financial_communication_business_understanding": "Financial Communication & Business Understanding"
        }
    },
    "operational_management": {
        "name": "Operational Management",
        "description": "Great Operations Are Invisible - Bad Operations Are Obvious",
        "sub_competencies": {
            "process_improvement_efficiency": "Process Improvement & Efficiency",
            "quality_control_standards": "Quality Control & Standards",
            "safety_leadership_risk_awareness": "Safety Leadership & Risk Awareness",
            "technology_system_optimization": "Technology & System Optimization",
            "compliance_risk_management": "Compliance & Risk Management"
        }
    },
    "cross_functional_collaboration": {
        "name": "Cross-Functional Collaboration", 
        "description": "Breaking Down Silos & Building Unified Property Teams",
        "sub_competencies": {
            "understanding_other_department": "Understanding & Appreciating the Other Department",
            "unified_resident_experience": "Unified Resident Experience Creation",
            "communication_across_departments": "Effective Communication Across Departments",
            "stakeholder_relationship_building": "Stakeholder Relationship Building"
        }
    },
    "strategic_thinking": {
        "name": "Strategic Thinking & Planning",
        "description": "Think Beyond Today - Lead for Tomorrow",
        "sub_competencies": {
            "seeing_patterns_anticipating_trends": "Seeing Patterns & Anticipating Trends",
            "innovation_continuous_improvement": "Innovation & Continuous Improvement Thinking",
            "problem_solving_future_focus": "Problem-Solving with Future Focus",
            "planning_goal_achievement": "Planning & Goal Achievement with Strategic Perspective"
        }
    },
    "client_confidence_connection": {
        "name": "Client Confidence & Connection",
        "description": "Building the Foundation for Exceptional Client Partnership",
        "sub_competencies": {
            "understanding_client_impact": "Understanding Client Impact & Connection",
            "service_excellence_presence": "Service Excellence & Professional Presence", 
            "client_communication_skills": "Client Communication & Relationship Skills",
            "client_advocacy_value": "Client Advocacy & Value Creation"
        }
    }
}

# Sample tasks for seeding the database - matches the structure in server.py
SAMPLE_TASKS = [
    # Leadership & Supervision - Team Motivation
    {
        "title": "Complete Motivation & Engagement Course",
        "description": "Complete the online course on team motivation strategies and employee engagement techniques",
        "task_type": "course_link",
        "competency_area": "leadership_supervision",
        "sub_competency": "inspiring_team_motivation",
        "order": 1,
        "required": True,
        "estimated_hours": 2.0,
        "external_link": "https://your-lms.com/motivation-course",
        "instructions": "Complete all modules and pass the final assessment with 80% or higher."
    },
    {
        "title": "Conduct Team Motivation Assessment",
        "description": "Survey your team to assess current motivation levels and identify improvement areas",
        "task_type": "assessment",
        "competency_area": "leadership_supervision",
        "sub_competency": "inspiring_team_motivation",
        "order": 2,
        "required": True,
        "estimated_hours": 1.5,
        "instructions": "Use the team motivation survey template and document findings."
    },
    {
        "title": "Implement One Team Engagement Initiative",
        "description": "Design and implement a team engagement initiative based on assessment results",
        "task_type": "project",
        "competency_area": "leadership_supervision",
        "sub_competency": "inspiring_team_motivation",
        "order": 3,
        "required": True,
        "estimated_hours": 4.0,
        "instructions": "Document the initiative plan, implementation process, and results."
    },
    
    # Financial Management - Budget Creation
    {
        "title": "Financial Planning Fundamentals Course",
        "description": "Complete comprehensive course on property financial planning and budgeting",
        "task_type": "course_link",
        "competency_area": "financial_management",
        "sub_competency": "departmental_budget_management",
        "order": 1,
        "required": True,
        "estimated_hours": 3.0,
        "external_link": "https://your-lms.com/financial-planning",
        "instructions": "Complete all modules including budget creation templates and case studies."
    },
    {
        "title": "Shadow Finance Manager During Budget Season",
        "description": "Observe and participate in the annual budget creation process",
        "task_type": "shadowing",
        "competency_area": "financial_management",
        "sub_competency": "departmental_budget_management",
        "order": 2,
        "required": True,
        "estimated_hours": 8.0,
        "instructions": "Attend budget meetings, review historical data, and participate in forecasting sessions."
    },
    {
        "title": "Create Department Budget Draft",
        "description": "Develop a complete budget for your department for the upcoming fiscal year",
        "task_type": "document_upload",
        "competency_area": "financial_management",
        "sub_competency": "departmental_budget_management",
        "order": 3,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Use company budget template, include justifications for all line items."
    },
    
    # Additional sample tasks for other competencies...
    {
        "title": "Process Improvement Methodology Course",
        "description": "Learn systematic approaches to analyzing and improving business processes",
        "task_type": "course_link",
        "competency_area": "operational_management",
        "sub_competency": "process_improvement_efficiency",
        "order": 1,
        "required": True,
        "estimated_hours": 2.5,
        "external_link": "https://your-lms.com/process-improvement",
        "instructions": "Focus on lean principles and workflow mapping techniques."
    },
    {
        "title": "Cross-Training: Shadow Other Department",
        "description": "Spend time with the opposite department (Leasing/Maintenance) to understand their processes",
        "task_type": "shadowing",
        "competency_area": "cross_functional_collaboration",
        "sub_competency": "understanding_other_department",
        "order": 1,
        "required": True,
        "estimated_hours": 16.0,
        "instructions": "Spend 2 full days with the other department, document key learnings and connection points."
    },
    {
        "title": "Complete Market Analysis Report",
        "description": "Research and analyze your local property management market conditions",
        "task_type": "document_upload",
        "competency_area": "strategic_thinking",
        "sub_competency": "seeing_patterns_anticipating_trends",
        "order": 1,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Include competitor analysis, pricing trends, and market opportunities."
    }
]

async def seed_database(db_manager: DatabaseManager):
    """Seed the database with initial competency framework and sample tasks"""
    print("🌱 Seeding database with sample data...")
    
    try:
        # Seed sample tasks
        result = await db_manager.competency_service.seed_sample_tasks(SAMPLE_TASKS, "system")
        print(f"✅ Seeded {result['processed']} sample tasks")
        
        if result['errors']:
            print("⚠️ Some errors occurred during seeding:")
            for error in result['errors']:
                print(f"   - {error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database seeding failed: {e}")
        return False

async def migrate_existing_data(db_manager: DatabaseManager):
    """Migrate any existing localStorage or hardcoded data to database"""
    print("🔄 Checking for existing data to migrate...")
    
    # This function can be expanded to migrate data from localStorage
    # or other sources if needed
    
    print("✅ Data migration check completed")
    return True

# Main database initialization function
async def initialize_database():
    """Initialize the complete database system"""
    db_manager = DatabaseManager()
    
    try:
        await db_manager.initialize()
        
        # Check if we need to seed data
        task_count = await db_manager.competency_service.tasks_collection.count_documents({'active': True})
        if task_count == 0:
            print("📝 No tasks found, seeding sample data...")
            await seed_database(db_manager)
        
        # Migrate any existing data
        await migrate_existing_data(db_manager)
        
        return db_manager
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        await db_manager.close()
        raise e

if __name__ == "__main__":
    # Test the database initialization
    async def test_init():
        db_manager = await initialize_database()
        
        # Test basic operations
        print("\n🧪 Testing basic database operations...")
        
        # Test competency framework
        stats = await db_manager.competency_service.get_admin_statistics()
        print(f"📊 Database contains {stats['total_tasks']} tasks across {stats['active_competency_areas']} competency areas")
        
        await db_manager.close()
    
    asyncio.run(test_init())