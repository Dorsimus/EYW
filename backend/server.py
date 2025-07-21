from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import shutil
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    name: str
    role: str = "participant"
    level: str = "navigator"

class CompetencyProgress(BaseModel):
    user_id: str
    competency_area: str
    sub_competency: str
    proficiency_level: int = 0  # 0-100 scale
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

# Navigator Level Competency Framework
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

# Routes
@api_router.get("/")
async def root():
    return {"message": "Earn Your Wings Platform API"}

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    
    # Initialize competency progress for new user
    for area_key, area_data in NAVIGATOR_COMPETENCIES.items():
        for sub_key, sub_name in area_data["sub_competencies"].items():
            progress = CompetencyProgress(
                user_id=user.id,
                competency_area=area_key,
                sub_competency=sub_key,
                proficiency_level=0
            )
            await db.competency_progress.insert_one(progress.dict())
    
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
    competencies = await db.competency_progress.find({"user_id": user_id}).to_list(1000)
    
    # Organize by competency area
    organized = {}
    for comp in competencies:
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
            "proficiency_level": comp["proficiency_level"],
            "evidence_items": comp["evidence_items"],
            "last_updated": comp["last_updated"]
        }
    
    # Calculate overall progress for each area
    for area_key, area_data in organized.items():
        if area_data["sub_competencies"]:
            total = sum(sub["proficiency_level"] for sub in area_data["sub_competencies"].values())
            count = len(area_data["sub_competencies"])
            area_data["overall_progress"] = round(total / count, 1) if count > 0 else 0
    
    return organized

@api_router.put("/users/{user_id}/competencies/{area}/{sub_competency}")
async def update_competency_progress(user_id: str, area: str, sub_competency: str, proficiency_level: int):
    if proficiency_level < 0 or proficiency_level > 100:
        raise HTTPException(status_code=400, detail="Proficiency level must be between 0-100")
    
    await db.competency_progress.update_one(
        {"user_id": user_id, "competency_area": area, "sub_competency": sub_competency},
        {"$set": {"proficiency_level": proficiency_level, "last_updated": datetime.utcnow()}}
    )
    
    return {"message": "Competency updated successfully"}

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
    
    # Try to delete file if it exists
    try:
        item_data = await db.portfolio_items.find_one({"id": item_id})
        if item_data and item_data.get("file_path"):
            file_path = Path(item_data["file_path"])
            if file_path.exists():
                file_path.unlink()
    except:
        pass  # Don't fail if file deletion fails
    
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