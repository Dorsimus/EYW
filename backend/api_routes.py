"""
Updated API Routes for Earn Your Wings Platform
Integrates the new database schema with existing endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import List, Dict, Any, Optional
import json
from datetime import datetime

from database_integration import DatabaseManager
from models.user import UserCreate, UserUpdate, UserResponse
from models.competency import TaskCreate, TaskUpdate, TaskCompletionCreate, TaskResponse
from models.portfolio import PortfolioItemCreate, PortfolioItemUpdate, PortfolioItemResponse
from models.flightbook import FlightbookEntryCreate, FlightbookEntryUpdate, FlightbookEntryResponse

# Import authentication dependencies from existing server
from server import get_current_user, require_admin, save_uploaded_file

# Create API router
api_router = APIRouter(prefix="/api")

# Initialize database manager (will be injected)
db_manager: DatabaseManager = None

def set_database_manager(manager: DatabaseManager):
    """Set the database manager instance"""
    global db_manager
    db_manager = manager

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if key == '_id':
                serialized['id'] = str(value)
            else:
                serialized[key] = serialize_doc(value)
        return serialized
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    else:
        return doc

# User Management Routes
@api_router.post("/users", response_model=UserResponse)
async def create_or_get_user(
    user_data: UserCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new user or return existing user"""
    # Use Clerk user ID from authentication
    user_data.clerk_user_id = current_user.get("sub", user_data.clerk_user_id)
    
    user = await db_manager.user_service.create_user(user_data)
    return serialize_doc(user)

@api_router.get("/users/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current authenticated user information"""
    clerk_user_id = current_user.get("sub")
    user = await db_manager.user_service.get_user_by_clerk_id(clerk_user_id)
    
    if not user:
        # Auto-create user from Clerk data
        user_data = UserCreate(
            clerk_user_id=clerk_user_id,
            email=current_user.get("email", ""),
            name=current_user.get("given_name", "") + " " + current_user.get("family_name", ""),
            role="participant",
            level="navigator"
        )
        user = await db_manager.user_service.create_user(user_data)
    
    # Update last login
    await db_manager.user_service.update_last_login(clerk_user_id)
    
    return serialize_doc(user)

@api_router.get("/users", response_model=List[UserResponse])
async def get_all_users(admin_user = Depends(require_admin)):
    """Get all users (admin only)"""
    users = await db_manager.user_service.get_all_users()
    return [serialize_doc(user) for user in users]

# Competency Framework Routes
@api_router.get("/competencies")
async def get_competency_framework():
    """Get the competency framework structure"""
    from database_integration import NAVIGATOR_COMPETENCIES
    return NAVIGATOR_COMPETENCIES

@api_router.get("/users/{user_id}/competencies")
async def get_user_competencies(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get competency progress for a user"""
    # Verify user access (can only access own data unless admin)
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or (user['id'] != user_id and not user.get('is_admin', False)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get progress for all competencies
    progress_list = await db_manager.competency_service.get_user_competency_progress(user_id)
    
    # Organize by competency area
    from database_integration import NAVIGATOR_COMPETENCIES
    organized = {}
    
    for progress in progress_list:
        area = progress["competency_area"]
        
        if area not in NAVIGATOR_COMPETENCIES:
            continue
            
        if area not in organized:
            organized[area] = {
                "name": NAVIGATOR_COMPETENCIES[area]["name"],
                "description": NAVIGATOR_COMPETENCIES[area]["description"],
                "sub_competencies": {},
                "overall_progress": 0
            }
        
        sub_comp = progress["sub_competency"]
        if sub_comp not in NAVIGATOR_COMPETENCIES[area]["sub_competencies"]:
            continue
            
        organized[area]["sub_competencies"][sub_comp] = {
            "name": NAVIGATOR_COMPETENCIES[area]["sub_competencies"][sub_comp],
            "completion_percentage": progress["completion_percentage"],
            "completed_tasks": progress["completed_tasks"],
            "total_tasks": progress["total_tasks"],
            "evidence_items": progress["evidence_items"],
            "last_updated": progress["last_updated"]
        }
    
    # Calculate overall progress for each area
    for area_key, area_data in organized.items():
        if area_data["sub_competencies"]:
            total = sum(sub["completion_percentage"] for sub in area_data["sub_competencies"].values())
            count = len(area_data["sub_competencies"])
            area_data["overall_progress"] = round(total / count, 1) if count > 0 else 0
    
    return organized

# Task Management Routes
@api_router.get("/tasks")
async def get_all_tasks():
    """Get all active tasks"""
    tasks = await db_manager.competency_service.get_all_tasks()
    return [serialize_doc(task) for task in tasks]

@api_router.get("/tasks/{competency_area}/{sub_competency}")
async def get_tasks_for_competency(competency_area: str, sub_competency: str):
    """Get tasks for a specific competency"""
    tasks = await db_manager.competency_service.get_tasks_by_competency(competency_area, sub_competency)
    return [serialize_doc(task) for task in tasks]

@api_router.get("/users/{user_id}/tasks/{competency_area}/{sub_competency}")
async def get_user_tasks_for_competency(
    user_id: str,
    competency_area: str, 
    sub_competency: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get tasks with completion status for a user and competency"""
    # Verify user access
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or (user['id'] != user_id and not user.get('is_admin', False)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    tasks = await db_manager.competency_service.get_user_tasks_with_completion_status(
        user_id, competency_area, sub_competency
    )
    return [serialize_doc(task) for task in tasks]

# Task Completion Routes
@api_router.post("/users/{user_id}/tasks/complete")
async def complete_task(
    user_id: str,
    task_id: str = Form(...),
    evidence_description: str = Form(""),
    notes: str = Form(""),
    file: UploadFile = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Complete a task for a user"""
    # Verify user access
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Prepare completion data
    completion_data = TaskCompletionCreate(
        task_id=task_id,
        evidence_description=evidence_description,
        notes=notes
    )
    
    # Handle file upload if provided
    if file:
        try:
            file_info = await save_uploaded_file(file, "evidence", user_id, task_id)
            completion_data.evidence_file_path = file_info["file_path"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"File upload failed: {str(e)}")
    
    # Complete the task
    completion = await db_manager.competency_service.complete_task(user_id, completion_data)
    return serialize_doc(completion)

@api_router.get("/users/{user_id}/task-completions")
async def get_user_task_completions(
    user_id: str,
    competency_area: Optional[str] = None,
    sub_competency: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get task completions for a user"""
    # Verify user access
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or (user['id'] != user_id and not user.get('is_admin', False)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    completions = await db_manager.competency_service.get_user_task_completions(
        user_id, competency_area, sub_competency
    )
    return [serialize_doc(completion) for completion in completions]

# Portfolio Management Routes
@api_router.post("/users/{user_id}/portfolio")
async def create_portfolio_item(
    user_id: str,
    title: str = Form(...),
    description: str = Form(...),
    competency_areas: str = Form("[]"),
    tags: str = Form("[]"),
    visibility: str = Form("private"),
    file: UploadFile = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new portfolio item"""
    # Verify user access
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Parse JSON fields
    try:
        competency_areas_list = json.loads(competency_areas) if competency_areas else []
        tags_list = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in competency_areas or tags")
    
    # Create portfolio item data
    item_data = PortfolioItemCreate(
        title=title,
        description=description,
        competency_areas=competency_areas_list,
        tags=tags_list,
        visibility=visibility
    )
    
    # Handle file upload if provided
    file_info = None
    if file:
        try:
            file_info = await save_uploaded_file(file, "portfolio", user_id, f"portfolio_{datetime.utcnow().timestamp()}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"File upload failed: {str(e)}")
    
    # Create portfolio item
    item = await db_manager.portfolio_service.create_portfolio_item(user_id, item_data, file_info)
    
    # Add to competency progress as evidence
    for area in competency_areas_list:
        await db_manager.competency_service.add_evidence_to_competency(user_id, area, item['id'])
    
    return serialize_doc(item)

@api_router.get("/users/{user_id}/portfolio")
async def get_user_portfolio(
    user_id: str,
    visibility: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get portfolio items for a user"""
    # Verify user access
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or (user['id'] != user_id and not user.get('is_admin', False)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    items = await db_manager.portfolio_service.get_user_portfolio(user_id, visibility)
    return [serialize_doc(item) for item in items]

@api_router.delete("/users/{user_id}/portfolio/{item_id}")
async def delete_portfolio_item(
    user_id: str,
    item_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a portfolio item"""
    # Verify user access
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user or user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get item to remove from competency evidence
    item = await db_manager.portfolio_service.get_portfolio_item_by_id(item_id, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    # Remove from competency evidence
    for area in item.get("competency_areas", []):
        await db_manager.competency_service.remove_evidence_from_competency(user_id, area, item_id)
    
    # Delete item
    success = await db_manager.portfolio_service.delete_portfolio_item(item_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    return {"message": "Portfolio item deleted successfully"}

# Admin Routes
@api_router.post("/admin/tasks", response_model=TaskResponse)
async def admin_create_task(
    task_data: TaskCreate,
    admin_user = Depends(require_admin)
):
    """Create a new task (admin only)"""
    task = await db_manager.competency_service.create_task(task_data, admin_user.get("sub", "admin"))
    return serialize_doc(task)

@api_router.put("/admin/tasks/{task_id}", response_model=TaskResponse)
async def admin_update_task(
    task_id: str,
    task_update: TaskUpdate,
    admin_user = Depends(require_admin)
):
    """Update a task (admin only)"""
    task = await db_manager.competency_service.update_task(task_id, task_update)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return serialize_doc(task)

@api_router.delete("/admin/tasks/{task_id}")
async def admin_delete_task(
    task_id: str,
    admin_user = Depends(require_admin)
):
    """Delete (deactivate) a task (admin only)"""
    success = await db_manager.competency_service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deactivated successfully"}

@api_router.get("/admin/stats")
async def admin_get_stats(admin_user = Depends(require_admin)):
    """Get admin dashboard statistics"""
    # Get statistics from all services
    user_stats = await db_manager.user_service.get_user_statistics()
    competency_stats = await db_manager.competency_service.get_admin_statistics()
    portfolio_stats = await db_manager.portfolio_service.get_portfolio_statistics()
    
    return {
        **user_stats,
        **competency_stats,
        **portfolio_stats,
        "timestamp": datetime.utcnow()
    }

@api_router.post("/admin/seed-tasks")
async def admin_seed_tasks(admin_user = Depends(require_admin)):
    """Seed database with sample tasks (admin only)"""
    from database_integration import SAMPLE_TASKS
    
    result = await db_manager.competency_service.seed_sample_tasks(SAMPLE_TASKS, admin_user.get("sub", "admin"))
    return {
        "message": f"Seeded {result['processed']} sample tasks",
        "details": result
    }

# Health check route
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connectivity
        await db_manager.db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }