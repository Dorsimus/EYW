from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
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
import requests
from functools import lru_cache
from passlib.context import CryptContext
import asyncio

# AI Service imports - temporarily disabled
# from emergentintegrations.llm.chat import LlmChat, UserMessage

# Import flightbook router
from routers.flightbook import router as flightbook_router

# Import enhanced services
from enhanced_task_completion import EnhancedTaskCompletionService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Clerk Authentication Configuration
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CLERK_ISSUER = os.getenv("CLERK_ISSUER")

if not CLERK_JWKS_URL or not CLERK_ISSUER:
    raise ValueError("CLERK_JWKS_URL and CLERK_ISSUER environment variables are required")

# HTTP Bearer for token extraction
security = HTTPBearer()

@lru_cache(maxsize=1)
def get_clerk_jwks():
    """Fetch and cache Clerk's JSON Web Key Set"""
    try:
        response = requests.get(CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logging.error(f"Failed to fetch JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch authentication keys"
        )

def get_public_key(kid: str):
    """Get the public key for a specific Key ID from JWKS"""
    jwks = get_clerk_jwks()
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token key ID"
    )

def validate_clerk_token(token: str) -> Dict[str, Any]:
    """Validate and decode a Clerk JWT token"""
    try:
        # Decode the token header to get the Key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing Key ID"
            )
        
        # Get the public key and validate the token
        public_key = get_public_key(kid)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False}
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Authentication dependency that validates Clerk tokens"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = credentials.credentials
    user_data = validate_clerk_token(token)
    return user_data

# User ID validation dependency
def validate_user_access(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Dependency factory that validates user can only access their own data"""
    def check_user_id(user_id: str):
        authenticated_user_id = current_user.get("sub")
        if authenticated_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only access your own data"
            )
        return current_user
    return check_user_id

# Role-based access control
def require_roles(required_roles: List[str]):
    """Decorator factory for role-based access control"""
    def dependency(current_user: Dict[str, Any] = Depends(get_current_user)):
        # Extract user roles from metadata
        user_metadata = current_user.get("metadata", {})
        user_roles = user_metadata.get("roles", [])
        
        # Also check for public_metadata as fallback
        if not user_roles:
            public_metadata = current_user.get("public_metadata", {})
            if public_metadata:
                user_roles = public_metadata.get("roles", [])
        
        user_id = current_user.get("sub", "")
        logging.info(f"User {user_id} roles check: metadata_roles={user_metadata.get('roles', [])}, checking_for={required_roles}, granted_roles={user_roles}")
        
        # Check if user has any of the required roles
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. User roles: {user_roles}, Required: {required_roles}"
            )
        
        return current_user
    
    return dependency

# Convenience dependencies for common roles
require_admin = require_roles(["admin"])
require_admin_or_moderator = require_roles(["admin", "moderator"])

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

# Enhanced File Storage Configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create organized directory structure for portfolio files
PORTFOLIO_DIR = UPLOAD_DIR / "portfolio"
EVIDENCE_DIR = UPLOAD_DIR / "evidence" 
TEMP_DIR = UPLOAD_DIR / "temp"

# Create subdirectories
for directory in [PORTFOLIO_DIR, EVIDENCE_DIR, TEMP_DIR]:
    directory.mkdir(exist_ok=True)

# File upload constraints
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    '.mp4', '.mov', '.avi', '.wmv',
    '.txt', '.rtf'
}

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'image/jpeg',
    'image/jpg',  # Some systems use this
    'image/png',
    'image/gif',
    'image/bmp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'text/plain',
    'text/rtf'
}

# Security configuration
import secrets

# Generate cryptographically secure SECRET_KEY
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(32)
    logging.warning("SECRET_KEY not found in environment, generated temporary key")

# Validate production SECRET_KEY
if SECRET_KEY == "your-secret-key-here-change-in-production":
    raise ValueError("PRODUCTION SECRET_KEY must be configured - default key is not secure")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# File Management Utilities
def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file for security and size constraints"""
    if not file.filename:
        return False, "Filename is required"
    
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        return False, f"File type {file_extension} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check MIME type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        return False, f"MIME type {file.content_type} not allowed"
    
    return True, "Valid file"

def generate_secure_filename(original_filename: str, file_id: str) -> str:
    """Generate secure filename with UUID prefix and sanitized original name"""
    # Sanitize original filename (keep extension)
    file_extension = Path(original_filename).suffix.lower()
    safe_name = "".join(c for c in Path(original_filename).stem if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_name = safe_name[:50]  # Limit length
    
    # Create secure filename: UUID_sanitized_name.ext
    return f"{file_id}_{safe_name}{file_extension}" if safe_name else f"{file_id}{file_extension}"

def get_file_storage_path(file_type: str, user_id: str, file_id: str) -> Path:
    """Generate organized storage path based on file type and user"""
    current_date = datetime.utcnow()
    year_month = current_date.strftime("%Y-%m")
    
    if file_type == "portfolio":
        base_dir = PORTFOLIO_DIR
    elif file_type == "evidence":
        base_dir = EVIDENCE_DIR
    else:
        base_dir = TEMP_DIR
    
    # Create path: uploads/portfolio/2024-01/user_id/
    user_dir = base_dir / year_month / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    
    return user_dir

async def save_uploaded_file(file: UploadFile, file_type: str, user_id: str, file_id: str) -> dict:
    """Save uploaded file with proper organization and security"""
    # Validate file
    is_valid, message = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Check file size (read file to check size)
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate secure filename and path
    secure_filename = generate_secure_filename(file.filename, file_id)
    storage_path = get_file_storage_path(file_type, user_id, file_id)
    file_path = storage_path / secure_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    return {
        "file_path": str(file_path),
        "original_filename": file.filename,
        "secure_filename": secure_filename,
        "file_size": file_size,
        "mime_type": file.content_type,
        "file_type": file_type
    }

def delete_file(file_path: str) -> bool:
    """Safely delete a file"""
    try:
        if file_path and Path(file_path).exists():
            Path(file_path).unlink()
            return True
    except Exception as e:
        logging.error(f"Failed to delete file {file_path}: {str(e)}")
    return False
# Legacy password utilities - kept for potential data migration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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
    id: Optional[str] = None  # Allow optional ID for demo users
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

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[str] = None
    competency_area: Optional[str] = None
    sub_competency: Optional[str] = None
    order: Optional[int] = None
    required: Optional[bool] = None
    estimated_hours: Optional[float] = None
    external_link: Optional[str] = None
    instructions: Optional[str] = None
    active: Optional[bool] = None

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
    original_filename: Optional[str] = None
    secure_filename: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    file_type: str = "portfolio"  # portfolio, evidence, temp
    visibility: str = "private"  # private, managers, mentors, public
    tags: List[str] = []
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # active, archived, deleted
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
    
    # Cross-Functional - Understanding Other Department
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
    
    # Strategic Thinking - Market Awareness
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
    },
    
    # Additional Leadership & Supervision Tasks
    {
        "title": "Performance Review Training Workshop",
        "description": "Attend workshop on conducting effective performance reviews",
        "task_type": "course_link",
        "competency_area": "leadership_supervision", 
        "sub_competency": "performance_management",
        "order": 1,
        "required": True,
        "estimated_hours": 3.0,
        "external_link": "https://your-lms.com/performance-reviews",
        "instructions": "Learn techniques for giving constructive feedback and setting goals."
    },
    {
        "title": "Conduct Monthly One-on-One Meetings",
        "description": "Schedule and conduct monthly development meetings with each team member",
        "task_type": "assessment",
        "competency_area": "leadership_supervision",
        "sub_competency": "coaching_development", 
        "order": 1,
        "required": True,
        "estimated_hours": 2.0,
        "instructions": "Focus on career development, goals, and skill building opportunities."
    },
    {
        "title": "Conflict Resolution Simulation",
        "description": "Complete interactive conflict resolution scenarios",
        "task_type": "course_link",
        "competency_area": "leadership_supervision",
        "sub_competency": "conflict_resolution",
        "order": 1,
        "required": True,
        "estimated_hours": 2.5,
        "external_link": "https://your-lms.com/conflict-resolution",
        "instructions": "Practice de-escalation techniques and mediation skills."
    },
    
    # Additional Financial Management Tasks
    {
        "title": "Variance Analysis Deep Dive",
        "description": "Analyze budget vs actual variances for your department",
        "task_type": "document_upload",
        "competency_area": "financial_management",
        "sub_competency": "variance_analysis",
        "order": 1,
        "required": True,
        "estimated_hours": 4.0,
        "instructions": "Identify root causes of variances and propose corrective actions."
    },
    {
        "title": "ROI Analysis for Capital Project",
        "description": "Prepare ROI analysis for a proposed capital improvement project",
        "task_type": "project",
        "competency_area": "financial_management",
        "sub_competency": "roi_decisions",
        "order": 1,
        "required": True,
        "estimated_hours": 5.0,
        "instructions": "Include initial investment, projected returns, payback period, and risk assessment."
    },
    {
        "title": "Monthly P&L Review Presentation",
        "description": "Present monthly P&L results and insights to management",
        "task_type": "assessment",
        "competency_area": "financial_management",
        "sub_competency": "pl_understanding",
        "order": 1,
        "required": False,
        "estimated_hours": 3.0,
        "instructions": "Analyze trends, explain variances, and provide actionable recommendations."
    },
    
    # Additional Operational Management Tasks
    {
        "title": "Technology Implementation Project",
        "description": "Lead implementation of new property management software feature",
        "task_type": "project",
        "competency_area": "operational_management",
        "sub_competency": "technology_utilization",
        "order": 1,
        "required": True,
        "estimated_hours": 8.0,
        "instructions": "Manage rollout, training, and adoption of new technology solution."
    },
    {
        "title": "Standard Operating Procedures Audit",
        "description": "Review and update department SOPs for current best practices",
        "task_type": "document_upload",
        "competency_area": "operational_management",
        "sub_competency": "sop_management",
        "order": 1,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Document gaps, update procedures, and ensure team training on changes."
    },
    {
        "title": "Safety Compliance Assessment",
        "description": "Complete comprehensive safety audit of your department area",
        "task_type": "assessment",
        "competency_area": "operational_management",
        "sub_competency": "safety_management",
        "order": 1,
        "required": True,
        "estimated_hours": 4.0,
        "instructions": "Identify risks, document findings, and create improvement action plan."
    },
    
    # Additional Cross-Functional Tasks
    {
        "title": "Resident Journey Mapping Workshop",
        "description": "Map the complete resident experience across all departments",
        "task_type": "project",
        "competency_area": "cross_functional_collaboration",
        "sub_competency": "unified_resident_experience",
        "order": 1,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Collaborate with other departments to identify touchpoints and improvement opportunities."
    },
    {
        "title": "Interdepartmental Communication Protocol",
        "description": "Develop communication standards between departments",
        "task_type": "document_upload",
        "competency_area": "cross_functional_collaboration",
        "sub_competency": "communication_across_departments",
        "order": 1,
        "required": False,
        "estimated_hours": 3.0,
        "instructions": "Create clear escalation paths and information sharing procedures."
    },
    
    # Additional Strategic Thinking Tasks
    {
        "title": "Industry Trend Analysis",
        "description": "Research and present on emerging property management trends",
        "task_type": "document_upload",
        "competency_area": "strategic_thinking",
        "sub_competency": "seeing_patterns_anticipating_trends",
        "order": 1,
        "required": True,
        "estimated_hours": 4.0,
        "instructions": "Focus on technology, resident expectations, and market changes."
    },
    {
        "title": "Long-term Department Planning Session",
        "description": "Facilitate strategic planning session for department goals",
        "task_type": "project",
        "competency_area": "strategic_thinking",
        "sub_competency": "planning_goal_achievement",
        "order": 1,
        "required": True,
        "estimated_hours": 8.0,
        "instructions": "Set 3-year vision, identify key initiatives, and create implementation timeline."
    },
    {
        "title": "Change Management Case Study",
        "description": "Complete case study on successful change management in property management",
        "task_type": "course_link",
        "competency_area": "strategic_thinking",
        "sub_competency": "innovation_continuous_improvement",
        "order": 1,
        "required": False,
        "estimated_hours": 2.0,
        "external_link": "https://your-lms.com/change-management",
        "instructions": "Apply lessons learned to your current organizational context."
    },
    
    # Enhanced Leadership & Supervision Portfolio Tasks
    {
        "title": "Individual Development Plan Creation",
        "description": "Create comprehensive development plans for each team member with quarterly progress tracking",
        "task_type": "document_upload",
        "competency_area": "leadership_supervision",
        "sub_competency": "inspiring_team_motivation",
        "order": 4,
        "required": True,
        "estimated_hours": 4.0,
        "instructions": "Use development plan template, include strengths assessment, growth goals, and specific development opportunities."
    },
    {
        "title": "Coaching Conversation Case Studies",
        "description": "Document 3 coaching conversations showing progression from problem-solving to people development",
        "task_type": "document_upload",
        "competency_area": "leadership_supervision",
        "sub_competency": "mastering_difficult_conversations",
        "order": 4,
        "required": True,
        "estimated_hours": 3.0,
        "instructions": "Include situation, coaching approach, outcomes, and lessons learned for each case study."
    },
    {
        "title": "Meeting Facilitation Innovation Documentation",
        "description": "Document meeting improvement techniques and engagement strategies with results",
        "task_type": "document_upload",
        "competency_area": "leadership_supervision",
        "sub_competency": "inspiring_team_motivation",
        "order": 5,
        "required": True,
        "estimated_hours": 2.0,
        "instructions": "Include before/after meeting effectiveness, engagement techniques used, and team feedback."
    },
    
    # Enhanced Financial Management Portfolio Tasks
    {
        "title": "Monthly P&L Commentary Series",
        "description": "Create quarterly series of monthly P&L analysis with business insights and recommendations",
        "task_type": "document_upload",
        "competency_area": "financial_management",
        "sub_competency": "pl_understanding",
        "order": 4,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Include variance analysis, trend identification, and actionable management recommendations."
    },
    {
        "title": "Cost-Saving Initiative Portfolio",
        "description": "Document 3 cost-saving initiatives with ROI analysis and implementation results",
        "task_type": "document_upload",
        "competency_area": "financial_management",
        "sub_competency": "cost_control",
        "order": 4,
        "required": True,
        "estimated_hours": 5.0,
        "instructions": "Include opportunity identification, implementation plan, actual savings achieved, and lessons learned."
    },
    
    # Enhanced Operational Management Portfolio Tasks
    {
        "title": "Process Improvement Project Documentation",
        "description": "Complete process improvement project with before/after analysis and measurable results",
        "task_type": "document_upload",
        "competency_area": "operational_management",
        "sub_competency": "workflow_optimization",
        "order": 4,
        "required": True,
        "estimated_hours": 8.0,
        "instructions": "Include current state mapping, improvement implementation, results measurement, and scalability assessment."
    },
    {
        "title": "Quality Control System Implementation",
        "description": "Design and implement quality control systems with monitoring and improvement documentation",
        "task_type": "document_upload",
        "competency_area": "operational_management",
        "sub_competency": "quality_control",
        "order": 4,
        "required": True,
        "estimated_hours": 6.0,
        "instructions": "Include quality standards, monitoring systems, team training materials, and improvement tracking."
    },
    
    # Enhanced Cross-Functional Collaboration Portfolio Tasks
    {
        "title": "Cross-Department Understanding Report",
        "description": "Complete department shadowing experience with partnership opportunity analysis",
        "task_type": "document_upload",
        "competency_area": "cross_functional_collaboration",
        "sub_competency": "understanding_other_department",
        "order": 4,
        "required": True,
        "estimated_hours": 8.0,
        "instructions": "Include shadowing log, process documentation, challenge identification, and collaboration opportunities."
    },
    {
        "title": "Resident Journey Mapping Project",
        "description": "Map complete resident experience with cross-department improvement recommendations",
        "task_type": "document_upload",
        "competency_area": "cross_functional_collaboration",
        "sub_competency": "unified_resident_experience",
        "order": 4,
        "required": True,
        "estimated_hours": 10.0,
        "instructions": "Include journey maps, pain point analysis, improvement recommendations, and implementation plan."
    },
    
    # Enhanced Strategic Thinking Portfolio Tasks
    {
        "title": "Strategic Planning Portfolio",
        "description": "Complete strategic planning project with market analysis and implementation roadmap",
        "task_type": "document_upload",
        "competency_area": "strategic_thinking",
        "sub_competency": "planning_goal_achievement",
        "order": 4,
        "required": True,
        "estimated_hours": 12.0,
        "instructions": "Include market analysis, strategic goals, implementation timeline, and success metrics."
    },
    {
        "title": "Innovation Implementation Case Study",
        "description": "Document successful innovation project from concept to implementation",
        "task_type": "document_upload",
        "competency_area": "strategic_thinking",
        "sub_competency": "innovation_continuous_improvement",
        "order": 4,
        "required": True,
        "estimated_hours": 8.0,
        "instructions": "Include innovation process, stakeholder engagement, implementation challenges, and results achieved."
    }
]

# Helper function to update competency progress
async def update_all_competency_progress(user_id: str):
    """Update competency progress for all competencies for a user"""
    
    # Get all competency areas and sub-competencies
    for area_key, area_data in NAVIGATOR_COMPETENCIES.items():
        for sub_key, sub_name in area_data["sub_competencies"].items():
            # Get all tasks for this competency
            all_tasks = await db.tasks.find({
                "competency_area": area_key,
                "sub_competency": sub_key,
                "active": True
            }).to_list(1000)
            
            # Get completed tasks for this user and competency
            task_ids = [task.get("id", str(task["_id"])) for task in all_tasks]
            completed_tasks = await db.task_completions.find({
                "user_id": user_id,
                "task_id": {"$in": task_ids}
            }).to_list(1000)
            
            # Calculate progress
            total_tasks = len(all_tasks)
            completed_count = len(completed_tasks)
            completion_percentage = (completed_count / total_tasks * 100) if total_tasks > 0 else 0
            
            # Update or create competency progress record
            progress_data = {
                "user_id": user_id,
                "competency_area": area_key,
                "sub_competency": sub_key,
                "completion_percentage": round(completion_percentage, 1),
                "completed_tasks": completed_count,
                "total_tasks": total_tasks,
                "evidence_items": [],  # Will be populated by portfolio items
                "last_updated": datetime.utcnow()
            }
            
            await db.competency_progress.update_one(
                {
                    "user_id": user_id,
                    "competency_area": area_key,
                    "sub_competency": sub_key
                },
                {"$set": progress_data},
                upsert=True
            )

# CORS Configuration with Production Security
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
PRODUCTION_MODE = os.getenv("PRODUCTION_MODE", "false").lower() == "true"

# Validate CORS configuration for production
if PRODUCTION_MODE:
    if not ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
        raise ValueError("PRODUCTION requires specific ALLOWED_ORIGINS - wildcard origins are not secure")
    
    # Use specific origins for production
    cors_origins = ALLOWED_ORIGINS
    logging.info(f"Production CORS configured for origins: {cors_origins}")
else:
    # Development mode - allow localhost and preview domains
    cors_origins = [
        "http://localhost:3000",
        "https://localhost:3000", 
        "https://prelaunch-check.preview.emergentagent.com"
    ]
    logging.info(f"Development CORS configured for origins: {cors_origins}")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# User Management Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    # Check if user with this ID already exists (for demo users with specific IDs)
    if user_data.id:
        existing_id = await db.users.find_one({"id": user_data.id})
        if existing_id:
            return User(**serialize_doc(existing_id))
    
    # Check if user with this email already exists (only if no specific ID provided)
    if not user_data.id:
        existing = await db.users.find_one({"email": user_data.email})
        if existing:
            # If user already exists, return existing user
            return User(**serialize_doc(existing))
    
    # Create user with provided ID if available, otherwise generate UUID
    user_dict = user_data.dict()
    if not user_dict.get('id'):
        user_dict['id'] = str(uuid.uuid4())
    user = User(**user_dict)
    if user_data.password and user_data.is_admin:
        user.password_hash = get_password_hash(user_data.password)
    
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
async def get_all_users(admin_user = Depends(require_admin)):
    """Get all users - ADMIN ONLY - Requires admin authentication"""
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/competencies")
async def get_competency_framework():
    return NAVIGATOR_COMPETENCIES

@api_router.get("/users/{user_id}/competencies")
async def get_user_competencies(user_id: str, current_user = Depends(validate_user_access)):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    # Update progress before returning
    await update_all_competency_progress(user_id)
    
    competencies = await db.competency_progress.find({"user_id": user_id}).to_list(1000)
    
    # Organize by competency area
    organized = {}
    for comp in competencies:
        comp = serialize_doc(comp)  # Serialize the document
        area = comp["competency_area"]
        
        # Handle case where competency area doesn't exist in current structure (legacy data)
        if area not in NAVIGATOR_COMPETENCIES:
            print(f"Warning: Competency area '{area}' not found in current structure, skipping...")
            continue
            
        if area not in organized:
            organized[area] = {
                "name": NAVIGATOR_COMPETENCIES[area]["name"],
                "description": NAVIGATOR_COMPETENCIES[area]["description"],
                "sub_competencies": {},
                "overall_progress": 0
            }
        
        sub_comp = comp["sub_competency"]
        
        # Handle case where sub-competency doesn't exist in current structure (legacy data)
        if sub_comp not in NAVIGATOR_COMPETENCIES[area]["sub_competencies"]:
            print(f"Warning: Sub-competency '{sub_comp}' not found in area '{area}', skipping...")
            continue
            
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

# Progress endpoint - returns user progress in the expected format
@api_router.get("/users/{user_id}/progress")
async def get_user_progress(user_id: str, current_user = Depends(validate_user_access)):
    """Get user progress with task completion data as JSON - REQUIRES AUTHENTICATION"""
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    # Update progress before returning
    await update_all_competency_progress(user_id)
    
    competencies = await db.competency_progress.find({"user_id": user_id}).to_list(1000)
    
    # Organize by competency area
    organized_competencies = {}
    overall_progress_sum = 0
    overall_progress_count = 0
    
    for comp in competencies:
        comp = serialize_doc(comp)
        area = comp["competency_area"]
        
        # Handle case where competency area doesn't exist in current structure
        if area not in NAVIGATOR_COMPETENCIES:
            continue
            
        if area not in organized_competencies:
            organized_competencies[area] = {
                "completion_percentage": 0.0,
                "completed_tasks": 0,
                "total_tasks": 0,
                "sub_competencies": {}
            }
        
        sub_comp = comp["sub_competency"]
        
        # Handle case where sub-competency doesn't exist in current structure
        if sub_comp not in NAVIGATOR_COMPETENCIES[area]["sub_competencies"]:
            continue
            
        organized_competencies[area]["sub_competencies"][sub_comp] = {
            "completion_percentage": comp["completion_percentage"],
            "completed_tasks": comp["completed_tasks"],
            "total_tasks": comp["total_tasks"]
        }
        
        # Add to area totals
        organized_competencies[area]["completed_tasks"] += comp["completed_tasks"]
        organized_competencies[area]["total_tasks"] += comp["total_tasks"]
    
    # Calculate overall progress for each area and overall
    for area_key, area_data in organized_competencies.items():
        if area_data["sub_competencies"]:
            total = sum(sub["completion_percentage"] for sub in area_data["sub_competencies"].values())
            count = len(area_data["sub_competencies"])
            area_data["completion_percentage"] = round(total / count, 1) if count > 0 else 0
            overall_progress_sum += area_data["completion_percentage"]
            overall_progress_count += 1
    
    # Calculate overall progress
    overall_progress = round(overall_progress_sum / overall_progress_count, 1) if overall_progress_count > 0 else 0
    
    return {
        "user_id": user_id,
        "overall_progress": overall_progress,
        "competencies": organized_competencies
    }

# User tasks endpoint - returns all tasks for a user with completion status
@api_router.get("/users/{user_id}/tasks")
async def get_user_tasks(user_id: str, current_user = Depends(validate_user_access)):
    """Return user tasks with completion status as JSON - REQUIRES AUTHENTICATION"""
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    # Get all active tasks
    tasks = await db.tasks.find({"active": True}).sort("competency_area", 1).sort("sub_competency", 1).sort("order", 1).to_list(1000)
    
    # Get user's completed tasks
    task_ids = [task.get("id", str(task["_id"])) for task in tasks]
    completions = await db.task_completions.find({
        "user_id": user_id,
        "task_id": {"$in": task_ids}
    }).to_list(1000)
    
    completion_map = {comp["task_id"]: serialize_doc(comp) for comp in completions}
    
    # Add completion status to tasks
    serialized_tasks = []
    for task in tasks:
        task_data = serialize_doc(task)
        task_id = task.get("id", str(task["_id"]))
        task_data["completed"] = task_id in completion_map
        if task_data["completed"]:
            task_data["completion_data"] = completion_map[task_id]
        serialized_tasks.append(task_data)
    
    return serialized_tasks

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connectivity
        await db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "earn-your-wings-backend"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "service": "earn-your-wings-backend"
        }

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
async def get_user_tasks_for_competency(user_id: str, competency_area: str, sub_competency: str, current_user = Depends(validate_user_access)):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    # Get all tasks for this competency
    tasks = await db.tasks.find({
        "competency_area": competency_area,
        "sub_competency": sub_competency,
        "active": True
    }).sort("order", 1).to_list(1000)
    
    # Get user's completed tasks (handle both _id and id fields)
    task_ids = [task.get("id", str(task["_id"])) for task in tasks]
    completions = await db.task_completions.find({
        "user_id": user_id,
        "task_id": {"$in": task_ids}
    }).to_list(1000)
    
    completion_map = {comp["task_id"]: serialize_doc(comp) for comp in completions}
    
    # Add completion status to tasks
    serialized_tasks = []
    for task in tasks:
        task_data = serialize_doc(task)
        # Handle both id and _id fields consistently
        task_id = task.get("id", str(task["_id"]))
        task_data["completed"] = task_id in completion_map
        if task_data["completed"]:
            task_data["completion_data"] = completion_map[task_id]
        serialized_tasks.append(task_data)
    
    return serialized_tasks

# Task Completion Routes
@api_router.post("/users/{user_id}/task-completions")
async def complete_task(
    user_id: str,
    task_id: str = Form(...),
    evidence_description: str = Form(""),
    notes: str = Form(""),
    file: UploadFile = File(None),
    current_user = Depends(validate_user_access)
):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
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
    
    # Handle file upload if provided using enhanced system
    if file:
        try:
            file_data = await save_uploaded_file(file, "evidence", user_id, completion.id)
            completion.evidence_file_path = file_data["file_path"]
        except HTTPException:
            raise  # Re-raise validation errors
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Evidence file upload failed: {str(e)}")
    
    await db.task_completions.insert_one(completion.dict())
    
    # Update competency progress
    await update_all_competency_progress(user_id)
    
    return completion

# Alternative endpoint for the new API structure
@api_router.post("/users/{user_id}/tasks/complete")
async def complete_task_new(
    user_id: str,
    task_id: str = Form(...),
    evidence_description: str = Form(""),
    notes: str = Form(""),
    file: UploadFile = File(None),
    current_user = Depends(validate_user_access)
):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
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
    
    # Handle file upload if provided using enhanced system
    if file:
        try:
            file_data = await save_uploaded_file(file, "evidence", user_id, completion.id)
            completion.evidence_file_path = file_data["file_path"]
        except HTTPException:
            raise  # Re-raise validation errors
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Evidence file upload failed: {str(e)}")
    
    await db.task_completions.insert_one(completion.dict())
    
    # Update competency progress
    await update_all_competency_progress(user_id)
    
    return serialize_doc(completion.dict())

# Specific endpoint structure as requested in review: POST /api/users/{user_id}/tasks/{task_id}/complete
@api_router.post("/users/{user_id}/tasks/{task_id}/complete")
async def complete_specific_task(
    user_id: str,
    task_id: str,
    request: Request,
    current_user = Depends(validate_user_access)
):
    """
    Enhanced task completion endpoint with integrated flightbook creation.
    Accepts both JSON and form data for task completion with timestamp recording.
    REQUIRES AUTHENTICATION - Users can only complete their own tasks.
    """
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    try:
        # Initialize enhanced completion service
        enhanced_service = EnhancedTaskCompletionService(db)
        
        # Parse request data (support both JSON and form data)
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
            notes = data.get("notes", "")
            evidence_description = data.get("evidence_description", "")
            completed_at = data.get("completed_at")  # Allow custom timestamp
        else:
            # Handle form data
            form = await request.form()
            notes = form.get("notes", "")
            evidence_description = form.get("evidence_description", "")
            completed_at = form.get("completed_at")
        
        # Prepare completion data
        completion_data = {
            "notes": notes,
            "evidence_description": evidence_description
        }
        
        # Use custom timestamp if provided, otherwise use current time
        if completed_at:
            try:
                # Parse the provided timestamp
                if isinstance(completed_at, str):
                    completion_data["completed_at"] = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                else:
                    completion_data["completed_at"] = completed_at
            except (ValueError, TypeError):
                # If timestamp parsing fails, use current time
                completion_data["completed_at"] = datetime.utcnow()
        else:
            completion_data["completed_at"] = datetime.utcnow()
        
        # Complete task with integrated flightbook creation
        completion = await enhanced_service.complete_task_with_flightbook_integration(
            user_id, task_id, completion_data
        )
        
        # Return completion data with timestamp and flightbook info
        return {
            "success": True,
            "completion": serialize_doc(completion),
            "message": "Task completed successfully",
            "completed_at": completion["completed_at"].isoformat() if isinstance(completion["completed_at"], datetime) else completion["completed_at"],
            "flightbook_entry_created": completion.get("flightbook_entry_created", False),
            "flightbook_entry_id": completion.get("flightbook_entry_id")
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Task completion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Task completion failed: {str(e)}")

# Admin Task Management Routes
@api_router.post("/admin/tasks", response_model=Task)
async def admin_create_task(task_data: TaskCreate, admin_user = Depends(require_admin)):
    task = Task(**task_data.dict(), created_by=admin_user.get("sub", "admin"))
    await db.tasks.insert_one(task.dict())
    return task

@api_router.put("/admin/tasks/{task_id}", response_model=Task)
async def admin_update_task(task_id: str, task_update: TaskUpdate, admin_user = Depends(require_admin)):
    # Get existing task
    existing_task = await db.tasks.find_one({"id": task_id})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    # Return updated task
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**serialize_doc(updated_task))

@api_router.delete("/admin/tasks/{task_id}")
async def admin_delete_task(task_id: str, admin_user = Depends(require_admin)):
    result = await db.tasks.update_one({"id": task_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deactivated successfully"}

@api_router.get("/admin/tasks")
async def admin_get_all_tasks(admin_user = Depends(require_admin)):
    tasks = await db.tasks.find().sort("created_at", -1).to_list(1000)
    return [serialize_doc(task) for task in tasks]

@api_router.get("/admin/stats")
async def admin_get_stats(admin_user = Depends(require_admin)):
    # Get total counts
    total_users = await db.users.count_documents({"is_admin": False})
    total_tasks = await db.tasks.count_documents({"active": True})
    total_completions = await db.task_completions.count_documents({})
    
    # Calculate completion rate
    completion_rate = 0.0
    if total_tasks > 0 and total_users > 0:
        possible_completions = total_tasks * total_users
        completion_rate = (total_completions / possible_completions) * 100
    
    # Active competency areas
    active_competency_areas = len(NAVIGATOR_COMPETENCIES)
    
    return AdminStats(
        total_users=total_users,
        total_tasks=total_tasks,
        total_completions=total_completions,
        completion_rate=round(completion_rate, 2),
        active_competency_areas=active_competency_areas
    )

@api_router.get("/admin/users")
async def admin_get_all_users(admin_user = Depends(require_admin)):
    users = await db.users.find({"is_admin": False}).to_list(1000)
    
    # Add progress stats for each user
    users_with_stats = []
    for user in users:
        user_data = serialize_doc(user)
        
        # Get completion count for this user
        completions = await db.task_completions.count_documents({"user_id": user["id"]})
        user_data["completed_tasks"] = completions
        
        # Get overall progress
        progress_docs = await db.competency_progress.find({"user_id": user["id"]}).to_list(1000)
        if progress_docs:
            total_progress = sum(doc["completion_percentage"] for doc in progress_docs)
            user_data["overall_progress"] = round(total_progress / len(progress_docs), 1)
        else:
            user_data["overall_progress"] = 0.0
            
        users_with_stats.append(user_data)
    
    return users_with_stats

# Task Completion Routes
@api_router.get("/users/{user_id}/task-completions")
async def get_user_task_completions(user_id: str, current_user = Depends(validate_user_access)):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
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

# Enhanced Portfolio routes with secure file handling
@api_router.post("/users/{user_id}/portfolio")
async def create_portfolio_item(
    user_id: str,
    title: str = Form(...),
    description: str = Form(...),
    competency_areas: str = Form("[]"),
    tags: str = Form("[]"),
    visibility: str = Form("private"),
    file: UploadFile = File(None),
    current_user = Depends(validate_user_access)
):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    try:
        competency_areas_list = json.loads(competency_areas) if competency_areas else []
        tags_list = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in competency_areas or tags")
    
    # Validate visibility
    if visibility not in ["private", "managers", "mentors", "public"]:
        visibility = "private"
    
    portfolio_item = PortfolioItem(
        user_id=user_id,
        title=title,
        description=description,
        competency_areas=competency_areas_list,
        tags=tags_list,
        visibility=visibility
    )
    
    # Handle file upload if provided using our enhanced system
    if file:
        try:
            file_data = await save_uploaded_file(file, "portfolio", user_id, portfolio_item.id)
            
            portfolio_item.file_path = file_data["file_path"]
            portfolio_item.original_filename = file_data["original_filename"]
            portfolio_item.secure_filename = file_data["secure_filename"]
            portfolio_item.file_size = file_data["file_size"]
            portfolio_item.mime_type = file_data["mime_type"]
            
        except HTTPException:
            raise  # Re-raise validation errors
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    await db.portfolio_items.insert_one(portfolio_item.dict())
    
    # Update competency evidence for related areas
    for area in competency_areas_list:
        if area in NAVIGATOR_COMPETENCIES:
            await db.competency_progress.update_many(
                {"user_id": user_id, "competency_area": area},
                {"$addToSet": {"evidence_items": portfolio_item.id}}
            )
    
    return serialize_doc(portfolio_item.dict())

@api_router.get("/users/{user_id}/portfolio")
async def get_user_portfolio(user_id: str, current_user = Depends(validate_user_access)):
    """Get user portfolio items - REQUIRES AUTHENTICATION"""
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    portfolio_items = await db.portfolio_items.find({
        "user_id": user_id,
        "status": "active"
    }).sort("upload_date", -1).to_list(1000)
    
    return [serialize_doc(item) for item in portfolio_items]

@api_router.get("/users/{user_id}/portfolio/{item_id}")
async def get_portfolio_item(user_id: str, item_id: str, current_user = Depends(validate_user_access)):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    item = await db.portfolio_items.find_one({
        "id": item_id,
        "user_id": user_id,
        "status": "active"
    })
    
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    return serialize_doc(item)

@api_router.put("/users/{user_id}/portfolio/{item_id}")
async def update_portfolio_item(
    user_id: str,
    item_id: str,
    title: str = Form(...),
    description: str = Form(...),
    competency_areas: str = Form("[]"),
    tags: str = Form("[]"),
    visibility: str = Form("private"),
    current_user = Depends(validate_user_access)
):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    try:
        competency_areas_list = json.loads(competency_areas) if competency_areas else []
        tags_list = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in competency_areas or tags")
    
    # Validate visibility
    if visibility not in ["private", "managers", "mentors", "public"]:
        visibility = "private"
    
    update_data = {
        "title": title,
        "description": description,
        "competency_areas": competency_areas_list,
        "tags": tags_list,
        "visibility": visibility,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.portfolio_items.update_one(
        {"id": item_id, "user_id": user_id, "status": "active"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    # Get updated item
    updated_item = await db.portfolio_items.find_one({"id": item_id, "user_id": user_id})
    return serialize_doc(updated_item)

@api_router.delete("/users/{user_id}/portfolio/{item_id}")
async def delete_portfolio_item(user_id: str, item_id: str, current_user = Depends(validate_user_access)):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    # Get item to check if file needs deletion
    item = await db.portfolio_items.find_one({"id": item_id, "user_id": user_id})
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    # Mark as deleted (soft delete)
    result = await db.portfolio_items.update_one(
        {"id": item_id, "user_id": user_id},
        {"$set": {"status": "deleted", "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    # Delete associated file if exists
    if item.get("file_path"):
        delete_file(item["file_path"])
    
    return {"message": "Portfolio item deleted successfully"}

@api_router.get("/users/{user_id}/portfolio/{item_id}/download")
async def download_portfolio_file(user_id: str, item_id: str, current_user = Depends(validate_user_access)):
    # Validate user can only access their own data
    validate_access = current_user(user_id)
    
    item = await db.portfolio_items.find_one({
        "id": item_id,
        "user_id": user_id,
        "status": "active"
    })
    
    if not item or not item.get("file_path"):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = Path(item["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=item.get("original_filename", "download"),
        media_type=item.get("mime_type", "application/octet-stream")
    )

# Include the flightbook router
app.include_router(flightbook_router)

# Include the API router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Earn Your Wings API", "version": "1.0.0", "status": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)