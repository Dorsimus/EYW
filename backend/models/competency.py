from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class TaskCreate(BaseModel):
    """Schema for creating new tasks"""
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description")
    task_type: str = Field(..., description="Task type: course_link, document_upload, assessment, shadowing, meeting, project")
    competency_area: str = Field(..., description="Main competency area")
    sub_competency: str = Field(..., description="Sub-competency within area")
    order: int = Field(default=0, description="Task order within competency")
    required: bool = Field(default=True, description="Whether task is required")
    estimated_hours: Optional[float] = Field(None, description="Estimated completion time")
    external_link: Optional[str] = Field(None, description="External resource link")
    instructions: Optional[str] = Field(None, description="Task instructions")
    active: bool = Field(default=True, description="Whether task is active")

class TaskUpdate(BaseModel):
    """Schema for updating tasks"""
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

class Task(TaskCreate):
    """Complete task schema with database fields"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: str = Field(..., description="Admin user who created task")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TaskCompletionCreate(BaseModel):
    """Schema for creating task completions"""
    task_id: str = Field(..., description="ID of completed task")
    evidence_description: Optional[str] = Field(None, description="Evidence description")
    notes: Optional[str] = Field(None, description="Completion notes")
    evidence_file_path: Optional[str] = Field(None, description="Path to uploaded evidence file")

class TaskCompletion(TaskCompletionCreate):
    """Complete task completion schema"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="User who completed the task")
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    verified_by: Optional[str] = Field(None, description="Verifier user ID")
    verified_at: Optional[datetime] = Field(None, description="Verification timestamp")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CompetencyProgress(BaseModel):
    """Schema for tracking competency progress"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="User ID")
    competency_area: str = Field(..., description="Competency area key")
    sub_competency: str = Field(..., description="Sub-competency key")
    completion_percentage: float = Field(default=0.0, description="Completion percentage")
    completed_tasks: int = Field(default=0, description="Number of completed tasks")
    total_tasks: int = Field(default=0, description="Total tasks in competency")
    evidence_items: List[str] = Field(default_factory=list, description="Portfolio item IDs as evidence")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TaskResponse(BaseModel):
    """Task response schema for API responses"""
    id: str
    title: str
    description: str
    task_type: str
    competency_area: str
    sub_competency: str
    order: int
    required: bool
    estimated_hours: Optional[float]
    external_link: Optional[str]
    instructions: Optional[str]
    active: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    completed: Optional[bool] = None  # Added dynamically based on user progress

class CompetencyProgressResponse(BaseModel):
    """Competency progress response schema"""
    id: str
    user_id: str
    competency_area: str
    sub_competency: str
    completion_percentage: float
    completed_tasks: int
    total_tasks: int
    evidence_items: List[str]
    last_updated: datetime