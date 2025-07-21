from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime, timedelta
import shutil
import json
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure motor to use UUIDs instead of ObjectIds
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, dict):
        return {key: serialize_doc(value) for key, value in doc.items()}
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Security configuration
SECRET_KEY = "your-secret-key-here-change-in-production"  # In production, use proper secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = "participant"  # participant, mentor, manager, admin
    level: str = "navigator"   # navigator level for now
    is_admin: bool = False
    password_hash: Optional[str] = None  # For admin users
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    name: str
    role: str = "participant"
    level: str = "navigator"
    is_admin: bool = False
    password: Optional[str] = None

class AdminLogin(BaseModel):
    email: str
    password: str

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    task_type: str  # course_link, document_upload, assessment, shadowing, meeting, project
    competency_area: str
    sub_competency: str
    order: int = 0  # for ordering tasks within a competency
    required: bool = True
    estimated_hours: Optional[float] = None
    external_link: Optional[str] = None  # Link to LMS course, document, etc.
    instructions: Optional[str] = None
    created_by: str  # admin user id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True

class TaskCreate(BaseModel):
    title: str
    description: str
    task_type: str
    competency_area: str
    sub_competency: str
    order: int = 0
    required: bool = True
    estimated_hours: Optional[float] = None
    external_link: Optional[str] = None
    instructions: Optional[str] = None

class TaskCompletion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    task_id: str
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    evidence_description: Optional[str] = None
    evidence_file_path: Optional[str] = None
    verified_by: Optional[str] = None  # mentor/manager id
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None

class TaskCompletionCreate(BaseModel):
    task_id: str
    evidence_description: Optional[str] = None
    notes: Optional[str] = None

class AdminStats(BaseModel):
    total_users: int
    total_tasks: int
    total_completions: int
    completion_rate: float
    active_competency_areas: int

class CompetencyProgress(BaseModel):
    user_id: str
    competency_area: str
    sub_competency: str
    completion_percentage: float = 0.0  # calculated from task completions
    completed_tasks: int = 0
    total_tasks: int = 0
    evidence_items: List[str] = []  # portfolio item IDs
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class PortfolioItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    competency_areas: List[str] = []  # which competencies this supports
    file_path: Optional[str] = None
    file_type: str = "document"  # document, image, video, etc.
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []

class PortfolioItemCreate(BaseModel):
    title: str
    description: str
    competency_areas: List[str] = []
    file_type: str = "document"
    tags: List[str] = []

# Navigator Level Competency Framework with Sample Tasks
NAVIGATOR_COMPETENCIES = {
    "leadership_supervision": {
        "name": "Leadership & Supervision",
        "description": "Mastering the art of leading people and managing performance",
        "sub_competencies": {
            "team_motivation": "Team Motivation & Engagement",
            "delegation": "Delegation Excellence", 
            "performance_management": "Performance Management",
            "coaching_development": "Coaching & Development",
            "team_building": "Team Building",
            "conflict_resolution": "Conflict Resolution & Communication",
            "difficult_conversations": "Difficult Conversations",
            "cross_dept_communication": "Cross-Departmental Communication",
            "resident_resolution": "Resident Issue Resolution",
            "crisis_leadership": "Crisis Leadership"
        }
    },
    "financial_management": {
        "name": "Financial Management & Business Acumen",
        "description": "Understanding and driving the financial success of property operations",
        "sub_competencies": {
            "budget_creation": "Department Budget Creation",
            "variance_analysis": "Variance Analysis",
            "cost_control": "Cost Control",
            "roi_decisions": "ROI Decision Making",
            "revenue_impact": "Revenue Impact Understanding",
            "pl_understanding": "P&L Understanding",
            "kpi_tracking": "KPI Tracking",
            "financial_forecasting": "Financial Forecasting",
            "capex_planning": "Capital Expenditure Planning",
            "vendor_cost_mgmt": "Vendor Cost Management"
        }
    },
    "operational_management": {
        "name": "Operational Management",
        "description": "Optimizing departmental operations for maximum efficiency and effectiveness",
        "sub_competencies": {
            "workflow_optimization": "Workflow Optimization",
            "technology_utilization": "Technology Utilization",
            "quality_control": "Quality Control",
            "sop_management": "Standard Operating Procedures",
            "innovation": "Innovation Implementation",
            "safety_management": "Safety Management",
            "policy_enforcement": "Policy Enforcement",
            "legal_compliance": "Legal Compliance",
            "emergency_preparedness": "Emergency Preparedness",
            "documentation": "Documentation Standards"
        }
    },
    "cross_functional": {
        "name": "Cross-Functional Collaboration", 
        "description": "Building bridges between departments for seamless property operations",
        "sub_competencies": {
            "interdept_understanding": "Inter-Departmental Understanding",
            "resident_journey": "Resident Journey Mapping",
            "revenue_awareness": "Revenue Impact Awareness",
            "collaborative_problem_solving": "Collaborative Problem Solving",
            "joint_planning": "Joint Planning",
            "resource_sharing": "Resource Sharing",
            "communication_protocols": "Communication Protocols",
            "dept_conflict_resolution": "Conflict Resolution",
            "success_metrics": "Success Metrics"
        }
    },
    "strategic_thinking": {
        "name": "Strategic Thinking & Planning",
        "description": "Developing the strategic mindset needed for property management leadership",
        "sub_competencies": {
            "market_awareness": "Market Awareness",
            "trend_identification": "Trend Identification",
            "opportunity_recognition": "Opportunity Recognition",
            "problem_anticipation": "Problem Anticipation",
            "longterm_planning": "Long-term Planning",
            "change_leadership": "Change Leadership",
            "stakeholder_management": "Stakeholder Management",
            "project_management": "Project Management",
            "innovation_adoption": "Innovation Adoption",
            "continuous_improvement": "Continuous Improvement"
        }
    }
}

# Sample tasks for seeding the database
SAMPLE_TASKS = [
    # Leadership & Supervision - Team Motivation
    {
        "title": "Complete Motivation & Engagement Course",
        "description": "Complete the online course on team motivation strategies and employee engagement techniques",
        "task_type": "course_link",
        "competency_area": "leadership_supervision",
        "sub_competency": "team_motivation",
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
        "sub_competency": "team_motivation",
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
        "sub_competency": "team_motivation",
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
        "sub_competency": "budget_creation",
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
        "sub_competency": "budget_creation",
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
        "sub_competency": "budget_creation",
        "order": 3,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Use company budget template, include justifications for all line items."
    },
    
    # Operational Management - Workflow Optimization
    {
        "title": "Process Improvement Methodology Course",
        "description": "Learn systematic approaches to analyzing and improving business processes",
        "task_type": "course_link",
        "competency_area": "operational_management",
        "sub_competency": "workflow_optimization",
        "order": 1,
        "required": True,
        "estimated_hours": 2.5,
        "external_link": "https://your-lms.com/process-improvement",
        "instructions": "Focus on lean principles and workflow mapping techniques."
    },
    {
        "title": "Map Current Department Workflows",
        "description": "Document all major processes in your department using workflow mapping",
        "task_type": "document_upload",
        "competency_area": "operational_management",
        "sub_competency": "workflow_optimization",
        "order": 2,
        "required": True,
        "estimated_hours": 4.0,
        "instructions": "Use standard workflow symbols and identify bottlenecks or inefficiencies."
    },
    
    # Cross-Functional - Interdepartmental Understanding
    {
        "title": "Cross-Training: Shadow Other Department",
        "description": "Spend time with the opposite department (Leasing/Maintenance) to understand their processes",
        "task_type": "shadowing",
        "competency_area": "cross_functional",
        "sub_competency": "interdept_understanding",
        "order": 1,
        "required": True,
        "estimated_hours": 16.0,
        "instructions": "Spend 2 full days with the other department, document key learnings and connection points."
    },
    
    # Strategic Thinking - Market Awareness
    {
        "title": "Complete Market Analysis Report",
        "description": "Research and analyze your local property management market conditions",
        "task_type": "document_upload",
        "competency_area": "strategic_thinking",
        "sub_competency": "market_awareness",
        "order": 1,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Include competitor analysis, pricing trends, and market opportunities."
    }
]

async def calculate_competency_progress(user_id: str, competency_area: str, sub_competency: str):
    """Calculate progress percentage for a specific sub-competency based on completed tasks"""
    # Get all tasks for this sub-competency
    tasks = await db.tasks.find({
        "competency_area": competency_area,
        "sub_competency": sub_competency,
        "active": True
    }).to_list(1000)
    
    if not tasks:
        return 0.0, 0, 0
    
    total_tasks = len(tasks)
    
    # Get completed tasks for this user
    task_ids = [task["id"] for task in tasks]
    completed = await db.task_completions.find({
        "user_id": user_id,
        "task_id": {"$in": task_ids}
    }).to_list(1000)
    
    completed_tasks = len(completed)
    completion_percentage = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0.0
    
    return completion_percentage, completed_tasks, total_tasks

async def update_all_competency_progress(user_id: str):
    """Recalculate all competency progress for a user"""
    for area_key, area_data in NAVIGATOR_COMPETENCIES.items():
        for sub_key in area_data["sub_competencies"].keys():
            percentage, completed, total = await calculate_competency_progress(user_id, area_key, sub_key)
            
            # Update or create competency progress record
            await db.competency_progress.update_one(
                {"user_id": user_id, "competency_area": area_key, "sub_competency": sub_key},
                {
                    "$set": {
                        "completion_percentage": percentage,
                        "completed_tasks": completed,
                        "total_tasks": total,
                        "last_updated": datetime.utcnow()
                    },
                    "$setOnInsert": {
                        "evidence_items": []
                    }
                },
                upsert=True
            )

# Routes
@api_router.get("/")
async def root():
    return {"message": "Earn Your Wings Platform API"}

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    
    # Initialize competency progress for new user
    await update_all_competency_progress(user.id)
    
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user_data = await db.users.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

@api_router.get("/users", response_model=List[User])
async def get_all_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/competencies")
async def get_competency_framework():
    return NAVIGATOR_COMPETENCIES

@api_router.get("/users/{user_id}/competencies")
async def get_user_competencies(user_id: str):
    # Update progress before returning
    await update_all_competency_progress(user_id)
    
    competencies = await db.competency_progress.find({"user_id": user_id}).to_list(1000)
    
    # Organize by competency area
    organized = {}
    for comp in competencies:
        comp = serialize_doc(comp)  # Serialize the document
        area = comp["competency_area"]
        if area not in organized:
            organized[area] = {
                "name": NAVIGATOR_COMPETENCIES[area]["name"],
                "description": NAVIGATOR_COMPETENCIES[area]["description"],
                "sub_competencies": {},
                "overall_progress": 0
            }
        
        sub_comp = comp["sub_competency"]
        organized[area]["sub_competencies"][sub_comp] = {
            "name": NAVIGATOR_COMPETENCIES[area]["sub_competencies"][sub_comp],
            "completion_percentage": comp["completion_percentage"],
            "completed_tasks": comp["completed_tasks"],
            "total_tasks": comp["total_tasks"],
            "evidence_items": comp["evidence_items"],
            "last_updated": comp["last_updated"]
        }
    
    # Calculate overall progress for each area
    for area_key, area_data in organized.items():
        if area_data["sub_competencies"]:
            total = sum(sub["completion_percentage"] for sub in area_data["sub_competencies"].values())
            count = len(area_data["sub_competencies"])
            area_data["overall_progress"] = round(total / count, 1) if count > 0 else 0
    
    return organized

@api_router.get("/tasks")
async def get_all_tasks():
    tasks = await db.tasks.find({"active": True}).sort("competency_area", 1).sort("sub_competency", 1).sort("order", 1).to_list(1000)
    return [serialize_doc(task) for task in tasks]

@api_router.get("/tasks/{competency_area}/{sub_competency}")
async def get_tasks_for_competency(competency_area: str, sub_competency: str):
    tasks = await db.tasks.find({
        "competency_area": competency_area,
        "sub_competency": sub_competency,
        "active": True
    }).sort("order", 1).to_list(1000)
    return [serialize_doc(task) for task in tasks]

@api_router.get("/users/{user_id}/tasks/{competency_area}/{sub_competency}")
async def get_user_tasks_for_competency(user_id: str, competency_area: str, sub_competency: str):
    # Get all tasks for this competency
    tasks = await db.tasks.find({
        "competency_area": competency_area,
        "sub_competency": sub_competency,
        "active": True
    }).sort("order", 1).to_list(1000)
    
    # Get user's completed tasks
    task_ids = [task["id"] for task in tasks]
    completions = await db.task_completions.find({
        "user_id": user_id,
        "task_id": {"$in": task_ids}
    }).to_list(1000)
    
    completion_map = {comp["task_id"]: serialize_doc(comp) for comp in completions}
    
    # Add completion status to tasks
    serialized_tasks = []
    for task in tasks:
        task_data = serialize_doc(task)
        task_data["completed"] = task["id"] in completion_map
        if task_data["completed"]:
            task_data["completion_data"] = completion_map[task["id"]]
        serialized_tasks.append(task_data)
    
    return serialized_tasks

# Task Completion Routes
@api_router.post("/users/{user_id}/task-completions")
async def complete_task(
    user_id: str,
    task_id: str = Form(...),
    evidence_description: str = Form(""),
    notes: str = Form(""),
    file: UploadFile = File(None)
):
    # Check if task exists
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if already completed
    existing = await db.task_completions.find_one({"user_id": user_id, "task_id": task_id})
    if existing:
        raise HTTPException(status_code=400, detail="Task already completed")
    
    completion = TaskCompletion(
        user_id=user_id,
        task_id=task_id,
        evidence_description=evidence_description,
        notes=notes
    )
    
    # Handle file upload if provided
    if file:
        file_extension = Path(file.filename).suffix if file.filename else ""
        file_path = UPLOAD_DIR / f"{completion.id}{file_extension}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        completion.evidence_file_path = str(file_path)
    
    await db.task_completions.insert_one(completion.dict())
    
    # Update competency progress
    await update_all_competency_progress(user_id)
    
    return completion

# Task Management Routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate):
    task = Task(**task_data.dict(), created_by="admin")  # TODO: Get actual admin user
    await db.tasks.insert_one(task.dict())
    return task

@api_router.get("/users/{user_id}/task-completions")
async def get_user_task_completions(user_id: str):
    completions = await db.task_completions.find({"user_id": user_id}).sort("completed_at", -1).to_list(1000)
    return [serialize_doc(completion) for completion in completions]

# Admin route to seed sample tasks
@api_router.post("/admin/seed-tasks")
async def seed_sample_tasks():
    """Seed the database with sample tasks - Admin only"""
    # Clear existing tasks
    await db.tasks.delete_many({})
    
    # Insert sample tasks
    for task_data in SAMPLE_TASKS:
        task = Task(**task_data, created_by="system")
        await db.tasks.insert_one(task.dict())
    
    return {"message": f"Seeded {len(SAMPLE_TASKS)} sample tasks"}

# Portfolio routes (unchanged)
@api_router.post("/users/{user_id}/portfolio")
async def create_portfolio_item(
    user_id: str,
    title: str = Form(...),
    description: str = Form(...),
    competency_areas: str = Form("[]"),
    tags: str = Form("[]"),
    file: UploadFile = File(None)
):
    try:
        competency_areas_list = json.loads(competency_areas) if competency_areas else []
        tags_list = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in competency_areas or tags")
    
    portfolio_item = PortfolioItem(
        user_id=user_id,
        title=title,
        description=description,
        competency_areas=competency_areas_list,
        tags=tags_list
    )
    
    # Handle file upload if provided
    if file:
        file_extension = Path(file.filename).suffix if file.filename else ""
        file_path = UPLOAD_DIR / f"{portfolio_item.id}{file_extension}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        portfolio_item.file_path = str(file_path)
        portfolio_item.file_type = file.content_type or "application/octet-stream"
    
    await db.portfolio_items.insert_one(portfolio_item.dict())
    
    # Update competency evidence for related areas
    for area in competency_areas_list:
        if area in NAVIGATOR_COMPETENCIES:
            await db.competency_progress.update_many(
                {"user_id": user_id, "competency_area": area},
                {"$addToSet": {"evidence_items": portfolio_item.id}}
            )
    
    return portfolio_item

@api_router.get("/users/{user_id}/portfolio", response_model=List[PortfolioItem])
async def get_user_portfolio(user_id: str):
    items = await db.portfolio_items.find({"user_id": user_id}).sort("upload_date", -1).to_list(1000)
    return [PortfolioItem(**item) for item in items]

@api_router.delete("/users/{user_id}/portfolio/{item_id}")
async def delete_portfolio_item(user_id: str, item_id: str):
    # Remove from database
    result = await db.portfolio_items.delete_one({"id": item_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    # Remove from competency evidence
    await db.competency_progress.update_many(
        {"user_id": user_id},
        {"$pull": {"evidence_items": item_id}}
    )
    
    return {"message": "Portfolio item deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()